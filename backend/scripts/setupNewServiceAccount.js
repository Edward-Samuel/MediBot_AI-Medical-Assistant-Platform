const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setupNewServiceAccount() {
  console.log('🔧 MEDIBOT New Service Account Setup\n');

  // Step 1: Check if credentials file exists
  const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
  
  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ google-credentials.json file not found');
    console.log('📁 Please place your downloaded JSON key file at:');
    console.log('   backend/config/google-credentials.json');
    console.log('\n📋 To get the JSON key file:');
    console.log('1. Go to Google Cloud Console');
    console.log('2. Navigate to APIs & Services > Credentials');
    console.log('3. Click on your service account');
    console.log('4. Go to Keys tab');
    console.log('5. Click "Add Key" > "Create new key"');
    console.log('6. Select JSON format and download');
    return;
  }

  // Step 2: Read and validate credentials
  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('✅ Credentials file found and valid');
    console.log('📧 Service Account Email:', credentials.client_email);
    console.log('🏗️  Project ID:', credentials.project_id);
  } catch (error) {
    console.log('❌ Invalid credentials file:', error.message);
    return;
  }

  // Step 3: Test Google Calendar API access
  try {
    console.log('\n🔍 Testing Google Calendar API access...');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    // List accessible calendars
    const calendarListResponse = await calendar.calendarList.list();
    const calendars = calendarListResponse.data.items || [];
    
    console.log('✅ Google Calendar API access successful');
    console.log('📋 Accessible calendars:');
    
    if (calendars.length === 0) {
      console.log('   (No calendars accessible yet)');
    } else {
      calendars.forEach(cal => {
        console.log(`   - ${cal.summary} (${cal.id})`);
      });
    }

  } catch (error) {
    console.log('❌ Google Calendar API access failed:', error.message);
    return;
  }

  // Step 4: Check target calendar access
  const targetCalendarId = process.env.GOOGLE_CALENDAR_ID;
  console.log('\n🎯 Target Calendar ID:', targetCalendarId);
  
  if (!targetCalendarId) {
    console.log('❌ GOOGLE_CALENDAR_ID not set in .env file');
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    // Check if target calendar is accessible
    const calendarListResponse = await calendar.calendarList.list();
    const calendars = calendarListResponse.data.items || [];
    const targetCalendar = calendars.find(cal => cal.id === targetCalendarId);

    if (targetCalendar) {
      console.log('✅ Target calendar is accessible!');
      console.log(`   Name: ${targetCalendar.summary}`);
      console.log(`   Access Level: ${targetCalendar.accessRole}`);
      
      // Test event creation
      console.log('\n🧪 Testing event creation...');
      
      const testEvent = {
        summary: 'MEDIBOT Setup Test',
        start: {
          dateTime: new Date().toISOString(),
          timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        end: {
          dateTime: new Date(Date.now() + 60000).toISOString(),
          timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        description: 'Test event created during MEDIBOT setup - will be deleted',
      };

      const createResponse = await calendar.events.insert({
        calendarId: targetCalendarId,
        resource: testEvent,
      });

      console.log('✅ Test event created successfully!');
      
      // Delete the test event
      await calendar.events.delete({
        calendarId: targetCalendarId,
        eventId: createResponse.data.id,
      });
      
      console.log('✅ Test event deleted successfully!');
      console.log('\n🎉 Setup Complete! Calendar integration is working perfectly!');
      
    } else {
      console.log('❌ Target calendar is NOT accessible');
      console.log('\n🔧 SOLUTION: Share the calendar with your service account');
      console.log('📧 Service account email:', credentials.client_email);
      console.log('\n📋 Steps to share the calendar:');
      console.log('1. Go to Google Calendar (calendar.google.com)');
      console.log('2. Find your calendar in the left sidebar');
      console.log('3. Click the three dots next to the calendar name');
      console.log('4. Select "Settings and sharing"');
      console.log('5. Scroll to "Share with specific people"');
      console.log('6. Click "Add people"');
      console.log('7. Add:', credentials.client_email);
      console.log('8. Set permission to "Make changes to events"');
      console.log('9. Click "Send"');
      console.log('10. Run this script again to test');
    }

  } catch (error) {
    console.log('❌ Target calendar test failed:', error.message);
  }
}

setupNewServiceAccount().catch(console.error);