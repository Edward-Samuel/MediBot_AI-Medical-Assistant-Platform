const googleCalendar = require('./services/googleCalendar');

async function checkCalendarAccess() {
  console.log('🔍 Checking Google Calendar Access...\n');

  try {
    // Test connection and list available calendars
    console.log('1. Testing calendar connection...');
    const connectionResult = await googleCalendar.testConnection();
    
    if (!connectionResult) {
      console.log('❌ Calendar connection failed');
      return;
    }

    console.log('✅ Calendar connection successful\n');

    // Try to access the calendar directly
    console.log('2. Checking current calendar ID from environment...');
    console.log(`   GOOGLE_CALENDAR_ID: ${process.env.GOOGLE_CALENDAR_ID || 'not set'}`);
    
    // Test creating an event with current settings
    console.log('\n3. Testing event creation with current settings...');
    const testAppointment = {
      patientName: 'Test Patient',
      patientEmail: 'test@example.com',
      doctorName: 'Dr. Test',
      doctorEmail: 'doctor@example.com',
      dateTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      duration: 30,
      appointmentType: 'test',
      chiefComplaint: 'Testing calendar access',
      symptoms: []
    };

    try {
      const eventResult = await googleCalendar.createAppointmentEvent(testAppointment);
      console.log('✅ Event creation successful with current settings');
      console.log(`   Event ID: ${eventResult.eventId}`);
      
      // Clean up
      await googleCalendar.cancelAppointmentEvent(eventResult.eventId);
      console.log('✅ Test event cleaned up');
      
    } catch (eventError) {
      console.log('❌ Event creation failed with current settings');
      console.log(`   Error: ${eventError.message}`);
      
      // Try with 'primary' calendar explicitly
      console.log('\n4. Trying with "primary" calendar explicitly...');
      
      // Temporarily override the calendar ID
      const originalCalendarId = googleCalendar.calendarId;
      googleCalendar.calendarId = 'primary';
      
      try {
        const primaryEventResult = await googleCalendar.createAppointmentEvent(testAppointment);
        console.log('✅ Event creation successful with "primary" calendar');
        console.log(`   Event ID: ${primaryEventResult.eventId}`);
        
        // Clean up
        await googleCalendar.cancelAppointmentEvent(primaryEventResult.eventId);
        console.log('✅ Test event cleaned up');
        
        console.log('\n💡 Solution: Update GOOGLE_CALENDAR_ID to "primary" in .env file');
        
      } catch (primaryError) {
        console.log('❌ Event creation also failed with "primary" calendar');
        console.log(`   Error: ${primaryError.message}`);
      } finally {
        // Restore original calendar ID
        googleCalendar.calendarId = originalCalendarId;
      }
    }

  } catch (error) {
    console.error('❌ Calendar access check failed:', error.message);
  }
}

checkCalendarAccess();