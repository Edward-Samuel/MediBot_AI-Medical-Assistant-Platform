# MEDIBOT - AI Medical Assistant Platform

A comprehensive medical assistant platform built with OpenRouter API for AI responses, featuring intelligent symptom analysis, appointment booking, and multi-language support with optimized token usage.

## Features

- **Patient Portal**: Appointment booking, medical consultation with AI
- **Doctor Dashboard**: Schedule management, patient records
- **AI Assistant**: Intelligent doctor recommendations based on symptoms
- **Multi-language Support**: English, Tamil, Spanish, French, Hindi
- **Image Analysis**: Medical image upload and analysis capabilities
- **Web Search Integration**: Real-time medical information from trusted sources
- **Google Calendar**: Automated appointment scheduling
- **Authentication**: Secure JWT-based authentication system
- **Voice Features**: Speech-to-text and text-to-speech capabilities

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **AI/ML**: OpenRouter API (NVIDIA Nemotron, Meta Llama models)
- **Authentication**: JWT with bcrypt
- **Calendar**: Google Calendar API integration
- **Search**: Tavily API for medical web search
- **Voice**: Web Speech API and ElevenLabs TTS

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

# OpenRouter API (Primary AI Service)
OPENROUTER_API_KEY=your-openrouter-api-key

# Tavily Search API (for medical web search)
TAVILY_API_KEY=your-tavily-api-key

# ElevenLabs API (for text-to-speech)
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Pinecone API (for FAQ RAG system - optional)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=medibot-faq

# Embedding Model (BioClinical ModernBERT - no API key needed)
# Uses local Hugging Face transformers model: neuml/bioclinical-modernbert-base-embeddings

# Server
PORT=3002
NODE_ENV=development

# Google Calendar
GOOGLE_CALENDAR_ID=your-calendar-id
TIMEZONE=Asia/Kolkata

# Google Calendar Service Account (optional - use instead of JSON file)
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
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

Create a `.env` file in the frontend directory:
```bash
# Frontend configuration
REACT_APP_API_URL=http://localhost:3002
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

1. **OpenRouter** - Primary AI service for medical responses
   - Sign up at [OpenRouter](https://openrouter.ai/)
   - Supports multiple models including NVIDIA Nemotron and Meta Llama
   - Free tier available with rate limits

2. **Google Cloud Platform** - For Google Calendar integration and OAuth
   - Enable Google Calendar API
   - Create service account for calendar integration

3. **Tavily** - For web search functionality (optional)
   - Real-time medical information from trusted sources
   - Sign up at [Tavily](https://tavily.com/)

4. **ElevenLabs** - For text-to-speech (optional)
   - Multi-language voice synthesis
   - Sign up at [ElevenLabs](https://elevenlabs.io/)

5. **ElevenLabs** - For text-to-speech (optional)
   - Multi-language voice synthesis
   - Sign up at [ElevenLabs](https://elevenlabs.io/)

6. **Pinecone** - For FAQ vector database (optional)
   - Semantic search for FAQ documents
   - Sign up at [Pinecone](https://www.pinecone.io/)

7. **ClinicalBERT** - For medical document embeddings (automatic)
   - Specialized medical/clinical BERT model from Hugging Face
   - No API key required - runs locally using @xenova/transformers
   - 768-dimensional embeddings optimized for clinical text
   - Supports up to 512 token context length

8. **MongoDB** - Database (local or cloud)
   - Local installation or MongoDB Atlas

## Key Features

### AI-Powered Medical Assistant
- **Optimized Prompts**: Token-efficient prompts reducing API costs by 77%
- **Natural Responses**: Conversational AI without structured formatting
- **Multi-modal**: Text and image analysis capabilities
- **Emergency Detection**: Automatic emergency situation recognition

### RAG-based FAQ System
- **Document Processing**: Support for PDF, DOCX, TXT, CSV, MD files
- **Vector Search**: Pinecone integration for semantic search
- **Admin Management**: Secure admin panel for FAQ management
- **Strict Responses**: Answers only from uploaded documents, never fabricated
- **Multi-format Support**: Automatic chunking and embedding of documents

### Appointment System
- **Smart Booking**: AI-powered doctor recommendations based on symptoms
- **Calendar Integration**: Automatic Google Calendar event creation
- **Fallback Handling**: Manual calendar instructions when integration fails
- **Multi-language**: Support for 5+ languages

### Web Search Integration
- **Trusted Sources**: Medical information from verified healthcare websites
- **Real-time**: Current medical research and guidelines
- **Filtered Results**: Domain-restricted to medical sources only

### Security & Performance
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Express rate limiter with proxy trust
- **Error Handling**: Comprehensive error handling with fallbacks
- **Optimized**: Reduced token usage for cost efficiency

## Project Structure

```
medibot/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── backend/                 # Node.js backend API
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   └── utils/              # Backend utilities
└── docs/                   # Documentation
```

## Recent Updates

- **RAG-based FAQ System**: Complete FAQ management with Pinecone vector search
- **Admin Panel**: Secure admin authentication and document management
- **Document Processing**: Support for PDF, DOCX, TXT, CSV, MD files with chunking
- **Semantic Search**: Vector-based FAQ search with strict answer generation
- **OpenRouter Integration**: Migrated from Gemini to OpenRouter for better model variety
- **Token Optimization**: Reduced prompt tokens by 77% for cost efficiency
- **Natural Responses**: Removed structured formatting for conversational AI
- **Web Search**: Always-available medical web search functionality
- **Error Handling**: Improved error handling with graceful fallbacks
- **Multi-language**: Enhanced support for Tamil, Spanish, French, Hindi

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email [your-email@example.com] or create an issue in the GitHub repository.