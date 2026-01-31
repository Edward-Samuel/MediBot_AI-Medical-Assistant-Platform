const googleCalendar = require('../services/googleCalendar');
const readline = require('readline');
require('dotenv').config();

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

async function setupCalendarIntegration() {
  console.log('🔧 MEDIBOT Calendar Integration Setup\n');

  // Check current status
  console.log('1. Checking current calendar integration status...');
  
  try {
    const initialized = await googleCalendar.initialize();
    
    if (initialized) {
      console.log('✅ Calendar integration is already working!');
      
      const testResult = await googleCalendar.testConnection();
      if (testResult.success) {
        console.log('✅ Calendar connection test passed');
        console.log(`📅 Using calendar: ${testResult.calendarId}`);
        console.log(`🔑 Authentication: ${testResult.authType}`);
        
        const runTest = await askQuestion('\nWould you like to run a full test by creating a test appointment? (y/n): ');
        
        if (runTest.toLowerCase() === 'y') {
          await runTestAppointment();
        }
      }
    } else {
      console.log('❌ Calendar integration is not configured');
      await guideSetup();
    }
    
  } catch (error) {
    console.error('❌ Calendar integration error:', error.message);
    await guideSetup();
  }
  
  rl.close();
}

async function guideSetup() {
  console.log('\n📋 Calendar Integration Setup Guide:');
  console.log('');
  console.log('Step 1: Google Cloud Console Setup');
  console.log('   1. Go to: https://console.cloud.google.com/');
  console.log('   2. Create a new project or select existing one');
  console.log('   3. Enable Google Calendar API');
  console.log('   4. Create a Service Account');
  console.log('   5. Download the JSON key file');
  console.log('');
  console.log('Step 2: File Setup');
  console.log('   1. Rename the downloaded file to: google-credentials.json');
  console.log('   2. Place it in: backend/config/google-credentials.json');
  console.log('');
  console.log('Step 3: Calendar Setup');
  console.log('   1. Go to Google Calendar (calendar.google.com)');
  console.log('   2. Create a new calendar for MEDIBOT (recommended)');
  console.log('   3. Share the calendar with your service account email');
  console.log('   4. Give it "Make changes to events" permission');
  console.log('');
  console.log('Step 4: Environment Configuration');
  console.log('   Update your backend/.env file:');
  console.log('   GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com');
  console.log('   (or use "primary" for your main calendar)');
  console.log('');
  
  const hasCredentials = await askQuestion('Do you have the google-credentials.json file ready? (y/n): ');
  
  if (hasCredentials.toLowerCase() === 'y') {
    console.log('\n🔄 Please place the file at: backend/config/google-credentials.json');
    console.log('Then run this script again to test the integration.');
  } else {
    console.log('\n📖 Please follow the setup guide above and run this script again.');
  }
}

async function runTestAppointment() {
  try {
    console.log('\n🧪 Creating test appointment...');
    
    const testAppointment = {
      patientName: 'Test Patient',
      patientEmail: 'test@example.com',
      doctorName: 'Dr. Test Doctor',
      doctorEmail: 'doctor@example.com',
      dateTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      duration: 30,
      appointmentType: 'Test Consultation',
      chiefComplaint: 'Calendar integration test',
      symptoms: ['Testing calendar integration']
    };
    
    const result = await googleCalendar.safeCreateEvent(testAppointment);
    
    if (result.eventId) {
      console.log('✅ Test appointment created successfully!');
      console.log(`   Event ID: ${result.eventId}`);
      console.log(`   Event Link: ${result.eventLink}`);
      
      const cleanup = await askQuestion('\nDelete the test event? (y/n): ');
      
      if (cleanup.toLowerCase() === 'y') {
        try {
          await googleCalendar.deleteEvent(result.eventId);
          console.log('✅ Test event deleted successfully');
        } catch (deleteError) {
          console.log('⚠️  Could not delete test event automatically');
          console.log('   Please delete it manually from your calendar');
        }
      }
    } else {
      console.log('❌ Test appointment creation failed');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test appointment failed:', error.message);
  }
}

// Run the setup
setupCalendarIntegration().catch(console.error);