const openRouterService = require('./openRouterService');

class FollowUpQuestionsService {
  /**
   * Generate contextual follow-up questions based on the conversation using OpenRouter
   */
  async generateFollowUpQuestions(lastBotMessage, lastUserMessage, conversationContext, language = 'en', count = 3) {
    try {
      console.log(`Generating ${count} follow-up questions in ${language}...`);
      
      // Build context from recent conversation
      const recentContext = conversationContext.slice(-4).map(msg => 
        `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content.substring(0, 200)}`
      ).join('\n');

      // Create a focused prompt for OpenRouter
      const prompt = `You are a medical assistant helping patients. Based on this conversation, suggest ${count} natural follow-up questions the patient might want to ask.

Recent conversation:
${recentContext}

Patient's last question: "${lastUserMessage}"
Your response: "${lastBotMessage.substring(0, 300)}..."

Generate ${count} short, conversational follow-up questions in ${language} that:
- Are directly related to the medical topic discussed
- Help the patient get more specific or actionable information
- Sound natural, as if the patient is asking
- Are concise (8-12 words maximum)
- End with a question mark

Format: Return ONLY the questions, one per line, no numbering, no explanations.

Example format:
What are the warning signs I should watch for?
Should I schedule an appointment with a specialist?
How long does recovery typically take?`;

      // Use OpenRouter with optimized settings for question generation
      const response = await openRouterService.generateResponse(prompt, [], {
        maxTokens: 200,
        temperature: 0.8,
        language,
      });

      console.log('OpenRouter raw response:', response.content.substring(0, 200));

      // Parse the response into clean questions
      const questions = response.content
        .split('\n')
        .map(q => q.trim())
        .filter(q => {
          // Remove numbering, bullets, and empty lines
          const cleaned = q.replace(/^[\d\.\-\*\)]+\s*/, '').trim();
          return cleaned.length > 5 && cleaned.includes('?');
        })
        .map(q => q.replace(/^[\d\.\-\*\)]+\s*/, '').trim())
        .slice(0, count);

      console.log(`Generated ${questions.length} questions:`, questions);

      // If we didn't get enough questions, supplement with fallback
      if (questions.length < count) {
        console.log(`Only got ${questions.length} questions, adding fallbacks...`);
        const fallbackQuestions = this.getFallbackQuestions(language, lastBotMessage);
        while (questions.length < count && fallbackQuestions.length > 0) {
          const fallback = fallbackQuestions.shift();
          if (!questions.includes(fallback)) {
            questions.push(fallback);
          }
        }
      }

      return questions;
    } catch (error) {
      console.error('Error generating follow-up questions with OpenRouter:', error.message);
      // Return fallback questions on error
      return this.getFallbackQuestions(language, lastBotMessage);
    }
  }

  /**
   * Get fallback follow-up questions based on language and context
   */
  getFallbackQuestions(language = 'en', context = '') {
    const fallbackQuestions = {
      en: [
        "What are the common symptoms I should watch for?",
        "Should I schedule an appointment with a doctor?",
        "What lifestyle changes can help with this condition?",
        "Are there any tests I should consider?",
        "How can I prevent this in the future?"
      ],
      es: [
        "¿Cuáles son los síntomas comunes que debo vigilar?",
        "¿Debería programar una cita con un médico?",
        "¿Qué cambios de estilo de vida pueden ayudar?",
        "¿Hay alguna prueba que deba considerar?",
        "¿Cómo puedo prevenir esto en el futuro?"
      ],
      fr: [
        "Quels sont les symptômes courants à surveiller?",
        "Dois-je prendre rendez-vous avec un médecin?",
        "Quels changements de mode de vie peuvent aider?",
        "Y a-t-il des tests que je devrais envisager?",
        "Comment puis-je prévenir cela à l'avenir?"
      ],
      ta: [
        "நான் கவனிக்க வேண்டிய பொதுவான அறிகுறிகள் என்ன?",
        "நான் மருத்துவரை சந்திக்க வேண்டுமா?",
        "என்ன வாழ்க்கை முறை மாற்றங்கள் உதவும்?",
        "நான் எந்த பரிசோதனைகளை செய்ய வேண்டும்?",
        "எதிர்காலத்தில் இதை எப்படி தடுக்கலாம்?"
      ],
      hi: [
        "मुझे किन सामान्य लक्षणों पर ध्यान देना चाहिए?",
        "क्या मुझे डॉक्टर से अपॉइंटमेंट लेना चाहिए?",
        "कौन से जीवनशैली परिवर्तन मदद कर सकते हैं?",
        "क्या कोई परीक्षण करवाना चाहिए?",
        "भविष्य में इसे कैसे रोका जा सकता है?"
      ],
      ar: [
        "ما هي الأعراض الشائعة التي يجب أن أراقبها؟",
        "هل يجب أن أحجز موعدًا مع طبيب؟",
        "ما التغييرات في نمط الحياة التي يمكن أن تساعد؟",
        "هل هناك فحوصات يجب أن أفكر فيها؟",
        "كيف يمكنني منع هذا في المستقبل؟"
      ],
      zh: [
        "我应该注意哪些常见症状？",
        "我应该预约医生吗？",
        "什么生活方式的改变可以帮助？",
        "我应该考虑做哪些检查？",
        "将来如何预防这种情况？"
      ],
      ja: [
        "注意すべき一般的な症状は何ですか？",
        "医師の予約を取るべきですか？",
        "どのような生活習慣の変更が役立ちますか？",
        "検討すべき検査はありますか？",
        "将来これを防ぐにはどうすればよいですか？"
      ],
      ko: [
        "주의해야 할 일반적인 증상은 무엇인가요?",
        "의사 예약을 해야 하나요?",
        "어떤 생활 습관 변화가 도움이 될까요?",
        "고려해야 할 검사가 있나요?",
        "앞으로 이것을 어떻게 예방할 수 있나요?"
      ],
      de: [
        "Welche häufigen Symptome sollte ich beachten?",
        "Sollte ich einen Arzttermin vereinbaren?",
        "Welche Lebensstiländerungen können helfen?",
        "Gibt es Tests, die ich in Betracht ziehen sollte?",
        "Wie kann ich dies in Zukunft verhindern?"
      ],
      it: [
        "Quali sono i sintomi comuni da tenere d'occhio?",
        "Dovrei fissare un appuntamento con un medico?",
        "Quali cambiamenti nello stile di vita possono aiutare?",
        "Ci sono test che dovrei considerare?",
        "Come posso prevenire questo in futuro?"
      ],
      pt: [
        "Quais são os sintomas comuns que devo observar?",
        "Devo agendar uma consulta com um médico?",
        "Quais mudanças no estilo de vida podem ajudar?",
        "Há algum exame que eu deva considerar?",
        "Como posso prevenir isso no futuro?"
      ],
      ru: [
        "Какие общие симптомы мне следует отслеживать?",
        "Следует ли мне записаться на прием к врачу?",
        "Какие изменения образа жизни могут помочь?",
        "Есть ли тесты, которые мне следует рассмотреть?",
        "Как я могу предотвратить это в будущем?"
      ]
    };

    // Return questions for the specified language, or English as fallback
    const questions = fallbackQuestions[language] || fallbackQuestions.en;
    
    // Return 3 random questions
    return this.shuffleArray(questions).slice(0, 3);
  }

  /**
   * Shuffle array helper
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate context-aware questions based on intent
   */
  getContextualQuestions(intent, language = 'en') {
    const contextualQuestions = {
      appointment: {
        en: [
          "What specialization do I need?",
          "Can I see available time slots?",
          "How do I reschedule an appointment?"
        ],
        es: [
          "¿Qué especialización necesito?",
          "¿Puedo ver los horarios disponibles?",
          "¿Cómo reprogramo una cita?"
        ],
        ta: [
          "எனக்கு என்ன சிறப்பு தேவை?",
          "கிடைக்கும் நேரங்களை பார்க்கலாமா?",
          "அப்பாயிண்ட்மென்ட்டை எப்படி மாற்றுவது?"
        ]
      },
      faq: {
        en: [
          "Can you explain this in simpler terms?",
          "What are the treatment options?",
          "Are there any side effects?"
        ],
        es: [
          "¿Puedes explicar esto en términos más simples?",
          "¿Cuáles son las opciones de tratamiento?",
          "¿Hay algún efecto secundario?"
        ],
        ta: [
          "இதை எளிமையாக விளக்க முடியுமா?",
          "சிகிச்சை விருப்பங்கள் என்ன?",
          "ஏதேனும் பக்க விளைவுகள் உள்ளதா?"
        ]
      },
      general: {
        en: [
          "What should I do next?",
          "Is this condition serious?",
          "When should I see a doctor?"
        ],
        es: [
          "¿Qué debo hacer a continuación?",
          "¿Es grave esta condición?",
          "¿Cuándo debo ver a un médico?"
        ],
        ta: [
          "நான் அடுத்து என்ன செய்ய வேண்டும்?",
          "இந்த நிலை தீவிரமானதா?",
          "நான் எப்போது மருத்துவரை பார்க்க வேண்டும்?"
        ]
      }
    };

    const questions = contextualQuestions[intent]?.[language] || contextualQuestions.general[language] || contextualQuestions.general.en;
    return questions;
  }
}

module.exports = new FollowUpQuestionsService();
