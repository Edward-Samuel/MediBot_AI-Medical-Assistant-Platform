console.log('🚀 Google Calendar Setup - Step 1: Create Service Account\n');

console.log('Follow these exact steps:\n');

console.log('1. 🌐 Open Google Cloud Console:');
console.log('   https://console.cloud.google.com/\n');

console.log('2. 📋 Create or Select Project:');
console.log('   - Click the project dropdown at the top');
console.log('   - Create a new project or select an existing one');
console.log('   - Note your project name for later\n');

console.log('3. 🔌 Enable Google Calendar API:');
console.log('   - Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com');
console.log('   - Click "ENABLE" button');
console.log('   - Wait for it to be enabled\n');

console.log('4. 🔑 Create Service Account:');
console.log('   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts');
console.log('   - Click "CREATE SERVICE ACCOUNT"');
console.log('   - Service account name: medibot-calendar');
console.log('   - Service account ID: medibot-calendar (auto-filled)');
console.log('   - Description: MEDIBOT Calendar Integration');
console.log('   - Click "CREATE AND CONTINUE"\n');

console.log('5. ⏭️ Skip Optional Steps:');
console.log('   - Click "CONTINUE" (skip role assignment)');
console.log('   - Click "DONE" (skip user access)\n');

console.log('6. 📥 Download Credentials:');
console.log('   - Click on the service account you just created');
console.log('   - Go to the "KEYS" tab');
console.log('   - Click "ADD KEY" > "Create new key"');
console.log('   - Select "JSON" format');
console.log('   - Click "CREATE"');
console.log('   - The file will download automatically\n');

console.log('7. 📧 Note the Service Account Email:');
console.log('   - In the downloaded JSON file, find "client_email"');
console.log('   - It looks like: medibot-calendar@your-project.iam.gserviceaccount.com');
console.log('   - Copy this email - you\'ll need it for calendar sharing\n');

console.log('✅ After completing these steps, run:');
console.log('   node scripts/setupCredentialsStep2.js\n');

console.log('💡 Need help? The downloaded JSON file should look like this:');
console.log('{');
console.log('  "type": "service_account",');
console.log('  "project_id": "your-project-id",');
console.log('  "private_key_id": "...",');
console.log('  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",');
console.log('  "client_email": "medibot-calendar@your-project.iam.gserviceaccount.com",');
console.log('  "client_id": "...",');
console.log('  "auth_uri": "https://accounts.google.com/o/oauth2/auth",');
console.log('  "token_uri": "https://oauth2.googleapis.com/token",');
console.log('  ...');
console.log('}');