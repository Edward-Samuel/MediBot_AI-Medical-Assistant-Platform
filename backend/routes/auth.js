const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, userType = 'user') => {
  return jwt.sign({ 
    userId, 
    type: userType 
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['patient', 'doctor']),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, firstName, lastName, phone, specialization, licenseNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      profile: {
        firstName,
        lastName,
        phone
      }
    });

    await user.save();

    // Create role-specific profile
    if (role === 'doctor') {
      if (!specialization || !licenseNumber) {
        return res.status(400).json({ message: 'Specialization and license number required for doctors' });
      }

      const doctor = new Doctor({
        userId: user._id,
        licenseNumber,
        specialization,
        experience: req.body.experience || 0,
        availability: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '13:00', available: false },
          sunday: { start: '09:00', end: '13:00', available: false }
        }
      });
      await doctor.save();
    } else if (role === 'patient') {
      const patient = new Patient({
        userId: user._id,
        bloodType: req.body.bloodType,
        emergencyContact: req.body.emergencyContact
      });
      await patient.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login - Common endpoint for all user types (patients, doctors, admins)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email/username and password are required' 
      });
    }

    let user = null;
    let userType = 'user';
    let additionalData = {};

    // Normalize the email/username input
    const loginIdentifier = email.toLowerCase();

    // First, try to find admin by email or username
    const admin = await Admin.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier }
      ]
    });

    if (admin) {
      if (!admin.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      const token = generateToken(admin._id, 'admin');

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: admin._id,
          email: admin.email,
          username: admin.username,
          role: admin.role,
          type: 'admin',
          permissions: admin.permissions,
          lastLogin: admin.lastLogin
        }
      });
    }

    // If not admin, try regular user (only by email for regular users)
    if (loginIdentifier.includes('@')) {
      user = await User.findOne({ email: loginIdentifier });
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get role-specific data
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) {
        additionalData = {
          licenseNumber: doctor.licenseNumber,
          specialization: doctor.specialization,
          experience: doctor.experience,
          availability: doctor.availability
        };
      }
    } else if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) {
        additionalData = {
          bloodType: patient.bloodType,
          emergencyContact: patient.emergencyContact,
          medicalHistory: patient.medicalHistory
        };
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, 'user');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        type: 'user',
        profile: user.profile,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user - Works for all user types
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'admin') {
      // Handle admin user
      const admin = await Admin.findById(decoded.userId).select('-password');
      if (!admin) {
        return res.status(401).json({ message: 'Admin not found' });
      }

      return res.json({ 
        user: {
          id: admin._id,
          email: admin.email,
          username: admin.username,
          role: admin.role,
          type: 'admin',
          permissions: admin.permissions,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt
        }
      });
    } else {
      // Handle regular user (patient/doctor)
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      let additionalData = {};
      
      // Get role-specific data
      if (user.role === 'doctor') {
        const doctor = await Doctor.findOne({ userId: user._id });
        if (doctor) {
          additionalData = {
            licenseNumber: doctor.licenseNumber,
            specialization: doctor.specialization,
            experience: doctor.experience,
            availability: doctor.availability
          };
        }
      } else if (user.role === 'patient') {
        const patient = await Patient.findOne({ userId: user._id });
        if (patient) {
          additionalData = {
            bloodType: patient.bloodType,
            emergencyContact: patient.emergencyContact,
            medicalHistory: patient.medicalHistory
          };
        }
      }

      return res.json({ 
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          type: 'user',
          profile: user.profile,
          ...additionalData
        }
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;