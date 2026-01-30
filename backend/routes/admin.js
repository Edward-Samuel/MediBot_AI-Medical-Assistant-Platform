const express = require('express');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get current admin profile
router.get('/profile', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      admin: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.adminPermissions,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
        profile: req.user.profile
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Create new admin (admin with canManageAdmins permission only)
router.post('/create', authenticateToken, requirePermission('canManageAdmins'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, permissions = {} } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message: 'Email, password, first name, and last name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Create new admin user
    const adminUser = new User({
      email: email.toLowerCase(),
      password,
      role: 'admin',
      profile: {
        firstName,
        lastName
      },
      adminPermissions: {
        canUpload: permissions.canUpload !== false,
        canDelete: permissions.canDelete !== false,
        canManageAdmins: permissions.canManageAdmins === true
      }
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.adminPermissions,
        profile: adminUser.profile,
        createdAt: adminUser.createdAt
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// List all admins (admin with canManageAdmins permission only)
router.get('/list', authenticateToken, requirePermission('canManageAdmins'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: 'admin' });

    res.json({
      admins: admins.map(admin => ({
        id: admin._id,
        email: admin.email,
        role: admin.role,
        permissions: admin.adminPermissions,
        profile: admin.profile,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Update admin status (admin with canManageAdmins permission only)
router.put('/:adminId/status', authenticateToken, requirePermission('canManageAdmins'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive must be a boolean value'
      });
    }

    // Prevent self-deactivation
    if (adminId === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        message: 'Cannot deactivate your own account'
      });
    }

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
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
        email: admin.email,
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

// Update admin permissions (admin with canManageAdmins permission only)
router.put('/:adminId/permissions', authenticateToken, requirePermission('canManageAdmins'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        message: 'Valid permissions object is required'
      });
    }

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({
        message: 'Admin not found'
      });
    }

    // Update permissions
    admin.adminPermissions = {
      canUpload: permissions.canUpload !== false,
      canDelete: permissions.canDelete !== false,
      canManageAdmins: permissions.canManageAdmins === true
    };

    await admin.save();

    res.json({
      message: 'Admin permissions updated successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        permissions: admin.adminPermissions
      }
    });
  } catch (error) {
    console.error('Update admin permissions error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Change admin password
router.put('/change-password', authenticateToken, requireAdmin, async (req, res) => {
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

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

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

// Chat History Management Routes

// Get all chat sessions (admin only)
router.get('/chat-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { language, search, startDate, endDate } = req.query;
    
    // Build filter
    let filter = {};
    
    if (language && language !== 'all') {
      filter.language = language;
    }
    
    if (search) {
      filter.$or = [
        { sessionId: { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sessions = await ChatHistory.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email profile.firstName profile.lastName role');

    const total = await ChatHistory.countDocuments(filter);

    // Format sessions for response
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      sessionId: session.sessionId,
      userId: session.userId?._id,
      userEmail: session.userId?.email,
      userName: session.userId ? 
        `${session.userId.profile?.firstName || ''} ${session.userId.profile?.lastName || ''}`.trim() : 
        'Anonymous',
      userRole: session.userId?.role,
      language: session.language,
      messageCount: session.messages.length,
      lastMessage: session.messages.length > 0 ? 
        session.messages[session.messages.length - 1].content.substring(0, 100) + '...' : 
        'No messages',
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));

    res.json({
      sessions: formattedSessions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Get specific chat session details (admin only)
router.get('/chat-history/:sessionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatHistory.findOne({ sessionId })
      .populate('userId', 'email profile.firstName profile.lastName role');
    
    if (!session) {
      return res.status(404).json({
        message: 'Chat session not found'
      });
    }

    res.json({
      session: {
        id: session._id,
        sessionId: session.sessionId,
        userId: session.userId?._id,
        userEmail: session.userId?.email,
        userName: session.userId ? 
          `${session.userId.profile?.firstName || ''} ${session.userId.profile?.lastName || ''}`.trim() : 
          'Anonymous',
        userRole: session.userId?.role,
        language: session.language,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Delete chat session (admin with canDelete permission only)
router.delete('/chat-history/:sessionId', authenticateToken, requirePermission('canDelete'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatHistory.findOneAndDelete({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        message: 'Chat session not found'
      });
    }

    res.json({
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Bulk delete chat sessions (admin with canDelete permission only)
router.post('/chat-history/bulk-delete', authenticateToken, requirePermission('canDelete'), async (req, res) => {
  try {
    const { sessionIds } = req.body;
    
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        message: 'Session IDs array is required'
      });
    }

    const result = await ChatHistory.deleteMany({
      sessionId: { $in: sessionIds }
    });

    res.json({
      message: `${result.deletedCount} chat sessions deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete chat sessions error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Export chat history (admin only)
router.get('/chat-history/export/:format', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { format } = req.params;
    const { startDate, endDate, language } = req.query;
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        message: 'Format must be json or csv'
      });
    }

    // Build filter
    let filter = {};
    if (language && language !== 'all') {
      filter.language = language;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sessions = await ChatHistory.find(filter)
      .populate('userId', 'email profile.firstName profile.lastName role')
      .sort({ createdAt: -1 });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=chat-history-${Date.now()}.json`);
      res.json(sessions);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=chat-history-${Date.now()}.csv`);
      
      // CSV headers
      let csv = 'Session ID,User Email,User Name,Language,Message Count,Created At,Updated At\n';
      
      // CSV data
      sessions.forEach(session => {
        const userName = session.userId ? 
          `${session.userId.profile?.firstName || ''} ${session.userId.profile?.lastName || ''}`.trim() : 
          'Anonymous';
        
        csv += `"${session.sessionId}","${session.userId?.email || ''}","${userName}","${session.language}",${session.messages.length},"${session.createdAt}","${session.updatedAt}"\n`;
      });
      
      res.send(csv);
    }
  } catch (error) {
    console.error('Export chat history error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// Get chat history statistics (admin only)
router.get('/chat-history/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalSessions = await ChatHistory.countDocuments();
    const totalMessages = await ChatHistory.aggregate([
      { $project: { messageCount: { $size: '$messages' } } },
      { $group: { _id: null, total: { $sum: '$messageCount' } } }
    ]);

    const languageStats = await ChatHistory.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentActivity = await ChatHistory.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('userId', 'email profile.firstName profile.lastName');

    res.json({
      stats: {
        totalSessions,
        totalMessages: totalMessages[0]?.total || 0,
        languageDistribution: languageStats,
        recentActivity: recentActivity.map(session => ({
          sessionId: session.sessionId,
          userEmail: session.userId?.email,
          language: session.language,
          messageCount: session.messages.length,
          updatedAt: session.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

module.exports = router;