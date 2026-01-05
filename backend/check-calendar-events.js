const googleCalendar = require('./services/googleCalendar');

async function checkCalendarEvents() {
  console.log('📅 Checking calendar events...\n');

  try {
    // Initialize the calendar service
    await googleCalendar.initialize();
    
    const calendar = googleCalendar.calendar;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    console.log(`🔍 Checking calendar: ${calendarId}`);

    // Get events from the past week to next week
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 7);
    
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;

    if (!events || events.length === 0) {
      console.log('❌ No events found in this calendar');
      console.log('\n💡 Possible reasons:');
      console.log('1. Events are in a different calendar');
      console.log('2. Calendar ID is incorrect');
      console.log('3. Service account lacks access to this calendar');
      return;
    }

    console.log(`✅ Found ${events.length} events:\n`);

    events.forEach((event, index) => {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      
      console.log(`${index + 1}. ${event.summary}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Start: ${start}`);
      console.log(`   End: ${end}`);
      
      if (event.description) {
        console.log(`   Description: ${event.description.substring(0, 100)}...`);
      }
      
      if (event.htmlLink) {
        console.log(`   Link: ${event.htmlLink}`);
      }
      
      console.log('');
    });

    console.log('🔗 Calendar URL:');
    console.log(`   https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`);

  } catch (error) {
    console.error('❌ Error checking calendar events:', error.message);
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      console.log('\n💡 Calendar not found. Check your GOOGLE_CALENDAR_ID in .env file');
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      console.log('\n💡 Access denied. Share the calendar with the service account:');
      console.log('   medibot-calendar@stately-rock-470216-i4.iam.gserviceaccount.com');
    }
  }
}

checkCalendarEvents();