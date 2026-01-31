# MediBot AI Medical Assistant - Setup Guide

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd medibot-ai-medical-assistant
   ```

2. **Setup Environment Variables**
   ```bash
   # Backend configuration
   cp backend/.env.example backend/.env
   
   # Frontend configuration
   cp frontend/.env.example frontend/.env
   ```

3. **Fill in your API keys** (see sections below for details)

4. **Install Dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

5. **Start the Application**
   ```bash
   # Backend (Terminal 1)
   cd backend && npm start
   
   # Frontend (Terminal 2)
   cd frontend && npm start
   ```

## 🔑 Required API Keys & Services

### 1. **MongoDB Database**
- **Local**: Install MongoDB locally or use MongoDB Atlas
- **Connection String**: `mongodb://localhost:27017/medibot`
- **Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/medibot`

### 2. **AI Services**

#### Google Gemini API
- **Purpose**: Appointment booking agent and medical reasoning
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Environment Variable**: `GEMINI_API_KEY`

#### OpenRouter API
- **Purpose**: Primary AI chat functionality with multiple model access
- **Get API Key**: https://openrouter.ai/keys
- **Environment Variable**: `OPENROUTER_API_KEY`
- **Models Used**: `openai/gpt-oss-120b` (default), vision models for image analysis

#### Tavily Search API
- **Purpose**: Real-time medical web search from trusted sources
- **Get API Key**: https://tavily.com/
- **Environment Variable**: `TAVILY_API_KEY`

#### Pinecone Vector Database
- **Purpose**: FAQ semantic search and document retrieval
- **Get API Key**: https://app.pinecone.io/
- **Environment Variable**: `PINECONE_API_KEY`
- **Index Configuration**: Dimension 768 (for BioClinical ModernBERT embeddings)

#### ElevenLabs (Optional)
- **Purpose**: Text-to-speech functionality
- **Get API Key**: https://elevenlabs.io/
- **Environment Variable**: `ELEVENLABS_API_KEY`

### 3. **Google Calendar Integration**

#### Service Account Setup
1. **Create Google Cloud Project**: https://console.cloud.google.com/
2. **Enable Google Calendar API**
3. **Create Service Account**:
   - Go to IAM & Admin > Service Accounts
   - Create new service account
   - Download JSON key file
   - Save as `backend/config/google-credentials.json`

#### Calendar Configuration
1. **Create/Use Calendar**: Create a dedicated "Medibot" calendar
2. **Share Calendar**: 
   - Share with service account email (from JSON file)
   - Give "Make changes to events" permission
   - Optionally make calendar public for embedded view
3. **Get Calendar ID**: 
   - Calendar Settings > Calendar ID
   - Format: `abc123@group.calendar.google.com`

#### Environment Variables
```bash
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
GOOGLE_CLIENT_ID=your_client_id (optional for OAuth)
GOOGLE_CLIENT_SECRET=your_client_secret (optional for OAuth)
```

## 📁 Project Structure

```
medibot-ai-medical-assistant/
├── backend/
│   ├── config/
│   │   ├── google-credentials.json (create this)
│   │   └── intentClassifierConfig.js
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── .env (create from .env.example)
│   └── server.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env (create from .env.example)
│   └── package.json
└── README.md
```

## 🤖 AI Agent Architecture

### Intent Classification System
- **FAQ Agent**: Semantic search using Pinecone vector database
- **Appointment Agent**: Multi-step booking workflow with calendar integration
- **General Chat Agent**: Medical consultation using OpenRouter AI
- **Web Search Agent**: Real-time medical information retrieval

### Workflow
```
User Input → Intent Classifier → Route to Agent → Generate Response → Save History
```

## 🔧 Configuration Details

### Backend (.env)
```bash
# Server
NODE_ENV=development
PORT=3004

# Database
MONGODB_URI=mongodb://localhost:27017/medibot

# Security
JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRE=24h

# AI Services
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key
TAVILY_API_KEY=your_tavily_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=medibot-faq

# Calendar
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
TIMEZONE=Asia/Kolkata

# Optional
ELEVENLABS_API_KEY=your_elevenlabs_key
DEBUG_INTENT_CLASSIFIER=false
```

### Frontend (.env)
```bash
# Calendar Integration
REACT_APP_GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com

# Optional UI Settings
REACT_APP_DEFAULT_THEME=light
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_DEFAULT_CALENDAR_MODE=MONTH
REACT_APP_TIMEZONE=Asia/Kolkata
```

## 🧪 Testing Your Setup

### 1. **Backend Health Check**
```bash
curl http://localhost:3004/api/health
```

### 2. **Calendar Integration Test**
```bash
cd backend && node scripts/testCalendar.js
```

### 3. **AI Services Test**
- Open frontend at http://localhost:3000
- Try different types of messages:
  - FAQ: "What is diabetes?"
  - Appointment: "I need to see a cardiologist"
  - General: "I have chest pain"
  - Search: "Search for latest COVID treatments"

## 🌍 Multi-Language Support

Supported languages:
- **English** (en)
- **Tamil** (ta)
- **Spanish** (es)
- **French** (fr)
- **Hindi** (hi)

Language detection is automatic based on user input.

## 🔒 Security Best Practices

1. **Never commit .env files** to version control
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Rotate API keys regularly**
4. **Keep service account JSON files secure**
5. **Use environment-specific configurations** for dev/staging/prod
6. **Enable CORS properly** for production deployment

## 🚀 Production Deployment

### Environment Setup
1. **Use production MongoDB** (MongoDB Atlas recommended)
2. **Set NODE_ENV=production**
3. **Use production API keys**
4. **Configure proper CORS settings**
5. **Set up SSL/HTTPS**
6. **Use environment variables** instead of .env files

### Recommended Services
- **Backend**: Railway, Render, or AWS
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Database**: MongoDB Atlas
- **Monitoring**: Add logging and error tracking

## 📞 Support

For issues or questions:
1. Check the console logs for error messages
2. Verify all API keys are correctly configured
3. Test individual services using the provided test scripts
4. Ensure all required services are accessible

## 🎯 Features

- ✅ Multi-agent AI architecture
- ✅ Intelligent intent classification
- ✅ Automated appointment booking
- ✅ Google Calendar integration
- ✅ FAQ semantic search
- ✅ Real-time web search
- ✅ Multi-language support
- ✅ Image analysis capabilities
- ✅ Comprehensive error handling
- ✅ Chat history persistence
- ✅ Responsive web interface