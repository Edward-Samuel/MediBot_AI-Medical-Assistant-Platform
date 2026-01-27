const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle different token types
    if (decoded.type === 'admin') {
      // Admin token - look up in Admin collection
      const admin = await Admin.findById(decoded.userId).select('-password');
      
      if (!admin) {
        return res.status(401).json({ message: 'Invalid token. Admin not found.' });
      }

      if (!admin.isActive) {
        return res.status(401).json({ message: 'Account is deactivated.' });
      }

      // Set user object with admin data for compatibility with chat history
      req.user = {
        _id: admin._id,
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        type: 'admin',
        permissions: admin.permissions,
        isActive: admin.isActive,
        profile: {
          firstName: admin.username,
          lastName: 'Admin'
        }
      };
    } else {
      // Regular user token - look up in User collection
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid token. User not found.' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated.' });
      }

      // Set both user object and id for compatibility
      req.user = user;
      req.user.id = user._id; // Ensure id field is available
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};