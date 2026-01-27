# Admin Chat History Management

## Overview

The admin chat history system allows administrators to view, manage, and analyze all user chat sessions in the healthcare chatbot system. This provides insights into user interactions and helps with system monitoring and improvement.

## Authentication

All admin chat history endpoints require admin authentication:
```javascript
headers: {
  'Authorization': 'Bearer <admin_jwt_token>'
}
```

## API Endpoints

### 1. Get All Chat Sessions
**GET** `/api/admin/chat-history`

Retrieve paginated list of all chat sessions.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `userId` (optional): Filter by specific user ID
- `language` (optional): Filter by language (en, ta, etc.)
- `search` (optional): Search in titles and message content

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "uuid-string",
      "title": "Medical Consultation",
      "language": "en",
      "messageCount": 15,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:45:00Z",
      "user": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "metadata": {
        "userAgent": "Mozilla/5.0...",
        "deviceType": "desktop"
      },
      "lastMessage": {
        "content": "Thank you for the medical advice...",
        "timestamp": "2024-01-15T11:45:00Z",
        "role": "user"
      }
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "totalSessions": 87
}
```

### 2. Get Specific Chat Session
**GET** `/api/admin/chat-history/:sessionId`

Retrieve detailed information about a specific chat session including all messages.

**Response:**
```json
{
  "sessionId": "uuid-string",
  "title": "Medical Consultation",
  "language": "en",
  "messages": [
    {
      "id": "msg-uuid",
      "role": "user",
      "content": "I have been feeling dizzy lately",
      "timestamp": "2024-01-15T10:30:00Z",
      "language": "en"
    },
    {
      "id": "msg-uuid-2",
      "role": "bot",
      "content": "I understand you're experiencing dizziness...",
      "timestamp": "2024-01-15T10:30:15Z",
      "language": "en"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1",
    "deviceType": "desktop"
  },
  "messageCount": 15
}
```

### 3. Get Chat History Statistics
**GET** `/api/admin/chat-history/stats/overview`

Retrieve comprehensive statistics about chat history.

**Query Parameters:**
- `startDate` (optional): Filter from date (ISO string)
- `endDate` (optional): Filter to date (ISO string)

**Response:**
```json
{
  "overview": {
    "totalSessions": 150,
    "totalMessages": 2340,
    "uniqueUsersCount": 89,
    "languagesUsed": ["en", "ta"],
    "avgMessagesPerSession": 15.6,
    "lastChatDate": "2024-01-15T11:45:00Z",
    "firstChatDate": "2024-01-01T09:15:00Z"
  },
  "languageBreakdown": [
    {
      "_id": "en",
      "count": 120,
      "totalMessages": 1890
    },
    {
      "_id": "ta",
      "count": 30,
      "totalMessages": 450
    }
  ],
  "dailyActivity": [
    {
      "date": "2024-01-15",
      "sessions": 12,
      "messages": 180
    }
  ]
}
```

### 4. Delete Chat Session
**DELETE** `/api/admin/chat-history/:sessionId`

Permanently delete a specific chat session (requires `canDelete` permission).

**Response:**
```json
{
  "message": "Chat session deleted successfully",
  "sessionId": "uuid-string"
}
```

### 5. Bulk Delete Chat Sessions
**POST** `/api/admin/chat-history/bulk-delete`

Delete multiple chat sessions based on criteria (requires `canDelete` permission).

**Request Body:**
```json
{
  "sessionIds": ["uuid-1", "uuid-2"],  // Option 1: Specific sessions
  "criteria": {                        // Option 2: Criteria-based
    "olderThan": "2024-01-01T00:00:00Z",
    "userId": "user-id",
    "language": "en",
    "emptyOnly": true
  }
}
```

**Response:**
```json
{
  "message": "Chat sessions deleted successfully",
  "deletedCount": 25
}
```

### 6. Export Chat History
**GET** `/api/admin/chat-history/export/:format`

Export chat history data in JSON or CSV format.

**Path Parameters:**
- `format`: Either `json` or `csv`

**Query Parameters:**
- `userId` (optional): Filter by user
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `language` (optional): Filter by language

**Response:**
- **JSON**: Returns downloadable JSON file
- **CSV**: Returns downloadable CSV file with columns: Session ID, Title, Language, User Email, User Name, Message Count, Created At, Updated At, Last Message

## Usage Examples

### Frontend Integration

```javascript
// Get chat history with pagination
const getChatHistory = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...filters
  });

  const response = await fetch(`/api/admin/chat-history?${params}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  return await response.json();
};

// Search chat history
const searchChatHistory = async (query) => {
  const response = await fetch(`/api/admin/chat-history?search=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  return await response.json();
};

// Get session details
const getSessionDetails = async (sessionId) => {
  const response = await fetch(`/api/admin/chat-history/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  return await response.json();
};

// Get statistics
const getChatStats = async () => {
  const response = await fetch('/api/admin/chat-history/stats/overview', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  return await response.json();
};
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const AdminChatHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChatHistory();
  }, [currentPage, searchQuery]);

  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (searchQuery) filters.search = searchQuery;

      const data = await getChatHistory(currentPage, filters);
      setSessions(data.sessions);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadChatHistory();
  };

  return (
    <div className="admin-chat-history">
      <h2>Chat History Management</h2>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chat history..."
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="sessions-list">
            {sessions.map(session => (
              <div key={session.sessionId} className="session-item">
                <h3>{session.title}</h3>
                <p>User: {session.user?.name || 'Unknown'} ({session.user?.email})</p>
                <p>Messages: {session.messageCount} | Language: {session.language}</p>
                <p>Last updated: {new Date(session.updatedAt).toLocaleString()}</p>
                <button onClick={() => viewSession(session.sessionId)}>
                  View Details
                </button>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

## Permissions

- **View chat history**: All admin users
- **Delete chat sessions**: Requires `canDelete` permission
- **Export data**: All admin users
- **Bulk operations**: Requires `canDelete` permission

## Security Considerations

1. **Data Privacy**: Chat history contains sensitive medical information
2. **Access Control**: Only authenticated admins can access
3. **Audit Trail**: Consider logging admin actions on chat data
4. **Data Retention**: Implement policies for data retention and deletion
5. **Export Security**: Exported files contain sensitive data

## Troubleshooting

### Common Issues

1. **Empty Results**: 
   - Check if chat sessions exist in database
   - Verify user authentication tokens are valid
   - Ensure sessions have messages (empty sessions are filtered out)

2. **Permission Errors**:
   - Verify admin has required permissions
   - Check admin authentication middleware

3. **Performance Issues**:
   - Use pagination for large datasets
   - Consider indexing on frequently queried fields
   - Implement caching for statistics

### Testing

Run the test suite to verify functionality:
```bash
cd backend
node examples/test-admin-chat-history.js
```

This will test all endpoints and provide detailed feedback on functionality.