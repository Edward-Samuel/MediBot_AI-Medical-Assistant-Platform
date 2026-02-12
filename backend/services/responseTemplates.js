/**
 * Medical Response Templates
 * 
 * Structured templates to reduce AI hallucination and ensure consistent,
 * safe medical guidance that always directs users to healthcare professionals.
 */

class ResponseTemplates {
  constructor() {
    this.templates = {
      // General medical advice structure
      medicalAdvice: {
        structure: [
          'acknowledgment',
          'generalGuidance',
          'whenToSeekHelp',
          'professionalConsultation',
          'disclaimer'
        ],
        maxLength: 300
      },

      // Symptom analysis structure
      symptomAnalysis: {
        structure: [
          'symptomAcknowledgment',
          'possibleCauses',
          'immediateSteps',
          'redFlags',
          'professionalAdvice'
        ],
        maxLength: 400
      },

      // Emergency response structure
      emergency: {
        structure: [
          'urgentWarning',
          'immediateAction',
          'emergencyContacts'
        ],
        maxLength: 150
      }
    };

    this.components = {
      // Acknowledgment phrases
      acknowledgment: {
        en: [
          "I understand you're concerned about {symptom}.",
          "Thank you for sharing your health concern about {symptom}.",
          "I can provide some general information about {symptom}."
        ],
        ta: [
          "{symptom} பற்றிய உங்கள் கவலையை நான் புரிந்துகொள்கிறேன்.",
          "{symptom} பற்றிய உங்கள் சுகாதார கவலையை பகிர்ந்ததற்கு நன்றி.",
          "{symptom} பற்றி சில பொதுவான தகவல்களை வழங்க முடியும்."
        ]
      },

      // Professional consultation reminders
      professionalConsultation: {
        en: [
          "**Important**: Please consult a healthcare professional for proper diagnosis and treatment.",
          "**Remember**: Only a qualified doctor can provide accurate diagnosis and treatment.",
          "**Essential**: Schedule an appointment with a healthcare provider for personalized care."
        ],
        ta: [
          "**முக்கியம்**: சரியான நோயறிதல் மற்றும் சிகிச்சைக்கு மருத்துவ நிபுணரை அணுகவும்.",
          "**நினைவில் கொள்ளுங்கள்**: தகுதிவாய்ந்த மருத்துவர் மட்டுமே துல்லியமான நோயறிதல் மற்றும் சிகிச்சை அளிக்க முடியும்.",
          "**அவசியம்**: தனிப்பட்ட பராமரிப்புக்காக சுகாதார வழங்குநருடன் சந்திப்பை ஏற்பாடு செய்யுங்கள்."
        ]
      },

      // Disclaimer
      disclaimer: {
        en: [
          "This information is for educational purposes only and not a substitute for professional medical advice.",
          "Please note: This guidance is general information and cannot replace professional medical consultation.",
          "Disclaimer: This is educational content only. Always consult healthcare professionals for medical decisions."
        ],
        ta: [
          "இந்த தகவல் கல்வி நோக்கங்களுக்காக மட்டுமே மற்றும் தொழில்முறை மருத்துவ ஆலோசனைக்கு மாற்றாக அல்ல.",
          "கவனிக்கவும்: இந்த வழிகாட்டுதல் பொதுவான தகவல் மற்றும் தொழில்முறை மருத்துவ ஆலோசனையை மாற்ற முடியாது.",
          "மறுப்பு: இது கல்வி உள்ளடக்கம் மட்டுமே. மருத்துவ முடிவுகளுக்கு எப்போதும் சுகாதார நிபுணர்களை அணுகவும்."
        ]
      },

      // Login requirement for appointments
      loginRequired: {
        en: [
          "To book an appointment, please log in to your account first.",
          "Appointment booking requires you to be logged in to your account.",
          "Please sign in to your account to book medical appointments."
        ],
        ta: [
          "அப்பாயிண்ட்மென்ட் புக் செய்ய, முதலில் உங்கள் கணக்கில் உள்நுழையவும்.",
          "அப்பாயிண்ட்மென்ட் புக்கிங்கிற்கு உங்கள் கணக்கில் உள்நுழைய வேண்டும்.",
          "மருத்துவ அப்பாயிண்ட்மென்ட் புக் செய்ய உங்கள் கணக்கில் உள்நுழையவும்."
        ]
      },

      // Login benefits for appointments
      loginBenefits: {
        en: [
          "**Appointment Booking Benefits:**\n• Your medical history is saved\n• Appointment reminders\n• Easy communication with doctors\n• Secure medical records",
          "**Why Login for Appointments:**\n• Track your appointment history\n• Receive automated reminders\n• Access your medical records\n• Secure patient information",
          "**Account Benefits:**\n• Personalized medical care\n• Appointment management\n• Medical history tracking\n• Direct doctor communication"
        ],
        ta: [
          "**அப்பாயிண்ட்மென்ட் புக்கிங் நன்மைகள்:**\n• உங்கள் மருத்துவ வரலாறு சேமிக்கப்படும்\n• அப்பாயிண்ட்மென்ட் நினைவூட்டல்கள்\n• மருத்துவர்களுடன் எளிதான தொடர்பு\n• பாதுகாப்பான மருத்துவ பதிவுகள்",
          "**அப்பாயிண்ட்மென்ட்டுக்கு ஏன் உள்நுழைய வேண்டும்:**\n• உங்கள் அப்பாயிண்ட்மென்ட் வரலாறை கண்காணிக்கவும்\n• தானியங்கி நினைவூட்டல்களை பெறவும்\n• உங்கள் மருத்துவ பதிவுகளை அணுகவும்\n• பாதுகாப்பான நோயாளி தகவல்",
          "**கணக்கு நன்மைகள்:**\n• தனிப்பயனாக்கப்பட்ட மருத்துவ பராமரிப்பு\n• அப்பாயிண்ட்மென்ட் மேலாண்மை\n• மருத்துவ வரலாறு கண்காணிப்பு\n• நேரடி மருத்துவர் தொடர்பு"
        ]
      },
      urgentWarning: {
        en: [
          "**MEDICAL EMERGENCY** - Seek immediate medical attention!",
          "⚠️ **URGENT** - This requires immediate professional medical care!",
          "🆘 **EMERGENCY** - Contact emergency services immediately!"
        ],
        ta: [
          "**மருத்துவ அவசரநிலை** - உடனடியாக மருத்துவ உதவி பெறுங்கள்!",
          "⚠️ **அவசரம்** - இதற்கு உடனடி தொழில்முறை மருத்துவ பராமரிப்பு தேவை!",
          "🆘 **அவசரநிலை** - உடனடியாக அவசர சேவைகளை தொடர்பு கொள்ளுங்கள்!"
        ]
      },

      // Immediate actions
      immediateAction: {
        en: [
          "• Call emergency services (911) immediately\n• Go to the nearest emergency room\n• Do not delay seeking medical help",
          "• Contact your doctor or emergency services now\n• Seek immediate professional medical attention\n• This cannot wait for a regular appointment",
          "• Get emergency medical care immediately\n• Call 911 or go to ER\n• Time is critical - act now"
        ],
        ta: [
          "• உடனடியாக அவசர சேவைகளை (108) அழைக்கவும்\n• அருகிலுள்ள அவசர சிகிச்சை பிரிவுக்கு செல்லுங்கள்\n• மருத்துவ உதவி பெறுவதை தாமதப்படுத்த வேண்டாம்",
          "• இப்போதே உங்கள் மருத்துவர் அல்லது அவசர சேவைகளை தொடர்பு கொள்ளுங்கள்\n• உடனடி தொழில்முறை மருத்துவ கவனிப்பு பெறுங்கள்\n• இது வழக்கமான சந்திப்புக்கு காத்திருக்க முடியாது",
          "• உடனடியாக அவசர மருத்துவ பராமரிப்பு பெறுங்கள்\n• 108 ஐ அழைக்கவும் அல்லது அவசர சிகிச்சை பிரிவுக்கு செல்லுங்கள்\n• நேரம் முக்கியமானது - இப்போதே செயல்படுங்கள்"
        ]
      }
    };

    // Emergency keywords that trigger immediate emergency response
    this.emergencyKeywords = {
      en: [
        'chest pain', 'heart attack', 'stroke', 'difficulty breathing', 'severe bleeding',
        'unconscious', 'seizure', 'severe allergic reaction', 'poisoning', 'overdose',
        'severe burns', 'broken bone', 'head injury', 'suicide', 'self harm'
      ],
      ta: [
        'மார்பு வலி', 'இதய தாக்குதல்', 'பக்கவாதம்', 'மூச்சு திணறல்', 'கடுமையான இரத்தப்போக்கு',
        'மயக்கம்', 'வலிப்பு', 'கடுமையான ஒவ்வாமை', 'விஷம்', 'அதிக மருந்து',
        'கடுமையான தீக்காயம்', 'எலும்பு முறிவு', 'தலை காயம்', 'தற்கொலை', 'சுய தீங்கு'
      ]
    };

    // Common symptoms and their structured responses
    this.symptomResponses = {
      headache: {
        en: {
          generalGuidance: [
            "**Common causes**: Tension, dehydration, eye strain, stress, lack of sleep",
            "**Immediate relief**: Rest in quiet room, apply cold/warm compress, stay hydrated",
            "**Over-the-counter options**: Pain relievers as directed on package"
          ],
          whenToSeekHelp: [
            "• Sudden, severe headache unlike any before",
            "• Headache with fever, stiff neck, or vision changes", 
            "• Frequent headaches interfering with daily life",
            "• Headache after head injury"
          ]
        },
        ta: {
          generalGuidance: [
            "**பொதுவான காரணங்கள்**: மன அழுத்தம், நீர்ச்சத்து குறைவு, கண் சோர்வு, மன அழுத்தம், தூக்கமின்மை",
            "**உடனடி நிவாரணம்**: அமைதியான அறையில் ஓய்வு, குளிர்/சூடான ஒத்தடம், நீர்ச்சத்து பராமரிப்பு",
            "**மருந்தகத்தில் கிடைக்கும் மருந்துகள்**: பேக்கேஜில் குறிப்பிட்டுள்ளபடி வலி நிவாரணிகள்"
          ],
          whenToSeekHelp: [
            "• முன்பு இல்லாத திடீர், கடுமையான தலைவலி",
            "• காய்ச்சல், கழுத்து விறைப்பு அல்லது பார்வை மாற்றங்களுடன் தலைவலி",
            "• அன்றாட வாழ்க்கையில் தலையிடும் அடிக்கடி தலைவலி",
            "• தலை காயத்திற்கு பிறகு தலைவலி"
          ]
        }
      },
      fever: {
        en: {
          generalGuidance: [
            "**Normal response**: Body's way of fighting infection",
            "**Home care**: Rest, fluids, light clothing, monitor temperature",
            "**Comfort measures**: Cool compress, lukewarm bath, adequate rest"
          ],
          whenToSeekHelp: [
            "• Temperature above 103°F (39.4°C)",
            "• Fever with difficulty breathing or chest pain",
            "• Fever lasting more than 3 days",
            "• Signs of dehydration or severe illness"
          ]
        },
        ta: {
          generalGuidance: [
            "**இயல்பான பதில்**: தொற்றுநோயை எதிர்த்துப் போராடும் உடலின் வழி",
            "**வீட்டு பராமரிப்பு**: ஓய்வு, திரவங்கள், இலகுவான ஆடை, வெப்பநிலை கண்காணிப்பு",
            "**ஆறுதல் நடவடிக்கைகள்**: குளிர் ஒத்தடம், வெதுவெதுப்பான குளியல், போதுமான ஓய்வு"
          ],
          whenToSeekHelp: [
            "• 103°F (39.4°C) க்கு மேல் வெப்பநிலை",
            "• மூச்சு திணறல் அல்லது மார்பு வலியுடன் காய்ச்சல்",
            "• 3 நாட்களுக்கு மேல் நீடிக்கும் காய்ச்சல்",
            "• நீர்ச்சத்து குறைவு அல்லது கடுமையான நோயின் அறிகுறிகள்"
          ]
        }
      }
    };
  }

  /**
   * Generate login requirement response for appointment booking
   */
  generateLoginRequiredResponse(language = 'en') {
    const lang = language === 'ta' ? 'ta' : 'en';
    
    if (lang === 'ta') {
      return {
        text: "அப்பாயிண்ட்மென்ட் புக் செய்ய, முதலில் உங்கள் கணக்கில் உள்நுழையவும்.",
        sections: [
          {
            title: "உள்நுழைய:",
            items: [
              "உங்கள் கணக்கு உள்ளதா? உள்நுழைய பொத்தானை அழுத்தவும்",
              "புதிய பயனரா? பதிவு செய்யவும்"
            ]
          },
          {
            title: "அப்பாயிண்ட்மென்ட் புக்கிங் நன்மைகள்:",
            items: [
              "உங்கள் மருத்துவ வரலாறு சேமிக்கப்படும்",
              "அப்பாயிண்ட்மென்ட் நினைவூட்டல்கள்",
              "மருத்துவர்களுடன் எளிதான தொடர்பு",
              "பாதுகாப்பான மருத்துவ பதிவுகள்"
            ]
          }
        ],
        formatted: "அப்பாயிண்ட்மென்ட் புக் செய்ய, முதலில் உங்கள் கணக்கில் உள்நுழையவும்.\n\n• உங்கள் கணக்கு உள்ளதா? உள்நுழைய பொத்தானை அழுத்தவும்\n• புதிய பயனரா? பதிவு செய்யவும்\n\n• உங்கள் மருத்துவ வரலாறு சேமிக்கப்படும்\n• அப்பாயிண்ட்மென்ட் நினைவூட்டல்கள்\n• மருத்துவர்களுடன் எளிதான தொடர்பு\n• பாதுகாப்பான மருத்துவ பதிவுகள்"
      };
    } else {
      return {
        text: "To book an appointment, please log in to your account first.",
        sections: [
          {
            title: "To Login:",
            items: [
              "Have an account? Click the login button",
              "New user? Sign up to create an account"
            ]
          },
          {
            title: "Appointment Booking Benefits:",
            items: [
              "Your medical history is saved",
              "Appointment reminders",
              "Easy communication with doctors",
              "Secure medical records"
            ]
          }
        ],
        formatted: "To book an appointment, please log in to your account first.\n\n• Have an account? Click the login button\n• New user? Sign up to create an account\n\n• Your medical history is saved\n• Appointment reminders\n• Easy communication with doctors\n• Secure medical records"
      };
    }
  }

  /**
   * Generate appointment booking response for authenticated users
   */
  generateAppointmentBookingResponse(language = 'en') {
    const lang = language === 'ta' ? 'ta' : 'en';
    
    if (lang === 'ta') {
      return {
        text: "நான் உங்களுக்கு அப்பாயிண்ட்மென்ட் புக் செய்ய உதவ முடியும்! எந்த வகையான மருத்துவரை பார்க்க விரும்புகிறீர்கள்?",
        sections: [
          {
            title: "உதாரணம்:",
            items: [
              "**இதயநோய் மருத்துவர்** - இதய தொடர்பான கவலைகளுக்கு",
              "**தோல் மருத்துவர்** - தோல் பிரச்சினைகளுக்கு",
              "**பொது மருத்துவம்** - பொதுவான சுகாதார பரிசோதனைகளுக்கு",
              "**நரம்பியல் மருத்துவர்** - நரம்பியல் கவலைகளுக்கு"
            ]
          }
        ],
        instruction: "உங்கள் விருப்பத்தை தெரிவிக்கவும், நான் உங்களுக்கு கிடைக்கும் மருத்துவர்களை கண்டுபிடிப்பேன்.",
        formatted: "நான் உங்களுக்கு அப்பாயிண்ட்மென்ட் புக் செய்ய உதவ முடியும்! எந்த வகையான மருத்துவரை பார்க்க விரும்புகிறீர்கள்?\n\n• **இதயநோய் மருத்துவர்** - இதய தொடர்பான கவலைகளுக்கு\n• **தோல் மருத்துவர்** - தோல் பிரச்சினைகளுக்கு\n• **பொது மருத்துவம்** - பொதுவான சுகாதார பரிசோதனைகளுக்கு\n• **நரம்பியல் மருத்துவர்** - நரம்பியல் கவலைகளுக்கு\n\nஉங்கள் விருப்பத்தை தெரிவிக்கவும், நான் உங்களுக்கு கிடைக்கும் மருத்துவர்களை கண்டுபிடிப்பேன்."
      };
    } else {
      return {
        text: "I can help you book an appointment! What type of doctor would you like to see?",
        sections: [
          {
            title: "Examples:",
            items: [
              "**Cardiologist** - for heart-related concerns",
              "**Dermatologist** - for skin issues",
              "**General Medicine** - for general health checkups",
              "**Neurologist** - for neurological concerns"
            ]
          }
        ],
        instruction: "Please let me know your preference and I'll find available doctors for you.",
        formatted: "I can help you book an appointment! What type of doctor would you like to see?\n\n• **Cardiologist** - for heart-related concerns\n• **Dermatologist** - for skin issues\n• **General Medicine** - for general health checkups\n• **Neurologist** - for neurological concerns\n\nPlease let me know your preference and I'll find available doctors for you."
      };
    }
  }

  /**
   * Check if message contains emergency keywords
   */
  isEmergency(message, language = 'en') {
    const keywords = this.emergencyKeywords[language] || this.emergencyKeywords.en;
    const lowerMessage = message.toLowerCase();
    
    return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
  }

  /**
   * Generate emergency response
   */
  generateEmergencyResponse(language = 'en') {
    const components = this.components;
    const lang = language === 'ta' ? 'ta' : 'en';
    
    const warning = this.getRandomItem(components.urgentWarning[lang]);
    const action = this.getRandomItem(components.immediateAction[lang]);
    
    return {
      text: warning,
      actions: action.split('\n').filter(line => line.trim()),
      type: 'emergency',
      formatted: `${warning}\n\n${action}`
    };
  }

  /**
   * Generate structured medical response
   */
  generateMedicalResponse(message, symptom, language = 'en') {
    const lang = language === 'ta' ? 'ta' : 'en';
    const components = this.components;
    
    // Check if we have a specific symptom response
    const symptomKey = this.findSymptomKey(symptom);
    let responseData = {
      text: '',
      sections: [],
      disclaimer: '',
      formatted: ''
    };
    
    // Acknowledgment
    const acknowledgment = this.getRandomItem(components.acknowledgment[lang])
      .replace('{symptom}', symptom);
    responseData.text = acknowledgment;
    
    // Specific symptom guidance if available
    if (symptomKey && this.symptomResponses[symptomKey] && this.symptomResponses[symptomKey][lang]) {
      const symptomData = this.symptomResponses[symptomKey][lang];
      
      if (symptomData.generalGuidance) {
        responseData.sections.push({
          title: lang === 'ta' ? 'பொதுவான வழிகாட்டுதல்:' : 'General Guidance:',
          items: symptomData.generalGuidance,
          type: 'guidance'
        });
      }
      
      if (symptomData.whenToSeekHelp) {
        responseData.sections.push({
          title: lang === 'ta' ? 'மருத்துவரை எப்போது பார்க்க வேண்டும்:' : 'When to Seek Medical Help:',
          items: symptomData.whenToSeekHelp,
          type: 'warning'
        });
      }
    } else {
      // Generic medical guidance
      responseData.sections.push({
        title: lang === 'ta' ? 'பொதுவான ஆலோசனை:' : 'General Advice:',
        items: lang === 'ta' 
          ? [
              'அறிகுறிகளை கண்காணிக்கவும்',
              'போதுமான ஓய்வு எடுக்கவும்',
              'நீர்ச்சத்து பராமரிக்கவும்',
              'அறிகுறிகள் மோசமாகினால் மருத்துவரை அணுகவும்'
            ]
          : [
              'Monitor your symptoms',
              'Get adequate rest',
              'Stay hydrated',
              'Seek medical attention if symptoms worsen'
            ],
        type: 'guidance'
      });
    }
    
    // Professional consultation reminder
    const consultation = this.getRandomItem(components.professionalConsultation[lang]);
    responseData.sections.push({
      title: '',
      items: [consultation],
      type: 'important'
    });
    
    // Disclaimer
    responseData.disclaimer = this.getRandomItem(components.disclaimer[lang]);
    
    // Build formatted version for backward compatibility
    let formatted = responseData.text + '\n\n';
    
    responseData.sections.forEach(section => {
      // Skip adding section titles
      section.items.forEach(item => {
        if (section.type === 'warning' || section.type === 'guidance') {
          formatted += `• ${item}\n`;
        } else {
          formatted += `${item}\n`;
        }
      });
      formatted += '\n';
    });
    
    formatted += responseData.disclaimer;
    responseData.formatted = formatted;
    
    return responseData;
  }

  /**
   * Generate general health response
   */
  generateGeneralResponse(message, language = 'en') {
    const lang = language === 'ta' ? 'ta' : 'en';
    
    const responseData = {
      text: lang === 'ta' 
        ? 'உங்கள் சுகாதார கேள்விக்கு நன்றி. பொதுவான சுகாதார தகவல்களை வழங்க முடியும், ஆனால் தனிப்பட்ட மருத்துவ ஆலோசனைக்கு தகுதிவாய்ந்த மருத்துவரை அணுகவும்.'
        : 'Thank you for your health question. I can provide general health information, but please consult a qualified healthcare professional for personalized medical advice.',
      sections: [
        {
          title: lang === 'ta' ? 'பொதுவான சுகாதார குறிப்புகள்:' : 'General Health Tips:',
          items: lang === 'ta'
            ? [
                'சமச்சீர் உணவு உண்ணுங்கள்',
                'வழக்கமான உடற்பயிற்சி செய்யுங்கள்',
                'போதுமான தூக்கம் பெறுங்கள்',
                'மன அழுத்தத்தை நிர்வகிக்கவும்',
                'வழக்கமான மருத்துவ பரிசோதனைகள் செய்யுங்கள்'
              ]
            : [
                'Maintain a balanced diet',
                'Exercise regularly',
                'Get adequate sleep',
                'Manage stress',
                'Schedule regular medical checkups'
              ],
          type: 'guidance'
        }
      ],
      disclaimer: '',
      formatted: ''
    };
    
    const consultation = this.getRandomItem(this.components.professionalConsultation[lang]);
    responseData.sections.push({
      title: '',
      items: [consultation],
      type: 'important'
    });
    
    // Build formatted version
    let formatted = responseData.text + '\n\n';
    
    responseData.sections.forEach(section => {
      // Skip adding section titles
      section.items.forEach(item => {
        if (section.type === 'guidance') {
          formatted += `• ${item}\n`;
        } else {
          formatted += `${item}\n`;
        }
      });
      formatted += '\n';
    });
    
    responseData.formatted = formatted.trim();
    
    return responseData;
  }

  /**
   * Find symptom key from message
   */
  findSymptomKey(symptom) {
    const symptomLower = symptom.toLowerCase();
    
    if (symptomLower.includes('headache') || symptomLower.includes('தலைவலி')) {
      return 'headache';
    }
    if (symptomLower.includes('fever') || symptomLower.includes('காய்ச்சல்')) {
      return 'fever';
    }
    
    return null;
  }

  /**
   * Get random item from array
   */
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Extract main symptom from message
   */
  extractSymptom(message, language = 'en') {
    const commonSymptoms = {
      en: ['headache', 'fever', 'cough', 'pain', 'nausea', 'dizziness', 'fatigue'],
      ta: ['தலைவலி', 'காய்ச்சல்', 'இருமல்', 'வலி', 'குமட்டல்', 'தலைசுற்றல்', 'சோர்வு']
    };
    
    const symptoms = commonSymptoms[language] || commonSymptoms.en;
    const lowerMessage = message.toLowerCase();
    
    for (const symptom of symptoms) {
      if (lowerMessage.includes(symptom.toLowerCase())) {
        return symptom;
      }
    }
    
    return language === 'ta' ? 'உங்கள் அறிகுறி' : 'your symptom';
  }
}

module.exports = new ResponseTemplates();