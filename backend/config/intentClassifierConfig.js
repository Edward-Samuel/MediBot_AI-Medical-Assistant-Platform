/**
 * Intent Classifier Configuration
 * 
 * This file contains configurable settings for the intent classifier.
 * Modify these settings to customize the behavior without changing the core logic.
 */

module.exports = {
  // Classification method preference
  classification: {
    method: 'ai_only', // Options: 'ai_first', 'rule_based', 'hybrid', 'ai_only'
    aiConfidenceThreshold: 0.5, // Minimum confidence to use AI result (lowered for ai_only)
    fallbackToRules: false // No fallback - AI only
  },

  // Confidence thresholds
  thresholds: {
    highConfidence: 0.8,
    mediumConfidence: 0.5,
    aiClassificationThreshold: 0.8 // Use AI if rule-based confidence is below this
  },

  // Intent categories
  intents: {
    FAQ: 'faq',
    GENERAL_CHAT: 'general_chat',
    APPOINTMENT: 'appointment',
    WEB_SEARCH: 'web_search'
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
    },
    appointment: {
      patternMatch: 0.5,
      appointmentKeywordWeight: 0.3, // Per keyword
      timeIndicatorWeight: 0.2, // Per time indicator
      maxScore: 1.0
    },
    webSearch: {
      patternMatch: 0.4,
      searchKeywordWeight: 0.3, // Per search keyword
      urgencyIndicatorWeight: 0.3, // Per urgency indicator
      maxScore: 1.0
    }
  },

  // Language-specific settings
  languages: {
    en: {
      enabled: true,
      faqKeywords: ['what', 'how', 'why', 'when', 'where', 'explain', 'tell me', 'information'],
      personalIndicators: ['i feel', 'i am', 'my', 'i have', 'i\'m experiencing', 'i\'m having'],
      appointmentKeywords: ['book', 'schedule', 'appointment', 'doctor', 'visit', 'consultation', 'meet', 'see'],
      timeIndicators: ['today', 'tomorrow', 'next week', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'morning', 'afternoon', 'evening'],
      searchKeywords: ['search', 'find', 'look up', 'google', 'web', 'online', 'latest', 'recent', 'current', 'news']
    },
    ta: {
      enabled: true,
      faqKeywords: ['என்ன', 'எப்படி', 'ஏன்', 'எப்போது', 'எங்கே'],
      personalIndicators: ['எனக்கு', 'என்', 'நான்'],
      appointmentKeywords: ['முன்பதிவு', 'டாக்டர்', 'சந்திப்பு', 'பார்வை'],
      timeIndicators: ['இன்று', 'நாளை', 'அடுத்த வாரம்', 'காலை', 'மதியம்', 'மாலை'],
      searchKeywords: ['தேடு', 'கண்டுபிடி', 'ஆராய்']
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

    appointment: {
      // Direct appointment requests (excluding reschedule/cancel)
      directRequests: [
        /^book.*appointment/i,
        /^schedule.*appointment/i,
        /^make.*appointment/i,
        /^set.*appointment/i,
        /^arrange.*appointment/i,
        /^fix.*appointment/i,
        /^get.*appointment/i,
        /^need.*appointment/i,
        /^want.*appointment/i,
        /\bbook.*appointment/i,
        /\bmake.*appointment/i,
        /\bget.*appointment/i,
        /\bneed.*appointment/i,
        /\bwant.*appointment/i,
        /appointment.*book/i,
        /i (need|want|would like).*appointment/i
      ],
      
      // Doctor consultation requests
      doctorConsultation: [
        /see.*doctor/i,
        /visit.*doctor/i,
        /meet.*doctor/i,
        /consult.*doctor/i,
        /talk.*doctor/i,
        /speak.*doctor/i,
        /doctor.*visit/i,
        /doctor.*consultation/i,
        /doctor.*appointment/i,
        /medical.*consultation/i,
        /health.*checkup/i,
        /medical.*checkup/i
      ],
      
      // Specialist appointments
      specialistAppointments: [
        /cardiologist/i,
        /dermatologist/i,
        /neurologist/i,
        /orthopedic/i,
        /pediatrician/i,
        /gynecologist/i,
        /psychiatrist/i,
        /ophthalmologist/i,
        /ent.*specialist/i,
        /specialist.*appointment/i
      ],
      
      // Time-based appointment requests
      timeBasedRequests: [
        /appointment.*today/i,
        /appointment.*tomorrow/i,
        /appointment.*next week/i,
        /appointment.*monday/i,
        /appointment.*tuesday/i,
        /appointment.*wednesday/i,
        /appointment.*thursday/i,
        /appointment.*friday/i,
        /urgent.*appointment/i,
        /emergency.*appointment/i,
        /asap.*appointment/i,
        /immediate.*appointment/i
      ],
      
      // Appointment management (must be checked first!)
      appointmentManagement: [
        /^cancel.*appointment/i,
        /^reschedule.*appointment/i,
        /^change.*appointment/i,
        /^modify.*appointment/i,
        /^postpone.*appointment/i,
        /^delete.*appointment/i,
        /^remove.*appointment/i,
        /\bcancel.*appointment/i,
        /\breschedule.*appointment/i,
        /\bchange.*appointment/i,
        /\bmodify.*appointment/i,
        /\bpostpone.*appointment/i,
        /\bdelete.*appointment/i,
        /appointment.*status/i,
        /appointment.*confirmation/i,
        /appointment.*details/i,
        /cancel.*my.*appointment/i,
        /reschedule.*my.*appointment/i
      ]
    },

    webSearch: {
      // Direct search requests
      directSearch: [
        /search for/i,
        /look up/i,
        /find information about/i,
        /search the web/i,
        /google/i,
        /web search/i,
        /online search/i,
        /search online/i,
        /find online/i,
        /browse for/i,
        /research/i
      ],
      
      // Current information requests
      currentInfo: [
        /latest news/i,
        /recent updates/i,
        /current information/i,
        /today's news/i,
        /breaking news/i,
        /recent developments/i,
        /latest research/i,
        /current studies/i,
        /new findings/i,
        /recent articles/i
      ],
      
      // Emergency-related searches (prioritize as web search over emergency)
      emergencySearch: [
        /search.*chest pain/i,
        /look up.*heart attack/i,
        /find.*stroke/i,
        /search.*emergency/i,
        /research.*symptoms/i,
        /studies.*about/i,
        /information.*emergency/i,
        /news.*about.*emergency/i,
        /latest.*research.*on/i,
        /current.*guidelines.*for/i
      ]
    }
  },

  // AI classification settings
  aiClassification: {
    enabled: true,
    model: 'openai/gpt-oss-120b', // Default model for classification
    maxTokens: 15,
    temperature: 0.1, // Low temperature for consistent classification
    prompt: `Classify the following user message into one of these intents:

1. FAQ - User is seeking factual information, explanations, or answers to specific questions about medical topics, procedures, policies, or general healthcare information
2. GENERAL_CHAT - User is describing personal symptoms, seeking personalized medical advice, having a conversational interaction, or sharing personal health experiences
3. APPOINTMENT - User wants to book, schedule, cancel, or manage medical appointments, consultations, or doctor visits
4. WEB_SEARCH - User is asking to search for current information, latest news, research, or wants to look up information online

Message: "{message}"

Consider:
- FAQ: Questions starting with what/how/why, requests for information, explanations, definitions, procedures
- GENERAL_CHAT: Personal symptoms, "I feel...", "I have...", conversational greetings, personalized medical concerns
- APPOINTMENT: "book appointment", "see doctor", "schedule consultation", appointment management
- WEB_SEARCH: "search for", "look up", "find information", "latest news", "current research"

Respond with only: FAQ, GENERAL_CHAT, APPOINTMENT, or WEB_SEARCH`
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