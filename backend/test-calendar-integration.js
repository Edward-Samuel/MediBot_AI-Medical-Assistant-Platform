const googleCalendar = require('./services/googleCalendar');

async function testCalendarIntegration() {
  console.log('🧪 Testing Calendar Integration with Appointment Data...\n');

  try {
    // Test appointment data similar to what would come from the booking system
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

    console.log('1. Creating appointment calendar event...');
    const eventResult = await googleCalendar.createAppointmentEvent(testAppointment);
    
    console.log('✅ Calendar event created successfully:');
    console.log(`   Event ID: ${eventResult.eventId}`);
    console.log(`   Event Link: ${eventResult.eventLink}`);
    console.log(`   Meeting Link: ${eventResult.meetingLink || 'None (manual setup required)'}`);

    console.log('\n2. Testing event update...');
    const updatedAppointment = {
      ...testAppointment,
      chiefComplaint: 'Follow-up consultation',
      symptoms: ['improved fatigue', 'mild headache']
    };

    const updateResult = await googleCalendar.updateAppointmentEvent(eventResult.eventId, updatedAppointment);
    console.log('✅ Calendar event updated successfully');

    console.log('\n3. Cleaning up - cancelling test event...');
    await googleCalendar.cancelAppointmentEvent(eventResult.eventId);
    console.log('✅ Test event cancelled');

    console.log('\n🎉 Calendar integration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Event creation works');
    console.log('   ✅ Event updates work');
    console.log('   ✅ Event cancellation works');
    console.log('   ⚠️  Email invitations disabled (requires domain-wide delegation)');
    console.log('   ⚠️  Meeting links disabled (requires additional permissions)');
    console.log('   ✅ Event details include contact information for manual coordination');

  } catch (error) {
    console.error('❌ Calendar integration test failed:', error.message);
    console.log('\n🔧 This means the calendar integration in appointment booking will also fail');
    console.log('   But appointments will still be created in the database');
  }
}

testCalendarIntegration();