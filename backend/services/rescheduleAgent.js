const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const openRouterService = require('./openRouterService');

/**
 * Reschedule Agent - Handles appointment rescheduling through chat
 */
class RescheduleAgent {
  constructor() {
    // Using OpenRouter service instead of Google Generative AI
  }

  /**
   * Parse reschedule request from user message
   */
  async parseRescheduleRequest(message, userId) {
    try {
      const prompt = `You are a medical appointment rescheduling assistant. Parse the user's request to reschedule an appointment.

User message: "${message}"

Extract the following information and respond ONLY with a valid JSON object:
{
  "intent": "reschedule",
  "appointmentIdentifier": "string or null (appointment ID, doctor name, date, or 'next', 'upcoming', 'latest')",
  "newDate": "YYYY-MM-DD or null",
  "newTime": "HH:MM or null (24-hour format)",
  "reason": "string or null"
}

Examples:
- "Reschedule my appointment with Dr. Smith to next Monday at 3pm" → {"intent":"reschedule","appointmentIdentifier":"Dr. Smith","newDate":"2024-02-19","newTime":"15:00","reason":null}
- "I need to change my next appointment to tomorrow 10am" → {"intent":"reschedule","appointmentIdentifier":"next","newDate":"2024-02-18","newTime":"10:00","reason":null}
- "Reschedule appointment #123 to Feb 20 at 2:30pm" → {"intent":"reschedule","appointmentIdentifier":"123","newDate":"2024-02-20","newTime":"14:30","reason":null}

Important:
- Use today's date as reference: ${new Date().toISOString().split('T')[0]}
- Convert relative dates (tomorrow, next Monday) to YYYY-MM-DD format
- Convert 12-hour time to 24-hour format
- If information is missing, set to null

Respond with ONLY the JSON object, no other text.`;

      const response = await openRouterService.generateResponse(prompt, [], {
        maxTokens: 200,
        temperature: 0.1
      });
      
      console.log('Reschedule AI response:', response.content);
      
      // Extract JSON from response - try multiple patterns
      let jsonMatch = response.content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to find JSON in code blocks
        jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        console.error('No JSON found in response:', response.content);
        throw new Error('Failed to parse reschedule request - no JSON found');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Parsed reschedule request:', parsed);
      return parsed;

    } catch (error) {
      console.error('Error parsing reschedule request:', error);
      console.error('Error details:', error.message);
      
      // Return a default structure instead of throwing
      return {
        intent: 'reschedule',
        appointmentIdentifier: 'next',
        newDate: null,
        newTime: null,
        reason: null,
        error: 'Could not understand reschedule request. Please specify which appointment and the new date/time.'
      };
    }
  }

  /**
   * Find appointment to reschedule based on identifier
   */
  async findAppointmentToReschedule(userId, identifier) {
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

      // Handle different identifier types
      if (identifier === 'next' || identifier === 'upcoming' || identifier === 'latest') {
        // Get the nearest upcoming appointment
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
        message: 'You have multiple upcoming appointments. Which one would you like to reschedule?'
      };

    } catch (error) {
      console.error('Error finding appointment:', error);
      return { error: 'Error finding appointment' };
    }
  }

  /**
   * Check if new time slot is available
   */
  async checkAvailability(doctorId, newDateTime, excludeAppointmentId = null) {
    try {
      const query = {
        doctorId,
        dateTime: {
          $gte: new Date(newDateTime.getTime() - 30 * 60000), // 30 minutes before
          $lte: new Date(newDateTime.getTime() + 30 * 60000)  // 30 minutes after
        },
        status: { $in: ['scheduled', 'confirmed'] }
      };

      if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
      }

      const conflicting = await Appointment.findOne(query);
      return !conflicting;

    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  /**
   * Generate reschedule response for chat
   */
  async generateRescheduleResponse(parsedRequest, findResult, language = 'en') {
    const responses = {
      en: {
        noAppointments: "You don't have any upcoming appointments to reschedule.",
        needsInfo: "I'd be happy to help you reschedule. Could you please specify:\n- Which appointment (doctor name or date)\n- New preferred date and time",
        multiplefound: "I found multiple appointments. Please specify which one:\n",
        confirmReschedule: "I found your appointment:\n\n**Doctor:** {doctorName}\n**Current Date:** {currentDate}\n**Current Time:** {currentTime}\n\nWould you like to reschedule to:\n**New Date:** {newDate}\n**New Time:** {newTime}\n\nPlease confirm by saying 'yes' or provide a different date/time.",
        missingDateTime: "I found your appointment with **{doctorName}** on {currentDate}.\n\nPlease provide the new date and time you'd like to reschedule to.",
        success: "**Appointment Rescheduled Successfully!**\n\n**Doctor:** {doctorName}\n**Old Date & Time:** {oldDateTime}\n**New Date & Time:** {newDateTime}\n\nYou will receive a confirmation email shortly.",
        slotUnavailable: "The requested time slot is not available. Please choose a different time.",
        error: "I encountered an error while trying to reschedule your appointment. Please try again or contact support.",
        parseError: "I couldn't understand your reschedule request. Please try again with:\n- Which appointment (e.g., 'my next appointment' or 'appointment with Dr. Smith')\n- New date and time (e.g., 'tomorrow at 2pm' or '25/02/2026 at 14:00')"
      }
    };

    const lang = responses[language] || responses.en;

    // Handle parsing error
    if (parsedRequest.error) {
      return lang.parseError;
    }

    if (findResult.error) {
      return lang.noAppointments;
    }

    if (findResult.needsClarification) {
      let message = lang.multiplefound;
      findResult.appointments.forEach((apt, index) => {
        const date = new Date(apt.dateTime).toLocaleDateString('en-GB');
        const time = new Date(apt.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        message += `\n${index + 1}. **${apt.doctorId.name}** (${apt.doctorId.specialization}) - ${date} at ${time}`;
      });
      return message;
    }

    if (!parsedRequest.newDate || !parsedRequest.newTime) {
      const currentDate = new Date(findResult.appointment.dateTime).toLocaleDateString('en-GB');
      return lang.missingDateTime
        .replace('{doctorName}', findResult.appointment.doctorId.name)
        .replace('{currentDate}', currentDate);
    }

    // Has all info - ready to reschedule
    const currentDate = new Date(findResult.appointment.dateTime).toLocaleDateString('en-GB');
    const currentTime = new Date(findResult.appointment.dateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return lang.confirmReschedule
      .replace('{doctorName}', findResult.appointment.doctorId.name)
      .replace('{currentDate}', currentDate)
      .replace('{currentTime}', currentTime)
      .replace('{newDate}', parsedRequest.newDate)
      .replace('{newTime}', parsedRequest.newTime);
  }

  /**
   * Execute the reschedule with calendar integration
   */
  async executeReschedule(appointmentId, newDateTime, userId) {
    try {
      const axios = require('axios');
      
      // Call the reschedule API endpoint
      const response = await axios.patch(
        `${process.env.API_URL || 'http://localhost:3004'}/api/appointments/${appointmentId}/reschedule`,
        { newDateTime },
        {
          headers: {
            'Authorization': `Bearer ${userId}` // This would need proper token handling
          }
        }
      );

      return {
        success: true,
        appointment: response.data.appointment,
        oldDateTime: response.data.oldDateTime,
        newDateTime: response.data.newDateTime
      };
    } catch (error) {
      console.error('Error executing reschedule:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reschedule appointment'
      };
    }
  }
}

module.exports = new RescheduleAgent();
module.exports = new RescheduleAgent();
