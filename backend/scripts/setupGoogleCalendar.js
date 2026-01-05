const fs = require('fs');
const path = require('path');

console.log('🗓️  Google Calendar Integration Setup\n');

console.log('To integrate Google Calendar with your appointment system, you need to:');
console.log('');

console.log('1. 📋 Create a Google Cloud Project:');
console.log('   - Go to https://console.cloud.google.com/');
console.log('   - Create a new project or select an existing one');
console.log('   - Enable the Google Calendar API');
console.log('');

console.log('2. 🔑 Create Service Account Credentials:');
console.log('   - Go to "APIs & Services" > "Credentials"');
console.log('   - Click "Create Credentials" > "Service Account"');
console.log('   - Fill in the service account details');
console.log('   - Click "Create and Continue"');
console.log('   - Skip the optional steps and click "Done"');
console.log('');

console.log('3. 📥 Download the Service Account Key:');
console.log('   - Click on the created service account');
console.log('   - Go to the "Keys" tab');
console.log('   - Click "Add Key" > "Create New Key"');
console.log('   - Choose "JSON" format and download');
console.log('   - Save the file as "google-credentials.json" in backend/config/');
console.log('');

console.log('4. 📅 Share Your Calendar:');
console.log('   - Open Google Calendar');
console.log('   - Go to your calendar settings');
console.log('   - Share the calendar with the service account email');
console.log('   - Give "Make changes to events" permission');
console.log('');

console.log('5. ⚙️  Update Environment Variables:');
console.log('   Add these to your .env file:');
console.log('');
console.log('   # Google Calendar Configuration');
console.log('   GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com');
console.log('   TIMEZONE=America/New_York');
console.log('   # Optional: Instead of JSON file, you can use:');
console.log('   # GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}');
console.log('');

console.log('6. 🎯 Your Calendar ID:');
console.log('   Based on your URL, your calendar ID appears to be:');
console.log('   1445a0f9ed5396251532f518007222689003bb47ef8f13fa380a8c41dfe7c531@group.calendar.google.com');
console.log('');

// Create config directory if it doesn't exist
const configDir = path.join(__dirname, '../config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('✅ Created config directory: backend/config/');
}

// Create a sample credentials file
const sampleCredentials = {
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
};

const samplePath = path.join(configDir, 'google-credentials.sample.json');
fs.writeFileSync(samplePath, JSON.stringify(sampleCredentials, null, 2));
console.log('✅ Created sample credentials file: backend/config/google-credentials.sample.json');
console.log('   Replace this with your actual credentials file');
console.log('');

console.log('7. 🧪 Test the Integration:');
console.log('   Run: node scripts/testGoogleCalendar.js');
console.log('');

console.log('📝 Notes:');
console.log('   - The service account email needs calendar access');
console.log('   - Make sure the Calendar API is enabled in Google Cloud Console');
console.log('   - The calendar ID should match your specific calendar');
console.log('   - Test the connection before using in production');
console.log('');

console.log('🎉 Setup complete! Follow the steps above to enable Google Calendar integration.');