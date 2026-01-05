const fs = require('fs');
const path = require('path');
require('dotenv').config();

function checkCredentials() {
  console.log('🔍 Checking Google Calendar Credentials\n');

  // Check environment variable
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.log('📋 Found GOOGLE_SERVICE_ACCOUNT_KEY in environment');
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      console.log('✅ Environment variable is valid JSON');
      
      // Check required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
      const missingFields = requiredFields.filter(field => !credentials[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
        console.log(`📧 Service account email: ${credentials.client_email}`);
        console.log(`🏗️  Project ID: ${credentials.project_id}`);
      } else {
        console.log('❌ Missing required fields:', missingFields.join(', '));
      }
    } catch (error) {
      console.log('❌ Environment variable contains invalid JSON:', error.message);
    }
  } else {
    console.log('⚠️  No GOOGLE_SERVICE_ACCOUNT_KEY found in environment');
  }

  // Check JSON file
  const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
  if (fs.existsSync(credentialsPath)) {
    console.log('\n📁 Found google-credentials.json file');
    try {
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsContent);
      console.log('✅ JSON file is valid');
      
      // Check required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
      const missingFields = requiredFields.filter(field => !credentials[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
        console.log(`📧 Service account email: ${credentials.client_email}`);
        console.log(`🏗️  Project ID: ${credentials.project_id}`);
      } else {
        console.log('❌ Missing required fields:', missingFields.join(', '));
      }
    } catch (error) {
      console.log('❌ JSON file is invalid:', error.message);
    }
  } else {
    console.log('\n⚠️  No google-credentials.json file found');
  }

  // Check calendar configuration
  console.log('\n📅 Calendar Configuration:');
  console.log(`Calendar ID: ${process.env.GOOGLE_CALENDAR_ID || 'Not set'}`);
  console.log(`Timezone: ${process.env.TIMEZONE || 'Not set'}`);

  // Provide recommendations
  console.log('\n💡 Recommendations:');
  
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !fs.existsSync(credentialsPath)) {
    console.log('1. You need to create Google Cloud service account credentials');
    console.log('2. Run: node scripts/createGoogleCredentials.js');
    console.log('3. Follow the interactive setup process');
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || fs.existsSync(credentialsPath)) {
    console.log('1. Your credentials seem to have issues');
    console.log('2. Make sure you downloaded the complete service account JSON file');
    console.log('3. The file should contain private_key and client_email fields');
    console.log('4. Re-download the credentials from Google Cloud Console if needed');
  }

  console.log('\n🔗 Quick links:');
  console.log('- Google Cloud Console: https://console.cloud.google.com/');
  console.log('- Enable Calendar API: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com');
  console.log('- Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts');
}

checkCredentials();