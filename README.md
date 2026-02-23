# MediBot AI Medical Assistant Platform

**Agentic AI-powered medical assistant with multi-agent architecture, intelligent appointment booking, and comprehensive healthcare support.**

## Features

- **Multi-Agent AI Architecture** - Intent classification with specialized agents
- **Automated Appointment Booking** - Smart doctor matching and calendar integration
- **Google Calendar Integration** - Real-time appointment synchronization with OAuth2
- **Appointment Rescheduling** - Efficient datetime-only updates using Google Calendar API
- **Intelligent FAQ System** - Semantic search using vector database
- **Real-time Web Search** - Medical information from trusted sources
- **Multi-language Support** - English, Tamil, Spanish, French, Hindi
- **Responsive Interface** - Modern React frontend with dark/light themes
- **Secure & HIPAA-Ready** - JWT authentication and data protection

## Quick Start

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
   - Google Calendar API (OAuth2)

3. **Install & Run**

   ```bash
   # Backend
   cd backend && npm install && npm start

   # Frontend
   cd frontend && npm install && npm start
   ```

## Architecture

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
- **Integrations**: Google Calendar (OAuth2), Tavily Search
- **Database**: MongoDB with Mongoose ODM

## Agent Capabilities

| Agent                 | Purpose                  | Technology          | Autonomy Level |
| --------------------- | ------------------------ | ------------------- | -------------- |
| **Intent Classifier** | Route conversations      | Hybrid AI + Rules   | High           |
| **FAQ Agent**         | Answer medical questions | RAG + Vector Search | Medium         |
| **Appointment Agent** | Book appointments        | Multi-step workflow | Very High      |
| **Reschedule Agent**  | Modify appointments      | AI + Calendar API   | High           |
| **Cancellation Agent**| Cancel appointments      | Calendar API        | Medium         |
| **Web Search Agent**  | Real-time medical info   | API orchestration   | Medium         |

## Google Calendar Integration

### Features
- **OAuth2 Authentication** - User-specific calendar access
- **Event Creation** - Automatic calendar event creation on appointment booking
- **Event ID Tracking** - MongoDB stores `googleCalendarEventId` for each appointment
- **Efficient Rescheduling** - Uses `events.patch` API for datetime-only updates
- **Event Deletion** - Removes calendar events when appointments are cancelled
- **Timezone Support** - Handles user timezones correctly
- **Meeting Links** - Stores Google Meet links when available

### Appointment Lifecycle
1. **Creation** - Calendar event created, event ID saved to MongoDB
2. **Rescheduling** - Only datetime fields updated using PATCH method
3. **Cancellation** - Calendar event deleted, appointment record removed from database

### Date Format
- **Display Format**: DD/MM/YYYY HH:MM (24-hour format)
- **Storage Format**: ISO 8601 (UTC)
- **User Timezone**: Automatically detected and applied

## Configuration

### Required Services

- **MongoDB** - User data and chat history
- **Google Calendar** - Appointment scheduling with OAuth2
- **Pinecone** - Vector database for FAQ search
- **OpenRouter** - Multi-model AI access
- **Tavily** - Medical web search

### Environment Setup

See [SETUP.md](SETUP.md) for detailed configuration instructions.

## Multi-Language Support

Automatic language detection and response generation:

- English
- Tamil
- Spanish
- French
- Hindi

## Security & Privacy

- JWT-based authentication
- OAuth2 for Google Calendar access
- Encrypted API communications
- Secure credential management
- HIPAA-compliant data handling
- No sensitive data in version control
- Automatic token refresh for expired credentials

## User Interface

- **Patient Portal** - Chat interface, appointment booking, medical history
- **Admin Dashboard** - User management, FAQ management, analytics
- **Doctor Interface** - Appointment management, patient communication
- **Embedded Calendar** - Real-time appointment visualization
- **Reschedule Widget** - Interactive date/time picker for rescheduling
- **Dark/Light Theme** - User preference support

## Database Schema

### Appointment Model
```javascript
{
  patientId: ObjectId,
  doctorId: ObjectId,
  dateTime: Date,
  duration: Number,
  type: String,
  status: String,
  googleCalendarEventId: String,  // Google Calendar event ID
  googleMeetLink: String,          // Google Meet link (if available)
  rescheduleCount: Number,
  // ... other fields
}
```

## API Endpoints

### Appointments
- `POST /api/appointments/book` - Create new appointment
- `GET /api/appointments/my-appointments` - Get user appointments
- `PATCH /api/appointments/:id/reschedule` - Reschedule appointment
- `DELETE /api/appointments/:id` - Cancel and delete appointment
- `PATCH /api/appointments/:id/status` - Update appointment status

### Calendar
- `GET /api/calendar/auth-url` - Get Google OAuth URL
- `POST /api/calendar/callback` - Handle OAuth callback
- `GET /api/calendar/status` - Check calendar connection status

## Testing

```bash
# Backend API health check
curl http://localhost:3004/api/health

# Calendar integration test
cd backend && node scripts/testCalendar.js

# Test appointment creation
cd backend && node test-calendar.js

# Frontend development server
cd frontend && npm start
```

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas connection
- [ ] Google Calendar OAuth2 credentials setup
- [ ] Google Calendar service account (optional)
- [ ] API keys rotated for production
- [ ] SSL/HTTPS enabled
- [ ] CORS configured properly
- [ ] Redirect URIs configured in Google Cloud Console

### Recommended Platforms

- **Backend**: Railway, Render, AWS
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas
- **Monitoring**: LogRocket, Sentry

## Performance

- **Response Time**: < 2s for AI responses
- **Calendar Sync**: < 1s for event operations
- **Concurrent Users**: Scales with MongoDB and API limits
- **Availability**: 99.9% uptime with proper deployment
- **Languages**: Real-time translation and localization

## Appointment Management

### Reschedule Limits
- Maximum 2 reschedules per appointment
- Must be rescheduled to future date/time
- Checks for doctor availability conflicts

### Cancellation Policy
- Cannot cancel completed appointments
- 24-hour advance notice required (configurable)
- Appointment record deleted from database
- Calendar event automatically removed

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [SETUP.md](SETUP.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Contact**: [Your Contact Info]

## Roadmap

- [ ] Advanced medical image analysis
- [ ] Telemedicine video integration
- [ ] Prescription management
- [ ] Health monitoring dashboards
- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Email notifications for appointments
- [ ] SMS reminders
- [ ] Multi-calendar support

---

**Built with ❤️ for better healthcare accessibility**

