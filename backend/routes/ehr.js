const express = require('express');
const EHR = require('../models/EHR');
const Patient = require('../models/Patient');
const User = require('../models/User');
const ehrAnalysisService = require('../services/ehrAnalysisService');
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

// Get or create EHR for authenticated patient
router.get('/my-ehr', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can access EHR' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });

    if (!ehr) {
      // Create new EHR if doesn't exist
      ehr = new EHR({
        patientId: patient._id,
        userId: req.user._id
      });
      await ehr.save();
    }

    res.json({ ehr });
  } catch (error) {
    console.error('Get EHR error:', error);
    res.status(500).json({ message: 'Error fetching EHR' });
  }
});

// Get holistic health analysis
router.get('/analysis', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient' && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const analysis = await ehrAnalysisService.getHolisticAnalysis(patient._id);
    
    res.json({ analysis });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ message: error.message || 'Error generating analysis' });
  }
});

// Update demographics
router.put('/demographics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can update demographics' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: req.user._id });
    }

    ehr.demographics = { ...ehr.demographics, ...req.body };
    ehr.calculateCompleteness();
    await ehr.save();

    res.json({ message: 'Demographics updated successfully', ehr });
  } catch (error) {
    console.error('Update demographics error:', error);
    res.status(500).json({ message: 'Error updating demographics' });
  }
});

// Add vital signs
router.post('/vitals', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient' && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: req.user._id });
    }

    const vitalEntry = { ...req.body, recordedDate: new Date() };
    
    // Calculate BMI if height and weight provided
    if (vitalEntry.height && vitalEntry.weight) {
      vitalEntry.bmi = ehr.calculateBMI(vitalEntry.height, vitalEntry.weight);
    }

    ehr.vitals.push(vitalEntry);
    await ehr.save();

    res.json({ message: 'Vitals added successfully', vitals: vitalEntry });
  } catch (error) {
    console.error('Add vitals error:', error);
    res.status(500).json({ message: 'Error adding vitals' });
  }
});

// Add diagnosis
router.post('/diagnoses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can add diagnoses' });
    }

    const { patientEmail, ...diagnosisData } = req.body;
    
    const user = await User.findOne({ email: patientEmail });
    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: user._id });
    }

    const diagnosis = {
      ...diagnosisData,
      diagnosisDate: new Date(),
      diagnosedBy: req.user.profile?.name || req.user.email
    };

    ehr.diagnoses.push(diagnosis);
    await ehr.save();

    res.json({ message: 'Diagnosis added successfully', diagnosis });
  } catch (error) {
    console.error('Add diagnosis error:', error);
    res.status(500).json({ message: 'Error adding diagnosis' });
  }
});

// Add lab result
router.post('/lab-results', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can add lab results' });
    }

    const { patientEmail, ...labData } = req.body;
    
    const user = await User.findOne({ email: patientEmail });
    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: user._id });
    }

    const labResult = {
      ...labData,
      testDate: labData.testDate || new Date(),
      orderedBy: req.user.profile?.name || req.user.email
    };

    ehr.labResults.push(labResult);
    await ehr.save();

    res.json({ message: 'Lab result added successfully', labResult });
  } catch (error) {
    console.error('Add lab result error:', error);
    res.status(500).json({ message: 'Error adding lab result' });
  }
});

// Add prescription
router.post('/prescriptions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can add prescriptions' });
    }

    const { patientEmail, ...prescriptionData } = req.body;
    
    const user = await User.findOne({ email: patientEmail });
    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: user._id });
    }

    const prescription = {
      ...prescriptionData,
      prescriptionDate: new Date(),
      prescribedBy: req.user.profile?.name || req.user.email,
      status: 'active'
    };

    ehr.prescriptions.push(prescription);
    await ehr.save();

    res.json({ message: 'Prescription added successfully', prescription });
  } catch (error) {
    console.error('Add prescription error:', error);
    res.status(500).json({ message: 'Error adding prescription' });
  }
});

// Add allergy
router.post('/allergies', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient' && req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: req.user._id });
    }

    const allergy = {
      ...req.body,
      onsetDate: req.body.onsetDate || new Date(),
      status: 'active'
    };

    ehr.allergiesDetailed.push(allergy);
    await ehr.save();

    res.json({ message: 'Allergy added successfully', allergy });
  } catch (error) {
    console.error('Add allergy error:', error);
    res.status(500).json({ message: 'Error adding allergy' });
  }
});

// Update social history
router.put('/social-history', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can update social history' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: req.user._id });
    }

    ehr.socialHistory = { ...ehr.socialHistory, ...req.body };
    ehr.calculateCompleteness();
    await ehr.save();

    res.json({ message: 'Social history updated successfully', socialHistory: ehr.socialHistory });
  } catch (error) {
    console.error('Update social history error:', error);
    res.status(500).json({ message: 'Error updating social history' });
  }
});

// Add family history
router.post('/family-history', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can add family history' });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: req.user._id });
    }

    ehr.familyHistory.push(req.body);
    await ehr.save();

    res.json({ message: 'Family history added successfully', familyHistory: req.body });
  } catch (error) {
    console.error('Add family history error:', error);
    res.status(500).json({ message: 'Error adding family history' });
  }
});

// Add clinical note
router.post('/clinical-notes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can add clinical notes' });
    }

    const { patientEmail, ...noteData } = req.body;
    
    const user = await User.findOne({ email: patientEmail });
    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    let ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      ehr = new EHR({ patientId: patient._id, userId: user._id });
    }

    const clinicalNote = {
      ...noteData,
      noteDate: new Date(),
      providerName: req.user.profile?.name || req.user.email
    };

    ehr.clinicalNotes.push(clinicalNote);
    await ehr.save();

    res.json({ message: 'Clinical note added successfully', clinicalNote });
  } catch (error) {
    console.error('Add clinical note error:', error);
    res.status(500).json({ message: 'Error adding clinical note' });
  }
});

module.exports = router;
