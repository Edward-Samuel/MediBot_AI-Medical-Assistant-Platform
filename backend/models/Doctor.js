const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true,
    enum: [
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
    ]
  },
  subSpecialization: String,
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [String],
  languages: [String],
  availability: {
    monday: { start: String, end: String, available: Boolean },
    tuesday: { start: String, end: String, available: Boolean },
    wednesday: { start: String, end: String, available: Boolean },
    thursday: { start: String, end: String, available: Boolean },
    friday: { start: String, end: String, available: Boolean },
    saturday: { start: String, end: String, available: Boolean },
    sunday: { start: String, end: String, available: Boolean }
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  bio: String,
  profileImage: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  googleCalendarId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for search optimization
doctorSchema.index({ specialization: 1, 'rating.average': -1 });
doctorSchema.index({ 'profile.firstName': 'text', 'profile.lastName': 'text', specialization: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);