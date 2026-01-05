const googleCalendar = require('./services/googleCalendar');

async function getCalendarId() {
  console.log('🔍 Finding available calendars...\n');

  try {
    // Initialize the calendar service
    await googleCalendar.initialize();
    
    // Get the calendar client directly
    const calendar = googleCalendar.calendar;
    
    if (!calendar) {
      console.log('❌ Calendar service not initialized');
      return;
    }

    // List all calendars the service account has access to
    console.log('📅 Available calendars:');
    const response = await calendar.calendarList.list();
    
    if (!response.data.items || response.data.items.length === 0) {
      console.log('❌ No calendars found');
      console.log('\n💡 Solutions:');
      console.log('1. Share your personal calendar with the service account:');
      console.log('   medibot-calendar@stately-rock-470216-i4.iam.gserviceaccount.com');
      console.log('2. Or create a new calendar and share it with the service account');
      return;
    }

    response.data.items.forEach((cal, index) => {
      console.log(`\n${index + 1}. ${cal.summary}`);
      console.log(`   ID: ${cal.id}`);
      console.log(`   Access: ${cal.accessRole}`);
      console.log(`   Primary: ${cal.primary || false}`);
      console.log(`   Selected: ${cal.selected || false}`);
      
      if (cal.description) {
        console.log(`   Description: ${cal.description}`);
      }
    });

    console.log('\n📋 To use a specific calendar:');
    console.log('1. Copy the calendar ID you want to use');
    console.log('2. Update GOOGLE_CALENDAR_ID in your .env file');
    console.log('3. Restart the server');

    console.log('\n🔧 Current configuration:');
    console.log(`   GOOGLE_CALENDAR_ID: ${process.env.GOOGLE_CALENDAR_ID || 'not set'}`);

  } catch (error) {
    console.error('❌ Error listing calendars:', error.message);
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      console.log('\n💡 This means the service account needs calendar access.');
      console.log('   Share your calendar with: medibot-calendar@stately-rock-470216-i4.iam.gserviceaccount.com');
    }
  }
}

getCalendarId();