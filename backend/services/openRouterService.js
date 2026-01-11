const OpenAI = require('openai');

class OpenRouterService {
  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    
    // Default model with reasoning capabilities
    this.defaultModel = 'nvidia/nemotron-nano-12b-v2-vl:free';
  }

  /**
   * Generate response with reasoning capabilities
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {Object} options - Additional options
   * @returns {Object} Response with content and reasoning details
   */
  async generateResponse(message, conversationHistory = [], options = {}) {
    try {
      const {
        model = this.defaultModel,
        enableReasoning = true,
        language = 'en',
        languageInfo = null,
        maxTokens = 1000,
        temperature = 0.7
      } = options;

      // Build messages array
      const messages = this.buildMessages(message, conversationHistory, language, languageInfo);

      // First API call with reasoning
      const requestOptions = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature
      };

      // Enable reasoning if supported and requested
      if (enableReasoning) {
        requestOptions.reasoning = { enabled: true };
      }

      console.log(`🤖 OpenRouter: Making request to ${model} with reasoning: ${enableReasoning}`);
      
      const apiResponse = await this.client.chat.completions.create(requestOptions);

      // Extract the assistant message with reasoning_details
      const response = apiResponse.choices[0].message;
      
      return {
        content: response.content,
        reasoning_details: response.reasoning_details || null,
        model: model,
        usage: apiResponse.usage,
        finishReason: apiResponse.choices[0].finish_reason
      };

    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error(`OpenRouter service failed: ${error.message}`);
    }
  }

  /**
   * Continue conversation with preserved reasoning context
   * @param {Array} messages - Full conversation including reasoning_details
   * @param {string} newMessage - New user message
   * @param {Object} options - Additional options
   * @returns {Object} Response with continued reasoning
   */
  async continueConversation(messages, newMessage, options = {}) {
    try {
      const {
        model = this.defaultModel,
        maxTokens = 1000,
        temperature = 0.7
      } = options;

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
        temperature
      });

      const assistantMessage = response.choices[0].message;
      
      return {
        content: assistantMessage.content,
        reasoning_details: assistantMessage.reasoning_details || null,
        model: model,
        usage: response.usage,
        finishReason: response.choices[0].finish_reason,
        fullConversation: [
          ...updatedMessages,
          {
            role: 'assistant',
            content: assistantMessage.content,
            reasoning_details: assistantMessage.reasoning_details
          }
        ]
      };

    } catch (error) {
      console.error('OpenRouter conversation continuation error:', error);
      throw new Error(`OpenRouter conversation failed: ${error.message}`);
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
    let systemPrompt = `You are MEDIBOT, a helpful medical AI assistant. You provide general health information and guidance but always remind users to consult healthcare professionals for proper diagnosis and treatment.

IMPORTANT GUIDELINES:
- Provide helpful, accurate medical information in a clear, easy-to-read format
- Use simple formatting with **bold** for important points
- Always recommend consulting a healthcare professional for diagnosis
- Never provide specific medical diagnoses
- Be empathetic and supportive
- Ask clarifying questions when needed
- Suggest when to seek immediate medical attention
- Keep responses concise and well-structured
- Use bullet points or numbered lists when appropriate`;

    // Add language-specific instructions
    if (language !== 'en') {
      systemPrompt += `\n\nPlease respond in ${languageInfo?.name || language}. Use natural, clear language appropriate for medical communication in this language.`;
      
      if (language === 'ta') {
        systemPrompt += `
        - Use respectful Tamil medical terminology
        - Include common Tamil phrases for medical conditions when appropriate
        - Use simple Tamil words that are easily understood
        - For body parts use: தலை (head), கண் (eye), காது (ear), மார்பு (chest), வயிறு (stomach), கை (hand), கால் (leg)
        - For symptoms use: வலி (pain), காய்ச்சல் (fever), இருமல் (cough), தலைவலி (headache)`;
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
          id: 'nvidia/nemotron-nano-12b-v2-vl:free',
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
   * Analyze medical symptoms using reasoning
   * @param {Array} symptoms - List of symptoms
   * @param {Object} patientInfo - Patient information
   * @returns {Object} Analysis with reasoning
   */
  async analyzeSymptoms(symptoms, patientInfo = {}) {
    try {
      const { age, gender, urgency } = patientInfo;
      
      const prompt = `As a medical AI assistant, analyze the following symptoms and patient information:

Symptoms: ${symptoms.join(', ')}
Age: ${age || 'Not specified'}
Gender: ${gender || 'Not specified'}
Urgency: ${urgency || 'Normal'}

Based on these symptoms, recommend the most appropriate medical specialization(s) from this list:
General Medicine, Cardiology, Dermatology, Endocrinology, Gastroenterology, Neurology, Oncology, Orthopedics, Pediatrics, Psychiatry, Pulmonology, Radiology, Surgery, Urology, Gynecology, Ophthalmology, ENT, Emergency Medicine

Think through your reasoning step by step, considering:
1. The primary symptoms and their potential causes
2. The patient's age and gender relevance
3. The urgency level and any red flags
4. The most appropriate specialist to consult

Provide your response in this JSON format:
{
  "primarySpecialization": "specialization name",
  "alternativeSpecializations": ["alt1", "alt2"],
  "urgencyLevel": "low/medium/high",
  "reasoning": "detailed explanation of your analysis",
  "redFlags": ["any concerning symptoms that need immediate attention"],
  "confidence": 0.8
}`;

      const response = await this.generateResponse(prompt, [], {
        enableReasoning: true,
        maxTokens: 800
      });

      // Try to parse JSON from response
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        
        return {
          analysis,
          reasoning: response.reasoning_details,
          model: response.model
        };
      } catch (parseError) {
        console.error('Error parsing OpenRouter analysis:', parseError);
        return {
          analysis: null,
          reasoning: response.reasoning_details,
          model: response.model,
          rawResponse: response.content
        };
      }

    } catch (error) {
      console.error('OpenRouter symptom analysis error:', error);
      throw error;
    }
  }
}

module.exports = new OpenRouterService();