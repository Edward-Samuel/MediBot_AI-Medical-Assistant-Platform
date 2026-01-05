const express = require('express');
const Patient = require('../models/Patient');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to authenticate user
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Get patient profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can access patient profiles' });
    }

    const patient = await Patient.findOne({ userId: req.user._id })
      .populate('userId', 'profile email');

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.json({ patient });

  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ message: 'Error fetching patient profile' });
  }
});

// Update patient profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can update patient profiles' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const {
      medicalHistory,
      allergies,
      medications,
      emergencyContact,
      insurance,
      bloodType,
      height,
      weight,
      preferredLanguage
    } = req.body;

    // Update patient fields
    if (medicalHistory) patient.medicalHistory = medicalHistory;
    if (allergies) patient.allergies = allergies;
    if (medications) patient.medications = medications;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    if (insurance) patient.insurance = insurance;
    if (bloodType) patient.bloodType = bloodType;
    if (height !== undefined) patient.height = height;
    if (weight !== undefined) patient.weight = weight;
    if (preferredLanguage) patient.preferredLanguage = preferredLanguage;

    await patient.save();

    res.json({ message: 'Profile updated successfully', patient });

  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Add medical history entry
router.post('/medical-history', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can add medical history' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const { condition, diagnosedDate, status, notes } = req.body;

    if (!condition) {
      return res.status(400).json({ message: 'Condition is required' });
    }

    const historyEntry = {
      condition,
      diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : new Date(),
      status: status || 'active',
      notes
    };

    patient.medicalHistory.push(historyEntry);
    await patient.save();

    res.json({ message: 'Medical history added successfully', patient });

  } catch (error) {
    console.error('Add medical history error:', error);
    res.status(500).json({ message: 'Error adding medical history' });
  }
});

// Add allergy
router.post('/allergies', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can add allergies' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const { allergen, severity, reaction } = req.body;

    if (!allergen) {
      return res.status(400).json({ message: 'Allergen is required' });
    }

    const allergyEntry = {
      allergen,
      severity: severity || 'mild',
      reaction
    };

    patient.allergies.push(allergyEntry);
    await patient.save();

    res.json({ message: 'Allergy added successfully', patient });

  } catch (error) {
    console.error('Add allergy error:', error);
    res.status(500).json({ message: 'Error adding allergy' });
  }
});

// Add medication
router.post('/medications', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can add medications' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const { name, dosage, frequency, startDate, endDate, prescribedBy } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Medication name is required' });
    }

    const medicationEntry = {
      name,
      dosage,
      frequency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      prescribedBy
    };

    patient.medications.push(medicationEntry);
    await patient.save();

    res.json({ message: 'Medication added successfully', patient });

  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ message: 'Error adding medication' });
  }
});

module.exports = router;