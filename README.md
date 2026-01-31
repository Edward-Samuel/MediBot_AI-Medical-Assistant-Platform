# MediBot AI Medical Assistant Platform

🤖 **Agentic AI-powered medical assistant with multi-agent architecture, intelligent appointment booking, and comprehensive healthcare support.**

## ✨ Features

- 🧠 **Multi-Agent AI Architecture** - Intent classification with specialized agents
- 📅 **Automated Appointment Booking** - Smart doctor matching and calendar integration  
- 🔍 **Intelligent FAQ System** - Semantic search using vector database
- 🌐 **Real-time Web Search** - Medical information from trusted sources
- 🗣️ **Multi-language Support** - English, Tamil, Spanish, French, Hindi
- 📱 **Responsive Interface** - Modern React frontend with dark/light themes
- 🔒 **Secure & HIPAA-Ready** - JWT authentication and data protection

## 🚀 Quick Start

1. **Clone & Setup**
   ```bash
   git clone https://github.com/Edward-Samuel/MediBot_AI-Medical-Assistant-Platform.git
   cd MediBot_AI-Medical-Assistant-Platform
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Configure API Keys** (see [SETUP.md](SETUP.md) for details)
   - Google Gemini API
   - OpenRouter API  
   - Tavily Search API
   - Pinecone Vector DB
   - Google Calendar API

3. **Install & Run**
   ```bash
   # Backend
   cd backend && npm install && npm start
   
   # Frontend  
   cd frontend && npm install && npm start
   ```

## 🏗️ Architecture

### Multi-Agent System
```
User Input → Intent Classifier → Specialized Agents → Response Generation
                    ↓
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
FAQ Agent      Appointment Agent    Web Search Agent
(Pinecone)     (Calendar + AI)      (Tavily + AI)
```

### Tech Stack
- **Backend**: Node.js, Express, MongoDB, JWT
- **Frontend**: React, Tailwind CSS, Lucide Icons
- **AI Services**: OpenRouter, Google Gemini, Pinecone
- **Integrations**: Google Calendar, Tavily Search
- **Database**: MongoDB with Mongoose ODM

## 📊 Agent Capabilities

| Agent | Purpose | Technology | Autonomy Level |
|-------|---------|------------|----------------|
| **Intent Classifier** | Route conversations | Hybrid AI + Rules | ⭐⭐⭐⭐ |
| **FAQ Agent** | Answer medical questions | RAG + Vector Search | ⭐⭐⭐ |
| **Appointment Agent** | Book appointments | Multi-step workflow | ⭐⭐⭐⭐⭐ |
| **Web Search Agent** | Real-time medical info | API orchestration | ⭐⭐⭐ |

## 🔧 Configuration

### Required Services
- **MongoDB** - User data and chat history
- **Google Calendar** - Appointment scheduling  
- **Pinecone** - Vector database for FAQ search
- **OpenRouter** - Multi-model AI access
- **Tavily** - Medical web search

### Environment Setup
See [SETUP.md](SETUP.md) for detailed configuration instructions.

## 🌍 Multi-Language Support

Automatic language detection and response generation:
- 🇺🇸 English
- 🇮🇳 Tamil  
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇮🇳 Hindi

## 🔒 Security & Privacy

- JWT-based authentication
- Encrypted API communications
- Secure credential management
- HIPAA-compliant data handling
- No sensitive data in version control

## 📱 User Interface

- **Patient Portal** - Chat interface, appointment booking, medical history
- **Admin Dashboard** - User management, FAQ management, analytics
- **Doctor Interface** - Appointment management, patient communication
- **Embedded Calendar** - Real-time appointment visualization

## 🧪 Testing

```bash
# Backend API health check
curl http://localhost:3004/api/health

# Calendar integration test
cd backend && node scripts/testCalendar.js

# Frontend development server
cd frontend && npm start
```

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] MongoDB Atlas connection
- [ ] Google Calendar service account setup
- [ ] API keys rotated for production
- [ ] SSL/HTTPS enabled
- [ ] CORS configured properly

### Recommended Platforms
- **Backend**: Railway, Render, AWS
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas
- **Monitoring**: LogRocket, Sentry

## 📈 Performance

- **Response Time**: < 2s for AI responses
- **Concurrent Users**: Scales with MongoDB and API limits
- **Availability**: 99.9% uptime with proper deployment
- **Languages**: Real-time translation and localization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [SETUP.md](SETUP.md)
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📧 **Contact**: [Your Contact Info]

## 🎯 Roadmap

- [ ] Advanced medical image analysis
- [ ] Telemedicine video integration  
- [ ] Prescription management
- [ ] Health monitoring dashboards
- [ ] Mobile app development
- [ ] Advanced analytics and reporting

---

**Built with ❤️ for better healthcare accessibility**