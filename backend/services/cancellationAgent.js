const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Cancellation Agent - Handles appointment cancellation through chat
 */
class CancellationAgent {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  /**
   * Parse cancellation request from user message
   */
  async parseCancellationRequest(message, userId) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `You are a medical appointment cancellation assistant. Parse the user's request to cancel an appointment.

User message: "${message}"

Extract the following information and respond ONLY with a valid JSON object:
{
  "intent": "cancel",
  "appointmentIdentifier": "string or null (appointment ID, doctor name, date, or 'next', 'upcoming', 'latest', 'all')",
  "reason": "string or null (reason for cancellation)"
}

Examples:
- "Cancel my appointment with Dr. Smith" → {"intent":"cancel","appointmentIdentifier":"Dr. Smith","reason":null}
- "I need to cancel my next appointment" → {"intent":"cancel","appointmentIdentifier":"next","reason":null}
- "Cancel appointment #123 because I'm feeling better" → {"intent":"cancel","appointmentIdentifier":"123","reason":"feeling better"}
- "Cancel all my appointments" → {"intent":"cancel","appointmentIdentifier":"all","reason":null}

Important:
- If information is missing, set to null
- Extract cancellation reason if mentioned

Respond with ONLY the JSON object, no other text.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse cancellation request');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;

    } catch (error) {
      console.error('Error parsing cancellation request:', error);
      return {
        intent: 'cancel',
        appointmentIdentifier: null,
        reason: null,
        error: 'Could not understand cancellation request'
      };
    }
  }

  /**
   * Find appointment(s) to cancel based on identifier
   */
  async findAppointmentToCancel(userId, identifier) {
    try {
      const patient = await Patient.findOne({ userId });
      if (!patient) {
        return { error: 'Patient profile not found' };
      }

      let query = {
        patientId: patient._id,
        status: { $in: ['scheduled', 'confirmed'] },
        dateTime: { $gte: new Date() } // Only future appointments
      };

      // Handle "all" appointments
      if (identifier === 'all') {
        const appointments = await Appointment.find(query)
          .sort({ dateTime: 1 })
          .populate('doctorId', 'name specialization')
          .lean();

        if (appointments.length === 0) {
          return { error: 'No upcoming appointments found to cancel' };
        }

        return { 
          cancelAll: true,
          appointments,
          message: `You have ${appointments.length} upcoming appointment(s). Are you sure you want to cancel all of them?`
        };
      }

      // Handle single appointment identifiers
      if (identifier === 'next' || identifier === 'upcoming' || identifier === 'latest') {
        const appointment = await Appointment.findOne(query)
          .sort({ dateTime: 1 })
          .populate('doctorId', 'name specialization')
          .lean();

        return appointment ? { appointment } : { error: 'No upcoming appointments found' };
      }

      // Check if identifier is an appointment ID
      if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
        query._id = identifier;
        const appointment = await Appointment.findOne(query)
          .populate('doctorId', 'name specialization')
          .lean();

        return appointment ? { appointment } : { error: 'Appointment not found' };
      }

      // Search by doctor name
      if (identifier) {
        const doctors = await Doctor.find({
          name: new RegExp(identifier, 'i')
        }).select('_id');

        if (doctors.length > 0) {
          query.doctorId = { $in: doctors.map(d => d._id) };
          const appointment = await Appointment.findOne(query)
            .sort({ dateTime: 1 })
            .populate('doctorId', 'name specialization')
            .lean();

          return appointment ? { appointment } : { error: `No upcoming appointments found with ${identifier}` };
        }
      }

      // If no specific identifier, get all upcoming appointments
      const appointments = await Appointment.find(query)
        .sort({ dateTime: 1 })
        .limit(5)
        .populate('doctorId', 'name specialization')
        .lean();

      if (appointments.length === 0) {
        return { error: 'No upcoming appointments found' };
      }

      if (appointments.length === 1) {
        return { appointment: appointments[0] };
      }

      // Multiple appointments - need clarification
      return { 
        needsClarification: true,
        appointments,
        message: 'You have multiple upcoming appointments. Which one would you like to cancel?'
      };

    } catch (error) {
      console.error('Error finding appointment:', error);
      return { error: 'Error finding appointment' };
    }
  }

  /**
   * Execute cancellation
   */
  async cancelAppointment(appointmentId, reason = null) {
    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      if (appointment.status === 'cancelled') {
        return { success: false, error: 'Appointment is already cancelled' };
      }

      if (appointment.status === 'completed') {
        return { success: false, error: 'Cannot cancel completed appointments' };
      }

      // Cancel in Google Calendar
      if (appointment.googleCalendarEventId) {
        try {
          const googleCalendar = require('./googleCalendar');
          await googleCalendar.cancelAppointmentEvent(appointment.googleCalendarEventId);
          console.log('✅ Google Calendar event cancelled');
        } catch (calendarError) {
          console.error('⚠️ Calendar cancellation failed:', calendarError.message);
        }
      }

      // Update appointment status
      appointment.status = 'cancelled';
      if (reason) {
        appointment.notes = (appointment.notes || '') + `\nCancellation reason: ${reason}`;
      }
      await appointment.save();

      return { 
        success: true, 
        appointment,
        calendarUpdated: !!appointment.googleCalendarEventId
      };

    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return { success: false, error: 'Failed to cancel appointment' };
    }
  }

  /**
   * Cancel multiple appointments
   */
  async cancelMultipleAppointments(appointmentIds, reason = null) {
    const results = [];
    
    for (const id of appointmentIds) {
      const result = await this.cancelAppointment(id, reason);
      results.push({ appointmentId: id, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return {
      success: successCount > 0,
      successCount,
      failCount,
      results
    };
  }

  /**
   * Generate cancellation response for chat
   */
  async generateCancellationResponse(parsedRequest, findResult, language = 'en') {
    const responses = {
      en: {
        noAppointments: "You don't have any upcoming appointments to cancel.",
        needsInfo: "I'd be happy to help you cancel an appointment. Could you please specify which appointment (doctor name or date)?",
        multipleFound: "I found multiple appointments. Please specify which one:\n",
        confirmCancel: "I found your appointment:\n\n**Doctor:** {doctorName}\n**Specialization:** {specialization}\n**Date:** {date}\n**Time:** {time}\n\nAre you sure you want to cancel this appointment? Please confirm by saying 'yes'.",
        confirmCancelAll: "You have {count} upcoming appointments:\n\n{list}\n\nAre you sure you want to cancel ALL of them? Please confirm by saying 'yes to all'.",
        success: "✅ **Appointment Cancelled Successfully!**\n\n**Doctor:** {doctorName}\n**Date & Time:** {dateTime}\n\nYour Google Calendar has been updated. If you need to book a new appointment, just let me know!",
        successMultiple: "✅ **{count} Appointments Cancelled Successfully!**\n\nYour Google Calendar has been updated. If you need to book new appointments, just let me know!",
        alreadyCancelled: "This appointment is already cancelled.",
        error: "I encountered an error while trying to cancel your appointment. Please try again or contact support."
      }
    };

    const lang = responses[language] || responses.en;

    if (findResult.error) {
      return lang.noAppointments;
    }

    if (findResult.needsClarification) {
      let message = lang.multipleFound;
      findResult.appointments.forEach((apt, index) => {
        const date = new Date(apt.dateTime).toLocaleDateString();
        const time = new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        message += `\n${index + 1}. **${apt.doctorId.name}** (${apt.doctorId.specialization}) - ${date} at ${time}`;
      });
      return message;
    }

    if (findResult.cancelAll) {
      let list = '';
      findResult.appointments.forEach((apt, index) => {
        const date = new Date(apt.dateTime).toLocaleDateString();
        const time = new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        list += `${index + 1}. **${apt.doctorId.name}** - ${date} at ${time}\n`;
      });
      
      return lang.confirmCancelAll
        .replace('{count}', findResult.appointments.length)
        .replace('{list}', list);
    }

    // Single appointment - confirm cancellation
    const date = new Date(findResult.appointment.dateTime).toLocaleDateString();
    const time = new Date(findResult.appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return lang.confirmCancel
      .replace('{doctorName}', findResult.appointment.doctorId.name)
      .replace('{specialization}', findResult.appointment.doctorId.specialization)
      .replace('{date}', date)
      .replace('{time}', time);
  }
}

module.exports = new CancellationAgent();
