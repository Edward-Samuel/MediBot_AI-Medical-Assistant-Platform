const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const { adminAuth, checkPermission, superAdminOnly } = require('../middleware/adminAuth');

const router = express.Router();

// Note: Admin login is now handled by the common /api/auth/login endpoint

// Get current admin profile
router.get('/profile', adminAuth, async (req, res) => {
  try {
    res.json({
      admin: {
        id: req.admin._id,
        username: req.admin.username,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions,
        lastLogin: req.admin.lastLogin,
        createdAt: req.admin.createdAt
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Create new admin (super admin only)
router.post('/create', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const { username, email, password, role = 'admin', permissions = {} } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Username, email, and password are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingAdmin) {
      return res.status(409).json({
        message: 'Admin with this username or email already exists'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role,
      permissions: {
        canUpload: permissions.canUpload !== false,
        canDelete: permissions.canDelete !== false,
        canManageAdmins: permissions.canManageAdmins === true
      },
      createdBy: req.admin._id
    });

    await newAdmin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
        createdAt: newAdmin.createdAt
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      message: 'Server error during admin creation'
    });
  }
});

// Get all admins (super admin only)
router.get('/list', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const admins = await Admin.find(filter)
      .select('-password')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Admin.countDocuments(filter);

    res.json({
      admins,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalAdmins: total
    });

  } catch (error) {
    console.error('Get admins list error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Update admin status (super admin only)
router.put('/:adminId/status', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const { adminId } = req.params;
    const { isActive } = req.body;

    if (adminId === req.admin._id.toString()) {
      return res.status(400).json({
        message: 'Cannot modify your own account status'
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        message: 'Admin not found'
      });
    }

    admin.isActive = isActive;
    await admin.save();

    res.json({
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      admin: {
        id: admin._id,
        username: admin.username,
        isActive: admin.isActive
      }
    });

  } catch (error) {
    console.error('Update admin status error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Update admin permissions (super admin only)
router.put('/:adminId/permissions', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        message: 'Admin not found'
      });
    }

    admin.permissions = {
      canUpload: permissions.canUpload !== false,
      canDelete: permissions.canDelete !== false,
      canManageAdmins: permissions.canManageAdmins === true
    };

    await admin.save();

    res.json({
      message: 'Admin permissions updated successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Update admin permissions error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Change password
router.put('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long'
      });
    }

    const admin = await Admin.findById(req.admin._id);
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect'
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Admin Chat History Management

// Get all chat sessions (admin only)
router.get('/chat-history', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, language, search } = req.query;
    
    const filter = {
      isActive: true,
      $expr: { $gt: [{ $size: "$messages" }, 0] } // Only sessions with messages
    };

    // Filter by specific user if provided
    if (userId) {
      filter.userId = userId;
    }

    // Filter by language if provided
    if (language) {
      filter.language = language;
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } }
      ];
    }

    const sessions = await ChatHistory.find(filter)
      .populate('userId', 'profile email')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId title language messages createdAt updatedAt userId metadata');

    const total = await ChatHistory.countDocuments(filter);

    // Format sessions with user info and message count
    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      title: session.title,
      language: session.language,
      messageCount: session.messages.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      user: session.userId ? {
        id: session.userId._id,
        name: `${session.userId.profile?.firstName || ''} ${session.userId.profile?.lastName || ''}`.trim(),
        email: session.userId.email
      } : null,
      metadata: session.metadata,
      lastMessage: session.messages.length > 0 ? {
        content: session.messages[session.messages.length - 1].content.substring(0, 100) + '...',
        timestamp: session.messages[session.messages.length - 1].timestamp,
        role: session.messages[session.messages.length - 1].role
      } : null
    }));

    res.json({
      sessions: formattedSessions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalSessions: total
    });

  } catch (error) {
    console.error('Error fetching admin chat history:', error);
    res.status(500).json({
      message: 'Error fetching chat history'
    });
  }
});

// Get specific chat session details (admin only)
router.get('/chat-history/:sessionId', adminAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chatHistory = await ChatHistory.findOne({
      sessionId,
      isActive: true
    }).populate('userId', 'profile email');

    if (!chatHistory) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({
      sessionId: chatHistory.sessionId,
      title: chatHistory.title,
      language: chatHistory.language,
      messages: chatHistory.messages,
      createdAt: chatHistory.createdAt,
      updatedAt: chatHistory.updatedAt,
      user: chatHistory.userId ? {
        id: chatHistory.userId._id,
        name: `${chatHistory.userId.profile?.firstName || ''} ${chatHistory.userId.profile?.lastName || ''}`.trim(),
        email: chatHistory.userId.email,
        profile: chatHistory.userId.profile
      } : null,
      metadata: chatHistory.metadata,
      messageCount: chatHistory.messages.length
    });

  } catch (error) {
    console.error('Error fetching chat session details:', error);
    res.status(500).json({
      message: 'Error fetching chat session details'
    });
  }
});

// Get chat history statistics (admin only)
router.get('/chat-history/stats/overview', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = await ChatHistory.aggregate([
      { 
        $match: { 
          isActive: true,
          $expr: { $gt: [{ $size: "$messages" }, 0] },
          ...dateFilter
        } 
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          uniqueUsers: { $addToSet: '$userId' },
          languagesUsed: { $addToSet: '$language' },
          avgMessagesPerSession: { $avg: { $size: '$messages' } },
          lastChatDate: { $max: '$updatedAt' },
          firstChatDate: { $min: '$createdAt' }
        }
      },
      {
        $project: {
          totalSessions: 1,
          totalMessages: 1,
          uniqueUsersCount: { $size: '$uniqueUsers' },
          languagesUsed: 1,
          avgMessagesPerSession: { $round: ['$avgMessagesPerSession', 2] },
          lastChatDate: 1,
          firstChatDate: 1
        }
      }
    ]);

    // Get language breakdown
    const languageStats = await ChatHistory.aggregate([
      { 
        $match: { 
          isActive: true,
          $expr: { $gt: [{ $size: "$messages" }, 0] },
          ...dateFilter
        } 
      },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get daily activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await ChatHistory.aggregate([
      { 
        $match: { 
          isActive: true,
          $expr: { $gt: [{ $size: "$messages" }, 0] },
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          sessions: { $sum: 1 },
          messages: { $sum: { $size: '$messages' } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const result = stats[0] || {
      totalSessions: 0,
      totalMessages: 0,
      uniqueUsersCount: 0,
      languagesUsed: [],
      avgMessagesPerSession: 0,
      lastChatDate: null,
      firstChatDate: null
    };

    res.json({
      overview: result,
      languageBreakdown: languageStats,
      dailyActivity: dailyActivity.map(day => ({
        date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
        sessions: day.sessions,
        messages: day.messages
      }))
    });

  } catch (error) {
    console.error('Error fetching chat history statistics:', error);
    res.status(500).json({
      message: 'Error fetching chat history statistics'
    });
  }
});

// Delete chat session (admin only - hard delete)
router.delete('/chat-history/:sessionId', adminAuth, checkPermission('canDelete'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chatHistory = await ChatHistory.findOne({ sessionId });

    if (!chatHistory) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    await ChatHistory.deleteOne({ sessionId });

    res.json({ 
      message: 'Chat session deleted successfully',
      sessionId 
    });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      message: 'Error deleting chat session'
    });
  }
});

// Bulk delete chat sessions (admin only)
router.post('/chat-history/bulk-delete', adminAuth, checkPermission('canDelete'), async (req, res) => {
  try {
    const { sessionIds, criteria } = req.body;

    let deleteFilter = {};

    if (sessionIds && sessionIds.length > 0) {
      // Delete specific sessions
      deleteFilter.sessionId = { $in: sessionIds };
    } else if (criteria) {
      // Delete based on criteria
      if (criteria.olderThan) {
        deleteFilter.createdAt = { $lt: new Date(criteria.olderThan) };
      }
      if (criteria.userId) {
        deleteFilter.userId = criteria.userId;
      }
      if (criteria.language) {
        deleteFilter.language = criteria.language;
      }
      if (criteria.emptyOnly) {
        deleteFilter.$or = [
          { messages: { $size: 0 } },
          { messages: { $exists: false } }
        ];
      }
    } else {
      return res.status(400).json({ message: 'Either sessionIds or criteria must be provided' });
    }

    const result = await ChatHistory.deleteMany(deleteFilter);

    res.json({
      message: 'Chat sessions deleted successfully',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error bulk deleting chat sessions:', error);
    res.status(500).json({
      message: 'Error bulk deleting chat sessions'
    });
  }
});

// Export chat history data (admin only)
router.get('/chat-history/export/:format', adminAuth, async (req, res) => {
  try {
    const { format } = req.params;
    const { userId, startDate, endDate, language } = req.query;

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ message: 'Format must be json or csv' });
    }

    const filter = {
      isActive: true,
      $expr: { $gt: [{ $size: "$messages" }, 0] }
    };

    if (userId) filter.userId = userId;
    if (language) filter.language = language;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sessions = await ChatHistory.find(filter)
      .populate('userId', 'profile email')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="chat-history-${new Date().toISOString().split('T')[0]}.json"`);
      
      const exportData = sessions.map(session => ({
        sessionId: session.sessionId,
        title: session.title,
        language: session.language,
        user: session.userId ? {
          email: session.userId.email,
          name: `${session.userId.profile?.firstName || ''} ${session.userId.profile?.lastName || ''}`.trim()
        } : null,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        metadata: session.metadata
      }));

      res.json(exportData);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="chat-history-${new Date().toISOString().split('T')[0]}.csv"`);
      
      // CSV headers
      let csv = 'Session ID,Title,Language,User Email,User Name,Message Count,Created At,Updated At,Last Message\n';
      
      sessions.forEach(session => {
        const userName = session.userId ? `${session.userId.profile?.firstName || ''} ${session.userId.profile?.lastName || ''}`.trim() : '';
        const userEmail = session.userId ? session.userId.email : '';
        const lastMessage = session.messages.length > 0 ? 
          session.messages[session.messages.length - 1].content.replace(/"/g, '""').substring(0, 100) : '';
        
        csv += `"${session.sessionId}","${session.title}","${session.language}","${userEmail}","${userName}",${session.messages.length},"${session.createdAt.toISOString()}","${session.updatedAt.toISOString()}","${lastMessage}"\n`;
      });
      
      res.send(csv);
    }

  } catch (error) {
    console.error('Error exporting chat history:', error);
    res.status(500).json({
      message: 'Error exporting chat history'
    });
  }
});

module.exports = router;