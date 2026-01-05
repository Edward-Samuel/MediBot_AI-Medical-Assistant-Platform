const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Ollama } = require('ollama');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');
const FAQ = require('../models/FAQ');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const tavilySearch = require('../services/tavilySearch');
const faqService = require('../services/faqService');
// const appointmentAgent = require('../services/appointmentAgent');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Ollama (local LLM)
const ollama = new Ollama({ 
  host: process.env.OLLAMA_HOST || 'http://localhost:11434' 
});

// Try multiple Gemini models with enhanced fallback handling
async function tryGeminiModels(prompt, timeoutMs = 5000) {
  const primaryModel = process.env.GEMINI_PRIMARY_MODEL || 'gemini-2.5-flash-lite';
  const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash,gemini-2.0-flash-lite').split(',');
  
  const modelsToTry = [primaryModel, ...fallbackModels.filter(m => m.trim() !== primaryModel)];
  
  let quotaExceeded = false;
  let lastQuotaError = null;
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying Gemini model: ${modelName.trim()}`);
      
      const model = genAI.getGenerativeModel({ model: modelName.trim() });
      
      // Create promise with timeout
      const geminiPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${modelName} timeout after ${timeoutMs}ms`)), timeoutMs);
      });

      // Race between API call and timeout
      const result = await Promise.race([geminiPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ Successfully used Gemini model: ${modelName.trim()}`);
      return { text, model: modelName.trim() };
      
    } catch (error) {
      const errorMessage = error.message || '';
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('Too Many Requests') ||
                          errorMessage.includes('rate limit');
      
      if (isQuotaError) {
        quotaExceeded = true;
        lastQuotaError = error;
        console.log(`📊 Gemini model ${modelName.trim()} quota exceeded`);
        
        // Extract retry delay if available
        const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)s/);
        if (retryMatch) {
          const retryDelay = parseFloat(retryMatch[1]);
          console.log(`⏱️  Google suggests retry in ${retryDelay}s`);
        }
        
        // If all models are likely to have the same quota issue, skip trying others
        if (modelName === modelsToTry[0]) {
          console.log(`⚠️  Primary model quota exceeded, other Gemini models likely affected too`);
          // Still try one more model to be sure, but expect it to fail
        }
      } else {
        console.log(`❌ Gemini model ${modelName.trim()} failed (non-quota): ${errorMessage}`);
      }
      
      // If this is the last model, throw appropriate error
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        if (quotaExceeded) {
          throw new Error(`All Gemini models quota exceeded. ${lastQuotaError?.message || 'Please try again later.'}`);
        } else {
          throw new Error(`All Gemini models failed. Last error: ${errorMessage}`);
        }
      }
      
      // For quota errors, add a small delay before trying next model
      if (isQuotaError) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Continue to next model
      continue;
    }
  }
}

// Check Ollama availability and get available models
async function checkOllamaAvailability() {
  try {
    const models = await ollama.list();
    console.log('Ollama available with models:', models.models.map(m => m.name));
    return models.models.length > 0 ? models.models : null;
  } catch (error) {
    console.log('Ollama not available:', error.message);
    return null;
  }
}

// Generate response using Ollama
async function generateOllamaResponse(message, conversationHistory, language, languageInfo) {
  try {
    const availableModels = await checkOllamaAvailability();
    if (!availableModels || availableModels.length === 0) {
      throw new Error('No Ollama models available');
    }

    const selectedModel = selectBestModel(availableModels, message, language);
    console.log(`Using Ollama model: ${selectedModel.name} (${selectedModel.reason})`);

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = conversationHistory.slice(-3).map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');
    }

    // Language-specific instructions
    let languageInstructions = '';
    if (language !== 'en') {
      languageInstructions = `Please respond in ${languageInfo?.name || language}. Use natural, clear language appropriate for medical communication in this language.`;
      
      if (language === 'ta') {
        languageInstructions += `
        - Use respectful Tamil medical terminology
        - Include common Tamil phrases for medical conditions when appropriate
        - Use simple Tamil words that are easily understood
        - For body parts use: தலை (head), கண் (eye), காது (ear), மார்பு (chest), வயிறு (stomach), கை (hand), கால் (leg)
        - For symptoms use: வலி (pain), காய்ச்சல் (fever), இருமல் (cough), தலைவலி (headache)`;
      }
    }

    const prompt = `You are MEDIBOT, a helpful medical AI assistant. You provide general health information and guidance but always remind users to consult healthcare professionals for proper diagnosis and treatment.

${languageInstructions}

IMPORTANT GUIDELINES:
- Provide helpful, accurate medical information in a clear, easy-to-read format
- Use simple formatting with **bold** for important points
- Always recommend consulting a healthcare professional for diagnosis
- Never provide specific medical diagnoses
- Be empathetic and supportive
- Ask clarifying questions when needed
- Suggest when to seek immediate medical attention
- Keep responses concise and well-structured
- Use bullet points or numbered lists when appropriate
- Respond in the user's language (${languageInfo?.name || 'English'})

Previous conversation:
${conversationContext}

User: ${message}

Respond as MEDIBOT with helpful medical guidance while emphasizing the importance of professional medical consultation. Keep the response under 300 words and format it clearly.`;

    // Create Ollama request with timeout (default 15 seconds)
    const ollamaTimeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS) || 15000;
    const ollamaPromise = ollama.chat({
      model: selectedModel.name,
      messages: [
        {
          role: 'system',
          content: 'You are MEDIBOT, a helpful medical AI assistant. Provide general health information and always recommend consulting healthcare professionals.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 500
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Ollama timeout after ${ollamaTimeoutMs}ms`)), ollamaTimeoutMs);
    });

    // Race between Ollama call and timeout
    const response = await Promise.race([ollamaPromise, timeoutPromise]);
    return response.message.content;

  } catch (error) {
    console.error('Ollama error:', error);
    throw error;
  }
}

// Smart model selection based on multiple factors
function selectBestModel(availableModels, message, language) {
  // Get preferred models from environment variables
  const preferredModel = process.env.OLLAMA_PREFERRED_MODEL || 'qwen2.5-coder:0.5b';
  const fallbackModels = (process.env.OLLAMA_FALLBACK_MODELS || 'phi3,llama3.1,llama3,mistral').split(',');
  
  // Model scoring system
  const modelScores = {
    // Qwen models (excellent for medical queries, fast and efficient)
    'qwen2.5-coder:0.5b': { score: 105, medical: 100, multilingual: 95, speed: 95 },
    'qwen2.5-coder': { score: 100, medical: 95, multilingual: 90, speed: 85 },
    'qwen2.5': { score: 95, medical: 90, multilingual: 85, speed: 80 },
    'qwen': { score: 90, medical: 85, multilingual: 80, speed: 75 },
    
    // Large, high-quality models (best for complex medical queries)
    'llama3.1': { score: 100, medical: 95, multilingual: 90, speed: 60 },
    'llama3': { score: 95, medical: 90, multilingual: 85, speed: 65 },
    'llama2': { score: 85, medical: 80, multilingual: 70, speed: 70 },
    
    // Specialized models
    'codellama': { score: 75, medical: 60, multilingual: 50, speed: 70 },
    'mistral': { score: 80, medical: 75, multilingual: 80, speed: 80 },
    'mixtral': { score: 90, medical: 85, multilingual: 85, speed: 50 },
    
    // Lightweight models (faster but less capable)
    'phi3': { score: 70, medical: 65, multilingual: 60, speed: 95 },
    'phi': { score: 65, medical: 60, multilingual: 55, speed: 90 },
    'gemma': { score: 75, medical: 70, multilingual: 70, speed: 85 },
    
    // Tiny models (very fast, basic responses)
    'tinyllama': { score: 50, medical: 40, multilingual: 30, speed: 100 },
    'orca-mini': { score: 60, medical: 55, multilingual: 45, speed: 90 }
  };

  // Check if preferred model is available
  let selectedModel = availableModels.find(model => 
    model.name.toLowerCase().includes(preferredModel.toLowerCase())
  );
  
  if (selectedModel) {
    return { 
      ...selectedModel, 
      reason: `Preferred model (${preferredModel})` 
    };
  }

  // Try fallback models in order
  for (const fallback of fallbackModels) {
    selectedModel = availableModels.find(model => 
      model.name.toLowerCase().includes(fallback.toLowerCase())
    );
    if (selectedModel) {
      return { 
        ...selectedModel, 
        reason: `Fallback model (${fallback})` 
      };
    }
  }

  // Smart selection based on query complexity and language
  const isComplexQuery = message.length > 100 || 
    /complex|detailed|explain|analysis|diagnosis/.test(message.toLowerCase());
  const isNonEnglish = language !== 'en';
  
  // Score available models
  const scoredModels = availableModels.map(model => {
    const modelName = model.name.toLowerCase();
    let bestScore = 0;
    let matchedPattern = 'unknown';
    
    // Find best matching pattern
    for (const [pattern, scores] of Object.entries(modelScores)) {
      if (modelName.includes(pattern)) {
        let totalScore = scores.score;
        
        // Boost score for complex medical queries
        if (isComplexQuery) {
          totalScore += scores.medical * 0.3;
        }
        
        // Boost score for non-English queries
        if (isNonEnglish) {
          totalScore += scores.multilingual * 0.2;
        }
        
        // Slight boost for speed if query is simple
        if (!isComplexQuery) {
          totalScore += scores.speed * 0.1;
        }
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          matchedPattern = pattern;
        }
      }
    }
    
    return {
      ...model,
      score: bestScore,
      pattern: matchedPattern
    };
  }).sort((a, b) => b.score - a.score);

  // Return the highest scored model
  const bestModel = scoredModels[0];
  return {
    ...bestModel,
    reason: `Best match (${bestModel.pattern}, score: ${Math.round(bestModel.score)})`
  };
}

// Medical specialization mapping based on symptoms/conditions
const symptomSpecializationMap = {
  // Cardiology
  'chest pain': 'Cardiology',
  'heart palpitations': 'Cardiology',
  'shortness of breath': 'Cardiology',
  'high blood pressure': 'Cardiology',
  'irregular heartbeat': 'Cardiology',
  
  // Tamil terms for common symptoms
  'மார்பு வலி': 'Cardiology',
  'இதய படபடப்பு': 'Cardiology',
  'மூச்சு திணறல்': 'Cardiology',
  'உயர் இரத்த அழுத்தம்': 'Cardiology',
  
  // Dermatology
  'skin rash': 'Dermatology',
  'acne': 'Dermatology',
  'moles': 'Dermatology',
  'eczema': 'Dermatology',
  'psoriasis': 'Dermatology',
  
  // Tamil dermatology terms
  'தோல் அரிப்பு': 'Dermatology',
  'முகப்பரு': 'Dermatology',
  'தோல் நோய்': 'Dermatology',
  
  // Neurology
  'headache': 'Neurology',
  'migraine': 'Neurology',
  'seizures': 'Neurology',
  'memory loss': 'Neurology',
  'dizziness': 'Neurology',
  
  // Tamil neurology terms
  'தலைவலி': 'Neurology',
  'மைக்ரேன்': 'Neurology',
  'வலிப்பு': 'Neurology',
  'மறதி': 'Neurology',
  'தலைசுற்றல்': 'Neurology',
  
  // Orthopedics
  'joint pain': 'Orthopedics',
  'back pain': 'Orthopedics',
  'fracture': 'Orthopedics',
  'arthritis': 'Orthopedics',
  'sports injury': 'Orthopedics',
  
  // Tamil orthopedic terms
  'மூட்டு வலி': 'Orthopedics',
  'முதுகு வலி': 'Orthopedics',
  'எலும்பு முறிவு': 'Orthopedics',
  'மூட்டுவாதம்': 'Orthopedics',
  
  // Gastroenterology
  'stomach pain': 'Gastroenterology',
  'nausea': 'Gastroenterology',
  'diarrhea': 'Gastroenterology',
  'constipation': 'Gastroenterology',
  'acid reflux': 'Gastroenterology',
  
  // Tamil gastro terms
  'வயிற்று வலி': 'Gastroenterology',
  'குமட்டல்': 'Gastroenterology',
  'வயிற்றுப்போக்கு': 'Gastroenterology',
  'மலச்சிக்கல்': 'Gastroenterology',
  
  // ENT
  'ear pain': 'ENT',
  'hearing loss': 'ENT',
  'sore throat': 'ENT',
  'sinus problems': 'ENT',
  'tinnitus': 'ENT',
  
  // Tamil ENT terms
  'காது வலி': 'ENT',
  'கேட்கும் திறன் குறைவு': 'ENT',
  'தொண்டை வலி': 'ENT',
  
  // Ophthalmology
  'eye pain': 'Ophthalmology',
  'vision problems': 'Ophthalmology',
  'blurred vision': 'Ophthalmology',
  'eye infection': 'Ophthalmology',
  
  // Tamil eye terms
  'கண் வலி': 'Ophthalmology',
  'பார்வை பிரச்சனை': 'Ophthalmology',
  'மங்கலான பார்வை': 'Ophthalmology',
  
  // Psychiatry
  'depression': 'Psychiatry',
  'anxiety': 'Psychiatry',
  'panic attacks': 'Psychiatry',
  'insomnia': 'Psychiatry',
  'mood swings': 'Psychiatry',
  
  // Tamil mental health terms
  'மனச்சோர்வு': 'Psychiatry',
  'பதட்டம்': 'Psychiatry',
  'தூக்கமின்மை': 'Psychiatry',
  'மன அழுத்தம்': 'Psychiatry'
};

// Recommend doctors based on symptoms
router.post('/recommend-doctor', async (req, res) => {
  try {
    const { symptoms, age, gender, urgency } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ message: 'Symptoms are required' });
    }

    let aiAnalysis = null;

    // Try Gemini AI first with enhanced error handling
    try {
      console.log('🤖 Trying Gemini AI for doctor recommendation...');
      
      const prompt = `
      As a medical AI assistant, analyze the following symptoms and patient information:
      
      Symptoms: ${symptoms.join(', ')}
      Age: ${age || 'Not specified'}
      Gender: ${gender || 'Not specified'}
      Urgency: ${urgency || 'Normal'}
      
      Based on these symptoms, recommend the most appropriate medical specialization(s) from this list:
      General Medicine, Cardiology, Dermatology, Endocrinology, Gastroenterology, Neurology, Oncology, Orthopedics, Pediatrics, Psychiatry, Pulmonology, Radiology, Surgery, Urology, Gynecology, Ophthalmology, ENT, Emergency Medicine
      
      Provide your response in this JSON format:
      {
        "primarySpecialization": "specialization name",
        "alternativeSpecializations": ["alt1", "alt2"],
        "urgencyLevel": "low/medium/high",
        "reasoning": "brief explanation",
        "redFlags": ["any concerning symptoms that need immediate attention"]
      }
      
      Consider the urgency level and age appropriateness (use Pediatrics for children under 18).
      `;

      // Use the enhanced tryGeminiModels function
      const geminiResult = await tryGeminiModels(prompt, 10000); // 10 second timeout for doctor recommendations
      
      try {
        // Extract JSON from the response
        const text = geminiResult.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        aiAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        console.log(`✅ Gemini AI analysis successful using model: ${geminiResult.model}`);
      } catch (parseError) {
        console.error('❌ Error parsing Gemini AI response:', parseError);
        aiAnalysis = null;
      }

    } catch (geminiError) {
      const isQuotaError = geminiError.message.includes('quota') || 
                          geminiError.message.includes('429') || 
                          geminiError.message.includes('Too Many Requests');
      
      if (isQuotaError) {
        console.log('📊 All Gemini models quota exceeded, using keyword-based fallback');
      } else {
        console.log('⚠️  All Gemini models failed, using fallback analysis:', geminiError.message);
      }
      
      aiAnalysis = null;
    }

    // Fallback to keyword matching if Gemini fails
    if (!aiAnalysis) {
      console.log('🔄 Using fallback specialization matching');
      aiAnalysis = fallbackSpecializationMatch(symptoms);
    }

    if (!aiAnalysis) {
      return res.status(500).json({ message: 'Unable to analyze symptoms' });
    }

    // Find doctors based on analysis
    const specializations = [
      aiAnalysis.primarySpecialization,
      ...(aiAnalysis.alternativeSpecializations || [])
    ].filter(Boolean);

    const doctors = await Doctor.find({
      specialization: { $in: specializations },
      isVerified: true
    })
    .populate('userId', 'profile')
    .sort({ 'rating.average': -1, experience: -1 })
    .limit(10);

    // Format doctor recommendations
    const recommendations = doctors.map(doctor => ({
      id: doctor._id,
      name: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
      specialization: doctor.specialization,
      experience: doctor.experience,
      rating: doctor.rating.average,
      availability: doctor.availability,
      bio: doctor.bio,
      languages: doctor.languages
    }));

    res.json({
      analysis: aiAnalysis,
      recommendations,
      totalDoctors: recommendations.length,
      fallbackUsed: !aiAnalysis.reasoning || aiAnalysis.reasoning === 'Based on symptom keyword matching'
    });

  } catch (error) {
    console.error('AI recommendation error:', error);
    
    // Even if there's an error, try to provide basic recommendations
    try {
      console.log('🆘 Using emergency fallback for doctor recommendations');
      const { symptoms } = req.body;
      
      // Emergency fallback - just use General Medicine
      const emergencyAnalysis = {
        primarySpecialization: 'General Medicine',
        alternativeSpecializations: [],
        urgencyLevel: 'medium',
        reasoning: 'Emergency fallback - please consult a general practitioner',
        redFlags: []
      };

      const doctors = await Doctor.find({
        specialization: 'General Medicine',
        isVerified: true
      })
      .populate('userId', 'profile')
      .sort({ 'rating.average': -1, experience: -1 })
      .limit(5);

      const recommendations = doctors.map(doctor => ({
        id: doctor._id,
        name: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
        specialization: doctor.specialization,
        experience: doctor.experience,
        rating: doctor.rating.average,
        availability: doctor.availability,
        bio: doctor.bio,
        languages: doctor.languages
      }));

      res.json({
        analysis: emergencyAnalysis,
        recommendations,
        totalDoctors: recommendations.length,
        fallbackUsed: true,
        emergencyFallback: true
      });

    } catch (emergencyError) {
      console.error('Emergency fallback also failed:', emergencyError);
      res.status(500).json({ 
        message: 'Error generating doctor recommendations. Please try again later.',
        fallbackUsed: true
      });
    }
  }
});

// Fallback function for specialization matching
function fallbackSpecializationMatch(symptoms) {
  const lowerSymptoms = symptoms.map(s => s.toLowerCase());
  const matches = {};
  
  // Enhanced symptom mapping with more comprehensive coverage
  const enhancedSymptomMap = {
    // Cardiology
    'chest pain': 'Cardiology', 'heart': 'Cardiology', 'cardiac': 'Cardiology',
    'palpitations': 'Cardiology', 'shortness of breath': 'Cardiology',
    'high blood pressure': 'Cardiology', 'hypertension': 'Cardiology',
    'irregular heartbeat': 'Cardiology', 'chest tightness': 'Cardiology',
    
    // Dermatology
    'skin': 'Dermatology', 'rash': 'Dermatology', 'acne': 'Dermatology',
    'moles': 'Dermatology', 'eczema': 'Dermatology', 'psoriasis': 'Dermatology',
    'itching': 'Dermatology', 'dermatitis': 'Dermatology',
    
    // Neurology
    'headache': 'Neurology', 'migraine': 'Neurology', 'seizure': 'Neurology',
    'memory': 'Neurology', 'dizziness': 'Neurology', 'vertigo': 'Neurology',
    'numbness': 'Neurology', 'tingling': 'Neurology', 'neurological': 'Neurology',
    
    // Orthopedics
    'joint': 'Orthopedics', 'bone': 'Orthopedics', 'back pain': 'Orthopedics',
    'fracture': 'Orthopedics', 'arthritis': 'Orthopedics', 'sports injury': 'Orthopedics',
    'muscle pain': 'Orthopedics', 'spine': 'Orthopedics', 'knee': 'Orthopedics',
    
    // Gastroenterology
    'stomach': 'Gastroenterology', 'abdominal': 'Gastroenterology', 'nausea': 'Gastroenterology',
    'diarrhea': 'Gastroenterology', 'constipation': 'Gastroenterology',
    'acid reflux': 'Gastroenterology', 'digestive': 'Gastroenterology',
    'bowel': 'Gastroenterology', 'intestinal': 'Gastroenterology',
    
    // ENT
    'ear': 'ENT', 'nose': 'ENT', 'throat': 'ENT', 'hearing': 'ENT',
    'sinus': 'ENT', 'tinnitus': 'ENT', 'sore throat': 'ENT',
    
    // Ophthalmology
    'eye': 'Ophthalmology', 'vision': 'Ophthalmology', 'sight': 'Ophthalmology',
    'blurred vision': 'Ophthalmology', 'eye pain': 'Ophthalmology',
    
    // Psychiatry
    'depression': 'Psychiatry', 'anxiety': 'Psychiatry', 'panic': 'Psychiatry',
    'insomnia': 'Psychiatry', 'mood': 'Psychiatry', 'mental': 'Psychiatry',
    'stress': 'Psychiatry', 'psychological': 'Psychiatry',
    
    // Pulmonology
    'lung': 'Pulmonology', 'breathing': 'Pulmonology', 'cough': 'Pulmonology',
    'asthma': 'Pulmonology', 'respiratory': 'Pulmonology', 'copd': 'Pulmonology',
    
    // Endocrinology
    'diabetes': 'Endocrinology', 'thyroid': 'Endocrinology', 'hormone': 'Endocrinology',
    'metabolism': 'Endocrinology', 'insulin': 'Endocrinology',
    
    // Urology
    'kidney': 'Urology', 'bladder': 'Urology', 'urinary': 'Urology',
    'prostate': 'Urology', 'urine': 'Urology',
    
    // Gynecology
    'menstrual': 'Gynecology', 'pregnancy': 'Gynecology', 'reproductive': 'Gynecology',
    'pelvic': 'Gynecology', 'gynecological': 'Gynecology',
    
    // Emergency Medicine
    'emergency': 'Emergency Medicine', 'urgent': 'Emergency Medicine',
    'severe': 'Emergency Medicine', 'acute': 'Emergency Medicine',
    
    // General Medicine (catch-all)
    'fever': 'General Medicine', 'fatigue': 'General Medicine', 'weakness': 'General Medicine',
    'general': 'General Medicine', 'checkup': 'General Medicine', 'physical': 'General Medicine'
  };
  
  // Count matches for each specialization
  lowerSymptoms.forEach(symptom => {
    Object.entries(enhancedSymptomMap).forEach(([key, specialization]) => {
      if (symptom.includes(key) || key.includes(symptom)) {
        matches[specialization] = (matches[specialization] || 0) + 1;
      }
    });
  });
  
  // Sort by match count
  const sortedMatches = Object.entries(matches).sort((a, b) => b[1] - a[1]);
  
  // If no matches found, default to General Medicine
  if (sortedMatches.length === 0) {
    return {
      primarySpecialization: 'General Medicine',
      alternativeSpecializations: [],
      urgencyLevel: 'medium',
      reasoning: 'Based on symptom keyword matching - General Medicine recommended for comprehensive evaluation',
      redFlags: []
    };
  }
  
  return {
    primarySpecialization: sortedMatches[0]?.[0] || 'General Medicine',
    alternativeSpecializations: sortedMatches.slice(1, 3).map(m => m[0]),
    urgencyLevel: 'medium',
    reasoning: 'Based on symptom keyword matching',
    redFlags: []
  };
}

// Medical consultation chat
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory, language = 'en', languageInfo, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Check if user is authenticated (optional middleware)
    let userId = null;
    let currentSessionId = sessionId;
    
    // Try to get user from token if provided
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId; // Fix: use userId instead of id
        console.log('AI Chat: User authenticated with ID:', userId);
      } catch (error) {
        // Token invalid or expired, continue as guest
        console.log('Invalid token, continuing as guest');
      }
    }

    let botResponse;
    let usingFallback = false;
    let appointmentData = null;
    let webSearchData = null;

    // Check for appointment booking intent if user is authenticated
    if (userId && (message.toLowerCase().includes('appointment') || message.toLowerCase().includes('book'))) {
      try {
        // Simple appointment intent detection
        appointmentData = {
          intent: 'appointment_booking',
          message: 'I can help you book an appointment! Please let me know what type of doctor you need.',
          simpleBooking: true
        };
        
        botResponse = "I can help you book an appointment! What type of doctor would you like to see? For example:\n\n• **Cardiologist** - for heart-related concerns\n• **Dermatologist** - for skin issues\n• **General Medicine** - for general health checkups\n• **Neurologist** - for neurological concerns\n\nPlease let me know your preference and I'll find available doctors for you.";
      } catch (appointmentError) {
        console.error('Appointment detection error:', appointmentError);
        // Continue with normal chat if appointment processing fails
      }
    }

    // Check for FAQ-related queries and get relevant FAQ context
    let faqContext = null;
    if (!botResponse && faqService.isFAQQuery(message)) {
      try {
        console.log('📚 FAQ search mode detected');
        faqContext = await faqService.getFAQContext(message);
        if (faqContext && faqContext.count > 0) {
          console.log(`✅ Found ${faqContext.count} relevant FAQs`);
        }
      } catch (faqError) {
        console.error('⚠️  FAQ search failed:', faqError.message);
        // Continue with normal AI chat if FAQ search fails
      }
    }

    // Check for web search intent
    let searchResults = null;
    if (!botResponse && tavilySearch.isWebSearchQuery(message)) {
      try {
        console.log('🔍 Web search mode detected');
        searchResults = await tavilySearch.searchMedical(message, {
          maxResults: 5,
          language: language
        });
        
        webSearchData = {
          query: message,
          resultsCount: searchResults.totalResults,
          searchTime: searchResults.searchTime
        };
        
        console.log(`✅ Found ${searchResults.totalResults} medical search results`);
      } catch (searchError) {
        console.error('⚠️  Web search failed:', searchError.message);
        webSearchData = {
          query: message,
          error: searchError.message,
          fallback: true
        };
        // Continue with normal AI chat if search fails
      }
    }

    // If no appointment intent or processing failed, use normal AI chat
    if (!botResponse) {
      try {
      // Try multiple Gemini models with timeout
      const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS) || 5000;
      
      // Build conversation context
      let conversationContext = '';
      if (conversationHistory && conversationHistory.length > 0) {
        conversationContext = conversationHistory.map(msg => 
          `${msg.role}: ${msg.content}`
        ).join('\n');
      }

      // Language-specific instructions
      let languageInstructions = '';
      if (language !== 'en') {
        languageInstructions = `Please respond in ${languageInfo?.name || language}. Use natural, clear language appropriate for medical communication in this language.`;
        
        // Special instructions for Tamil
        if (language === 'ta') {
          languageInstructions += ` 
          - Use respectful Tamil medical terminology
          - Include common Tamil phrases for medical conditions when appropriate
          - Be culturally sensitive to Tamil healthcare practices
          - Use simple Tamil words that are easily understood by all Tamil speakers
          - When mentioning body parts, use common Tamil terms like: தலை (head), கண் (eye), காது (ear), மூக்கு (nose), வாய் (mouth), கழுத்து (neck), மார்பு (chest), வயிறு (stomach), கை (hand), கால் (leg)
          - For common symptoms use: வலி (pain), காய்ச்சல் (fever), இருமல் (cough), தலைவலி (headache), வயிற்று வலி (stomach pain)`;
        }
      }

      // Build search context if available
      let searchContext = '';
      if (searchResults && searchResults.results && searchResults.results.length > 0) {
        searchContext = `\n\nCURRENT MEDICAL RESEARCH AND INFORMATION:\n`;
        searchResults.results.forEach((result, index) => {
          searchContext += `${index + 1}. ${result.title}\n`;
          searchContext += `   Source: ${new URL(result.url).hostname}\n`;
          searchContext += `   Content: ${result.content.substring(0, 300)}...\n\n`;
        });
        searchContext += `Use this current medical information to enhance your response, but always emphasize consulting healthcare professionals.\n`;
      }

      // Build FAQ context if available
      let faqContextText = '';
      if (faqContext && faqContext.context) {
        faqContextText = `\n\nRELEVANT FREQUENTLY ASKED QUESTIONS:\n${faqContext.context}\n\nUse the above FAQ information to provide accurate and consistent answers. If the user's question is directly answered in the FAQs, prioritize that information.\n`;
      }

      const prompt = `
      You are MEDIBOT, a helpful medical AI assistant. You provide general health information and guidance but always remind users to consult healthcare professionals for proper diagnosis and treatment.

      ${languageInstructions}

      IMPORTANT GUIDELINES:
      - Provide helpful, accurate medical information in a clear, easy-to-read format
      - Use simple formatting: **bold** for important points, but avoid excessive formatting
      - Always recommend consulting a healthcare professional for diagnosis
      - Never provide specific medical diagnoses
      - Be empathetic and supportive
      - Ask clarifying questions when needed
      - Suggest when to seek immediate medical attention
      - Keep responses concise and well-structured
      - Use bullet points or numbered lists when appropriate
      - Respond in the user's language (${languageInfo?.name || 'English'})
      ${searchResults ? '- When using web search information, cite the sources and emphasize they are for educational purposes only' : ''}

      ${searchContext}
      ${faqContextText}

      Previous conversation:
      ${conversationContext}

      User: ${message}

      Respond as MEDIBOT with helpful medical guidance while emphasizing the importance of professional medical consultation. ${searchResults ? 'Include relevant information from the search results above, properly citing sources.' : ''} Format your response clearly and avoid excessive markdown formatting.
      `;

      // Try multiple Gemini models
      const geminiResult = await tryGeminiModels(prompt, timeoutMs);
      botResponse = geminiResult.text;
      
      console.log(`✅ Successfully used Gemini model: ${geminiResult.model}`);

    } catch (aiError) {
      const isQuotaError = aiError.message.includes('quota') || 
                          aiError.message.includes('429') || 
                          aiError.message.includes('Too Many Requests');
      
      if (isQuotaError) {
        console.log(`📊 All Gemini models quota exceeded, trying Ollama fallback`);
      } else {
        console.log(`❌ All Gemini models failed (${aiError.message}), trying Ollama fallback`);
      }
      
      try {
        // Try Ollama as fallback
        botResponse = await generateOllamaResponse(message, conversationHistory, language, languageInfo);
        usingFallback = true;
        console.log('✅ Successfully used Ollama fallback');
      } catch (ollamaError) {
        console.log('⚠️  Ollama fallback failed, using simple text response:', ollamaError.message);
        usingFallback = true;
        
        // Final fallback to simple text responses - this should NEVER fail
        try {
          botResponse = generateFallbackResponse(message, language, languageInfo);
          console.log('✅ Using simple text fallback response');
        } catch (fallbackError) {
          // If even simple fallback fails, provide a basic response
          console.error('❌ All fallbacks failed:', fallbackError);
          botResponse = language === 'ta' 
            ? "மன்னிக்கவும், தற்போது நான் பதிலளிக்க முடியவில்லை. மருத்துவ நிபுணரை அணுகவும்."
            : "I apologize for the technical difficulty. Please consult a healthcare professional for your medical concerns.";
        }
      }
      }
    }

    // Save chat history for logged-in users
    if (userId) {
      try {
        console.log('Saving chat history for user:', userId);
        // Generate session ID if not provided
        if (!currentSessionId) {
          currentSessionId = uuidv4();
          console.log('Generated new session ID:', currentSessionId);
        }

        // Find or create chat session
        let chatHistory = await ChatHistory.findOne({
          userId,
          sessionId: currentSessionId,
          isActive: true
        });

        if (!chatHistory) {
          console.log('Creating new chat session');
          // Create new session
          const metadata = {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip || req.connection.remoteAddress,
            deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
          };

          chatHistory = await ChatHistory.createSession(
            userId,
            currentSessionId,
            language,
            metadata
          );
          console.log('Created new session:', chatHistory.sessionId);
        } else {
          console.log('Using existing session:', chatHistory.sessionId);
        }

        // Add user message
        await chatHistory.addMessage({
          id: uuidv4(),
          role: 'user',
          content: message,
          language,
          timestamp: new Date()
        });

        // Add bot response
        await chatHistory.addMessage({
          id: uuidv4(),
          role: 'bot',
          content: botResponse,
          language,
          timestamp: new Date()
        });

        console.log(`Chat history saved for user ${userId}, session ${currentSessionId}, total messages: ${chatHistory.messages.length}`);
      } catch (historyError) {
        console.error('Error saving chat history:', historyError);
        // Don't fail the request if history saving fails
      }
    } else {
      console.log('No user ID, skipping chat history save');
    }

    res.json({
      response: botResponse,
      timestamp: new Date().toISOString(),
      language: language,
      sessionId: currentSessionId,
      saved: !!userId, // Indicate if the chat was saved
      usingFallback: usingFallback, // Indicate if fallback was used
      appointmentData: appointmentData, // Include appointment data if detected
      webSearchData: webSearchData, // Include web search data if used
      searchResults: searchResults ? {
        query: searchResults.query,
        totalResults: searchResults.totalResults,
        sources: searchResults.results?.map(r => ({
          title: r.title,
          url: r.url,
          domain: new URL(r.url).hostname
        })) || []
      } : null
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    // Even if there's an error, try to provide a fallback response instead of failing
    try {
      const fallbackResponse = generateFallbackResponse(
        req.body.message || 'help', 
        req.body.language || 'en', 
        req.body.languageInfo
      );
      
      console.log('Using emergency fallback due to system error');
      
      return res.json({
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        language: req.body.language || 'en',
        sessionId: req.body.sessionId,
        saved: false,
        usingFallback: true,
        fallbackReason: 'System error - using emergency fallback'
      });
    } catch (fallbackError) {
      console.error('Even emergency fallback failed:', fallbackError);
      
      // Absolute last resort - basic response (this should NEVER fail)
      const emergencyResponse = req.body.language === 'ta'
        ? "மன்னிக்கவும், தற்போது தொழில்நுட்ப சிக்கல் உள்ளது. மருத்துவ நிபுணரை அணுகவும்."
        : "I apologize for the technical difficulty. Please consult a healthcare professional for your medical concerns.";
      
      return res.json({
        response: emergencyResponse,
        timestamp: new Date().toISOString(),
        language: req.body.language || 'en',
        sessionId: req.body.sessionId,
        saved: false,
        usingFallback: true,
        fallbackReason: 'Emergency fallback - all systems unavailable'
      });
    }
  }
});

// Fallback response generator for when AI API is unavailable
function generateFallbackResponse(message, language = 'en', languageInfo) {
  try {
    const lowerMessage = message.toLowerCase();
    
    // Common medical keywords and responses
    const responses = {
      en: {
        greeting: "Hello! I'm MEDIBOT, your medical assistant. I'm currently running in limited mode due to high demand. How can I help you with your health concerns today?",
        headache: "For headaches, here are some general recommendations:\n\n**Immediate relief:**\n- Rest in a quiet, dark room\n- Apply a cold or warm compress\n- Stay hydrated\n- Consider over-the-counter pain relievers (follow package instructions)\n\n**When to see a doctor:**\n- Severe or sudden headaches\n- Headaches with fever, stiff neck, or vision changes\n- Frequent headaches that interfere with daily life\n\n**Important:** This is general information only. Please consult a healthcare professional for proper diagnosis and treatment.",
        fever: "For fever management:\n\n**General care:**\n- Rest and stay hydrated\n- Dress lightly and keep room cool\n- Monitor temperature regularly\n- Consider fever reducers if recommended by a healthcare provider\n\n**Seek immediate medical attention if:**\n- Temperature above 103°F (39.4°C)\n- Fever with severe symptoms (difficulty breathing, chest pain, severe headache)\n- Fever lasting more than 3 days\n- Signs of dehydration\n\n**Important:** Always consult a healthcare professional for proper evaluation and treatment.",
        pain: "For pain management:\n\n**General approaches:**\n- Rest the affected area\n- Apply ice for acute injuries (first 24-48 hours)\n- Apply heat for muscle tension\n- Gentle movement as tolerated\n- Over-the-counter pain relievers (follow instructions)\n\n**Seek medical attention for:**\n- Severe or worsening pain\n- Pain after injury\n- Pain with other concerning symptoms\n- Chronic pain affecting daily life\n\n**Important:** This is general guidance only. Please consult a healthcare professional for proper diagnosis and treatment.",
        emergency: "**This sounds like it could be a medical emergency.**\n\nPlease:\n- Call emergency services (911) immediately\n- Go to the nearest emergency room\n- Don't delay seeking immediate medical attention\n\nI'm an AI assistant and cannot provide emergency medical care. Your safety is the priority - please seek immediate professional medical help.",
        default: "Thank you for your question. I'm currently running in limited mode due to high demand on our AI services.\n\n**General health advice:**\n- For any concerning symptoms, consult a healthcare professional\n- Keep track of your symptoms (when they started, severity, triggers)\n- Maintain a healthy lifestyle (balanced diet, regular exercise, adequate sleep)\n- Stay up to date with preventive care and screenings\n\n**When to seek immediate medical attention:**\n- Severe or sudden symptoms\n- Difficulty breathing or chest pain\n- Signs of serious illness or injury\n\n**Important:** I provide general health information only. For proper diagnosis and treatment, please consult with a qualified healthcare professional.\n\nIs there a specific health concern I can provide general information about?"
      },
      ta: {
        greeting: "வணக்கம்! நான் மெடிபாட், உங்கள் மருத்துவ உதவியாளர். அதிக கோரிக்கையின் காரணமாக நான் தற்போது வரையறுக்கப்பட்ட முறையில் இயங்குகிறேன். உங்கள் சுகாதார கவலைகளில் இன்று நான் எப்படி உதவ முடியும்?",
        headache: "தலைவலிக்கு பொதுவான பரிந்துரைகள்:\n\n**உடனடி நிவாரணம்:**\n- அமைதியான, இருண்ட அறையில் ஓய்வு எடுங்கள்\n- குளிர் அல்லது சூடான ஒத்தடம் கொடுங்கள்\n- நீர்ச்சத்து பராமரிக்கவும்\n- மருந்தகத்தில் கிடைக்கும் வலி நிவாரணிகளை பரிசீலிக்கவும்\n\n**மருத்துவரை பார்க்க வேண்டிய நேரம்:**\n- கடுமையான அல்லது திடீர் தலைவலி\n- காய்ச்சல், கழுத்து விறைப்பு அல்லது பார்வை மாற்றங்களுடன் தலைவலி\n- அடிக்கடி வரும் தலைவலி\n\n**முக்கியம்:** இது பொதுவான தகவல் மட்டுமே. சரியான நோயறிதல் மற்றும் சிகிச்சைக்கு மருத்துவ நிபுணரை அணுகவும்.",
        default: "உங்கள் கேள்விக்கு நன்றி. எங்கள் AI சேவைகளில் அதிக கோரிக்கையின் காரணமாக நான் தற்போது வரையறுக்கப்பட்ட முறையில் இயங்குகிறேன்.\n\n**பொதுவான சுகாதார ஆலோசனை:**\n- எந்தவொரு கவலைக்குரிய அறிகுறிகளுக்கும் மருத்துவ நிபுணரை அணுகவும்\n- உங்கள் அறிகுறிகளை கண்காணிக்கவும்\n- ஆரோக்கியமான வாழ்க்கை முறையை பராமரிக்கவும்\n\n**உடனடி மருத்துவ கவனிப்பு தேவைப்படும் போது:**\n- கடுமையான அல்லது திடீர் அறிகுறிகள்\n- மூச்சு திணறல் அல்லது மார்பு வலி\n- கடுமையான நோய் அல்லது காயத்தின் அறிகுறிகள்\n\n**முக்கியம்:** நான் பொதுவான சுகாதார தகவல்களை மட்டுமே வழங்குகிறேன். சரியான நோயறிதல் மற்றும் சிகிச்சைக்கு தகுதிவாய்ந்த மருத்துவ நிபுணரை அணுகவும்."
      }
    };

    const langResponses = responses[language] || responses.en;
    
    // Check for emergency keywords
    const emergencyKeywords = ['emergency', 'urgent', 'severe pain', 'can\'t breathe', 'chest pain', 'heart attack', 'stroke'];
    if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return langResponses.emergency || responses.en.emergency;
    }
    
    // Check for specific symptoms
    if (lowerMessage.includes('headache') || lowerMessage.includes('தலைவலி')) {
      return langResponses.headache || responses.en.headache;
    }
    
    if (lowerMessage.includes('fever') || lowerMessage.includes('காய்ச்சல்')) {
      return langResponses.fever || responses.en.fever;
    }
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('வலி')) {
      return langResponses.pain || responses.en.pain;
    }
    
    // Check for greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('வணக்கம்')) {
      return langResponses.greeting || responses.en.greeting;
    }
    
    // Default response
    return langResponses.default || responses.en.default;
    
  } catch (error) {
    console.error('Fallback response generation error:', error);
    
    // Emergency fallback - should never fail
    return language === 'ta'
      ? "மன்னிக்கவும், தற்போது தொழில்நுட்ப சிக்கல் உள்ளது. மருத்துவ நிபுணரை அணுகவும்."
      : "I apologize for the technical difficulty. Please consult a healthcare professional for your medical concerns.";
  }
}

// Medical FAQ
router.get('/faq', async (req, res) => {
  try {
    const faqs = [
      {
        question: "How do I book an appointment?",
        answer: "You can book an appointment by selecting a doctor from our recommendations, choosing an available time slot, and confirming your booking. You'll receive a confirmation email with appointment details."
      },
      {
        question: "What should I do in case of emergency?",
        answer: "For medical emergencies, call emergency services immediately (911 in the US). MEDIBOT is for non-emergency consultations and health guidance only."
      },
      {
        question: "How accurate are the doctor recommendations?",
        answer: "Our AI analyzes your symptoms using advanced medical knowledge to suggest appropriate specialists. However, this is guidance only - always consult with healthcare professionals for proper diagnosis."
      },
      {
        question: "Is my medical information secure?",
        answer: "Yes, we follow strict HIPAA compliance and use encryption to protect your medical data. Your information is never shared without your consent."
      },
      {
        question: "Can I cancel or reschedule appointments?",
        answer: "Yes, you can cancel or reschedule appointments up to 24 hours before the scheduled time through your patient dashboard."
      }
    ];

    res.json({ faqs });
  } catch (error) {
    console.error('FAQ error:', error);
    res.status(500).json({ message: 'Error fetching FAQs' });
  }
});

// Test Tavily search functionality
router.get('/test-search', async (req, res) => {
  try {
    const { query = 'diabetes symptoms' } = req.query;
    
    if (!tavilySearch.initialized) {
      return res.status(503).json({
        message: 'Tavily Search API not configured',
        configured: false
      });
    }

    console.log(`🧪 Testing Tavily search with query: "${query}"`);
    
    const searchResults = await tavilySearch.searchMedical(query, {
      maxResults: 3,
      includeAnswer: true
    });

    res.json({
      message: 'Search test successful',
      configured: true,
      query: query,
      results: searchResults,
      totalResults: searchResults.totalResults,
      searchTime: searchResults.searchTime
    });

  } catch (error) {
    console.error('Search test error:', error);
    res.status(500).json({
      message: 'Search test failed',
      error: error.message,
      configured: tavilySearch.initialized
    });
  }
});

// Check AI services status
router.get('/status', async (req, res) => {
  try {
    const status = {
      gemini: {
        available: false,
        primaryModel: process.env.GEMINI_PRIMARY_MODEL || 'gemini-2.5-flash-lite',
        fallbackModels: (process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash,gemini-2.0-flash-lite').split(','),
        workingModels: []
      },
      ollama: false,
      ollamaModels: [],
      fallbackOnly: false,
      preferredModel: process.env.OLLAMA_PREFERRED_MODEL || 'qwen2.5-coder:0.5b',
      fallbackModels: (process.env.OLLAMA_FALLBACK_MODELS || 'phi3,llama3.1,llama3,mistral').split(','),
      calendar: {
        available: false,
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        error: null
      },
      tavilySearch: {
        available: false,
        configured: tavilySearch.initialized,
        error: null
      }
    };

    // Check Gemini API models
    const geminiModelsToTest = [status.gemini.primaryModel, ...status.gemini.fallbackModels];
    
    for (const modelName of geminiModelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName.trim() });
        const result = await model.generateContent('Hello');
        status.gemini.workingModels.push(modelName.trim());
        status.gemini.available = true;
      } catch (error) {
        console.log(`Gemini model ${modelName} not available:`, error.message);
      }
    }

    // Check Ollama
    try {
      const models = await ollama.list();
      status.ollama = true;
      status.ollamaModels = models.models.map(m => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at,
        isPreferred: m.name.toLowerCase().includes(status.preferredModel.toLowerCase()),
        isFallback: status.fallbackModels.some(fb => m.name.toLowerCase().includes(fb.toLowerCase()))
      }));
    } catch (error) {
      console.log('Ollama not available:', error.message);
      status.ollama = false;
    }

    // Check Google Calendar
    try {
      const googleCalendar = require('../services/googleCalendar');
      const calendarTest = await googleCalendar.testConnection();
      status.calendar.available = calendarTest;
      if (!calendarTest) {
        status.calendar.error = 'Calendar connection test failed';
      }
    } catch (calendarError) {
      console.log('Calendar not available:', calendarError.message);
      status.calendar.available = false;
      status.calendar.error = calendarError.message;
    }

    // Check Tavily Search
    try {
      const searchTest = await tavilySearch.testSearch();
      status.tavilySearch.available = searchTest;
      if (!searchTest && tavilySearch.initialized) {
        status.tavilySearch.error = 'Search test failed';
      } else if (!tavilySearch.initialized) {
        status.tavilySearch.error = 'API key not configured';
      }
    } catch (searchError) {
      console.log('Tavily Search not available:', searchError.message);
      status.tavilySearch.available = false;
      status.tavilySearch.error = searchError.message;
    }

    // If neither AI service is available, we're in fallback-only mode
    status.fallbackOnly = !status.gemini.available && !status.ollama;

    let message = 'Multiple services available';
    if (status.fallbackOnly) {
      message = 'Running in fallback mode with simple responses';
    } else if (status.gemini.available) {
      message = `Gemini AI available (${status.gemini.workingModels.length} models)`;
      if (status.ollama) {
        message += ` + Ollama local LLM`;
      }
    } else if (status.ollama) {
      message = 'Using Ollama local LLM only';
    }

    // Add calendar status to message
    if (status.calendar.available) {
      message += ' + Calendar integration';
    } else {
      message += ' (Calendar integration unavailable)';
    }

    // Add search status to message
    if (status.tavilySearch.available) {
      message += ' + Web search';
    } else if (status.tavilySearch.configured) {
      message += ' (Web search configured but unavailable)';
    } else {
      message += ' (Web search not configured)';
    }

    res.json({
      status: 'OK',
      services: status,
      message: message
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Error checking services status'
    });
  }
});

// Get available Ollama models with recommendations
router.get('/models', async (req, res) => {
  try {
    const models = await ollama.list();
    
    const modelRecommendations = {
      'llama3.1': { 
        category: 'Premium', 
        medical: 'Excellent', 
        multilingual: 'Excellent',
        speed: 'Medium',
        recommended: true,
        description: 'Best overall model for medical conversations'
      },
      'llama3': { 
        category: 'Premium', 
        medical: 'Very Good', 
        multilingual: 'Good',
        speed: 'Medium',
        recommended: true,
        description: 'High-quality general purpose model'
      },
      'mistral': { 
        category: 'Balanced', 
        medical: 'Good', 
        multilingual: 'Good',
        speed: 'Fast',
        recommended: true,
        description: 'Good balance of quality and speed'
      },
      'phi3': { 
        category: 'Lightweight', 
        medical: 'Basic', 
        multilingual: 'Limited',
        speed: 'Very Fast',
        recommended: false,
        description: 'Fast responses, basic medical knowledge'
      }
    };

    const enrichedModels = models.models.map(model => {
      const modelName = model.name.toLowerCase();
      let recommendation = { category: 'Other', medical: 'Unknown', multilingual: 'Unknown', speed: 'Unknown', recommended: false };
      
      for (const [pattern, rec] of Object.entries(modelRecommendations)) {
        if (modelName.includes(pattern)) {
          recommendation = rec;
          break;
        }
      }
      
      return {
        ...model,
        ...recommendation,
        isPreferred: modelName.includes((process.env.OLLAMA_PREFERRED_MODEL || 'llama3.1').toLowerCase()),
        isFallback: (process.env.OLLAMA_FALLBACK_MODELS || 'llama3,mistral,phi3')
          .split(',')
          .some(fb => modelName.includes(fb.toLowerCase()))
      };
    });

    res.json({
      models: enrichedModels,
      currentPreferred: process.env.OLLAMA_PREFERRED_MODEL || 'qwen2.5-coder:0.5b',
      currentFallbacks: (process.env.OLLAMA_FALLBACK_MODELS || 'phi3,llama3.1,llama3,mistral').split(',')
    });

  } catch (error) {
    console.error('Models list error:', error);
    res.status(500).json({ 
      message: 'Error fetching Ollama models',
      error: error.message 
    });
  }
});

// Confirm appointment booking from chat
router.post('/book-appointment', async (req, res) => {
  try {
    const { doctorId, dateTime, appointmentData, bookingId } = req.body;

    if (!doctorId || !dateTime) {
      return res.status(400).json({ message: 'Doctor ID and date/time are required' });
    }

    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let userId;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find or create patient profile
    const Patient = require('../models/Patient');
    let patient = await Patient.findOne({ userId });
    
    if (!patient) {
      // Create basic patient profile
      patient = new Patient({
        userId,
        medicalHistory: [],
        allergies: [],
        medications: []
      });
      await patient.save();
    }

    // Get doctor details
    const doctor = await Doctor.findById(doctorId).populate('userId', 'profile');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get patient user details
    const patientUser = await User.findById(userId);
    if (!patientUser) {
      return res.status(404).json({ message: 'Patient user not found' });
    }

    // Check if appointment slot is available (basic check)
    const Appointment = require('../models/Appointment');
    const existingAppointment = await Appointment.findOne({
      doctorId,
      dateTime: new Date(dateTime),
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(409).json({ message: 'This time slot is no longer available' });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      dateTime: new Date(dateTime),
      duration: 30,
      type: appointmentData?.appointmentType || 'consultation',
      status: 'scheduled',
      symptoms: appointmentData?.symptoms || [],
      chiefComplaint: appointmentData?.chiefComplaint || '',
      fee: {
        consultation: 0,
        additional: 0,
        total: 0,
        paid: false
      }
    });

    const savedAppointment = await appointment.save();

    // Try to create Google Calendar event with comprehensive fallback handling
    let calendarEventId = null;
    let calendarEventLink = null;
    let meetingLink = null;
    let calendarIntegrationStatus = 'disabled';
    let calendarErrorMessage = null;

    try {
      const googleCalendar = require('../services/googleCalendar');
      
      const calendarData = {
        patientName: `${patientUser.profile.firstName} ${patientUser.profile.lastName}`,
        patientEmail: patientUser.email,
        doctorName: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
        doctorEmail: doctor.userId.email,
        dateTime: savedAppointment.dateTime,
        duration: savedAppointment.duration,
        appointmentType: savedAppointment.type,
        chiefComplaint: savedAppointment.chiefComplaint,
        symptoms: savedAppointment.symptoms
      };

      console.log('🗓️  Attempting to create calendar event...');
      const calendarResult = await googleCalendar.createAppointmentEvent(calendarData);
      calendarEventId = calendarResult.eventId;
      calendarEventLink = calendarResult.eventLink;
      meetingLink = calendarResult.meetingLink;

      // Update appointment with calendar event ID
      savedAppointment.googleCalendarEventId = calendarEventId;
      await savedAppointment.save();

      calendarIntegrationStatus = 'success';
      console.log('✅ Calendar event created successfully:', calendarEventId);

    } catch (calendarError) {
      console.error('⚠️  Calendar integration failed:', calendarError.message);
      
      // Categorize the error for better user feedback
      if (calendarError.message.includes('quota') || calendarError.message.includes('429')) {
        calendarIntegrationStatus = 'quota_exceeded';
        calendarErrorMessage = 'Calendar service temporarily unavailable due to high usage';
      } else if (calendarError.message.includes('Not Found') || calendarError.message.includes('404')) {
        calendarIntegrationStatus = 'calendar_not_found';
        calendarErrorMessage = 'Calendar configuration issue - please contact support';
      } else if (calendarError.message.includes('Forbidden') || calendarError.message.includes('403')) {
        calendarIntegrationStatus = 'permission_denied';
        calendarErrorMessage = 'Calendar permissions issue - manual coordination required';
      } else if (calendarError.message.includes('service not available') || calendarError.message.includes('not initialized')) {
        calendarIntegrationStatus = 'service_unavailable';
        calendarErrorMessage = 'Calendar service temporarily unavailable';
      } else {
        calendarIntegrationStatus = 'unknown_error';
        calendarErrorMessage = 'Calendar integration temporarily unavailable';
      }
      
      console.log(`📊 Calendar integration status: ${calendarIntegrationStatus}`);
      
      // Don't fail the appointment booking if calendar fails
      // The appointment is still valid and functional without calendar integration
    }

    // Populate the appointment with doctor and patient details
    const populatedAppointment = await Appointment.findById(savedAppointment._id)
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'profile' }
      })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'profile' }
      });

    // Generate user-friendly calendar status message
    let calendarStatusMessage = '';
    let calendarInstructions = '';
    
    switch (calendarIntegrationStatus) {
      case 'success':
        calendarStatusMessage = 'Calendar event created successfully';
        calendarInstructions = 'Check your calendar for the appointment details and reminders.';
        break;
      case 'quota_exceeded':
        calendarStatusMessage = 'Appointment booked successfully (calendar temporarily unavailable)';
        calendarInstructions = 'Your appointment is confirmed. Please manually add this to your calendar and contact the doctor directly.';
        break;
      case 'calendar_not_found':
      case 'permission_denied':
        calendarStatusMessage = 'Appointment booked successfully (calendar integration unavailable)';
        calendarInstructions = 'Your appointment is confirmed. Please manually add this to your calendar and contact the doctor directly.';
        break;
      case 'service_unavailable':
      case 'unknown_error':
      default:
        calendarStatusMessage = 'Appointment booked successfully (calendar sync pending)';
        calendarInstructions = 'Your appointment is confirmed. Calendar integration may sync later, or please add manually to your calendar.';
        break;
    }

    res.json({
      message: calendarStatusMessage,
      appointment: {
        id: populatedAppointment._id,
        doctorName: `Dr. ${populatedAppointment.doctorId.userId.profile.firstName} ${populatedAppointment.doctorId.userId.profile.lastName}`,
        specialization: populatedAppointment.doctorId.specialization,
        dateTime: populatedAppointment.dateTime,
        type: populatedAppointment.type,
        fee: populatedAppointment.fee,
        status: populatedAppointment.status,
        symptoms: populatedAppointment.symptoms,
        chiefComplaint: populatedAppointment.chiefComplaint,
        calendarEventLink: calendarEventLink,
        meetingLink: meetingLink
      },
      calendarIntegration: {
        status: calendarIntegrationStatus,
        message: calendarErrorMessage,
        instructions: calendarInstructions,
        fallbackUsed: calendarIntegrationStatus !== 'success'
      },
      // Provide manual calendar details for fallback
      manualCalendarDetails: calendarIntegrationStatus !== 'success' ? {
        title: `Medical Appointment with Dr. ${populatedAppointment.doctorId.userId.profile.firstName} ${populatedAppointment.doctorId.userId.profile.lastName}`,
        dateTime: populatedAppointment.dateTime,
        duration: `${populatedAppointment.duration || 30} minutes`,
        location: 'Contact doctor for location/meeting details',
        description: `Appointment Type: ${populatedAppointment.type}\nSymptoms: ${populatedAppointment.symptoms.join(', ')}\nChief Complaint: ${populatedAppointment.chiefComplaint}`,
        doctorContact: doctor.userId.email,
        patientContact: patientUser.email
      } : null
    });

  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({ 
      message: error.message || 'Error booking appointment' 
    });
  }
});

// Get user's appointment history
router.get('/appointments', async (req, res) => {
  try {
    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let userId;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find patient
    const Patient = require('../models/Patient');
    const patient = await Patient.findOne({ userId });
    
    if (!patient) {
      return res.json({ appointments: [] });
    }

    // Get appointments
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'profile' }
      })
      .sort({ dateTime: -1 })
      .limit(50);

    const formattedAppointments = appointments.map(appointment => ({
      id: appointment._id,
      doctorName: `Dr. ${appointment.doctorId.userId.profile.firstName} ${appointment.doctorId.userId.profile.lastName}`,
      specialization: appointment.doctorId.specialization,
      dateTime: appointment.dateTime,
      type: appointment.type,
      status: appointment.status,
      fee: appointment.fee,
      symptoms: appointment.symptoms,
      chiefComplaint: appointment.chiefComplaint,
      diagnosis: appointment.diagnosis,
      notes: appointment.notes,
      createdAt: appointment.createdAt
    }));

    res.json({ appointments: formattedAppointments });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointment history' });
  }
});

// Cancel appointment
router.put('/appointments/:appointmentId/cancel', async (req, res) => {
  try {
    // Get user from token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let userId;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { appointmentId } = req.params;

    // Find patient
    const Patient = require('../models/Patient');
    const patient = await Patient.findOne({ userId });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find and update appointment
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patient._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed appointment' });
    }

    // Check if appointment is within 24 hours
    const appointmentTime = new Date(appointment.dateTime);
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff < 24) {
      return res.status(400).json({ 
        message: 'Cannot cancel appointment within 24 hours of scheduled time' 
      });
    }

    // Cancel Google Calendar event if it exists (with fallback handling)
    let calendarCancellationStatus = 'not_applicable';
    let calendarCancellationMessage = '';
    
    if (appointment.googleCalendarEventId) {
      try {
        const googleCalendar = require('../services/googleCalendar');
        await googleCalendar.cancelAppointmentEvent(appointment.googleCalendarEventId);
        calendarCancellationStatus = 'success';
        calendarCancellationMessage = 'Calendar event cancelled successfully';
        console.log('✅ Calendar event cancelled:', appointment.googleCalendarEventId);
      } catch (calendarError) {
        console.error('⚠️  Calendar cancellation failed:', calendarError.message);
        calendarCancellationStatus = 'failed';
        
        if (calendarError.message.includes('Not Found') || calendarError.message.includes('404')) {
          calendarCancellationMessage = 'Calendar event may have been already removed or not found';
        } else if (calendarError.message.includes('quota') || calendarError.message.includes('429')) {
          calendarCancellationMessage = 'Calendar service temporarily unavailable - please manually remove from calendar';
        } else {
          calendarCancellationMessage = 'Calendar event cancellation failed - please manually remove from calendar';
        }
        
        // Don't fail the appointment cancellation if calendar fails
        // The appointment cancellation is still valid
      }
    } else {
      calendarCancellationMessage = 'No calendar event was associated with this appointment';
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Generate appropriate response message
    let responseMessage = 'Appointment cancelled successfully';
    if (calendarCancellationStatus === 'failed') {
      responseMessage += ' (please manually remove from calendar)';
    }

    res.json({ 
      message: responseMessage,
      appointment: {
        id: appointment._id,
        status: appointment.status
      },
      calendarIntegration: {
        status: calendarCancellationStatus,
        message: calendarCancellationMessage,
        fallbackUsed: calendarCancellationStatus === 'failed'
      }
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Error cancelling appointment' });
  }
});

module.exports = router;