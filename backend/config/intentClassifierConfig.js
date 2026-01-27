/**
 * Intent Classifier Configuration
 * 
 * This file contains configurable settings for the intent classifier.
 * Modify these settings to customize the behavior without changing the core logic.
 */

module.exports = {
  // Confidence thresholds
  thresholds: {
    highConfidence: 0.8,
    mediumConfidence: 0.5,
    aiClassificationThreshold: 0.8 // Use AI if rule-based confidence is below this
  },

  // Scoring weights for different factors
  scoring: {
    faq: {
      patternMatch: 0.3,
      questionMark: 0.3,
      lengthBonus: 0.2, // For messages > 50 chars
      infoKeywordWeight: 0.15, // Per keyword
      maxScore: 1.0
    },
    generalChat: {
      conversationalPattern: 0.4,
      personalIndicatorWeight: 0.2, // Per indicator
      symptomDescription: 0.3,
      maxScore: 1.0
    }
  },

  // Language-specific settings
  languages: {
    en: {
      enabled: true,
      faqKeywords: ['what', 'how', 'why', 'when', 'where', 'explain', 'tell me', 'information'],
      personalIndicators: ['i feel', 'i am', 'my', 'i have', 'i\'m experiencing', 'i\'m having']
    },
    ta: {
      enabled: true,
      faqKeywords: ['என்ன', 'எப்படி', 'ஏன்', 'எப்போது', 'எங்கே'],
      personalIndicators: ['எனக்கு', 'என்', 'நான்']
    }
  },

  // Pattern configurations
  patterns: {
    faq: {
      // Question starters
      questionStarters: /^(what|how|when|where|why|which|who)\s/i,
      
      // Information seeking
      informationSeeking: [
        /tell me about/i,
        /explain/i,
        /information about/i,
        /details about/i,
        /help with/i,
        /guide/i,
        /instructions/i
      ],
      
      // Medical information
      medicalInfo: [
        /symptoms of/i,
        /causes of/i,
        /treatment for/i,
        /prevention of/i,
        /diagnosis of/i,
        /side effects/i,
        /medication/i,
        /dosage/i
      ],
      
      // System queries
      systemQueries: [
        /hospital/i,
        /clinic/i,
        /insurance/i,
        /coverage/i,
        /policy/i,
        /procedure/i,
        /test/i,
        /examination/i
      ]
    },

    generalChat: {
      // Conversational patterns
      greetings: /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
      
      // Personal expressions
      personalExpressions: [
        /how are you/i,
        /thank you/i,
        /thanks/i,
        /goodbye/i,
        /bye/i,
        /i feel/i,
        /i am/i,
        /i have been/i,
        /my.*hurts/i,
        /my.*pain/i,
        /i'm experiencing/i,
        /i'm having/i,
        /can you help me with my/i
      ],
      
      // Symptom descriptions
      symptoms: [
        /pain in/i,
        /hurts/i,
        /ache/i,
        /swollen/i,
        /fever/i,
        /headache/i,
        /nausea/i,
        /dizzy/i,
        /tired/i,
        /fatigue/i,
        /cough/i,
        /sore/i,
        /burning/i,
        /itchy/i,
        /rash/i
      ]
    },

    appointment: [
      /book.*appointment/i,
      /schedule.*appointment/i,
      /make.*appointment/i,
      /appointment/i,
      /see.*doctor/i,
      /visit.*doctor/i,
      /consultation/i,
      /meet.*doctor/i
    ],

    webSearch: [
      /search for/i,
      /look up/i,
      /find information about/i,
      /search the web/i,
      /google/i,
      /latest news/i,
      /recent updates/i,
      /current information/i,
      /web search/i,
      /online search/i,
      /search online/i,
      /find online/i,
      // Emergency-related searches (prioritize as web search over emergency)
      /search.*chest pain/i,
      /look up.*heart attack/i,
      /find.*stroke/i,
      /search.*emergency/i,
      /research.*symptoms/i,
      /studies.*about/i,
      /information.*emergency/i,
      /news.*about.*emergency/i,
      /latest.*research.*on/i
    ]
  },

  // AI classification settings
  aiClassification: {
    enabled: true,
    model: 'openai/gpt-oss-120b', // Default model for classification
    maxTokens: 10,
    temperature: 0.1, // Low temperature for consistent classification
    prompt: `Classify the following user message into one of these intents:

1. FAQ - User is seeking factual information, explanations, or answers to specific questions about medical topics, procedures, policies, or general healthcare information
2. GENERAL_CHAT - User is describing personal symptoms, seeking personalized medical advice, having a conversational interaction, or sharing personal health experiences

Message: "{message}"

Consider:
- FAQ: Questions starting with what/how/why, requests for information, explanations, definitions, procedures
- GENERAL_CHAT: Personal symptoms, "I feel...", "I have...", conversational greetings, personalized medical concerns

Respond with only: FAQ or GENERAL_CHAT`
  },

  // Debugging and monitoring
  debug: {
    enabled: process.env.DEBUG_INTENT_CLASSIFIER === 'true',
    logScores: true,
    logPatternMatches: true,
    logAIClassification: true
  },

  // Performance settings
  performance: {
    maxMessageLength: 1000, // Truncate longer messages
    cacheResults: false, // Enable caching for repeated messages
    cacheTTL: 300000 // Cache TTL in milliseconds (5 minutes)
  }
};