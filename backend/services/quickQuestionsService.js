const ChatHistory = require('../models/ChatHistory');
const Appointment = require('../models/Appointment');

/**
 * Generate dynamic quick questions based on user context
 */
class QuickQuestionsService {
  constructor() {
    // Base question pool organized by category
    this.questionPool = {
      symptoms: [
        "I have a headache and fever",
        "What should I do for chest pain?",
        "I'm experiencing stomach pain",
        "I have a persistent cough",
        "I'm feeling dizzy and nauseous",
        "I have back pain that won't go away",
        "I'm having trouble breathing",
        "I have a skin rash that's spreading"
      ],
      appointments: [
        "How do I book an appointment?",
        "I need to see a doctor urgently",
        "Can I schedule a follow-up appointment?",
        "What specialists are available?",
        "I need to reschedule my appointment"
      ],
      specialists: [
        "I need a dermatologist",
        "I need a cardiologist consultation",
        "Can I see a pediatrician?",
        "I need an orthopedic specialist",
        "I'm looking for a gynecologist"
      ],
      general: [
        "What are the symptoms of diabetes?",
        "How can I manage high blood pressure?",
        "What vaccinations do I need?",
        "How do I prepare for a blood test?",
        "What are common allergy symptoms?"
      ],
      followUp: [
        "Check my appointment status",
        "What were my doctor's recommendations?",
        "I need to discuss my test results",
        "Can I get a prescription refill?"
      ],
      timeBasedMorning: [
        "I woke up with a headache",
        "I'm feeling unwell this morning",
        "I need a same-day appointment"
      ],
      timeBasedEvening: [
        "I need urgent care tonight",
        "Is there emergency consultation available?",
        "I'm feeling worse as the day goes on"
      ],
      seasonal: {
        winter: [
          "I have flu-like symptoms",
          "I'm experiencing cold symptoms",
          "How do I prevent seasonal flu?"
        ],
        summer: [
          "I have heat exhaustion symptoms",
          "I got a sunburn, what should I do?",
          "How do I stay hydrated in hot weather?"
        ],
        spring: [
          "I'm having allergy symptoms",
          "My seasonal allergies are acting up",
          "How do I manage pollen allergies?"
        ],
        fall: [
          "I need a flu shot",
          "How do I boost my immune system?",
          "I'm getting sick frequently"
        ]
      }
    };
  }

  /**
   * Get current season based on month
   */
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Get time of day category
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Analyze user's chat history to extract patterns
   */
  async analyzeUserHistory(userId) {
    try {
      const recentChats = await ChatHistory.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean();

      const patterns = {
        hasHistory: recentChats.length > 0,
        commonTopics: [],
        lastInteractionDays: null,
        preferredLanguage: 'en'
      };

      if (recentChats.length > 0) {
        // Get last interaction
        const lastChat = recentChats[0];
        const daysSinceLastChat = Math.floor(
          (Date.now() - new Date(lastChat.updatedAt)) / (1000 * 60 * 60 * 24)
        );
        patterns.lastInteractionDays = daysSinceLastChat;
        patterns.preferredLanguage = lastChat.language || 'en';

        // Extract common topics from messages
        const allMessages = recentChats.flatMap(chat => 
          chat.messages.filter(msg => msg.role === 'user').map(msg => msg.content.toLowerCase())
        );

        // Simple keyword analysis
        const keywords = {
          appointment: ['appointment', 'book', 'schedule', 'reschedule'],
          symptoms: ['pain', 'fever', 'headache', 'cough', 'sick', 'hurt'],
          specialist: ['specialist', 'doctor', 'dermatologist', 'cardiologist'],
          followUp: ['follow', 'result', 'test', 'prescription']
        };

        Object.entries(keywords).forEach(([topic, words]) => {
          const count = allMessages.filter(msg => 
            words.some(word => msg.includes(word))
          ).length;
          if (count > 0) {
            patterns.commonTopics.push({ topic, count });
          }
        });

        patterns.commonTopics.sort((a, b) => b.count - a.count);
      }

      return patterns;
    } catch (error) {
      console.error('Error analyzing user history:', error);
      return { hasHistory: false, commonTopics: [], lastInteractionDays: null };
    }
  }

  /**
   * Get user's appointment context
   */
  async getAppointmentContext(userId) {
    try {
      const upcomingAppointments = await Appointment.find({
        patientId: userId,
        dateTime: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] }
      })
        .sort({ dateTime: 1 })
        .limit(3)
        .populate('doctorId', 'name specialization')
        .lean();

      const recentAppointments = await Appointment.find({
        patientId: userId,
        dateTime: { $lt: new Date() },
        status: 'completed'
      })
        .sort({ dateTime: -1 })
        .limit(3)
        .populate('doctorId', 'name specialization')
        .lean();

      return {
        hasUpcoming: upcomingAppointments.length > 0,
        upcomingCount: upcomingAppointments.length,
        hasRecent: recentAppointments.length > 0,
        recentSpecializations: recentAppointments.map(apt => apt.doctorId?.specialization).filter(Boolean),
        needsFollowUp: recentAppointments.some(apt => apt.followUpRequired)
      };
    } catch (error) {
      console.error('Error getting appointment context:', error);
      return { hasUpcoming: false, hasRecent: false, needsFollowUp: false };
    }
  }

  /**
   * Generate personalized questions based on context
   */
  async generateQuestions(userId = null, language = 'en', count = 5) {
    const questions = [];
    const timeOfDay = this.getTimeOfDay();
    const season = this.getCurrentSeason();

    // For authenticated users, get personalized context
    if (userId) {
      const [historyPatterns, appointmentContext] = await Promise.all([
        this.analyzeUserHistory(userId),
        this.getAppointmentContext(userId)
      ]);

      // Priority 1: Follow-up questions if user has recent activity
      if (appointmentContext.needsFollowUp && questions.length < count) {
        questions.push(this.getRandomFromArray(this.questionPool.followUp));
      }

      // Priority 2: Appointment-related if user has upcoming appointments
      if (appointmentContext.hasUpcoming && questions.length < count) {
        questions.push("Check my upcoming appointments");
      }

      // Priority 3: Based on user's common topics
      if (historyPatterns.commonTopics.length > 0 && questions.length < count) {
        const topTopic = historyPatterns.commonTopics[0].topic;
        if (this.questionPool[topTopic]) {
          questions.push(this.getRandomFromArray(this.questionPool[topTopic]));
        }
      }

      // Priority 4: Returning user - different questions
      if (historyPatterns.hasHistory && questions.length < count) {
        if (historyPatterns.lastInteractionDays > 7) {
          questions.push("I have new symptoms to discuss");
        }
      }
    }

    // Add time-based questions
    if (timeOfDay === 'morning' && questions.length < count) {
      questions.push(this.getRandomFromArray(this.questionPool.timeBasedMorning));
    } else if ((timeOfDay === 'evening' || timeOfDay === 'night') && questions.length < count) {
      questions.push(this.getRandomFromArray(this.questionPool.timeBasedEvening));
    }

    // Add seasonal questions
    if (questions.length < count) {
      const seasonalQuestions = this.questionPool.seasonal[season];
      questions.push(this.getRandomFromArray(seasonalQuestions));
    }

    // Fill remaining slots with diverse questions
    const remainingCount = count - questions.length;
    if (remainingCount > 0) {
      const categories = ['symptoms', 'appointments', 'specialists', 'general'];
      const usedQuestions = new Set(questions);

      for (let i = 0; i < remainingCount; i++) {
        const category = categories[i % categories.length];
        let question = this.getRandomFromArray(this.questionPool[category]);
        
        // Ensure uniqueness
        let attempts = 0;
        while (usedQuestions.has(question) && attempts < 10) {
          question = this.getRandomFromArray(this.questionPool[category]);
          attempts++;
        }
        
        questions.push(question);
        usedQuestions.add(question);
      }
    }

    return questions.slice(0, count);
  }

  /**
   * Get random item from array
   */
  getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get popular questions from analytics (placeholder for future implementation)
   */
  async getPopularQuestions(limit = 5) {
    // TODO: Implement analytics-based popular questions
    // This would track most common user queries and return trending questions
    return [];
  }
}

module.exports = new QuickQuestionsService();
