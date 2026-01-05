const express = require('express');
const Doctor = require('../models/Doctor');
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

// Get all doctors with filters
router.get('/', async (req, res) => {
  try {
    const { specialization, search, page = 1, limit = 10 } = req.query;
    
    let query = { isVerified: true };
    
    // Add specialization filter
    if (specialization) {
      query.specialization = specialization;
    }
    
    const doctors = await Doctor.find(query)
      .populate('userId', 'profile')
      .sort({ 'rating.average': -1, experience: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by search term if provided
    let filteredDoctors = doctors;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredDoctors = doctors.filter(doctor => 
        doctor.userId.profile.firstName.toLowerCase().includes(searchTerm) ||
        doctor.userId.profile.lastName.toLowerCase().includes(searchTerm) ||
        doctor.specialization.toLowerCase().includes(searchTerm)
      );
    }

    const formattedDoctors = filteredDoctors.map(doctor => ({
      id: doctor._id,
      name: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
      specialization: doctor.specialization,
      subSpecialization: doctor.subSpecialization,
      experience: doctor.experience,
      rating: doctor.rating,
      languages: doctor.languages,
      bio: doctor.bio,
      profileImage: doctor.profileImage,
      availability: doctor.availability
    }));

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors: formattedDoctors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'profile');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const formattedDoctor = {
      id: doctor._id,
      name: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
      email: doctor.userId.email,
      phone: doctor.userId.profile.phone,
      specialization: doctor.specialization,
      subSpecialization: doctor.subSpecialization,
      experience: doctor.experience,
      education: doctor.education,
      certifications: doctor.certifications,
      languages: doctor.languages,
      rating: doctor.rating,
      bio: doctor.bio,
      profileImage: doctor.profileImage,
      availability: doctor.availability,
      isVerified: doctor.isVerified
    };

    res.json({ doctor: formattedDoctor });

  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ message: 'Error fetching doctor details' });
  }
});

// Update doctor profile (doctors only)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update doctor profiles' });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const {
      specialization,
      subSpecialization,
      experience,
      education,
      certifications,
      languages,
      bio,
      availability
    } = req.body;

    // Update doctor fields
    if (specialization) doctor.specialization = specialization;
    if (subSpecialization) doctor.subSpecialization = subSpecialization;
    if (experience !== undefined) doctor.experience = experience;
    if (education) doctor.education = education;
    if (certifications) doctor.certifications = certifications;
    if (languages) doctor.languages = languages;
    if (bio) doctor.bio = bio;
    if (availability) doctor.availability = availability;

    await doctor.save();

    res.json({ message: 'Profile updated successfully', doctor });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get specializations list
router.get('/meta/specializations', async (req, res) => {
  try {
    const specializations = [
      'General Medicine',
      'Cardiology',
      'Dermatology',
      'Endocrinology',
      'Gastroenterology',
      'Neurology',
      'Oncology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry',
      'Pulmonology',
      'Radiology',
      'Surgery',
      'Urology',
      'Gynecology',
      'Ophthalmology',
      'ENT',
      'Emergency Medicine'
    ];

    res.json({ specializations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching specializations' });
  }
});

module.exports = router;