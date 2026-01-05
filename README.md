# MEDIBOT - AI Medical Assistant Platform

A comprehensive medical assistant platform built with Gemini API for reasoning, MedGemma for medical domain knowledge, and enhanced with RAG system over verified medical sources.

## Features

- **Patient Portal**: Appointment booking, consultation, FAQs
- **Doctor Dashboard**: Schedule management, patient records
- **AI Assistant**: Intelligent doctor recommendations based on symptoms
- **RAG System**: Medical knowledge retrieval from verified sources
- **EHR Integration**: Electronic Health Records management
- **Google Calendar**: Appointment scheduling integration
- **Authentication**: Separate login/register for patients and doctors

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **AI/ML**: Gemini API, MedGemma, RAG system
- **Authentication**: JWT
- **Calendar**: Google Calendar API
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Edward-Samuel/MediBot_AI-Medical-Assistant-Platform.git
cd MediBot_AI-Medical-Assistant-Platform
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the backend directory with the following variables:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/medibot

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d

# Google APIs
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_TIMEOUT_MS=25000
GEMINI_PRIMARY_MODEL=gemini-2.5-flash-lite

# Tavily Search API (for medical web search)
TAVILY_API_KEY=your-tavily-api-key

# ElevenLabs API (for text-to-speech)
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Ollama (Local LLM)
OLLAMA_HOST=http://localhost:11434
OLLAMA_PREFERRED_MODEL=qwen2.5-coder:0.5b
OLLAMA_FALLBACK_MODELS=phi3,llama3.1,llama3,mistral
OLLAMA_TIMEOUT_MS=100000

# Server
PORT=3002
NODE_ENV=development

# Google Calendar
GOOGLE_CALENDAR_ID=your-calendar-id
TIMEZONE=Asia/Kolkata
```

### 4. Google Credentials Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google Calendar API
4. Create Service Account credentials
5. Download the JSON file and save as `backend/config/google-credentials.json`

See `backend/config/README.md` for detailed instructions.

### 5. Frontend Setup
```bash
cd frontend
npm install
```

### 6. Database Setup
Make sure MongoDB is running on your system:
```bash
# On Windows (if using MongoDB Community Server)
net start MongoDB

# On macOS (if using Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

### 7. Start the Application

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3002

## API Keys Required

To use all features, you'll need API keys from:

1. **Google Cloud Platform** - For Google Calendar integration and OAuth
2. **Google Gemini** - For AI responses
3. **Tavily** - For web search functionality
4. **ElevenLabs** - For text-to-speech (optional)
5. **MongoDB** - Database (local or cloud)

## Optional Features

- **Ollama**: Install locally for offline AI responses
- **ElevenLabs**: For enhanced text-to-speech in multiple languages
- **Web Search**: Tavily API for real-time medical information

## Project Structure

```
medibot/
├── frontend/          # React frontend
├── backend/           # Node.js backend
├── ai-services/       # AI/ML services
├── database/          # Database schemas
└── docs/             # Documentation
```