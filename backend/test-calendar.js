/**
 * Calendar Integration Diagnostic Script
 * 
 * This script helps diagnose calendar integration issues
 * Run with: node backend/test-calendar.js
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const googleCalendarService = require('./backend/services/googleCalendar');

async function testCalendarIntegration() {
  try {
    console.log('Starting Calendar Integration Diagnostics\n');
    
    // 1. Check environment variables
    console.log('1️⃣ Checking Environment Variables:');
    console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
    console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
    console.log('   GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Missing');
    console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'Missing');
    console.log('');

    // 2. Connect to database
    console.log('2️⃣ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   Connected to MongoDB\n');

    // 3. Find users with connected calendars
    console.log('3️⃣ Checking Users with Connected Calendars:');
    const usersWithCalendar = await User.find({ 'googleCalendar.connected': true });
    
    if (usersWithCalendar.length === 0) {
      console.log('    No users have connected their Google Calendar');
      console.log('   Users need to connect their calendar first via the UI\n');
    } else {
      console.log(`   Found ${usersWithCalendar.length} user(s) with connected calendar:\n`);
      
      for (const user of usersWithCalendar) {
        console.log(`   User: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Calendar ID: ${user.googleCalendar.calendarId}`);
        console.log(`      Connected At: ${user.googleCalendar.connectedAt}`);
        console.log(`      Has Access Token: ${!!user.googleCalendar.accessToken}`);
        console.log(`      Has Refresh Token: ${!!user.googleCalendar.refreshToken}`);
        console.log(`      Token Expiry: ${user.googleCalendar.expiryDate ? new Date(user.googleCalendar.expiryDate) : 'N/A'}`);
        
        // Check if token is expired
        const now = Date.now();
        const isExpired = user.googleCalendar.expiryDate && user.googleCalendar.expiryDate < now;
        console.log(`      Token Status: ${isExpired ? ' Expired (will auto-refresh)' : 'Valid'}`);
        console.log('');

        // 4. Test creating a calendar event
        console.log('4️⃣ Testing Calendar Event Creation:');
        try {
          const testEventDetails = {
            patientName: 'Test Patient',
            patientEmail: user.email,
            doctorName: 'Test Doctor',
            doctorEmail: user.email,
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            duration: 30,
            appointmentType: 'test',
            chiefComplaint: 'Diagnostic test appointment',
            symptoms: ['Testing calendar integration']
          };

          console.log('   Creating test event...');
          const result = await googleCalendarService.safeCreateEvent(testEventDetails, user._id);

          if (result.eventId) {
            console.log('   SUCCESS! Calendar event created');
            console.log(`      Event ID: ${result.eventId}`);
            console.log(`      Event Link: ${result.eventLink}`);
            console.log(`      Meeting Link: ${result.meetingLink || 'N/A'}`);
            console.log('');
            console.log('   🎉 Calendar integration is working correctly!');
            console.log('   Check your Google Calendar to see the test event');
          } else {
            console.log('   FAILED to create calendar event');
            console.log(`      Error: ${result.error}`);
            console.log('');
            console.log('   🔧 Troubleshooting steps:');
            console.log('      1. Verify OAuth credentials in Google Cloud Console');
            console.log('      2. Check that redirect URI matches in Google Cloud Console');
            console.log('      3. Try disconnecting and reconnecting calendar');
            console.log('      4. Check backend logs for detailed error messages');
          }
        } catch (testError) {
          console.log('   ERROR during test:');
          console.log(`      ${testError.message}`);
          console.log('');
          console.log('   🔧 This error suggests:');
          if (testError.message.includes('not connected')) {
            console.log('      - User needs to connect their Google Calendar');
          } else if (testError.message.includes('invalid_grant')) {
            console.log('      - OAuth tokens are invalid or expired');
            console.log('      - User needs to reconnect their Google Calendar');
          } else if (testError.message.includes('access_denied')) {
            console.log('      - Calendar access was denied or revoked');
            console.log('      - User needs to reconnect with proper permissions');
          } else {
            console.log('      - Check the error message above for details');
            console.log('      - Review backend logs for more information');
          }
        }
        console.log('');
      }
    }

    // 5. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Environment Configuration:');
    console.log(`  OAuth Client ID: ${process.env.GOOGLE_CLIENT_ID ? '✅' : '❌'}`);
    console.log(`  OAuth Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? '✅' : '❌'}`);
    console.log(`  Redirect URI: ${process.env.GOOGLE_REDIRECT_URI || 'Not set'}`);
    console.log('');
    console.log('User Status:');
    console.log(`  Users with connected calendar: ${usersWithCalendar.length}`);
    console.log('');
    
    if (usersWithCalendar.length === 0) {
      console.log(' NEXT STEPS:');
      console.log('   1. Have a user log in to the application');
      console.log('   2. Go to Profile or Calendar page');
      console.log('   3. Click "Connect Google Calendar"');
      console.log('   4. Complete the OAuth authorization');
      console.log('   5. Run this script again to test');
    } else {
      console.log('Calendar integration is configured');
      console.log('   If appointments still don\'t appear in calendar:');
      console.log('   1. Check backend logs when booking appointment');
      console.log('   2. Verify user has calendar connected (check UI)');
      console.log('   3. Try the test endpoint: POST /auth/google/test-connection');
      console.log('   4. Check Google Calendar permissions in Google Account settings');
    }
    console.log('');

  } catch (error) {
    console.error('Diagnostic script error:', error);
    console.error('');
    console.error('This error suggests:');
    if (error.message.includes('MONGODB_URI')) {
      console.error('  - MongoDB connection string is missing or invalid');
      console.error('  - Check MONGODB_URI in backend/.env');
    } else {
      console.error('  - See error details above');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the diagnostic
testCalendarIntegration();
