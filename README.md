# MediBot AI Medical Assistant Platform

Agentic medical assistant platform with multilingual chat, appointment management, FAQ retrieval, web search, and Google Calendar integration.

## Key Features

- AI medical chat with intent routing
- Appointment booking, rescheduling, and cancellation
- Google Calendar sync with OAuth2
- FAQ search with Pinecone
- Trusted-source medical web search
- Voice support and responsive React UI

## Quick Start

1. Clone the repository

```bash
git clone https://github.com/Edward-Samuel/MediBot_AI-Medical-Assistant-Platform.git
cd MediBot_AI-Medical-Assistant-Platform
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Configure services in `.env`

- Google Gemini API
- Tavily Search API
- Pinecone
- Google Calendar API
- ElevenLabs API (optional)

3. Install and run

```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && npm install && npm start
```

See [SETUP.md](SETUP.md) for full setup details.

## Architecture

### Multi-Agent System

```text
User Input -> Intent Classifier -> Specialized Agents -> Response Generation
                      |
        +-------------+-------------+
        |             |             |
      FAQ       Appointment     Web Search
   (Pinecone)   (Calendar)      (Tavily)
```

### Tech Stack

- Backend: Node.js, Express, MongoDB, JWT
- Frontend: React 18, Tailwind CSS
- AI: Google Gemini, Pinecone, Tavily, ElevenLabs
- Integrations: Google Calendar API, OAuth2

## Agent Capabilities

| Agent | Purpose | Technology |
| --- | --- | --- |
| Intent Classifier | Route conversations | Gemini + rules |
| FAQ Agent | Answer knowledge-base questions | Pinecone RAG |
| Appointment Agent | Book appointments | AI workflow + calendar |
| Reschedule Agent | Modify appointments | AI + Calendar API |
| Cancellation Agent | Cancel appointments | Calendar API |
| Web Search Agent | Retrieve current medical info | Tavily + AI |

## Google Calendar Integration

- Creates events on booking
- Updates appointment times on reschedule
- Deletes events on cancellation
- Stores calendar event IDs and meeting links
- Supports timezone-aware scheduling

## Configuration

### Required Services

- MongoDB
- Google Gemini
- Pinecone
- Tavily
- Google Calendar
- ElevenLabs (optional)

See [SETUP.md](SETUP.md) for environment variables and service setup.

## Multi-Language Support

Supported languages:

- English
- Tamil
- Spanish
- French
- Hindi
- Arabic
- Chinese
- Japanese
- Korean
- German
- Italian
- Portuguese
- Russian

## Security

- JWT-based authentication
- OAuth2 for Google Calendar access
- Encrypted API communication
- Secure credential handling
- Automatic token refresh for supported integrations

## API Endpoints

### Appointments

- `POST /api/appointments/book`
- `GET /api/appointments/my-appointments`
- `PATCH /api/appointments/:id/reschedule`
- `DELETE /api/appointments/:id`
- `PATCH /api/appointments/:id/status`

### Calendar

- `GET /api/calendar/auth-url`
- `POST /api/calendar/callback`
- `GET /api/calendar/status`

## Testing

```bash
# Backend health check
curl http://localhost:3004/api/health

# Calendar integration test
cd backend && node test-calendar.js

# Frontend
cd frontend && npm start
```

## Deployment

### Recommended Platforms

- Backend: Railway, Render, AWS
- Frontend: Vercel, Netlify
- Database: MongoDB Atlas

## Contributing

1. Fork the repository
2. Create a branch
3. Commit your changes
4. Push the branch
5. Open a pull request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Support

- Setup guide: [SETUP.md](SETUP.md)
- Issues: GitHub Issues
- Discussions: GitHub Discussions

## Mission and Vision

MediBot is designed to improve healthcare accessibility with multilingual support, practical appointment workflows, and reliable medical information retrieval. The platform is intended to assist patients and healthcare workflows, not replace professional medical care.
