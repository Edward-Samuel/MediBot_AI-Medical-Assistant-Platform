const { GoogleGenerativeAI } = require('@google/generative-ai');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AppointmentAgent {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }

  // Parse appointment request from natural language
  async parseAppointmentRequest(message, userId, conversationHistory = []) {
    try {
      // Build context from conversation history
      const context = conversationHistory.slice(-5).map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');

      const prompt = `
You are an AI appointment booking assistant for a medical platform. Analyze the user's message and determine if they want to book an appointment.

Context from previous conversation:
${context}

Current user message: "${message}"

Extract the following information if available:
1. Intent: Does the user want to book an appointment? (yes/no)
2. Specialization: What type of doctor do they need? (e.g., cardiology, dermatology, general medicine)
3. Symptoms: What symptoms or health concerns do they mention?
4. Urgency: Is this urgent/emergency? (urgent/normal)
5. Preferred date: Any specific date mentioned? (extract in YYYY-MM-DD format if possible)
6. Preferred time: Any specific time mentioned? (extract in HH:MM format if possible)
7. Appointment type: consultation, follow-up, routine-checkup, or emergency

Respond in JSON format:
{
  "intent": "yes/no",
  "specialization": "specialization name or null",
  "symptoms": ["symptom1", "symptom2"] or [],
  "urgency": "urgent/normal",
  "preferredDate": "YYYY-MM-DD or null",
  "preferredTime": "HH:MM or null",
  "appointmentType": "consultation/follow-up/routine-checkup/emergency",
  "chiefComplaint": "brief description of main concern or null",
  "confidence": 0.0-1.0
}

Examples:
- "I need to see a cardiologist for chest pain" → intent: yes, specialization: cardiology, symptoms: ["chest pain"]
- "Can I book an appointment tomorrow at 2pm?" → intent: yes, preferredDate: tomorrow's date, preferredTime: "14:00"
- "I have a headache and fever" → intent: maybe (could be seeking advice or wanting appointment), symptoms: ["headache", "fever"]
- "Thank you for the advice" → intent: no
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      return {
        intent: parsed.intent === 'yes',
        specialization: parsed.specialization || null,
        symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
        urgency: parsed.urgency === 'urgent' ? 'urgent' : 'normal',
        preferredDate: parsed.preferredDate || null,
        preferredTime: parsed.preferredTime || null,
        appointmentType: ['consultation', 'follow-up', 'routine-checkup', 'emergency'].includes(parsed.appointmentType) 
          ? parsed.appointmentType 
          : 'consultation',
        chiefComplaint: parsed.chiefComplaint || null,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
      };

    } catch (error) {
      console.error('Error parsing appointment request:', error);
      return {
        intent: false,
        specialization: null,
        symptoms: [],
        urgency: 'normal',
        preferredDate: null,
        preferredTime: null,
        appointmentType: 'consultation',
        chiefComplaint: null,
        confidence: 0
      };
    }
  }

  // Find suitable doctors based on parsed request
  async findSuitableDoctors(parsedRequest, limit = 5) {
    try {
      const query = { isVerified: true };
      
      // Filter by specialization if specified
      if (parsedRequest.specialization) {
        // Map common terms to specializations
        const specializationMap = {
          'heart': 'Cardiology',
          'skin': 'Dermatology',
          'brain': 'Neurology',
          'bones': 'Orthopedics',
          'children': 'Pediatrics',
          'mental': 'Psychiatry',
          'general': 'General Medicine'
        };

        const specialization = specializationMap[parsedRequest.specialization.toLowerCase()] 
          || parsedRequest.specialization;
        
        query.specialization = new RegExp(specialization, 'i');
      }

      const doctors = await Doctor.find(query)
        .populate('userId', 'profile')
        .sort({ 'rating.average': -1, experience: -1 })
        .limit(limit);

      return doctors.map(doctor => ({
        id: doctor._id,
        name: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
        specialization: doctor.specialization,
        experience: doctor.experience,
        rating: doctor.rating.average,
        availability: doctor.availability
      }));

    } catch (error) {
      console.error('Error finding doctors:', error);
      return [];
    }
  }

  // Get available slots for a doctor
  async getAvailableSlots(doctorId, preferredDate = null, preferredTime = null) {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) return [];

      // If no preferred date, suggest next 7 days
      const dates = [];
      const startDate = preferredDate ? new Date(preferredDate) : new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }

      const availableSlots = [];

      for (const date of dates) {
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
        const dayAvailability = doctor.availability[dayOfWeek];
        
        if (!dayAvailability || !dayAvailability.available) continue;

        // Get existing appointments for this date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await Appointment.find({
          doctorId,
          dateTime: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['scheduled', 'confirmed'] }
        });

        // Generate time slots
        const slots = this.generateTimeSlots(
          dayAvailability.start || '09:00',
          dayAvailability.end || '17:00',
          30,
          existingAppointments,
          date,
          preferredTime
        );

        availableSlots.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          slots
        });

        // If we have enough slots, break
        if (availableSlots.reduce((total, day) => total + day.slots.length, 0) >= 10) {
          break;
        }
      }

      return availableSlots;

    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  // Generate time slots for a day
  generateTimeSlots(startTime, endTime, duration, existingAppointments, date, preferredTime = null) {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const start = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(date);
    end.setHours(endHour, endMinute, 0, 0);

    const current = new Date(start);
    const now = new Date();

    while (current < end) {
      // Skip past time slots
      if (current > now) {
        // Check if slot is available
        const isBooked = existingAppointments.some(apt => {
          const aptTime = new Date(apt.dateTime);
          return Math.abs(aptTime.getTime() - current.getTime()) < duration * 60000;
        });

        if (!isBooked) {
          const timeString = current.toTimeString().slice(0, 5);
          const isPreferred = preferredTime && timeString === preferredTime;
          
          slots.push({
            time: timeString,
            dateTime: new Date(current),
            available: true,
            preferred: isPreferred
          });
        }
      }

      current.setMinutes(current.getMinutes() + duration);
    }

    // Sort preferred slots first
    return slots.sort((a, b) => {
      if (a.preferred && !b.preferred) return -1;
      if (!a.preferred && b.preferred) return 1;
      return 0;
    });
  }

  // Book appointment automatically
  async bookAppointment(userId, doctorId, dateTime, appointmentData) {
    try {
      // Find patient profile
      const patient = await Patient.findOne({ userId });
      if (!patient) {
        throw new Error('Patient profile not found');
      }

      // Validate doctor exists
      const doctor = await Doctor.findById(doctorId).populate('userId');
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Check if appointment time is in the future
      const appointmentDate = new Date(dateTime);
      if (appointmentDate <= new Date()) {
        throw new Error('Appointment must be scheduled for a future date');
      }

      // Check for conflicting appointments
      const conflictingAppointment = await Appointment.findOne({
        doctorId,
        dateTime: {
          $gte: new Date(appointmentDate.getTime() - 30 * 60000),
          $lte: new Date(appointmentDate.getTime() + 30 * 60000)
        },
        status: { $in: ['scheduled', 'confirmed'] }
      });

      if (conflictingAppointment) {
        throw new Error('Time slot not available');
      }

      // Create appointment
      const appointment = new Appointment({
        patientId: patient._id,
        doctorId,
        dateTime: appointmentDate,
        type: appointmentData.appointmentType || 'consultation',
        symptoms: appointmentData.symptoms || [],
        chiefComplaint: appointmentData.chiefComplaint,
        fee: {
          consultation: 0,
          additional: 0,
          total: 0
        }
      });

      await appointment.save();

      // Populate appointment details for response
      await appointment.populate([
        { path: 'patientId', populate: { path: 'userId', select: 'profile' } },
        { path: 'doctorId', populate: { path: 'userId', select: 'profile' } }
      ]);

      return appointment;

    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  }

  // Generate appointment booking response
  async generateBookingResponse(parsedRequest, doctors, availableSlots, language = 'en') {
    try {
      const prompt = `
Generate a helpful response for a user who wants to book a medical appointment.

Request details:
- Specialization: ${parsedRequest.specialization || 'Any'}
- Symptoms: ${parsedRequest.symptoms.join(', ') || 'None specified'}
- Urgency: ${parsedRequest.urgency}
- Preferred date: ${parsedRequest.preferredDate || 'Flexible'}
- Preferred time: ${parsedRequest.preferredTime || 'Flexible'}

Available doctors: ${doctors.length}
Available slots found: ${availableSlots.reduce((total, day) => total + day.slots.length, 0)}

Language: ${language}

Generate a response that:
1. Acknowledges their request
2. Mentions the doctors found (if any)
3. Suggests next steps for booking
4. Is helpful and professional
5. Is in the specified language

Keep it concise and actionable.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Error generating booking response:', error);
      return language === 'ta' 
        ? 'உங்கள் அப்பாயிண்ட்மென்ட் கோரிக்கையை நான் புரிந்துகொண்டேன். உதவி செய்ய தயாராக இருக்கிறேன்.'
        : 'I understand you want to book an appointment. Let me help you with that.';
    }
  }
}

module.exports = new AppointmentAgent();