const googleCalendar = require('../services/googleCalendar');
require('dotenv').config();

async function quickTest() {
  console.log('🧪 Quick Google Calendar Test\n');
  
  console.log('Configuration:');
  console.log(`Calendar ID: ${process.env.GOOGLE_CALENDAR_ID}`);
  console.log(`Timezone: ${process.env.TIMEZONE || 'Asia/Kolkata'}`);
  console.log('');

  try {
    // Test connection
    console.log('Testing connection...');
    const connected = await googleCalendar.testConnection();
    
    if (connected) {
      console.log('✅ Calendar connection successful!');
      console.log('');
      console.log('Your calendar is ready to receive appointment bookings.');
      console.log('When users book appointments through the chat, they will automatically appear in your Google Calendar.');
    } else {
      console.log('⚠️  Calendar connection not available');
      console.log('');
      console.log('📋 Setup required:');
      console.log('1. Run: node scripts/createGoogleCredentials.js');
      console.log('2. Follow the interactive setup process');
      console.log('3. Share your calendar with the service account');
      console.log('4. Run this test again');
      console.log('');
      console.log('💡 Note: Appointments will still work without calendar integration!');
      console.log('   Users can book appointments normally, they just won\'t appear in Google Calendar.');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 To fix this:');
    console.log('1. Run: node scripts/createGoogleCredentials.js');
    console.log('2. Follow the setup guide in GOOGLE_CALENDAR_SETUP.md');
  }
}

quickTest();