const fs = require('fs');
const path = require('path');
const googleCalendar = require('../services/googleCalendar');
require('dotenv').config();

async function setupStep3() {
  console.log('🚀 Google Calendar Setup - Step 3: Share Calendar & Test\n');

  // Check if credentials exist
  const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ Credentials file not found. Please run Step 2 first:');
    console.log('   node scripts/setupCredentialsStep2.js');
    return;
  }

  // Get service account email
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const serviceAccountEmail = credentials.client_email;

    console.log('📧 Your service account email:');
    console.log(`   ${serviceAccountEmail}\n`);

    console.log('📅 Share your Google Calendar:');
    console.log('1. Open Google Calendar: https://calendar.google.com/');
    console.log('2. Find your calendar in the left sidebar');
    console.log('3. Click the three dots (⋮) next to your calendar name');
    console.log('4. Select "Settings and sharing"');
    console.log('5. Scroll to "Share with specific people"');
    console.log('6. Click "Add people"');
    console.log(`7. Enter: ${serviceAccountEmail}`);
    console.log('8. Set permission to "Make changes to events"');
    console.log('9. Click "Send"\n');

    console.log('🧪 Testing connection...\n');

    // Test the connection
    const connected = await googleCalendar.testConnection();

    if (connected) {
      console.log('🎉 SUCCESS! Google Calendar integration is working!\n');
      
      console.log('✅ What works now:');
      console.log('   - Appointments automatically create calendar events');
      console.log('   - Email invitations sent to patients and doctors');
      console.log('   - Google Meet links generated for virtual consultations');
      console.log('   - Automatic reminders set up');
      console.log('   - Real-time calendar synchronization\n');

      console.log('🚀 Try booking an appointment:');
      console.log('   1. Go to your website');
      console.log('   2. Use the AI chat to book an appointment');
      console.log('   3. Check your Google Calendar - the event should appear!');
      console.log('   4. Visit /calendar to see the embedded calendar\n');

      console.log('📊 Calendar Configuration:');
      console.log(`   Calendar ID: ${process.env.GOOGLE_CALENDAR_ID}`);
      console.log(`   Timezone: ${process.env.TIMEZONE || 'Asia/Kolkata'}`);
      console.log(`   Service Account: ${serviceAccountEmail}`);

    } else {
      console.log('⚠️  Connection test failed\n');
      
      console.log('🔧 Troubleshooting:');
      console.log('1. Make sure you shared the calendar with the service account');
      console.log('2. Check that you gave "Make changes to events" permission');
      console.log('3. Wait a few minutes for permissions to propagate');
      console.log('4. Try running this test again\n');

      console.log('💡 Double-check:');
      console.log(`   - Calendar shared with: ${serviceAccountEmail}`);
      console.log(`   - Permission level: Make changes to events`);
      console.log(`   - Calendar ID in .env: ${process.env.GOOGLE_CALENDAR_ID}`);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n🔧 This might help:');
    console.log('1. Make sure the credentials file is valid JSON');
    console.log('2. Re-download the service account key if needed');
    console.log('3. Check that Google Calendar API is enabled');
  }
}

setupStep3();