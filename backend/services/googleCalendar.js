const { google } = require('googleapis');
const path = require('path');

class GoogleCalendarService {
  constructor() {
    this.calendar = null;
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    this.initialized = false;
    this.authType = null; // 'service_account' or 'oauth' or null
  }

  async initialize() {
    try {
      let auth;

      // Method 1: Try service account from environment variable
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.log('🔑 Using Google service account from environment variable');
        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
          auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
              'https://www.googleapis.com/auth/calendar',
              'https://www.googleapis.com/auth/calendar.events'
            ],
          });
          this.authType = 'service_account';
        } catch (parseError) {
          console.error('❌ Invalid service account JSON in environment variable');
          throw parseError;
        }
      } 
      // Method 2: Try service account from JSON file
      else {
        const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
        const fs = require('fs');
        
        if (fs.existsSync(credentialsPath)) {
          console.log('🔑 Using Google service account from JSON file');
          try {
            auth = new google.auth.GoogleAuth({
              keyFile: credentialsPath,
              scopes: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
              ],
            });
            this.authType = 'service_account';
          } catch (fileError) {
            console.error('❌ Invalid service account JSON file');
            throw fileError;
          }
        } else {
          console.log('⚠️  Google Calendar credentials not found');
          console.log('   📋 To enable calendar integration:');
          console.log('   1. Create a Google Cloud Project');
          console.log('   2. Enable Google Calendar API');
          console.log('   3. Create a Service Account');
          console.log('   4. Download the JSON key file');
          console.log('   5. Place it at: backend/config/google-credentials.json');
          console.log('   📝 Calendar integration will be disabled until configured');
          this.initialized = false;
          return false;
        }
      }

      this.calendar = google.calendar({ version: 'v3', auth });
      
      // Test the connection
      await this.testConnection();
      
      this.initialized = true;
      console.log('✅ Google Calendar service initialized successfully');
      return true;
    } catch (error) {
      console.error('⚠️  Failed to initialize Google Calendar service:', error.message);
      
      // Provide specific error guidance
      if (error.message.includes('invalid_grant')) {
        console.log('   🔧 Fix: Check that your service account key is valid and not expired');
      } else if (error.message.includes('access_denied') || error.message.includes('forbidden')) {
        console.log('   🔧 Fix: Ensure the service account has Calendar API access');
        console.log('   📋 Required permissions:');
        console.log('   - Google Calendar API enabled in Google Cloud Console');
        console.log('   - Service account has calendar access permissions');
      } else if (error.message.includes('not found')) {
        console.log('   🔧 Fix: Check that the calendar ID exists and is accessible');
        console.log('   📋 Current calendar ID:', this.calendarId);
      }
      
      console.log('   📝 Calendar integration will be disabled');
      console.log('   ✅ Appointments will still work without calendar integration');
      this.initialized = false;
      return false;
    }
  }

  async createAppointmentEvent(appointmentData) {
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Calendar service not available - appointments will be created without calendar integration');
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
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 10 }
          ],
        },
        colorId: '2', // Green color for medical appointments
        visibility: 'private', // Keep medical appointments private
      };

      // Use a dedicated calendar for appointments if specified
      const targetCalendarId = this.calendarId === 'primary' ? 'primary' : this.calendarId;

      const response = await this.calendar.events.insert({
        calendarId: targetCalendarId,
        resource: event,
        sendUpdates: 'none', // Don't send notifications automatically
      });

      console.log('📅 Calendar event created successfully:', response.data.id);
      return {
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        meetingLink: null, // No automatic meeting link
        calendarName: targetCalendarId
      };

    } catch (error) {
      console.error('❌ Error creating calendar event:', error.message);
      
      // Provide specific error guidance
      if (error.message.includes('notFound')) {
        throw new Error('Calendar not found - check GOOGLE_CALENDAR_ID configuration');
      } else if (error.message.includes('forbidden') || error.message.includes('access_denied')) {
        throw new Error('Calendar access denied - check service account permissions');
      } else if (error.message.includes('invalid_grant')) {
        throw new Error('Invalid credentials - service account key may be expired');
      } else {
        throw new Error(`Calendar integration failed: ${error.message}`);
      }
    }
  }

  // Test the calendar connection with detailed diagnostics
  async testConnection() {
    try {
      console.log('🔍 Testing Google Calendar connection...');
      
      // Test 1: List calendars
      const calendarListResponse = await this.calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];
      
      console.log('📋 Available calendars:');
      calendars.forEach(cal => {
        console.log(`   - ${cal.summary} (${cal.id}) - Access: ${cal.accessRole}`);
      });

      // Test 2: Check target calendar access
      const targetCalendarId = this.calendarId === 'primary' ? 'primary' : this.calendarId;
      
      try {
        const calendarResponse = await this.calendar.calendars.get({
          calendarId: targetCalendarId
        });
        console.log(`✅ Target calendar accessible: ${calendarResponse.data.summary}`);
      } catch (calError) {
        console.log(`⚠️  Target calendar (${targetCalendarId}) not accessible:`, calError.message);
        
        // Suggest using primary calendar
        if (targetCalendarId !== 'primary') {
          console.log('   💡 Suggestion: Try using "primary" as GOOGLE_CALENDAR_ID');
        }
      }

      // Test 3: Try creating a test event (and immediately delete it)
      try {
        const testEvent = {
          summary: 'MEDIBOT Connection Test',
          start: {
            dateTime: new Date().toISOString(),
            timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
          },
          end: {
            dateTime: new Date(Date.now() + 60000).toISOString(), // 1 minute duration
            timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
          },
          description: 'This is a test event created by MEDIBOT to verify calendar integration. It will be deleted immediately.',
        };

        const testResponse = await this.calendar.events.insert({
          calendarId: targetCalendarId,
          resource: testEvent,
        });

        // Immediately delete the test event
        await this.calendar.events.delete({
          calendarId: targetCalendarId,
          eventId: testResponse.data.id,
        });

        console.log('✅ Calendar write access confirmed');
      } catch (writeError) {
        console.log('⚠️  Calendar write access failed:', writeError.message);
        throw writeError;
      }

      return true;
    } catch (error) {
      console.error('❌ Calendar connection test failed:', error.message);
      throw error;
    }
  }

  createEventDescription({ patientName, patientEmail, doctorName, doctorEmail, appointmentType, chiefComplaint, symptoms }) {
    let description = `🏥 MEDIBOT Medical Appointment\n\n`;
    
    description += `👤 Patient: ${patientName}`;
    if (patientEmail) description += ` (${patientEmail})`;
    description += `\n`;
    
    description += `👨‍⚕️ Doctor: ${doctorName}`;
    if (doctorEmail) description += ` (${doctorEmail})`;
    description += `\n`;
    
    description += `📋 Type: ${appointmentType}\n\n`;
    
    if (chiefComplaint) {
      description += `🎯 Chief Complaint: ${chiefComplaint}\n\n`;
    }
    
    if (symptoms && symptoms.length > 0) {
      description += `🔍 Symptoms: ${symptoms.join(', ')}\n\n`;
    }
    
    description += `📱 Booked via: MEDIBOT Platform\n`;
    description += `🕐 Created: ${new Date().toLocaleString()}\n\n`;
    
    description += `📝 Important Notes:\n`;
    description += `• This appointment was automatically created by MEDIBOT\n`;
    description += `• Both patient and doctor have been notified separately\n`;
    description += `• For video consultations, a meeting link will be shared separately\n`;
    description += `• Contact information is provided above for coordination\n`;
    description += `• Please confirm attendance 24 hours before the appointment\n\n`;
    
    description += `🔒 Privacy: This is a confidential medical appointment`;
    
    return description;
  }

  // Generate manual calendar instructions when integration fails
  generateManualCalendarInstructions(appointmentData) {
    const {
      patientName,
      doctorName,
      dateTime,
      duration = 30,
      appointmentType,
      chiefComplaint
    } = appointmentData;

    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    return {
      title: `Medical Appointment: ${patientName} with ${doctorName}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      description: this.createEventDescription(appointmentData),
      location: 'Contact doctor for location details',
      instructions: {
        google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Medical Appointment: ${patientName} with ${doctorName}`)}&dates=${startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(this.createEventDescription(appointmentData))}`,
        outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(`Medical Appointment: ${patientName} with ${doctorName}`)}&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&body=${encodeURIComponent(this.createEventDescription(appointmentData))}`,
        ics: this.generateICSContent(appointmentData)
      }
    };
  }

  generateICSContent(appointmentData) {
    const {
      patientName,
      doctorName,
      dateTime,
      duration = 30
    } = appointmentData;

    const startTime = new Date(dateTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MEDIBOT//Medical Appointment//EN
BEGIN:VEVENT
UID:${Date.now()}@medibot.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:Medical Appointment: ${patientName} with ${doctorName}
DESCRIPTION:${this.createEventDescription(appointmentData).replace(/\n/g, '\\n')}
LOCATION:Contact doctor for location details
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;
  }

  // Graceful error handling wrapper
  async safeCreateEvent(appointmentData) {
    try {
      return await this.createAppointmentEvent(appointmentData);
    } catch (error) {
      console.log('📅 Calendar integration failed, providing manual options');
      return {
        eventId: null,
        eventLink: null,
        meetingLink: null,
        manualInstructions: this.generateManualCalendarInstructions(appointmentData),
        error: error.message
      };
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
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
          ],
        },
        colorId: '2', // Green color for medical appointments
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