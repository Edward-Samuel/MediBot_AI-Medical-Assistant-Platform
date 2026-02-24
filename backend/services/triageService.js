const openRouterService = require('./openRouterService');

class TriageService {
  constructor() {
    // Triage levels with priority
    this.triageLevels = {
      EMERGENCY: {
        level: 1,
        name: 'Emergency',
        color: 'red',
        icon: '🔴',
        timeframe: 'Immediate',
        action: 'Call 911 or go to ER immediately'
      },
      URGENT: {
        level: 2,
        name: 'Urgent',
        color: 'orange',
        icon: '🟠',
        timeframe: 'Same day',
        action: 'Seek medical attention within hours'
      },
      SEMI_URGENT: {
        level: 3,
        name: 'Semi-Urgent',
        color: 'yellow',
        icon: '🟡',
        timeframe: '24-48 hours',
        action: 'Schedule appointment within 1-2 days'
      },
      ROUTINE: {
        level: 4,
        name: 'Routine',
        color: 'green',
        icon: '🟢',
        timeframe: 'Within a week',
        action: 'Schedule regular appointment'
      }
    };

    // Emergency keywords by language
    this.emergencyKeywords = {
      en: [
        'chest pain', 'heart attack', 'stroke', 'can\'t breathe', 'difficulty breathing',
        'severe bleeding', 'unconscious', 'seizure', 'suicide', 'overdose',
        'severe head injury', 'broken bone', 'severe burn', 'choking',
        'severe allergic reaction', 'anaphylaxis', 'severe abdominal pain',
        'coughing blood', 'vomiting blood', 'severe trauma', 'poisoning'
      ],
      es: [
        'dolor de pecho', 'ataque al corazón', 'derrame cerebral', 'no puedo respirar',
        'sangrado severo', 'inconsciente', 'convulsión', 'suicidio', 'sobredosis'
      ],
      ta: [
        'மார்பு வலி', 'மாரடைப்பு', 'பக்கவாதம்', 'மூச்சு திணறல்',
        'கடுமையான இரத்தப்போக்கு', 'சுயநினைவு இழப்பு', 'வலிப்பு'
      ],
      hi: [
        'सीने में दर्द', 'दिल का दौरा', 'स्ट्रोक', 'सांस लेने में कठिनाई',
        'गंभीर रक्तस्राव', 'बेहोश', 'दौरा', 'आत्महत्या'
      ],
      ar: [
        'ألم في الصدر', 'نوبة قلبية', 'سكتة دماغية', 'صعوبة في التنفس',
        'نزيف شديد', 'فاقد للوعي', 'نوبة صرع'
      ],
      fr: [
        'douleur thoracique', 'crise cardiaque', 'accident vasculaire cérébral',
        'difficulté à respirer', 'saignement sévère', 'inconscient', 'convulsion'
      ],
      de: [
        'brustschmerzen', 'herzinfarkt', 'schlaganfall', 'atemnot',
        'starke blutung', 'bewusstlos', 'krampfanfall'
      ],
      it: [
        'dolore al petto', 'infarto', 'ictus', 'difficoltà respiratorie',
        'emorragia grave', 'incosciente', 'convulsione'
      ],
      pt: [
        'dor no peito', 'ataque cardíaco', 'derrame', 'dificuldade para respirar',
        'sangramento grave', 'inconsciente', 'convulsão'
      ],
      ru: [
        'боль в груди', 'сердечный приступ', 'инсульт', 'затрудненное дыхание',
        'сильное кровотечение', 'без сознания', 'судороги'
      ],
      zh: [
        '胸痛', '心脏病发作', '中风', '呼吸困难',
        '严重出血', '失去意识', '癫痫发作'
      ],
      ja: [
        '胸の痛み', '心臓発作', '脳卒中', '呼吸困難',
        '重度の出血', '意識不明', '発作'
      ],
      ko: [
        '가슴 통증', '심장마비', '뇌졸중', '호흡곤란',
        '심한 출혈', '의식불명', '발작'
      ]
    };

    // Red flag symptoms
    this.redFlags = {
      en: [
        'sudden severe headache', 'worst headache of life', 'confusion',
        'slurred speech', 'facial drooping', 'arm weakness', 'leg weakness',
        'sudden vision loss', 'severe dizziness', 'high fever with stiff neck',
        'severe abdominal pain', 'persistent vomiting', 'blood in stool',
        'severe shortness of breath', 'rapid heart rate', 'chest pressure'
      ]
    };
  }

  /**
   * Perform AI-powered triage assessment
   */
  async assessSymptoms(symptoms, patientInfo = {}, language = 'en') {
    try {
      console.log('Starting triage assessment...');
      
      // Quick emergency keyword check first
      const emergencyCheck = this.checkEmergencyKeywords(symptoms, language);
      if (emergencyCheck.isEmergency) {
        console.log('EMERGENCY DETECTED via keywords!');
        return this.createEmergencyResponse(symptoms, emergencyCheck.matchedKeywords, language);
      }

      // AI-powered triage assessment
      const aiAssessment = await this.performAITriage(symptoms, patientInfo, language);
      
      console.log(`Triage completed: ${aiAssessment.triageLevel.name}`);
      return aiAssessment;

    } catch (error) {
      console.error('Triage assessment error:', error);
      // Return safe default (routine) on error
      return this.createRoutineResponse(symptoms, language);
    }
  }

  /**
   * Check for emergency keywords
   */
  checkEmergencyKeywords(symptoms, language = 'en') {
    const symptomsLower = symptoms.toLowerCase();
    const keywords = this.emergencyKeywords[language] || this.emergencyKeywords.en;
    
    const matchedKeywords = keywords.filter(keyword => 
      symptomsLower.includes(keyword.toLowerCase())
    );

    return {
      isEmergency: matchedKeywords.length > 0,
      matchedKeywords
    };
  }

  /**
   * Perform AI-powered triage using OpenRouter
   */
  async performAITriage(symptoms, patientInfo, language) {
    const { age, gender, duration, severity } = patientInfo;

    const prompt = `You are an emergency triage nurse with 20 years of experience. Assess the urgency of these symptoms.

Patient Information:
- Symptoms: ${symptoms}
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
- Duration: ${duration || 'Not specified'}
- Self-reported severity: ${severity || 'Not specified'}

Triage Levels:
1. EMERGENCY - Life-threatening, needs immediate ER/911 (chest pain, stroke, severe bleeding, can't breathe)
2. URGENT - Serious but not immediately life-threatening, needs same-day care (high fever, severe pain, infection)
3. SEMI_URGENT - Needs attention within 24-48 hours (moderate pain, persistent symptoms, worsening condition)
4. ROUTINE - Can wait for regular appointment (mild symptoms, chronic condition management, preventive care)

Analyze and respond in JSON format:
{
  "triageLevel": "EMERGENCY|URGENT|SEMI_URGENT|ROUTINE",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of triage decision",
  "redFlags": ["list", "of", "concerning", "symptoms"],
  "recommendedActions": ["specific", "actions", "to", "take"],
  "specialization": "recommended medical specialty",
  "estimatedWaitTime": "how long patient can safely wait"
}

Be conservative - when in doubt, escalate to higher urgency level.`;

    const response = await openRouterService.generateResponse(prompt, [], {
      maxTokens: 500,
      temperature: 0.2, // Low temperature for consistent medical decisions
      language
    });

    // Parse AI response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI triage response');
    }

    const aiResult = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize triage level
    const triageLevel = this.triageLevels[aiResult.triageLevel] || this.triageLevels.ROUTINE;

    return {
      triageLevel,
      confidence: Math.max(0, Math.min(1, aiResult.confidence || 0.7)),
      reasoning: aiResult.reasoning || 'Based on symptom analysis',
      redFlags: aiResult.redFlags || [],
      recommendedActions: aiResult.recommendedActions || [],
      specialization: aiResult.specialization || 'General Medicine',
      estimatedWaitTime: aiResult.estimatedWaitTime || triageLevel.timeframe,
      assessmentMethod: 'ai_powered',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create emergency response
   */
  createEmergencyResponse(symptoms, matchedKeywords, language) {
    const messages = {
      en: {
        warning: 'MEDICAL EMERGENCY DETECTED',
        action: 'Call 911 or go to the nearest Emergency Room IMMEDIATELY',
        doNotWait: 'DO NOT WAIT - This requires immediate medical attention'
      },
      es: {
        warning: 'EMERGENCIA MÉDICA DETECTADA',
        action: 'Llame al 911 o vaya a la sala de emergencias MÁS CERCANA INMEDIATAMENTE',
        doNotWait: 'NO ESPERE - Esto requiere atención médica inmediata'
      },
      ta: {
        warning: 'மருத்துவ அவசரநிலை கண்டறியப்பட்டது',
        action: '911 ஐ அழைக்கவும் அல்லது உடனடியாக அருகிலுள்ள அவசர சிகிச்சை பிரிவுக்கு செல்லவும்',
        doNotWait: 'காத்திருக்க வேண்டாம் - இதற்கு உடனடி மருத்துவ கவனிப்பு தேவை'
      },
      hi: {
        warning: 'चिकित्सा आपातकाल का पता चला',
        action: '911 पर कॉल करें या तुरंत निकटतम आपातकालीन कक्ष में जाएं',
        doNotWait: 'प्रतीक्षा न करें - इसके लिए तत्काल चिकित्सा ध्यान की आवश्यकता है'
      }
    };

    const msg = messages[language] || messages.en;

    return {
      triageLevel: this.triageLevels.EMERGENCY,
      confidence: 1.0,
      reasoning: `Emergency keywords detected: ${matchedKeywords.join(', ')}`,
      redFlags: matchedKeywords,
      recommendedActions: [
        msg.action,
        msg.doNotWait,
        'If alone, call emergency services first',
        'Stay calm and follow dispatcher instructions'
      ],
      specialization: 'Emergency Medicine',
      estimatedWaitTime: 'Immediate',
      assessmentMethod: 'keyword_detection',
      emergencyWarning: msg.warning,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create routine response (fallback)
   */
  createRoutineResponse(symptoms, language) {
    return {
      triageLevel: this.triageLevels.ROUTINE,
      confidence: 0.6,
      reasoning: 'Based on symptom description, routine care is appropriate',
      redFlags: [],
      recommendedActions: [
        'Schedule a regular appointment with your doctor',
        'Monitor symptoms and note any changes',
        'Maintain a symptom diary'
      ],
      specialization: 'General Medicine',
      estimatedWaitTime: 'Within a week',
      assessmentMethod: 'fallback',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get triage statistics
   */
  getTriageStats() {
    return {
      levels: Object.keys(this.triageLevels).map(key => ({
        key,
        ...this.triageLevels[key]
      })),
      emergencyKeywordCount: Object.values(this.emergencyKeywords).reduce(
        (sum, keywords) => sum + keywords.length, 0
      ),
      supportedLanguages: Object.keys(this.emergencyKeywords).length
    };
  }

  /**
   * Format triage result for display
   */
  formatTriageResult(triageResult, language = 'en') {
    const { triageLevel, confidence, reasoning, redFlags, recommendedActions } = triageResult;

    const formatted = {
      level: triageLevel.name,
      icon: triageLevel.icon,
      color: triageLevel.color,
      urgency: triageLevel.level,
      timeframe: triageLevel.timeframe,
      confidence: Math.round(confidence * 100),
      summary: reasoning,
      warnings: redFlags,
      actions: recommendedActions,
      isEmergency: triageLevel.level === 1
    };

    return formatted;
  }
}

module.exports = new TriageService();
