const googleCalendar = require('../services/googleCalendar');
require('dotenv').config();

async function testGoogleCalendar() {
  console.log('🧪 Testing Google Calendar Integration...\n');

  try {
    // Test 1: Initialize and test connection
    console.log('1. Testing calendar connection...');
    const connected = await googleCalendar.testConnection();
    
    if (!connected) {
      console.log('❌ Calendar connection failed');
      console.log('   Make sure you have:');
      console.log('   - Created google-credentials.json in backend/config/');
      console.log('   - Enabled Google Calendar API');
      console.log('   - Shared calendar with service account');
      return;
    }
    
    console.log('✅ Calendar connection successful\n');

    // Test 2: Create a test appointment
    console.log('2. Creating test appointment...');
    const testAppointment = {
      patientName: 'John Doe',
      patientEmail: 'john.doe@example.com',
      doctorName: 'Dr. Sarah Johnson',
      doctorEmail: 'sarah.johnson@medibot.com',
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 30,
      appointmentType: 'consultation',
      chiefComplaint: 'Regular checkup',
      symptoms: ['fatigue', 'headache']
    };

    const eventResult = await googleCalendar.createAppointmentEvent(testAppointment);
    console.log('✅ Test appointment created:');
    console.log(`   Event ID: ${eventResult.eventId}`);
    console.log(`   Event Link: ${eventResult.eventLink}`);
    if (eventResult.meetingLink) {
      console.log(`   Meeting Link: ${eventResult.meetingLink}`);
    }
    console.log('');

    // Test 3: Update the appointment
    console.log('3. Updating test appointment...');
    const updatedAppointment = {
      ...testAppointment,
      chiefComplaint: 'Updated: Regular checkup with additional concerns'
    };

    await googleCalendar.updateAppointmentEvent(eventResult.eventId, updatedAppointment);
    console.log('✅ Test appointment updated\n');

    // Test 4: Check availability (optional)
    console.log('4. Testing availability check...');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
    
    const availableSlots = await googleCalendar.getAvailableSlots(
      'sarah.johnson@medibot.com',
      tomorrow,
      dayAfter
    );
    
    console.log(`✅ Found ${availableSlots.length} available slots\n`);

    // Test 5: Cancel the test appointment
    console.log('5. Cancelling test appointment...');
    await googleCalendar.cancelAppointmentEvent(eventResult.eventId);
    console.log('✅ Test appointment cancelled\n');

    console.log('🎉 All tests passed! Google Calendar integration is working correctly.');
    console.log('');
    console.log('📋 Configuration Summary:');
    console.log(`   Calendar ID: ${process.env.GOOGLE_CALENDAR_ID || 'Not set'}`);
    console.log(`   Timezone: ${process.env.TIMEZONE || 'Not set (using default)'}`);
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check your google-credentials.json file');
    console.log('   2. Verify the service account has calendar access');
    console.log('   3. Ensure Google Calendar API is enabled');
    console.log('   4. Check the calendar ID in your .env file');
    console.log('   5. Make sure the calendar is shared with the service account');
  }
}

testGoogleCalendar();