const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const admin = await Admin.findById(decoded.userId).select('-password');
    
    if (!admin) {
      return res.status(401).json({ 
        message: 'Invalid token. Admin not found.' 
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated.' 
      });
    }

    req.admin = admin;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired.' 
      });
    }
    
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during authentication.' 
    });
  }
};

// Middleware to check specific permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    if (!req.admin.permissions[permission]) {
      return res.status(403).json({ 
        message: `Access denied. ${permission} permission required.` 
      });
    }

    next();
  };
};

// Middleware to check if user is super admin
const superAdminOnly = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }

  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ 
      message: 'Access denied. Super admin privileges required.' 
    });
  }

  next();
};

module.exports = {
  adminAuth,
  checkPermission,
  superAdminOnly
};