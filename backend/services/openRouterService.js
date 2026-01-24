const OpenAI = require('openai');
const responseTemplates = require('./responseTemplates');

class OpenRouterService {
  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    
    // Default model with reasoning capabilities
    this.defaultModel = 'openai/gpt-oss-120b';
  }

  /**
   * Generate structured medical response with reduced hallucination
   * @param {string} message - User message
   * @param {Array} images - Array of image data (base64)
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {Object} options - Additional options
   * @returns {Object} Response with structured content
   */
  async generateResponse(message, conversationHistory = [], options = {}) {
    try {
      const {
        model = this.defaultModel,
        images = [],
        enableReasoning = true,
        language = 'en',
        languageInfo = null,
        maxTokens = 800,
        temperature = 0.3 // Lower temperature for more consistent responses
      } = options;

      // Use vision model if images are provided
      const selectedModel = images && images.length > 0 
        ? 'openai/gpt-oss-120b' // Vision-capable model
        : model;

      // Check for emergency situations first
      if (responseTemplates.isEmergency(message, language)) {
        console.log('🚨 Emergency detected - using emergency template');
        return {
          content: responseTemplates.generateEmergencyResponse(language),
          reasoning_details: null,
          model: 'emergency_template',
          usage: { total_tokens: 0 },
          finishReason: 'emergency_template',
          isTemplate: true
        };
      }

      // Extract symptom for structured response
      const symptom = responseTemplates.extractSymptom(message, language);
      
      // Build structured prompt to reduce hallucination
      const structuredPrompt = this.buildStructuredPrompt(message, symptom, conversationHistory, language, languageInfo, images);

      // Make API call with structured constraints
      const requestOptions = {
        model: selectedModel,
        messages: structuredPrompt,
        max_tokens: maxTokens,
        temperature, // Lower temperature for consistency
        top_p: 0.8, // Reduce randomness
        frequency_penalty: 0.3, // Reduce repetition
        presence_penalty: 0.2
      };

      // Enable reasoning if supported and requested (not available for vision models)
      if (enableReasoning && !images?.length) {
        requestOptions.reasoning = { enabled: true };
      }

      console.log(`🤖 OpenRouter: Making structured request to ${selectedModel}${images?.length ? ' (with images)' : ''}`);
      
      const apiResponse = await this.client.chat.completions.create(requestOptions);
      const response = apiResponse.choices[0].message;
      
      // Post-process response to ensure it follows medical guidelines
      const processedContent = this.postProcessMedicalResponse(response.content, symptom, language, images?.length > 0);
      
      return {
        content: processedContent,
        reasoning_details: response.reasoning_details || null,
        model: selectedModel,
        usage: apiResponse.usage,
        finishReason: apiResponse.choices[0].finish_reason,
        isTemplate: false
      };

    } catch (error) {
      console.error('OpenRouter API error:', error);
      
      // Return a simple error message instead of template fallback
      const errorMessage = language === 'ta' 
        ? 'மன்னிக்கவும், தற்போது AI சேவை கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்.'
        : 'Sorry, the AI service is currently unavailable. Please try again later.';
      
      return {
        content: errorMessage,
        reasoning_details: null,
        model: 'error',
        usage: { total_tokens: 0 },
        finishReason: 'error',
        isTemplate: false,
        error: error.message
      };
    }
  }

  /**
   * Build structured prompt to reduce hallucination
   */
  buildStructuredPrompt(message, symptom, conversationHistory, language, languageInfo, images = []) {
    const messages = [];

    // System message with strict medical guidelines
    let systemPrompt = `You are MEDIBOT, a medical AI assistant.

RULES:
1. Answer user's question directly first
2. Use natural, conversational language
3. No bold titles, headers, or numbered sections
4. Write in flowing paragraphs
5. Add medical disclaimers after answering
6. For emergencies, direct to immediate care

FORBIDDEN:
- Bold titles (**Title:** format)
- Numbered sections (1., 2., 3.)
- Template phrases
- Specific diagnoses
- Medication dosages`;

    // Add image analysis guidelines if images are present
    if (images && images.length > 0) {
      systemPrompt += `

IMAGE ANALYSIS:
- Describe observations in general terms only
- Never diagnose from images
- Recommend professional evaluation
- Images cannot replace medical examination`;
    }

    // Add language-specific instructions
    if (language !== 'en') {
      systemPrompt += `\n\nRespond in ${languageInfo?.name || language}. Use clear medical terms.`;
      
      if (language === 'ta') {
        systemPrompt += ` Use simple Tamil words and respectful medical terminology.`;
      }
    }

    messages.push({
      role: 'system',
      content: systemPrompt
    });

    // Add conversation history (limited to prevent context drift)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-3); // Only last 3 exchanges
      
      recentHistory.forEach(msg => {
        const messageObj = {
          role: msg.role,
          content: msg.content
        };
        
        // Preserve reasoning_details for assistant messages
        if (msg.role === 'assistant' && msg.reasoning_details) {
          messageObj.reasoning_details = msg.reasoning_details;
        }
        
        messages.push(messageObj);
      });
    }

    // Build current user message
    let userMessageContent = [];
    
    // Add text content
    const structuredUserMessage = `${message}

Answer directly without titles or sections. Use natural paragraphs.`;

    // Handle images if present
    if (images && images.length > 0) {
      userMessageContent.push({
        type: 'text',
        text: structuredUserMessage + ` Analyze the ${images.length} uploaded image(s) in natural paragraphs.`
      });

      // Add each image
      images.forEach((image, index) => {
        userMessageContent.push({
          type: 'image_url',
          image_url: {
            url: image.data,
            detail: 'high'
          }
        });
      });
    } else {
      userMessageContent = structuredUserMessage;
    }

    messages.push({
      role: 'user',
      content: userMessageContent
    });

    return messages;
  }

  /**
   * Post-process AI response - simplified to just return content as-is
   */
  postProcessMedicalResponse(content, symptom, language, hasImages = false) {
    // Return content without any filtering or modifications
    return content;
  }

  /**
   * Continue conversation with preserved reasoning context
   */
  async continueConversation(messages, newMessage, options = {}) {
    try {
      const {
        model = this.defaultModel,
        maxTokens = 800,
        temperature = 0.3 // Lower temperature for consistency
      } = options;

      // Check for emergency in new message
      if (responseTemplates.isEmergency(newMessage, options.language)) {
        console.log('🚨 Emergency detected in continuation - using emergency template');
        return {
          content: responseTemplates.generateEmergencyResponse(options.language),
          reasoning_details: null,
          model: 'emergency_template',
          usage: { total_tokens: 0 },
          finishReason: 'emergency_template',
          isTemplate: true,
          fullConversation: [
            ...messages,
            {
              role: 'user',
              content: newMessage
            },
            {
              role: 'assistant',
              content: responseTemplates.generateEmergencyResponse(options.language)
            }
          ]
        };
      }

      // Add new user message to conversation
      const updatedMessages = [
        ...messages,
        {
          role: 'user',
          content: newMessage
        }
      ];

      console.log(`🔄 OpenRouter: Continuing conversation with ${model}`);
      
      const response = await this.client.chat.completions.create({
        model,
        messages: updatedMessages,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.8,
        frequency_penalty: 0.3,
        presence_penalty: 0.2
      });

      const assistantMessage = response.choices[0].message;
      
      // Post-process the response
      const symptom = responseTemplates.extractSymptom(newMessage, options.language);
      const processedContent = this.postProcessMedicalResponse(
        assistantMessage.content, 
        symptom, 
        options.language
      );
      
      return {
        content: processedContent,
        reasoning_details: assistantMessage.reasoning_details || null,
        model: model,
        usage: response.usage,
        finishReason: response.choices[0].finish_reason,
        isTemplate: false,
        fullConversation: [
          ...updatedMessages,
          {
            role: 'assistant',
            content: processedContent,
            reasoning_details: assistantMessage.reasoning_details
          }
        ]
      };

    } catch (error) {
      console.error('OpenRouter conversation continuation error:', error);
      
      // Fallback to template response
      const symptom = responseTemplates.extractSymptom(newMessage, options.language);
      const fallbackResponse = responseTemplates.generateMedicalResponse(newMessage, symptom, options.language);
      
      return {
        content: fallbackResponse.formatted, // Use formatted string, not the whole object
        reasoning_details: null,
        model: 'fallback_template',
        usage: { total_tokens: 0 },
        finishReason: 'fallback_template',
        isTemplate: true,
        error: error.message,
        fullConversation: [
          ...messages,
          {
            role: 'user',
            content: newMessage
          },
          {
            role: 'assistant',
            content: fallbackResponse.formatted // Use formatted string here too
          }
        ]
      };
    }
  }

  /**
   * Build messages array for OpenRouter API
   * @param {string} message - Current user message
   * @param {Array} conversationHistory - Previous messages
   * @param {string} language - Response language
   * @param {Object} languageInfo - Language information
   * @returns {Array} Formatted messages array
   */
  buildMessages(message, conversationHistory = [], language = 'en', languageInfo = null) {
    const messages = [];

    // System message for medical context
    let systemPrompt = `You are MEDIBOT, a medical AI assistant.

GUIDELINES:
- Answer user's question directly first
- Use natural, conversational language
- No bold titles or numbered sections
- Be empathetic and supportive
- Add medical disclaimers after answering
- Recommend professional consultation when needed

FORBIDDEN:
- Generic template phrases
- Bold headers or titles
- Formal structured responses`;

    // Add language-specific instructions
    if (language !== 'en') {
      systemPrompt += `\n\nRespond in ${languageInfo?.name || language}.`;
      
      if (language === 'ta') {
        systemPrompt += ` Use simple Tamil medical terms.`;
      }
    }

    messages.push({
      role: 'system',
      content: systemPrompt
    });

    // Add conversation history (preserve reasoning_details if present)
    if (conversationHistory && conversationHistory.length > 0) {
      // Take last 5 messages to keep context manageable
      const recentHistory = conversationHistory.slice(-5);
      
      recentHistory.forEach(msg => {
        const messageObj = {
          role: msg.role,
          content: msg.content
        };
        
        // Preserve reasoning_details for assistant messages
        if (msg.role === 'assistant' && msg.reasoning_details) {
          messageObj.reasoning_details = msg.reasoning_details;
        }
        
        messages.push(messageObj);
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    return messages;
  }

  /**
   * Check if OpenRouter service is available
   * @returns {Promise<boolean>} Service availability status
   */
  async checkAvailability() {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        console.log('OpenRouter API key not configured');
        return false;
      }

      // Make a simple test request
      const testResponse = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });

      console.log('✅ OpenRouter service is available');
      return true;
    } catch (error) {
      console.log('❌ OpenRouter service unavailable:', error.message);
      return false;
    }
  }

  /**
   * Get available models from OpenRouter
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    try {
      // OpenRouter doesn't have a models endpoint in the same way as OpenAI
      // Return a list of commonly available models
      return [
        {
          id: 'openai/gpt-oss-120b',
          name: 'Nemotron Nano 12B VL (Free)',
          description: 'NVIDIA\'s vision-language model with reasoning capabilities',
          reasoning: true,
          free: true
        },
        {
          id: 'meta-llama/llama-3.2-3b-instruct:free',
          name: 'Llama 3.2 3B Instruct (Free)',
          description: 'Meta\'s instruction-tuned model',
          reasoning: false,
          free: true
        },
        {
          id: 'meta-llama/llama-3.2-1b-instruct:free',
          name: 'Llama 3.2 1B Instruct (Free)',
          description: 'Lightweight instruction-tuned model',
          reasoning: false,
          free: true
        }
      ];
    } catch (error) {
      console.error('Error getting OpenRouter models:', error);
      return [];
    }
  }

  /**
   * Analyze medical symptoms using structured approach
   * @param {Array} symptoms - List of symptoms
   * @param {Object} patientInfo - Patient information
   * @returns {Object} Analysis with structured recommendations
   */
  async analyzeSymptoms(symptoms, patientInfo = {}) {
    try {
      const { age, gender, urgency } = patientInfo;
      
      // Check for emergency symptoms first
      const emergencySymptoms = symptoms.some(symptom => 
        responseTemplates.isEmergency(symptom, 'en')
      );
      
      if (emergencySymptoms) {
        console.log('🚨 Emergency symptoms detected in analysis');
        return {
          analysis: {
            primarySpecialization: 'Emergency Medicine',
            alternativeSpecializations: [],
            urgencyLevel: 'high',
            reasoning: 'Emergency symptoms detected - immediate medical attention required',
            redFlags: symptoms,
            confidence: 1.0,
            isEmergency: true
          },
          reasoning: null,
          model: 'emergency_template'
        };
      }

      // Use structured prompt for symptom analysis
      const prompt = `Analyze these symptoms for medical specialization recommendation:

Symptoms: ${symptoms.join(', ')}
Age: ${age || 'Not specified'}
Gender: ${gender || 'Not specified'}
Urgency: ${urgency || 'Normal'}

STRICT REQUIREMENTS:
1. Only recommend from these specializations: General Medicine, Cardiology, Dermatology, Endocrinology, Gastroenterology, Neurology, Oncology, Orthopedics, Pediatrics, Psychiatry, Pulmonology, Radiology, Surgery, Urology, Gynecology, Ophthalmology, ENT, Emergency Medicine
2. Consider age appropriateness (Pediatrics for under 18)
3. Base recommendations on symptom patterns, not specific diagnoses
4. Provide educational reasoning only

Respond in this EXACT JSON format:
{
  "primarySpecialization": "specialization name",
  "alternativeSpecializations": ["alt1", "alt2"],
  "urgencyLevel": "low/medium/high",
  "reasoning": "educational explanation of symptom patterns and why this specialization is appropriate",
  "redFlags": ["symptoms requiring immediate attention"],
  "confidence": 0.8
}`;

      const response = await this.generateResponse(prompt, [], {
        enableReasoning: true,
        maxTokens: 600,
        temperature: 0.2 // Very low temperature for consistent analysis
      });

      // Try to parse JSON from response
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        let analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        
        // Validate and sanitize analysis
        if (analysis) {
          analysis = this.validateSymptomAnalysis(analysis, symptoms, patientInfo);
        }
        
        return {
          analysis,
          reasoning: response.reasoning_details,
          model: response.model,
          isTemplate: response.isTemplate
        };
      } catch (parseError) {
        console.error('Error parsing OpenRouter analysis:', parseError);
        
        // Fallback to rule-based analysis
        const fallbackAnalysis = this.generateFallbackAnalysis(symptoms, patientInfo);
        
        return {
          analysis: fallbackAnalysis,
          reasoning: null,
          model: 'fallback_rules',
          isTemplate: true
        };
      }

    } catch (error) {
      console.error('OpenRouter symptom analysis error:', error);
      
      // Fallback to rule-based analysis
      const fallbackAnalysis = this.generateFallbackAnalysis(symptoms, patientInfo);
      
      return {
        analysis: fallbackAnalysis,
        reasoning: null,
        model: 'fallback_rules',
        isTemplate: true,
        error: error.message
      };
    }
  }

  /**
   * Validate and sanitize symptom analysis
   */
  validateSymptomAnalysis(analysis, symptoms, patientInfo) {
    const validSpecializations = [
      'General Medicine', 'Cardiology', 'Dermatology', 'Endocrinology', 
      'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics', 
      'Pediatrics', 'Psychiatry', 'Pulmonology', 'Radiology', 
      'Surgery', 'Urology', 'Gynecology', 'Ophthalmology', 'ENT', 
      'Emergency Medicine'
    ];

    // Validate primary specialization
    if (!validSpecializations.includes(analysis.primarySpecialization)) {
      analysis.primarySpecialization = 'General Medicine';
    }

    // Validate alternative specializations
    if (analysis.alternativeSpecializations) {
      analysis.alternativeSpecializations = analysis.alternativeSpecializations
        .filter(spec => validSpecializations.includes(spec))
        .slice(0, 2); // Limit to 2 alternatives
    }

    // Validate urgency level
    if (!['low', 'medium', 'high'].includes(analysis.urgencyLevel)) {
      analysis.urgencyLevel = 'medium';
    }

    // Ensure confidence is between 0 and 1
    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
      analysis.confidence = 0.7;
    }

    // Age-based validation
    if (patientInfo.age && patientInfo.age < 18 && analysis.primarySpecialization !== 'Pediatrics') {
      analysis.alternativeSpecializations = analysis.alternativeSpecializations || [];
      if (!analysis.alternativeSpecializations.includes('Pediatrics')) {
        analysis.alternativeSpecializations.unshift('Pediatrics');
      }
    }

    return analysis;
  }

  /**
   * Generate rule-based fallback analysis
   */
  generateFallbackAnalysis(symptoms, patientInfo) {
    const { age, urgency } = patientInfo;
    
    // Simple rule-based mapping
    const symptomMap = {
      'chest pain': 'Cardiology',
      'heart': 'Cardiology',
      'skin': 'Dermatology',
      'rash': 'Dermatology',
      'headache': 'Neurology',
      'back pain': 'Orthopedics',
      'joint': 'Orthopedics',
      'stomach': 'Gastroenterology',
      'nausea': 'Gastroenterology',
      'ear': 'ENT',
      'throat': 'ENT',
      'eye': 'Ophthalmology',
      'vision': 'Ophthalmology',
      'breathing': 'Pulmonology',
      'cough': 'Pulmonology',
      'anxiety': 'Psychiatry',
      'depression': 'Psychiatry'
    };

    let primarySpecialization = 'General Medicine';
    const alternativeSpecializations = [];

    // Find matching specialization
    const lowerSymptoms = symptoms.map(s => s.toLowerCase()).join(' ');
    for (const [keyword, specialization] of Object.entries(symptomMap)) {
      if (lowerSymptoms.includes(keyword)) {
        primarySpecialization = specialization;
        break;
      }
    }

    // Age-based adjustments
    if (age && age < 18) {
      alternativeSpecializations.push('Pediatrics');
    }

    // Urgency-based adjustments
    let urgencyLevel = 'medium';
    if (urgency === 'urgent' || urgency === 'high') {
      urgencyLevel = 'high';
    }

    return {
      primarySpecialization,
      alternativeSpecializations,
      urgencyLevel,
      reasoning: 'Based on symptom keyword matching - please consult a healthcare professional for proper evaluation',
      redFlags: [],
      confidence: 0.6,
      isFallback: true
    };
  }
}

module.exports = new OpenRouterService();