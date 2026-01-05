console.log('🔧 Fix Google Calendar Credentials\n');

console.log('❌ Problem Identified:');
console.log('   You have OAuth2 client credentials, but we need Service Account credentials.\n');

console.log('🔄 The difference:');
console.log('   - OAuth2 credentials: For user login/authentication');
console.log('   - Service Account: For server-to-server API access (what we need)\n');

console.log('✅ Solution - Create Service Account Credentials:\n');

console.log('1. 🌐 Go to Google Cloud Console:');
console.log('   https://console.cloud.google.com/iam-admin/serviceaccounts\n');

console.log('2. 🏗️  Select your project: stately-rock-470216-i4\n');

console.log('3. 🔑 Create Service Account:');
console.log('   - Click "CREATE SERVICE ACCOUNT"');
console.log('   - Name: medibot-calendar');
console.log('   - Description: MEDIBOT Calendar Integration');
console.log('   - Click "CREATE AND CONTINUE"');
console.log('   - Skip roles (click "CONTINUE")');
console.log('   - Click "DONE"\n');

console.log('4. 📥 Download Service Account Key:');
console.log('   - Click on the service account you just created');
console.log('   - Go to "KEYS" tab');
console.log('   - Click "ADD KEY" > "Create new key"');
console.log('   - Select "JSON" format');
console.log('   - Click "CREATE"');
console.log('   - Save the downloaded file\n');

console.log('5. 🔄 Replace the current file:');
console.log('   - The new file should contain "type": "service_account"');
console.log('   - Replace the current google-credentials.json with the new one\n');

console.log('💡 The correct file should look like:');
console.log('{');
console.log('  "type": "service_account",');
console.log('  "project_id": "stately-rock-470216-i4",');
console.log('  "private_key_id": "...",');
console.log('  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",');
console.log('  "client_email": "medibot-calendar@stately-rock-470216-i4.iam.gserviceaccount.com",');
console.log('  "client_id": "...",');
console.log('  "auth_uri": "https://accounts.google.com/o/oauth2/auth",');
console.log('  "token_uri": "https://oauth2.googleapis.com/token"');
console.log('}\n');

console.log('🧪 After replacing the file, test with:');
console.log('   node scripts/checkCredentials.js\n');

console.log('📋 Quick checklist:');
console.log('   ✅ Google Calendar API enabled');
console.log('   ❌ Service Account created (need to do this)');
console.log('   ❌ Service Account key downloaded (need to do this)');
console.log('   ❌ Calendar shared with service account (need to do this)');

console.log('\n🚀 Direct link to create service account:');
console.log('   https://console.cloud.google.com/iam-admin/serviceaccounts?project=stately-rock-470216-i4');