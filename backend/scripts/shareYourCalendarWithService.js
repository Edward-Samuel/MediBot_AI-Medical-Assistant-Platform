const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function shareYourCalendarWithService() {
  console.log('🔧 Setting up Your Calendar with Service Account\n');
  
  // Get service account email
  const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
  
  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ google-credentials.json file not found');
    return;
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const serviceAccountEmail = credentials.client_email;
    const targetCalendarId = process.env.GOOGLE_CALENDAR_ID;
    
    console.log('Target Calendar ID:', targetCalendarId);
    console.log('📧 Service Account Email:', serviceAccountEmail);
    
    console.log('\n📋 Steps to Share Your Calendar:');
    console.log('1. Go to Google Calendar (calendar.google.com)');
    console.log('2. Find your calendar in the left sidebar');
    console.log('3. Click the three dots next to the calendar name');
    console.log('4. Select "Settings and sharing"');
    console.log('5. Scroll to "Share with specific people"');
    console.log('6. Click "Add people"');
    console.log('7. Add this email:', serviceAccountEmail);
    console.log('8. Set permission to "Make changes to events"');
    console.log('9. Click "Send"');
    
    console.log('\n⏰ Wait 2-3 minutes for changes to propagate');
    console.log('🧪 Then test with: node testActualIntegration.js');
    
  } catch (error) {
    console.error('❌ Error reading credentials:', error.message);
  }
}

shareYourCalendarWithService();