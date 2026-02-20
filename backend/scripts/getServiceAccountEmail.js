const path = require('path');
const fs = require('fs');

function getServiceAccountEmail() {
  try {
    const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.log('❌ google-credentials.json file not found');
      console.log('📁 Expected location: backend/config/google-credentials.json');
      return;
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    console.log('Service Account Details:');
    console.log('   Email:', credentials.client_email);
    console.log('   Project ID:', credentials.project_id);
    console.log('   Private Key ID:', credentials.private_key_id);
    
    console.log('\nNext Steps:');
    console.log('1. Copy this email:', credentials.client_email);
    console.log('2. Go to Google Calendar (calendar.google.com)');
    console.log('3. Find your target calendar');
    console.log('4. Share it with the service account email above');
    console.log('5. Give "Make changes to events" permission');
    console.log('6. Run: node testTargetCalendar.js');
    
    return credentials.client_email;
    
  } catch (error) {
    console.error('❌ Error reading credentials:', error.message);
    
    if (error.message.includes('Unexpected token')) {
      console.log('🔧 The JSON file might be corrupted. Please re-download it.');
    }
  }
}

getServiceAccountEmail();