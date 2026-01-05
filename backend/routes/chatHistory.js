const express = require('express');
const ChatHistory = require('../models/ChatHistory');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get user's chat sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const sessions = await ChatHistory.getUserSessions(userId);
    
    // Add message count to each session
    const sessionsWithCount = sessions.map(session => ({
      ...session.toObject(),
      messageCount: session.messages ? session.messages.length : 0
    }));

    res.json({
      sessions: sessionsWithCount,
      total: sessions.length
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ message: 'Error fetching chat sessions' });
  }
});

// Get specific chat session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id || req.user.id;
    
    const chatHistory = await ChatHistory.findOne({
      userId: userId,
      sessionId,
      isActive: true
    });

    if (!chatHistory) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({
      sessionId: chatHistory.sessionId,
      title: chatHistory.title,
      messages: chatHistory.messages,
      language: chatHistory.language,
      createdAt: chatHistory.createdAt,
      updatedAt: chatHistory.updatedAt
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ message: 'Error fetching chat session' });
  }
});

// Create new chat session
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const { language = 'en' } = req.body;
    const sessionId = uuidv4();
    const userId = req.user._id || req.user.id;
    
    // Get user metadata
    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
    };

    const chatHistory = await ChatHistory.createSession(
      userId,
      sessionId,
      language,
      metadata
    );

    res.status(201).json({
      sessionId: chatHistory.sessionId,
      title: chatHistory.title,
      language: chatHistory.language,
      createdAt: chatHistory.createdAt
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ message: 'Error creating chat session' });
  }
});

// Add message to chat session
router.post('/session/:sessionId/message', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role, content, language = 'en' } = req.body;
    const userId = req.user._id || req.user.id;

    if (!role || !content) {
      return res.status(400).json({ message: 'Role and content are required' });
    }

    if (!['user', 'bot'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "user" or "bot"' });
    }

    let chatHistory = await ChatHistory.findOne({
      userId: userId,
      sessionId,
      isActive: true
    });

    if (!chatHistory) {
      // Create new session if it doesn't exist
      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
      };

      chatHistory = await ChatHistory.createSession(
        userId,
        sessionId,
        language,
        metadata
      );
    }

    const messageData = {
      id: uuidv4(),
      role,
      content,
      language,
      timestamp: new Date()
    };

    await chatHistory.addMessage(messageData);

    res.json({
      message: 'Message added successfully',
      messageId: messageData.id,
      sessionId: chatHistory.sessionId
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Error adding message to chat history' });
  }
});

// Update chat session (e.g., change title or language)
router.put('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, language } = req.body;
    const userId = req.user._id || req.user.id;

    const chatHistory = await ChatHistory.findOne({
      userId: userId,
      sessionId,
      isActive: true
    });

    if (!chatHistory) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    if (title) chatHistory.title = title;
    if (language) chatHistory.language = language;

    await chatHistory.save();

    res.json({
      message: 'Chat session updated successfully',
      sessionId: chatHistory.sessionId,
      title: chatHistory.title,
      language: chatHistory.language
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
    res.status(500).json({ message: 'Error updating chat session' });
  }
});

// Delete chat session (soft delete)
router.delete('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id || req.user.id;

    const chatHistory = await ChatHistory.findOne({
      userId: userId,
      sessionId,
      isActive: true
    });

    if (!chatHistory) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    chatHistory.isActive = false;
    await chatHistory.save();

    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ message: 'Error deleting chat session' });
  }
});

// Get chat statistics for user
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const stats = await ChatHistory.aggregate([
      { $match: { userId: userId, isActive: true } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          languagesUsed: { $addToSet: '$language' },
          lastChatDate: { $max: '$updatedAt' },
          firstChatDate: { $min: '$createdAt' }
        }
      }
    ]);

    const result = stats[0] || {
      totalSessions: 0,
      totalMessages: 0,
      languagesUsed: [],
      lastChatDate: null,
      firstChatDate: null
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching chat statistics:', error);
    res.status(500).json({ message: 'Error fetching chat statistics' });
  }
});

// Search chat history
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, language, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Use the correct user ID field from the token
    const userId = req.user._id || req.user.id;

    const searchFilter = {
      userId: userId,
      isActive: true
    };

    // Add language filter if specified
    if (language) {
      searchFilter.language = language;
    }

    // Try text search first
    let results = [];
    try {
      results = await ChatHistory.find({
        ...searchFilter,
        $text: { $search: query }
      }, {
        score: { $meta: 'textScore' }
      })
      .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
      .limit(parseInt(limit))
      .select('sessionId title language updatedAt messages');
    } catch (textSearchError) {
      console.log('Text search failed, falling back to regex search:', textSearchError.message);
      
      // Fallback to regex search if text search fails
      results = await ChatHistory.find({
        ...searchFilter,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { 'messages.content': { $regex: query, $options: 'i' } }
        ]
      })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select('sessionId title language updatedAt messages');
    }

    // Highlight matching messages
    const processedResults = results.map(session => {
      const matchingMessages = session.messages.filter(msg =>
        msg.content.toLowerCase().includes(query.toLowerCase())
      );

      return {
        sessionId: session.sessionId,
        title: session.title,
        language: session.language,
        updatedAt: session.updatedAt,
        matchingMessages: matchingMessages.slice(0, 3), // Show up to 3 matching messages
        totalMessages: session.messages.length,
        messageCount: session.messages.length
      };
    });

    res.json({
      results: processedResults,
      total: results.length,
      query
    });
  } catch (error) {
    console.error('Error searching chat history:', error);
    res.status(500).json({ message: 'Error searching chat history' });
  }
});

module.exports = router;