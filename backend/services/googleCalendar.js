const { google } = require('googleapis');
const path = require('path');

class GoogleCalendarService {
  constructor() {
    this.calendar = null;
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    this.initialized = false;
  }

  async initialize() {
    try {
      let auth;

      // Method 1: Try environment variable first
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.log('Using Google service account from environment variable');
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
          ],
        });
      } 
      // Method 2: Try JSON file
      else {
        const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
        const fs = require('fs');
        
        if (fs.existsSync(credentialsPath)) {
          console.log('Using Google service account from JSON file');
          auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: [
              'https://www.googleapis.com/auth/calendar',
              'https://www.googleapis.com/auth/calendar.events'
            ],
          });
        } else {
          console.log('⚠️  Google Calendar credentials not found');
          console.log('   Calendar integration will be disabled until credentials are configured');
          console.log('   Appointments will still work without calendar integration');
          this.initialized = false;
          return false;
        }
      }

      this.calendar = google.calendar({ version: 'v3', auth });
      this.initialized = true;
      console.log('✅ Google Calendar service initialized successfully');
      return true;
    } catch (error) {
      console.error('⚠️  Failed to initialize Google Calendar service:', error.message);
      console.log('   Calendar integration will be disabled');
      console.log('   Appointments will still work without calendar integration');
      this.initialized = false;
      return false;
    }
  }

  async createAppointmentEvent(appointmentData) {
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Google Calendar service not available');
      }
    }

    try {
      const {
        patientName,
        patientEmail,
        doctorName,
        doctorEmail,
        dateTime,
        duration = 30,
        appointmentType,
        chiefComplaint,
        symptoms = []
      } = appointmentData;

      const startTime = new Date(dateTime);
      const endTime = new Date(startTime.getTime() + duration * 60000); // duration in minutes

      const event = {
        summary: `Medical Appointment: ${patientName} with ${doctorName}`,
        description: this.createEventDescription({
          patientName,
          patientEmail,
          doctorName,
          doctorEmail,
          appointmentType,
          chiefComplaint,
          symptoms
        }),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        // Note: Attendees removed to avoid permission issues
        // attendees: [
        //   { email: patientEmail, displayName: patientName },
        //   { email: doctorEmail, displayName: doctorName }
        // ].filter(attendee => attendee.email),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 }, // 30 minutes before (email reminders need attendees)
          ],
        },
        // Note: Conference data removed due to permission issues
        // conferenceData: {
        //   createRequest: {
        //     requestId: `appointment-${Date.now()}`,
        //     conferenceSolutionKey: { type: 'hangoutsMeet' }
        //   }
        // },
        colorId: '2', // Green color for medical appointments
      };

      const response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event,
        // conferenceDataVersion: 1, // Removed since we're not creating conferences
        sendUpdates: 'none', // Don't send email invitations (requires domain-wide delegation)
      });

      console.log('Calendar event created:', response.data.id);
      return {
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        meetingLink: null // No meeting link since we're not creating conferences
      };

    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  async updateAppointmentEvent(eventId, appointmentData) {
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Google Calendar service not available');
      }
    }

    try {
      const {
        patientName,
        patientEmail,
        doctorName,
        doctorEmail,
        dateTime,
        duration = 30,
        appointmentType,
        chiefComplaint,
        symptoms = []
      } = appointmentData;

      const startTime = new Date(dateTime);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const event = {
        summary: `Medical Appointment: ${patientName} with ${doctorName}`,
        description: this.createEventDescription({
          patientName,
          patientEmail,
          doctorName,
          doctorEmail,
          appointmentType,
          chiefComplaint,
          symptoms
        }),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        // Note: Attendees removed to avoid permission issues
        // attendees: [
        //   { email: patientEmail, displayName: patientName },
        //   { email: doctorEmail, displayName: doctorName }
        // ].filter(attendee => attendee.email),
      };

      const response = await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: event,
        sendUpdates: 'none', // Don't send email invitations
      });

      console.log('Calendar event updated:', response.data.id);
      return {
        eventId: response.data.id,
        eventLink: response.data.htmlLink
      };

    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  async cancelAppointmentEvent(eventId) {
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Google Calendar service not available');
      }
    }

    try {
      await this.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId,
        sendUpdates: 'none', // Don't notify attendees (requires domain-wide delegation)
      });

      console.log('Calendar event cancelled:', eventId);
      return true;

    } catch (error) {
      console.error('Error cancelling calendar event:', error);
      throw new Error(`Failed to cancel calendar event: ${error.message}`);
    }
  }

  async getAvailableSlots(doctorEmail, startDate, endDate) {
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return []; // Return empty if calendar not available
      }
    }

    try {
      const response = await this.calendar.freebusy.query({
        resource: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          items: [{ id: doctorEmail }]
        }
      });

      const busyTimes = response.data.calendars[doctorEmail]?.busy || [];
      
      // Generate available slots (this is a simplified version)
      const availableSlots = this.generateAvailableSlots(startDate, endDate, busyTimes);
      
      return availableSlots;

    } catch (error) {
      console.error('Error checking availability:', error);
      return []; // Return empty array if error
    }
  }

  createEventDescription({ patientName, patientEmail, doctorName, doctorEmail, appointmentType, chiefComplaint, symptoms }) {
    let description = `Medical Appointment\n\n`;
    description += `Patient: ${patientName}`;
    if (patientEmail) description += ` (${patientEmail})`;
    description += `\n`;
    description += `Doctor: ${doctorName}`;
    if (doctorEmail) description += ` (${doctorEmail})`;
    description += `\n`;
    description += `Type: ${appointmentType}\n\n`;
    
    if (chiefComplaint) {
      description += `Chief Complaint: ${chiefComplaint}\n\n`;
    }
    
    if (symptoms && symptoms.length > 0) {
      description += `Symptoms: ${symptoms.join(', ')}\n\n`;
    }
    
    description += `This appointment was booked through MEDIBOT.\n\n`;
    description += `📝 Notes:\n`;
    description += `• Email invitations are not sent automatically\n`;
    description += `• Please manually notify attendees\n`;
    description += `• Create a separate meeting link if video consultation is needed\n`;
    description += `• Contact details are included above for coordination`;
    
    return description;
  }

  generateAvailableSlots(startDate, endDate, busyTimes) {
    // This is a simplified implementation
    // In a real application, you'd want more sophisticated slot generation
    const slots = [];
    const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    const slotDuration = 30; // 30 minutes
    
    const current = new Date(startDate);
    
    while (current < endDate) {
      const hour = current.getHours();
      
      if (hour >= workingHours.start && hour < workingHours.end) {
        const slotEnd = new Date(current.getTime() + slotDuration * 60000);
        
        // Check if this slot conflicts with busy times
        const isAvailable = !busyTimes.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return (current >= busyStart && current < busyEnd) ||
                 (slotEnd > busyStart && slotEnd <= busyEnd);
        });
        
        if (isAvailable) {
          slots.push({
            start: new Date(current),
            end: new Date(slotEnd),
            available: true
          });
        }
      }
      
      current.setMinutes(current.getMinutes() + slotDuration);
    }
    
    return slots;
  }

  // Test the calendar connection
  async testConnection() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const response = await this.calendar.calendarList.list();
      console.log('Calendar connection test successful');
      console.log('Available calendars:', response.data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary
      })));
      return true;
    } catch (error) {
      console.error('Calendar connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = new GoogleCalendarService();