const express = require('express');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Initialize OAuth2 client for Google Calendar
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({
    userId
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['patient', 'doctor', 'admin']),
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
    } else if (role === 'admin') {
      // Set admin permissions
      user.adminPermissions = {
        canUpload: true,
        canDelete: true,
        canManageAdmins: req.body.canManageAdmins || false
      };
      await user.save();
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
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
    } else if (user.role === 'admin') {
      additionalData = {
        adminPermissions: user.adminPermissions
      };
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
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

    // Handle user lookup
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
    } else if (user.role === 'admin') {
      additionalData = {
        adminPermissions: user.adminPermissions
      };
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        googleCalendar: {
          connected: user.googleCalendar?.connected || false,
          connectedAt: user.googleCalendar?.connectedAt || null,
          calendarId: user.googleCalendar?.calendarId || null
        },
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Google OAuth - Initiate calendar authorization
router.get('/google/calendar', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate authorization URL with state parameter containing user ID
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      state: JSON.stringify({ userId: user._id.toString() }),
      prompt: 'consent' // Force consent screen to get refresh token
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    res.status(500).json({ message: 'Error initiating Google authorization' });
  }
});

// Google OAuth - Callback handler
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code not provided');
    }

    console.log('Received OAuth callback with code');

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Successfully exchanged code for tokens');
    console.log('   Access token:', tokens.access_token ? 'Present' : 'Missing');
    console.log('   Refresh token:', tokens.refresh_token ? 'Present' : 'Missing');
    console.log('   Expiry date:', tokens.expiry_date);

    // Parse state to get user ID
    const stateData = JSON.parse(state);
    const user = await User.findById(stateData.userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    console.log('User found:', user.email);

    // Set credentials to use for fetching profile
    oauth2Client.setCredentials(tokens);

    // Fetch user's Google profile to get the email
    let calendarId = null;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      calendarId = userInfo.data.email;
      console.log('Connected Google Calendar Email:', calendarId);
    } catch (profileError) {
      console.error('❌ Error fetching Google profile:', profileError.message);
      console.error('Full error:', profileError);
      // Don't use fallback - we need the actual Google account email
    }

    // Only save if we successfully got the calendar ID
    if (!calendarId) {
      console.error('❌ Failed to retrieve Google account email');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/calendar-connected?success=false&error=${encodeURIComponent('Failed to retrieve Google account information')}`);
    }

    // Store tokens in user profile
    user.googleCalendar = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      connected: true,
      connectedAt: new Date(),
      calendarId: calendarId // Store the connected email from Google OAuth
    };

    await user.save();
    
    console.log('Google Calendar connected successfully for user:', user.email);
    console.log('   Calendar ID stored:', calendarId);
    console.log('   Tokens saved to database');

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/calendar-connected?success=true`);
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/calendar-connected?success=false&error=${encodeURIComponent(error.message)}`);
  }
});

// Disconnect Google Calendar
router.post('/google/disconnect', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear Google Calendar connection
    user.googleCalendar = {
      connected: false,
      accessToken: null,
      refreshToken: null,
      expiryDate: null,
      connectedAt: null,
      calendarId: null
    };

    await user.save();

    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Google Calendar disconnect error:', error);
    res.status(500).json({ message: 'Error disconnecting Google Calendar' });
  }
});

// Test calendar connection and create a test event
router.post('/google/test-connection', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🧪 Testing calendar connection for user:', user.email);
    console.log('   Connected:', user.googleCalendar?.connected);
    console.log('   Calendar ID:', user.googleCalendar?.calendarId);
    console.log('   Has access token:', !!user.googleCalendar?.accessToken);
    console.log('   Has refresh token:', !!user.googleCalendar?.refreshToken);
    console.log('   Token expiry:', user.googleCalendar?.expiryDate ? new Date(user.googleCalendar.expiryDate) : 'N/A');

    if (!user.googleCalendar?.connected) {
      return res.status(400).json({ 
        message: 'Google Calendar not connected',
        connected: false
      });
    }

    // Try to create a test event
    const googleCalendar = require('../services/googleCalendar');
    
    const testEventDetails = {
      patientName: 'Test Patient',
      patientEmail: user.email,
      doctorName: 'Test Doctor',
      doctorEmail: user.email,
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 30,
      appointmentType: 'test',
      chiefComplaint: 'Test appointment',
      symptoms: []
    };

    const result = await googleCalendar.safeCreateEvent(testEventDetails, user._id);

    res.json({
      message: 'Calendar connection test completed',
      connected: true,
      calendarId: user.googleCalendar.calendarId,
      testResult: {
        success: !!result.eventId,
        eventId: result.eventId,
        eventLink: result.eventLink,
        error: result.error
      }
    });

  } catch (error) {
    console.error('❌ Calendar test error:', error);
    res.status(500).json({ 
      message: 'Calendar test failed',
      error: error.message 
    });
  }
});

// Check Google Calendar connection status
router.get('/google/status', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'No valid token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      connected: user.googleCalendar?.connected || false,
      connectedAt: user.googleCalendar?.connectedAt || null,
      calendarId: user.googleCalendar?.calendarId || null // Only from OAuth
    });
  } catch (error) {
    console.error('Google Calendar status check error:', error);
    res.status(500).json({ message: 'Error checking calendar status' });
  }
});

module.exports = router;