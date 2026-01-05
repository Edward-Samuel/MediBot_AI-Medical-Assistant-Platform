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

async function setupStep2() {
  console.log('🚀 Google Calendar Setup - Step 2: Install Credentials\n');

  console.log('Now we need to install the credentials file you downloaded.\n');

  const hasFile = await askQuestion('Do you have the JSON credentials file downloaded? (y/n): ');

  if (hasFile.toLowerCase() !== 'y') {
    console.log('\n❌ Please complete Step 1 first:');
    console.log('   node scripts/setupCredentialsStep1.js');
    rl.close();
    return;
  }

  const filePath = await askQuestion('\nEnter the full path to your downloaded JSON file: ');

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found. Please check the path and try again.');
      rl.close();
      return;
    }

    // Read and validate the file
    const credentialsContent = fs.readFileSync(filePath, 'utf8');
    const credentials = JSON.parse(credentialsContent);

    // Validate required fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !credentials[field]);

    if (missingFields.length > 0) {
      console.log('❌ Invalid credentials file. Missing fields:', missingFields.join(', '));
      console.log('   Make sure you downloaded a service account JSON file.');
      rl.close();
      return;
    }

    // Create config directory
    const configDir = path.join(__dirname, '../config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log('📁 Created config directory');
    }

    // Copy file to correct location
    const targetPath = path.join(configDir, 'google-credentials.json');
    fs.copyFileSync(filePath, targetPath);

    console.log('✅ Credentials installed successfully!');
    console.log(`📁 Location: ${targetPath}`);
    console.log(`📧 Service account: ${credentials.client_email}`);

    // Update .gitignore
    const gitignorePath = path.join(__dirname, '../../.gitignore');
    try {
      let gitignoreContent = '';
      if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      }
      
      const credentialsEntry = 'backend/config/google-credentials.json';
      if (!gitignoreContent.includes(credentialsEntry)) {
        gitignoreContent += `\n# Google Calendar Credentials\n${credentialsEntry}\n`;
        fs.writeFileSync(gitignorePath, gitignoreContent);
        console.log('✅ Added to .gitignore for security');
      }
    } catch (error) {
      console.log('⚠️  Could not update .gitignore');
    }

    console.log('\n📅 Next: Share your calendar with the service account');
    console.log(`   Service account email: ${credentials.client_email}`);
    console.log('\n✅ After sharing your calendar, run:');
    console.log('   node scripts/setupCredentialsStep3.js');

  } catch (error) {
    console.log('❌ Error processing file:', error.message);
    if (error.message.includes('JSON')) {
      console.log('   Make sure the file is a valid JSON file.');
    }
  }

  rl.close();
}

setupStep2();