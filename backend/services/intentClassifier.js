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
      /trust/i
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
   * Classify user intent using parallel rule-based + AI approach
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

      // Check for appointment booking with enhanced scoring
      const appointmentResult = this.classifyAppointmentIntent(message);
      if (appointmentResult.confidence >= 0.8) {
        return appointmentResult;
      }

      // Run rule-based and AI classification in parallel for speed
      const [ruleBasedResult, aiResult] = await Promise.allSettled([
        Promise.resolve(this.classifyWithRules(message, conversationHistory)),
        this.classifyWithAI(message, conversationHistory)
      ]);

      // Use rule-based result if it has high confidence
      const ruleResult = ruleBasedResult.status === 'fulfilled' ? ruleBasedResult.value : null;
      if (ruleResult && ruleResult.confidence >= 0.8) {
        return ruleResult;
      }

      // Use AI result if available, otherwise fall back to rule-based
      const aiResultValue = aiResult.status === 'fulfilled' ? aiResult.value : null;
      
      if (aiResultValue && aiResultValue.confidence >= 0.7) {
        return aiResultValue;
      }

      // Combine results if both available but low confidence
      if (ruleResult && aiResultValue) {
        return this.combineResults(ruleResult, aiResultValue);
      }

      // Final fallback to rule-based result
      return ruleResult || {
        intent: this.intents.GENERAL_CHAT,
        confidence: 0.5,
        method: 'fallback',
        reasoning: 'Default classification due to processing errors'
      };

    } catch (error) {
      console.error('Intent classification error:', error);
      // Fallback to rule-based classification
      return this.classifyWithRules(message, conversationHistory);
    }
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
    let appointmentScore = 0;

    // Check appointment patterns
    for (const pattern of this.appointmentPatterns) {
      if (pattern.test(message)) {
        appointmentScore += this.config.scoring.appointment.patternMatch;
        if (this.config.debug.logPatternMatches) {
          console.log(`Appointment pattern matched: ${pattern}`);
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
      console.log(`Appointment score: ${appointmentScore.toFixed(2)}, confidence: ${confidence.toFixed(2)}`);
    }

    return {
      intent: this.intents.APPOINTMENT,
      confidence,
      method: 'rule_based',
      reasoning: `Appointment score: ${appointmentScore.toFixed(2)}`,
      scores: { appointment: appointmentScore }
    };
  }

  /**
   * AI-based intent classification for ambiguous cases
   */
  async classifyWithAI(message, conversationHistory = []) {
    try {
      const response = await openRouterService.generateResponse(this.config.aiClassification.prompt.replace('{message}', message), [], {
        maxTokens: this.config.aiClassification.maxTokens,
        temperature: this.config.aiClassification.temperature
      });

      const aiIntent = response.content.trim().toUpperCase();
      let intent;
      
      switch (aiIntent) {
        case 'FAQ':
          intent = this.intents.FAQ;
          break;
        case 'APPOINTMENT':
          intent = this.intents.APPOINTMENT;
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
        confidence: 0.7,
        method: 'ai_classification',
        reasoning: `AI classification result: ${aiIntent}`
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