const openRouterService = require('./openRouterService');
const config = require('../config/intentClassifierConfig');

class IntentClassifier {
  constructor() {
    this.intents = {
      FAQ: 'faq',
      GENERAL_CHAT: 'general_chat',
      APPOINTMENT: 'appointment',
      WEB_SEARCH: 'web_search'
    };

    // Load configuration
    this.config = config;
    
    // Initialize patterns from config
    this.faqPatterns = [
      this.config.patterns.faq.questionStarters,
      ...this.config.patterns.faq.informationSeeking,
      ...this.config.patterns.faq.medicalInfo,
      ...this.config.patterns.faq.systemQueries,
      /\?$/, // Questions ending with ?
      /faq/i,
      /frequently asked/i,
      /common questions/i,
      /safe/i,
      /safety/i,
      /secure/i,
      /security/i,
      /privacy/i,
      /protect/i,
      /reliable/i,
      /trust/i,
      // MediBot-specific FAQ patterns
      /how (do|does|can) (i|medibot|the platform|this)/i,
      /what (is|are) (medibot|the|your)/i,
      /tell me about (medibot|the platform|your)/i,
      /explain (medibot|the platform|how)/i,
      /how to (book|cancel|reschedule|upload|access)/i,
      /what specializations/i,
      /which doctors/i,
      /consultation fee/i,
      /appointment (process|system|booking)/i,
      /languages (support|available)/i,
      /doctor (verification|quality|ratings)/i,
      /medical records/i,
      /appointment history/i,
      /how does.*work/i,
      /what.*available/i,
      /can i (upload|book|cancel|access)/i,
    ];

    // Appointment patterns from config
    this.appointmentPatterns = [
      ...this.config.patterns.appointment.directRequests,
      ...this.config.patterns.appointment.doctorConsultation,
      ...this.config.patterns.appointment.specialistAppointments,
      ...this.config.patterns.appointment.timeBasedRequests,
      ...this.config.patterns.appointment.appointmentManagement
    ];

    // Web search patterns from config
    this.webSearchPatterns = [
      ...this.config.patterns.webSearch.directSearch,
      ...this.config.patterns.webSearch.currentInfo,
      ...this.config.patterns.webSearch.emergencySearch
    ];

    this.conversationalPatterns = [
      this.config.patterns.generalChat.greetings,
      ...this.config.patterns.generalChat.personalExpressions
    ];

    this.symptomPatterns = this.config.patterns.generalChat.symptoms;
  }

  /**
   * Classify user intent using AI-first approach with rule-based fallback
   */
  async classifyIntent(message, conversationHistory = [], options = {}) {
    try {
      // Check for explicit web search request first (highest priority)
      if (options.forceWebSearch || this.isWebSearchIntent(message)) {
        return {
          intent: this.intents.WEB_SEARCH,
          confidence: 1.0,
          method: 'rule_based',
          reasoning: 'Explicit web search request detected'
        };
      }

      const classificationMethod = this.config.classification?.method || 'ai_first';

      // AI-only approach (no fallback)
      if (classificationMethod === 'ai_only') {
        console.log('🤖 Using AI-only intent classification (no fallback)...');
        const aiResult = await this.classifyWithAI(message, conversationHistory);
        
        if (aiResult) {
          console.log(`✅ AI classified: ${aiResult.intent} (confidence: ${aiResult.confidence})`);
          return aiResult;
        }

        // If AI completely fails, return general chat as safe default
        console.error('❌ AI classification failed completely');
        return {
          intent: this.intents.GENERAL_CHAT,
          confidence: 0.3,
          method: 'fallback',
          reasoning: 'AI classification failed, defaulting to general chat'
        };
      }

      // AI-first approach (with fallback)
      if (classificationMethod === 'ai_first') {
        console.log('🤖 Using AI-first intent classification...');
        const aiResult = await this.classifyWithAI(message, conversationHistory);
        
        if (aiResult && aiResult.confidence >= (this.config.classification?.aiConfidenceThreshold || 0.7)) {
          console.log(`✅ AI classified with high confidence: ${aiResult.intent} (${aiResult.confidence})`);
          return aiResult;
        }

        // Fallback to rule-based if enabled
        if (this.config.classification?.fallbackToRules) {
          console.log('⚠️ AI confidence low, using rule-based fallback');
          return this.getRuleBasedClassification(message, conversationHistory);
        }

        return aiResult;
      }

      // Rule-based approach
      if (classificationMethod === 'rule_based') {
        console.log('📋 Using rule-based intent classification...');
        return this.getRuleBasedClassification(message, conversationHistory);
      }

      // Hybrid approach (default)
      console.log('🔀 Using hybrid intent classification...');
      const [aiResult, ruleResult] = await Promise.allSettled([
        this.classifyWithAI(message, conversationHistory),
        Promise.resolve(this.getRuleBasedClassification(message, conversationHistory))
      ]);

      const aiValue = aiResult.status === 'fulfilled' ? aiResult.value : null;
      const ruleValue = ruleResult.status === 'fulfilled' ? ruleResult.value : null;

      // Prefer AI if high confidence
      if (aiValue && aiValue.confidence >= 0.8) {
        return aiValue;
      }

      // Prefer rule-based if high confidence
      if (ruleValue && ruleValue.confidence >= 0.8) {
        return ruleValue;
      }

      // Return whichever has higher confidence
      if (aiValue && ruleValue) {
        return aiValue.confidence >= ruleValue.confidence ? aiValue : ruleValue;
      }

      return aiValue || ruleValue || {
        intent: this.intents.GENERAL_CHAT,
        confidence: 0.5,
        method: 'fallback',
        reasoning: 'Default classification'
      };

    } catch (error) {
      console.error('Intent classification error:', error);
      
      // For ai_only mode, return general chat on error
      if (this.config.classification?.method === 'ai_only') {
        return {
          intent: this.intents.GENERAL_CHAT,
          confidence: 0.3,
          method: 'error_fallback',
          reasoning: 'AI classification error, defaulting to general chat'
        };
      }
      
      // For other modes, use rule-based fallback
      return this.getRuleBasedClassification(message, conversationHistory);
    }
  }

  /**
   * Get rule-based classification (consolidated method)
   */
  getRuleBasedClassification(message, conversationHistory = []) {
    // Check for appointment management first (reschedule/cancel)
    const managementResult = this.checkAppointmentManagement(message);
    if (managementResult.confidence >= 0.8) {
      return managementResult;
    }

    // Check for appointment booking
    const appointmentResult = this.classifyAppointmentIntent(message);
    if (appointmentResult.confidence >= 0.8) {
      return appointmentResult;
    }

    // Run general rule-based classification
    return this.classifyWithRules(message, conversationHistory);
  }

  /**
   * Quick check for appointment management (reschedule/cancel)
   */
  checkAppointmentManagement(message) {
    const managementPatterns = this.config.patterns.appointment.appointmentManagement;
    for (const pattern of managementPatterns) {
      if (pattern.test(message)) {
        return {
          intent: 'appointmentManagement',
          confidence: 0.95,
          method: 'rule_based',
          reasoning: 'Appointment management keywords detected'
        };
      }
    }
    return { confidence: 0 };
  }

  /**
   * Rule-based intent classification
   */
  classifyWithRules(message, conversationHistory = []) {
    const lowerMessage = message.toLowerCase().trim();
    
    // Calculate scores for each intent
    const scores = {
      faq: 0,
      general_chat: 0
    };

    // FAQ scoring
    let faqScore = 0;
    
    // Check FAQ patterns
    for (const pattern of this.faqPatterns) {
      if (pattern.test(message)) {
        faqScore += this.config.scoring.faq.patternMatch;
        if (this.config.debug.logPatternMatches) {
          console.log(`FAQ pattern matched: ${pattern}`);
        }
      }
    }

    // Platform-specific keywords (MediBot-related questions)
    const platformKeywords = [
      'medibot', 'platform', 'system', 'appointment', 'booking', 
      'doctor', 'specialization', 'consultation', 'fee', 'upload',
      'cancel', 'reschedule', 'verification', 'rating', 'language',
      'medical record', 'history', 'profile', 'account'
    ];
    const platformKeywordCount = platformKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length;
    faqScore += platformKeywordCount * 0.15; // Higher weight for platform questions

    // Length-based scoring (longer questions often seek information)
    if (message.length > 50) {
      faqScore += this.config.scoring.faq.lengthBonus;
    }

    // Question mark bonus
    if (message.includes('?')) {
      faqScore += this.config.scoring.faq.questionMark;
    }

    // Information-seeking keywords
    const infoKeywords = this.config.languages.en.faqKeywords;
    const infoKeywordCount = infoKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
    faqScore += infoKeywordCount * this.config.scoring.faq.infoKeywordWeight;

    // General chat scoring
    let generalChatScore = 0;

    // Reduce general chat score if it's clearly a question
    const isQuestion = message.includes('?') || 
                      /^(what|how|when|where|why|who|which|can|do|does|is|are)/i.test(message);
    
    if (isQuestion) {
      generalChatScore -= 0.2; // Penalize general chat for questions
    }

    // Check conversational patterns
    for (const pattern of this.conversationalPatterns) {
      if (pattern.test(message)) {
        generalChatScore += this.config.scoring.generalChat.conversationalPattern;
        if (this.config.debug.logPatternMatches) {
          console.log(`Conversational pattern matched: ${pattern}`);
        }
      }
    }

    // Personal experience indicators
    const personalIndicators = this.config.languages.en.personalIndicators;
    const personalCount = personalIndicators.filter(indicator => lowerMessage.includes(indicator)).length;
    generalChatScore += personalCount * this.config.scoring.generalChat.personalIndicatorWeight;

    // Symptom description patterns
    if (this.hasSymptomDescription(message)) {
      generalChatScore += this.config.scoring.generalChat.symptomDescription;
    }

    // Ensure general chat score doesn't go negative
    generalChatScore = Math.max(0, generalChatScore);

    // Context from conversation history
    if (conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (lastMessage.role === 'bot' && lastMessage.content.includes('FAQ')) {
        faqScore += 0.1;
      } else if (lastMessage.role === 'bot' && this.isMedicalAdvice(lastMessage.content)) {
        generalChatScore += 0.1;
      }
    }

    // Ensure scores don't exceed maximum
    faqScore = Math.min(faqScore, this.config.scoring.faq.maxScore);
    generalChatScore = Math.min(generalChatScore, this.config.scoring.generalChat.maxScore);

    // Determine intent based on scores
    const maxScore = Math.max(faqScore, generalChatScore);
    const intent = faqScore > generalChatScore ? this.intents.FAQ : this.intents.GENERAL_CHAT;
    
    // Adjust confidence based on score difference
    const scoreDifference = Math.abs(faqScore - generalChatScore);
    let confidence = Math.min(0.5 + scoreDifference, 1.0);

    // Boost confidence for clear patterns
    if (maxScore > 0.7) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }

    if (this.config.debug.logScores) {
      console.log(`Rule-based scores - FAQ: ${faqScore.toFixed(2)}, General: ${generalChatScore.toFixed(2)}`);
    }

    return {
      intent,
      confidence,
      method: 'rule_based',
      reasoning: `FAQ score: ${faqScore.toFixed(2)}, General chat score: ${generalChatScore.toFixed(2)}`,
      scores: { faq: faqScore, general_chat: generalChatScore }
    };
  }

  /**
   * Classify appointment intent with enhanced scoring
   */
  classifyAppointmentIntent(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    // First check if it's appointment management (reschedule/cancel)
    const managementPatterns = this.config.patterns.appointment.appointmentManagement;
    for (const pattern of managementPatterns) {
      if (pattern.test(message)) {
        if (this.config.debug.logPatternMatches) {
          console.log(`Appointment management pattern matched: ${pattern}`);
        }
        return {
          intent: 'appointmentManagement',
          confidence: 0.95,
          method: 'rule_based',
          reasoning: 'Appointment management keywords detected (reschedule/cancel/modify)',
          scores: { appointmentManagement: 0.95 }
        };
      }
    }
    
    // If not management, check for booking
    let appointmentScore = 0;

    // Check appointment booking patterns (excluding management)
    const bookingPatterns = [
      ...this.config.patterns.appointment.directRequests,
      ...this.config.patterns.appointment.doctorConsultation,
      ...this.config.patterns.appointment.specialistAppointments,
      ...this.config.patterns.appointment.timeBasedRequests
    ];
    
    for (const pattern of bookingPatterns) {
      if (pattern.test(message)) {
        appointmentScore += this.config.scoring.appointment.patternMatch;
        if (this.config.debug.logPatternMatches) {
          console.log(`Appointment booking pattern matched: ${pattern}`);
        }
      }
    }

    // Appointment keywords
    const appointmentKeywords = this.config.languages.en.appointmentKeywords;
    const appointmentKeywordCount = appointmentKeywords.filter(keyword => lowerMessage.includes(keyword)).length;
    appointmentScore += appointmentKeywordCount * this.config.scoring.appointment.appointmentKeywordWeight;

    // Time indicators
    const timeIndicators = this.config.languages.en.timeIndicators;
    const timeIndicatorCount = timeIndicators.filter(indicator => lowerMessage.includes(indicator)).length;
    appointmentScore += timeIndicatorCount * this.config.scoring.appointment.timeIndicatorWeight;

    // Ensure score doesn't exceed maximum
    appointmentScore = Math.min(appointmentScore, this.config.scoring.appointment.maxScore);

    // Calculate confidence
    let confidence = Math.min(appointmentScore, 1.0);

    // Boost confidence for strong appointment indicators
    if (appointmentScore > 0.6) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }

    if (this.config.debug.logScores) {
      console.log(`Appointment booking score: ${appointmentScore.toFixed(2)}, confidence: ${confidence.toFixed(2)}`);
    }

    return {
      intent: this.intents.APPOINTMENT,
      confidence,
      method: 'rule_based',
      reasoning: `Appointment booking score: ${appointmentScore.toFixed(2)}`,
      scores: { appointment: appointmentScore }
    };
  }

  /**
   * AI-based intent classification with appointment sub-intent detection
   */
  async classifyWithAI(message, conversationHistory = []) {
    try {
      const prompt = `You are an intent classification system for a medical chatbot. Analyze the user's message and classify it into ONE of these intents:

User message: "${message}"

Available intents:
1. APPOINTMENT_BOOKING - User wants to book/schedule a NEW appointment
2. APPOINTMENT_RESCHEDULE - User wants to reschedule/change an EXISTING appointment
3. APPOINTMENT_CANCEL - User wants to cancel/delete an EXISTING appointment
4. FAQ - User is asking a question about the platform, services, or general medical information
5. WEB_SEARCH - User explicitly requests to search the web or needs current/latest information
6. GENERAL_CHAT - General conversation, greetings, or casual chat

Classification rules:
- If message contains "reschedule", "change appointment", "modify appointment" → APPOINTMENT_RESCHEDULE
- If message contains "cancel", "delete appointment", "remove appointment" → APPOINTMENT_CANCEL
- If message contains "book", "schedule", "need appointment", "want appointment" (without reschedule/cancel) → APPOINTMENT_BOOKING
- If message asks "what", "how", "why", "when", "where" questions → FAQ
- If message asks for "latest", "recent", "search for", "look up" → WEB_SEARCH
- Otherwise → GENERAL_CHAT

Examples:
- "I need to book an appointment" → APPOINTMENT_BOOKING
- "Book me a doctor" → APPOINTMENT_BOOKING
- "Reschedule my appointment" → APPOINTMENT_RESCHEDULE
- "Change my appointment to tomorrow" → APPOINTMENT_RESCHEDULE
- "Cancel my appointment" → APPOINTMENT_CANCEL
- "Delete my appointment with Dr. Smith" → APPOINTMENT_CANCEL
- "What is MediBot?" → FAQ
- "How do I book an appointment?" → FAQ
- "Search for latest COVID treatments" → WEB_SEARCH
- "Hello" → GENERAL_CHAT

Respond with ONLY the intent name (e.g., APPOINTMENT_BOOKING), nothing else.`;

      const response = await openRouterService.generateResponse(prompt, [], {
        maxTokens: 50,
        temperature: 0.1 // Low temperature for consistent classification
      });

      const aiIntent = response.content.trim().toUpperCase();
      let intent;
      
      // Map AI response to internal intent names
      switch (aiIntent) {
        case 'APPOINTMENT_BOOKING':
          intent = this.intents.APPOINTMENT;
          break;
        case 'APPOINTMENT_RESCHEDULE':
          intent = 'appointmentManagement';
          break;
        case 'APPOINTMENT_CANCEL':
          intent = 'appointmentManagement';
          break;
        case 'FAQ':
          intent = this.intents.FAQ;
          break;
        case 'WEB_SEARCH':
          intent = this.intents.WEB_SEARCH;
          break;
        case 'GENERAL_CHAT':
        default:
          intent = this.intents.GENERAL_CHAT;
          break;
      }

      if (this.config.debug.logAIClassification) {
        console.log(`AI classified as: ${aiIntent} -> ${intent}`);
      }

      return {
        intent,
        confidence: 0.9, // Higher confidence for AI classification
        method: 'ai_classification',
        reasoning: `AI classification result: ${aiIntent}`,
        aiIntent: aiIntent // Store original AI intent for debugging
      };

    } catch (error) {
      console.error('AI classification failed:', error);
      // Return neutral result
      return {
        intent: this.intents.GENERAL_CHAT,
        confidence: 0.5,
        method: 'ai_fallback',
        reasoning: 'AI classification failed, defaulting to general chat'
      };
    }
  }

  /**
   * Combine rule-based and AI results
   */
  combineResults(ruleResult, aiResult) {
    // If both methods agree, increase confidence
    if (ruleResult.intent === aiResult.intent) {
      return {
        intent: ruleResult.intent,
        confidence: Math.min((ruleResult.confidence + aiResult.confidence) / 2 + 0.1, 1.0),
        method: 'combined',
        reasoning: `Both methods agree: ${ruleResult.reasoning}`,
        ruleScores: ruleResult.scores
      };
    }

    // If they disagree, use the one with higher confidence
    const winner = ruleResult.confidence > aiResult.confidence ? ruleResult : aiResult;
    return {
      ...winner,
      method: 'combined_conflict',
      reasoning: `Methods disagreed, using ${winner.method}: ${winner.reasoning}`
    };
  }

  /**
   * Check if message indicates emergency
   */
  isEmergency(message) {
    // Emergency detection removed - always return false
    return false;
  }

  /**
   * Check if message is about appointment booking
   */
  isAppointmentIntent(message) {
    return this.appointmentPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message is an explicit web search request
   */
  isWebSearchIntent(message) {
    return this.webSearchPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message contains symptom descriptions
   */
  hasSymptomDescription(message) {
    return this.symptomPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if content is medical advice
   */
  isMedicalAdvice(content) {
    const medicalAdvicePatterns = [
      /consult.*doctor/i,
      /medical professional/i,
      /healthcare provider/i,
      /symptoms/i,
      /treatment/i,
      /diagnosis/i
    ];

    return medicalAdvicePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get intent statistics for monitoring
   */
  getIntentStats() {
    return {
      supportedIntents: Object.values(this.intents),
      faqPatternCount: this.faqPatterns.length,
      appointmentPatternCount: this.appointmentPatterns.length,
      webSearchPatternCount: this.webSearchPatterns.length,
      conversationalPatternCount: this.conversationalPatterns.length,
      totalPatterns: this.faqPatterns.length + this.appointmentPatterns.length + 
                    this.webSearchPatterns.length + this.conversationalPatterns.length,
      configVersion: '2.0.0'
    };
  }
}

module.exports = new IntentClassifier();