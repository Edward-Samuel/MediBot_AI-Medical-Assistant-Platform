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

    this.appointmentPatterns = this.config.patterns.appointment;

    // Web search patterns - explicit search requests
    this.webSearchPatterns = [
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
      // Emergency-related searches (should be web search, not emergency)
      /search.*chest pain/i,
      /look up.*heart attack/i,
      /find.*stroke/i,
      /search.*emergency/i,
      /research.*symptoms/i,
      /studies.*about/i,
      /information.*emergency/i
    ];

    this.conversationalPatterns = [
      this.config.patterns.generalChat.greetings,
      ...this.config.patterns.generalChat.personalExpressions
    ];

    this.symptomPatterns = this.config.patterns.generalChat.symptoms;
  }

  /**
   * Classify user intent using rule-based approach with AI fallback
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

      // Check for appointment booking
      if (this.isAppointmentIntent(message)) {
        return {
          intent: this.intents.APPOINTMENT,
          confidence: 0.9,
          method: 'rule_based',
          reasoning: 'Appointment booking patterns detected'
        };
      }

      // Rule-based classification for FAQ vs General Chat
      const ruleBasedResult = this.classifyWithRules(message, conversationHistory);
      
      // If confidence is high enough, return rule-based result
      if (ruleBasedResult.confidence >= 0.8) {
        return ruleBasedResult;
      }

      // Use AI classification for ambiguous cases
      const aiResult = await this.classifyWithAI(message, conversationHistory);
      
      // Combine rule-based and AI results
      return this.combineResults(ruleBasedResult, aiResult);

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
   * AI-based intent classification for ambiguous cases
   */
  async classifyWithAI(message, conversationHistory = []) {
    try {
      const prompt = `Classify the following user message into one of these intents:

1. FAQ - User is seeking factual information, explanations, or answers to specific questions about medical topics, procedures, policies, or general healthcare information
2. GENERAL_CHAT - User is describing personal symptoms, seeking personalized medical advice, having a conversational interaction, or sharing personal health experiences

Message: "${message}"

Consider:
- FAQ: Questions starting with what/how/why, requests for information, explanations, definitions, procedures
- GENERAL_CHAT: Personal symptoms, "I feel...", "I have...", conversational greetings, personalized medical concerns

Respond with only: FAQ or GENERAL_CHAT`;

      const response = await openRouterService.generateResponse(prompt, [], {
        maxTokens: 10,
        temperature: 0.1
      });

      const aiIntent = response.content.trim().toUpperCase();
      const intent = aiIntent === 'FAQ' ? this.intents.FAQ : this.intents.GENERAL_CHAT;

      return {
        intent,
        confidence: 0.7,
        method: 'ai_classification',
        reasoning: 'AI classification result'
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
      conversationalPatternCount: this.conversationalPatterns.length
    };
  }
}

module.exports = new IntentClassifier();