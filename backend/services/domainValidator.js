const openRouterService = require('./openRouterService');

/**
 * Domain Validator - Ensures chat stays within healthcare/medical appointment domain
 */
class DomainValidator {
  constructor() {
    // Healthcare domain keywords
    this.healthcareKeywords = [
      'doctor', 'appointment', 'medical', 'health', 'symptom', 'disease', 'treatment',
      'medicine', 'hospital', 'clinic', 'patient', 'consultation', 'diagnosis',
      'prescription', 'specialist', 'surgery', 'therapy', 'vaccine', 'checkup',
      'emergency', 'pain', 'fever', 'cough', 'cold', 'flu', 'injury', 'illness',
      'medibot', 'booking', 'schedule', 'reschedule', 'cancel', 'fee', 'rating',
      'cardiology', 'dermatology', 'pediatrics', 'orthopedics', 'neurology',
      'psychiatry', 'gynecology', 'ophthalmology', 'ent', 'dentistry', 'cpr',
      'first aid', 'resuscitation', 'heimlich', 'choking', 'bandage', 'wound care'
    ];

    // Tamil healthcare keywords
    this.tamilHealthcareKeywords = [
      'மருத்துவர்', 'நியமனம்', 'மருத்துவம்', 'உடல்நலம்', 'அறிகுறி',
      'நோய்', 'சிகிச்சை', 'மருந்து', 'மருத்துவமனை', 'நோயாளி'
    ];

    // Allowed general conversation patterns (greetings, thanks, etc.)
    this.allowedGeneralPatterns = [
      /^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/i,
      /^(thank you|thanks|thank|appreciate)/i,
      /^(bye|goodbye|see you|take care)/i,
      /^(yes|no|okay|ok|sure|alright)/i,
      /^(help|assist|support)/i
    ];

    // Off-topic categories to reject
    this.offTopicCategories = [
      'politics', 'sports', 'entertainment', 'cooking', 'travel',
      'technology (non-medical)', 'finance', 'education (non-medical)',
      'shopping', 'gaming', 'weather', 'news', 'social media',
      'religion', 'philosophy', 'history', 'geography', 'mathematics',
      'programming', 'business', 'real estate', 'automotive'
    ];
  }

  /**
   * Validate if message is within healthcare domain
   */
  async validateDomain(message, language = 'en') {
    try {
      // Quick check: Allow short greetings and acknowledgments
      if (message.length < 20) {
        for (const pattern of this.allowedGeneralPatterns) {
          if (pattern.test(message)) {
            return {
              isValid: true,
              confidence: 1.0,
              method: 'pattern_match',
              reasoning: 'Allowed general conversation'
            };
          }
        }
      }

      // Quick keyword check
      const hasHealthcareKeyword = this.hasHealthcareKeywords(message);
      if (hasHealthcareKeyword) {
        return {
          isValid: true,
          confidence: 0.9,
          method: 'keyword_match',
          reasoning: 'Healthcare keywords detected'
        };
      }

      // Use AI for more nuanced validation
      const aiValidation = await this.validateWithAI(message, language);
      return aiValidation;

    } catch (error) {
      console.error('Domain validation error:', error);
      // On error, be permissive to avoid blocking legitimate queries
      return {
        isValid: true,
        confidence: 0.5,
        method: 'error_fallback',
        reasoning: 'Validation error, allowing message'
      };
    }
  }

  /**
   * Check for healthcare keywords
   */
  hasHealthcareKeywords(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check English keywords
    const hasEnglishKeyword = this.healthcareKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    // Check Tamil keywords
    const hasTamilKeyword = this.tamilHealthcareKeywords.some(keyword => 
      message.includes(keyword)
    );

    return hasEnglishKeyword || hasTamilKeyword;
  }

  /**
   * AI-based domain validation
   */
  async validateWithAI(message, language) {
    try {
      const prompt = `You are a domain validator for a medical appointment chatbot called MediBot. Determine if the user's message is relevant to healthcare, medical appointments, or the MediBot platform.

User message: "${message}"

ALLOWED topics:
- Medical symptoms, conditions, diseases, treatments
- Doctor appointments (booking, rescheduling, canceling)
- Healthcare services and consultations
- Medical specializations and specialists
- Health-related questions and concerns
- MediBot platform features and usage
- General greetings and polite conversation
- Medical records and patient information

NOT ALLOWED topics:
- Politics, sports, entertainment, celebrities
- Cooking recipes (non-medical)
- Travel, tourism, vacation planning
- Technology (unless medical devices)
- Finance, banking, investments
- Shopping, e-commerce, products (non-medical)
- Gaming, movies, TV shows
- Weather forecasts
- News and current events (non-medical)
- Programming, coding, software development
- Education (non-medical topics)
- Religion, philosophy, history
- Any topic unrelated to healthcare

Examples:
- "I have a headache" → VALID (medical symptom)
- "Book an appointment with a cardiologist" → VALID (appointment booking)
- "What is MediBot?" → VALID (platform question)
- "Hello, how are you?" → VALID (greeting)
- "Who won the football match?" → INVALID (sports)
- "What's the weather today?" → INVALID (weather)
- "Tell me a joke" → INVALID (entertainment)
- "How to make pasta?" → INVALID (cooking)
- "What is Python programming?" → INVALID (technology/programming)

Respond with ONLY ONE word: VALID or INVALID`;

      const response = await openRouterService.generateResponse(prompt, [], {
        maxTokens: 10,
        temperature: 0.0
      });

      const aiResponse = response.content.trim().toUpperCase();
      const isValid = aiResponse.includes('VALID') && !aiResponse.includes('INVALID');

      return {
        isValid,
        confidence: 0.85,
        method: 'ai_validation',
        reasoning: isValid ? 'AI validated as healthcare-related' : 'AI detected off-topic content'
      };

    } catch (error) {
      console.error('AI validation failed:', error);
      // On AI failure, use strict keyword check
      const hasKeywords = this.hasHealthcareKeywords(message);
      return {
        isValid: hasKeywords,
        confidence: 0.6,
        method: 'fallback_keyword',
        reasoning: hasKeywords ? 'Fallback: healthcare keywords found' : 'Fallback: no healthcare keywords'
      };
    }
  }

  /**
   * Generate rejection message
   */
  generateRejectionMessage(language = 'en') {
    const messages = {
      en: "I'm MediBot, a medical appointment assistant. I can only help with healthcare-related questions, medical appointments, and platform features. Please ask me about:\n\n• Booking, rescheduling, or canceling appointments\n• Medical symptoms and health concerns\n• Finding doctors and specialists\n• MediBot platform features\n\nHow can I assist you with your healthcare needs?",
      ta: "நான் மெடிபாட், ஒரு மருத்துவ நியமன உதவியாளர். நான் உடல்நலம் தொடர்பான கேள்விகள், மருத்துவ நியமனங்கள் மற்றும் தளத்தின் அம்சங்களில் மட்டுமே உதவ முடியும். தயவுசெய்து என்னிடம் கேளுங்கள்:\n\n• நியமனங்களை முன்பதிவு செய்தல், மாற்றுதல் அல்லது ரத்து செய்தல்\n• மருத்துவ அறிகுறிகள் மற்றும் உடல்நல கவலைகள்\n• மருத்துவர்கள் மற்றும் நிபுணர்களைக் கண்டறிதல்\n• மெடிபாட் தள அம்சங்கள்\n\nஉங்கள் உடல்நல தேவைகளில் நான் எவ்வாறு உதவ முடியும்?"
    };

    return messages[language] || messages.en;
  }
}

module.exports = new DomainValidator();
