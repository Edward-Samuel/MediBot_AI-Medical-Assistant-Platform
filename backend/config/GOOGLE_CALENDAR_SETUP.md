# Google Calendar Integration Setup Guide

## Overview

This guide helps you set up Google Calendar integration for MEDIBOT appointment booking. The integration allows automatic calendar event creation when appointments are booked.

## Current Issue Resolution

**Problem**: "Sign in to your Google Account - You must sign in to access this content"

**Root Cause**: The calendar integration is trying to access a personal Google Calendar that requires user authentication, but the system is configured for service account authentication.

## Solution Options

### Option 1: Service Account Setup (Recommended)

This creates a dedicated calendar for MEDIBOT appointments that doesn't require user sign-in.

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your Project ID

#### Step 2: Enable Google Calendar API

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

#### Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in details:
   - **Name**: `medibot-calendar-service`
   - **Description**: `Service account for MEDIBOT calendar integration`
4. Click "Create and Continue"
5. Skip role assignment for now (click "Continue")
6. Click "Done"

#### Step 4: Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Download the JSON file
6. Rename it to `google-credentials.json`
7. Place it in `backend/config/` directory

#### Step 5: Create Dedicated Calendar

1. Go to [Google Calendar](https://calendar.google.com/)
2. On the left sidebar, click "+" next to "Other calendars"
3. Select "Create new calendar"
4. Fill in details:
   - **Name**: `MEDIBOT Appointments`
   - **Description**: `Medical appointments booked through MEDIBOT`
   - **Time zone**: Your local timezone
5. Click "Create calendar"
6. Find the calendar in the left sidebar
7. Click the three dots next to it > "Settings and sharing"
8. Copy the "Calendar ID" (looks like: `abc123@group.calendar.google.com`)

#### Step 6: Share Calendar with Service Account

1. In the calendar settings, scroll to "Share with specific people"
2. Click "Add people"
3. Enter the service account email (from the JSON file: `client_email` field)
4. Set permission to "Make changes to events"
5. Click "Send"

#### Step 7: Configure Environment Variables

Add to your `.env` file:

```bash
# Google Calendar Configuration
GOOGLE_CALENDAR_ID=your-calendar-id-from-step-5
TIMEZONE=Asia/Kolkata
```

### Option 2: Use Primary Calendar (Alternative)

If you want to use your personal calendar:

#### Step 1-4: Same as Option 1

#### Step 5: Share Your Primary Calendar

1. Go to [Google Calendar](https://calendar.google.com/)
2. Click on "Settings" (gear icon) > "Settings"
3. Select your primary calendar from the left sidebar
4. Scroll to "Share with specific people"
5. Add the service account email with "Make changes to events" permission

#### Step 6: Configure Environment

```bash
# Use primary calendar
GOOGLE_CALENDAR_ID=primary
TIMEZONE=Asia/Kolkata
```

## Configuration Files

### Environment Variables (.env)

```bash
# Required for Google Calendar integration
GOOGLE_CALENDAR_ID=your-calendar-id-here
TIMEZONE=Asia/Kolkata

# Optional: Service account key as environment variable (for production)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### Service Account JSON (google-credentials.json)

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "medibot-calendar-service@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Testing the Integration

### Test 1: Check Service Status

```bash
# In your backend directory
node -e "
const calendar = require('./services/googleCalendar');
calendar.testConnection().then(result => {
  console.log('Test result:', result);
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
"
```

### Test 2: API Endpoint Test

```bash
curl -X GET http://localhost:3001/api/ai/status
```

Should return:
```json
{
  "status": "OK",
  "services": {
    "openrouter": { "available": true, "priority": "primary" },
    "calendar": { "available": true }
  }
}
```

## Troubleshooting

### Error: "Calendar not found"

**Solution**: 
- Check that `GOOGLE_CALENDAR_ID` is correct
- Verify the service account has access to the calendar
- Try using `primary` as the calendar ID

### Error: "Access denied" or "Forbidden"

**Solution**:
- Ensure Google Calendar API is enabled
- Check service account permissions on the calendar
- Verify the JSON key file is valid and not expired

### Error: "Invalid grant"

**Solution**:
- The service account key may be expired or invalid
- Re-download the JSON key file
- Check that the system clock is synchronized

### Error: "Not found" (404)

**Solution**:
- The calendar ID doesn't exist or isn't accessible
- Check the calendar ID spelling
- Ensure the calendar is shared with the service account

## Fallback Behavior

When calendar integration fails, MEDIBOT will:

1. **Still create the appointment** in the database
2. **Provide manual calendar instructions** including:
   - Google Calendar quick-add link
   - Outlook Calendar link
   - ICS file download
   - Manual event details

### Manual Calendar Response Example

```json
{
  "appointment": { ... },
  "calendarIntegration": {
    "status": "manual_required",
    "message": "Calendar integration unavailable",
    "instructions": "Please add manually to your calendar"
  },
  "manualCalendarDetails": {
    "title": "Medical Appointment with Dr. Smith",
    "dateTime": "2024-01-15T10:00:00.000Z",
    "duration": "30 minutes",
    "calendarLinks": {
      "google": "https://calendar.google.com/calendar/render?action=TEMPLATE&...",
      "outlook": "https://outlook.live.com/calendar/0/deeplink/compose?...",
      "ics": "BEGIN:VCALENDAR\nVERSION:2.0\n..."
    }
  }
}
```

## Security Best Practices

### 1. Service Account Security

- **Limit Permissions**: Only grant calendar access, not broader Google Workspace access
- **Rotate Keys**: Regularly rotate service account keys (every 90 days)
- **Monitor Usage**: Check Google Cloud Console for unusual API usage

### 2. Environment Variables

- **Never commit** `.env` files or JSON keys to version control
- **Use secrets management** in production (AWS Secrets Manager, etc.)
- **Restrict file permissions** on JSON key files (chmod 600)

### 3. Calendar Privacy

- **Dedicated Calendar**: Use a separate calendar for appointments
- **Private Events**: Set event visibility to private
- **Limited Sharing**: Only share with necessary service accounts

## Production Deployment

### Environment Variable Method (Recommended)

```bash
# Convert JSON to single line and set as environment variable
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
```

### File-based Method

```bash
# Ensure proper file permissions
chmod 600 /path/to/google-credentials.json
chown app:app /path/to/google-credentials.json
```

## Monitoring and Logging

The system provides detailed logging for calendar integration:

```
🔑 Using Google service account from environment variable
🔍 Testing Google Calendar connection...
📋 Available calendars:
   - MEDIBOT Appointments (abc123@group.calendar.google.com) - Access: owner
✅ Target calendar accessible: MEDIBOT Appointments
✅ Calendar write access confirmed
✅ Google Calendar service initialized successfully
📅 Calendar event created successfully: event_id_123
```

## Support

If you continue to have issues:

1. **Check the logs** for specific error messages
2. **Verify each setup step** was completed correctly
3. **Test with a simple calendar first** (create a test event manually)
4. **Contact support** with the specific error message and setup details

The calendar integration is optional - appointments will work without it, and users will receive manual calendar instructions instead.