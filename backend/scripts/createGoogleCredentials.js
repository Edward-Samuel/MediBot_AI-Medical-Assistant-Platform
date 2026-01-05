const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

async function createCredentials() {
  console.log('🔑 Google Calendar Credentials Setup\n');
  
  console.log('This script will help you create the Google Calendar credentials.');
  console.log('You have two options:\n');
  
  console.log('Option 1: Create credentials file (Recommended for development)');
  console.log('Option 2: Use environment variable (Recommended for production)\n');
  
  const option = await askQuestion('Choose option (1 or 2): ');
  
  if (option === '1') {
    await createCredentialsFile();
  } else if (option === '2') {
    await showEnvironmentVariableInstructions();
  } else {
    console.log('Invalid option. Please run the script again and choose 1 or 2.');
  }
  
  rl.close();
}

async function createCredentialsFile() {
  console.log('\n📋 Creating Google Credentials File\n');
  
  console.log('First, you need to create a Google Cloud service account:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create or select a project');
  console.log('3. Enable the Google Calendar API');
  console.log('4. Go to "APIs & Services" > "Credentials"');
  console.log('5. Click "Create Credentials" > "Service Account"');
  console.log('6. Fill in the details and create the service account');
  console.log('7. Click on the service account, go to "Keys" tab');
  console.log('8. Click "Add Key" > "Create New Key" > "JSON"');
  console.log('9. Download the JSON file\n');
  
  const hasFile = await askQuestion('Do you have the JSON file downloaded? (y/n): ');
  
  if (hasFile.toLowerCase() === 'y') {
    const filePath = await askQuestion('Enter the full path to your downloaded JSON file: ');
    
    try {
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        console.log('❌ File not found at the specified path.');
        return;
      }
      
      // Read and validate the JSON file
      const credentialsContent = fs.readFileSync(filePath, 'utf8');
      const credentials = JSON.parse(credentialsContent);
      
      // Validate required fields
      if (!credentials.type || !credentials.project_id || !credentials.client_email) {
        console.log('❌ Invalid credentials file. Make sure it\'s a service account JSON file.');
        return;
      }
      
      // Create config directory if it doesn't exist
      const configDir = path.join(__dirname, '../config');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Copy the file to the correct location
      const targetPath = path.join(configDir, 'google-credentials.json');
      fs.copyFileSync(filePath, targetPath);
      
      console.log('✅ Credentials file created successfully!');
      console.log(`📁 Saved to: ${targetPath}`);
      console.log(`📧 Service account email: ${credentials.client_email}`);
      console.log('\n📅 Next steps:');
      console.log('1. Share your Google Calendar with this service account email');
      console.log('2. Give it "Make changes to events" permission');
      console.log('3. Run: node scripts/quickCalendarTest.js');
      
    } catch (error) {
      console.log('❌ Error processing the credentials file:', error.message);
    }
  } else {
    console.log('\n📝 Please follow these steps to get your credentials:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Follow the instructions above to create and download the JSON file');
    console.log('3. Run this script again when you have the file');
  }
}

async function showEnvironmentVariableInstructions() {
  console.log('\n🌍 Environment Variable Setup\n');
  
  console.log('To use environment variables instead of a file:');
  console.log('1. Create your service account JSON file as described above');
  console.log('2. Copy the entire contents of the JSON file');
  console.log('3. Add this line to your .env file:');
  console.log('   GOOGLE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\'');
  console.log('4. Make sure to escape any quotes in the JSON');
  console.log('\nThis method is more secure for production deployments.');
}

// Create .gitignore entry for credentials
function updateGitignore() {
  const gitignorePath = path.join(__dirname, '../../.gitignore');
  const credentialsEntry = 'backend/config/google-credentials.json';
  
  try {
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    if (!gitignoreContent.includes(credentialsEntry)) {
      gitignoreContent += `\n# Google Calendar Credentials\n${credentialsEntry}\n`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('✅ Added credentials file to .gitignore');
    }
  } catch (error) {
    console.log('⚠️  Could not update .gitignore:', error.message);
  }
}

console.log('Starting Google Calendar credentials setup...\n');
createCredentials().then(() => {
  updateGitignore();
  console.log('\n🎉 Setup complete!');
}).catch(console.error);