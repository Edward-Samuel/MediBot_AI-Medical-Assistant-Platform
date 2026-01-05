# Google Credentials Setup

This directory contains Google API credentials needed for the application.

## Required Files

### 1. google-credentials.json
This is the Google Service Account credentials file for Google Calendar API access.

**To create this file:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google Calendar API
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Download the JSON file and rename it to `google-credentials.json`
6. Place it in this directory

**Template:** Use `google-credentials.json.template` as a reference for the structure.

### 2. google-credentials1.json (Optional)
This can be used for OAuth credentials if needed for different authentication flows.

## Security Notes

⚠️ **IMPORTANT**: These files contain sensitive credentials and should NEVER be committed to version control.

- These files are already added to `.gitignore`
- Never share these files publicly
- Regenerate credentials if they are accidentally exposed
- Use environment variables for production deployments

## Environment Variables Alternative

Instead of JSON files, you can use environment variables:

```bash
# In your .env file
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

The application will automatically use environment variables if the JSON files are not present.