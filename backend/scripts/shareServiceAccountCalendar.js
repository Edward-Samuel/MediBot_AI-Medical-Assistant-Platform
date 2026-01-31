const { google } = require('googleapis');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function shareServiceAccountCalendar() {
  console.log('🔧 Sharing Service Account Calendar with Your Account\n');
  
  try {
    // Initialize Google Auth
    const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const serviceAccountCalendarId = process.env.GOOGLE_CALENDAR_ID;
    
    console.log('Service Account Calendar ID:', serviceAccountCalendarId);
    
    // Get your email address
    const yourEmail = await askQuestion('Enter your Google email address (the one you use for Google Calendar): ');
    
    if (!yourEmail || !yourEmail.includes('@')) {
      console.log('❌ Invalid email address');
      rl.close();
      return;
    }
    
    console.log('\n🔄 Adding you to the service account calendar...');
    
    // Add ACL rule to share calendar with your email
    const aclRule = {
      role: 'reader', // You can view events but not modify them
      scope: {
        type: 'user',
        value: yourEmail
      }
    };
    
    try {
      const aclResponse = await calendar.acl.insert({
        calendarId: serviceAccountCalendarId,
        resource: aclRule
      });
      
      console.log('✅ Calendar shared successfully!');
      console.log('📧 Shared with:', yourEmail);
      console.log('🔑 Permission level: Reader (view only)');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Go to Google Calendar (calendar.google.com)');
      console.log('2. Look for "Other calendars" in the left sidebar');
      console.log('3. You should see the MEDIBOT calendar there');
      console.log('4. If not visible, try refreshing the page');
      
      console.log('\n🔗 Or add it manually:');
      console.log('1. In Google Calendar, click the "+" next to "Other calendars"');
      console.log('2. Select "Subscribe to calendar"');
      console.log('3. Enter this calendar ID:', serviceAccountCalendarId);
      
    } catch (aclError) {
      if (aclError.message.includes('duplicate')) {
        console.log('✅ Calendar is already shared with your account!');
        console.log('📧 Shared with:', yourEmail);
      } else {
        console.log('❌ Failed to share calendar:', aclError.message);
        
        // Provide manual instructions
        console.log('\n🔧 Manual Solution:');
        console.log('Since automatic sharing failed, you can add the calendar manually:');
        console.log('1. Go to Google Calendar (calendar.google.com)');
        console.log('2. Click the "+" next to "Other calendars"');
        console.log('3. Select "Subscribe to calendar"');
        console.log('4. Enter this calendar ID:', serviceAccountCalendarId);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  rl.close();
}

shareServiceAccountCalendar().catch(console.error);