const mongoose = require('mongoose');

// Comprehensive EHR Schema for storing detailed patient medical records
const ehrSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Demographics
  demographics: {
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    ethnicity: String,
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed', 'other'] },
    occupation: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },

  // Vital Signs History
  vitals: [{
    recordedDate: { type: Date, default: Date.now },
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number, // bpm
    temperature: Number, // celsius
    respiratoryRate: Number, // breaths per minute
    oxygenSaturation: Number, // percentage
    weight: Number, // kg
    height: Number, // cm
    bmi: Number,
    recordedBy: String,
    notes: String
  }],

  // Lab Results
  labResults: [{
    testDate: { type: Date, default: Date.now },
    testName: String,
    testType: { type: String, enum: ['blood', 'urine', 'imaging', 'biopsy', 'other'] },
    results: [{
      parameter: String,
      value: String,
      unit: String,
      referenceRange: String,
      status: { type: String, enum: ['normal', 'abnormal', 'critical'] }
    }],
    orderedBy: String,
    performedAt: String,
    notes: String,
    attachments: [String] // URLs or file paths
  }],

  // Diagnoses
  diagnoses: [{
    diagnosisDate: { type: Date, default: Date.now },
    condition: { type: String, required: true },
    icdCode: String, // ICD-10 code
    severity: { type: String, enum: ['mild', 'moderate', 'severe', 'critical'] },
    status: { type: String, enum: ['active', 'resolved', 'chronic', 'in_remission'], default: 'active' },
    diagnosedBy: String,
    notes: String,
    treatmentPlan: String
  }],

  // Procedures & Surgeries
  procedures: [{
    procedureDate: Date,
    procedureName: String,
    procedureCode: String, // CPT code
    performedBy: String,
    facility: String,
    outcome: String,
    complications: String,
    notes: String
  }],

  // Immunizations
  immunizations: [{
    vaccineName: String,
    vaccineCode: String, // CVX code
    administeredDate: Date,
    doseNumber: Number,
    administeredBy: String,
    lotNumber: String,
    expirationDate: Date,
    site: String,
    route: String,
    reactions: String
  }],

  // Family History
  familyHistory: [{
    relationship: { type: String, enum: ['father', 'mother', 'sibling', 'brother', 'sister', 'grandfather', 'grandmother', 'grandparent', 'child', 'son', 'daughter', 'aunt', 'uncle', 'cousin', 'other'] },
    condition: String,
    ageOfOnset: Number,
    status: { type: String, enum: ['living', 'deceased'] },
    notes: String
  }],

  // Social History
  socialHistory: {
    smokingStatus: { type: String, enum: ['never', 'former', 'current'] },
    smokingDetails: {
      packsPerDay: Number,
      yearsSmoked: Number,
      quitDate: Date
    },
    alcoholUse: { type: String, enum: ['never', 'occasional', 'moderate', 'heavy'] },
    alcoholDetails: {
      drinksPerWeek: Number
    },
    drugUse: { type: String, enum: ['never', 'former', 'current'] },
    drugDetails: String,
    exerciseFrequency: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
    diet: String,
    stressLevel: { type: String, enum: ['low', 'moderate', 'high'] },
    sleepHours: Number,
    occupation: String,
    livingArrangement: String
  },

  // Clinical Notes
  clinicalNotes: [{
    noteDate: { type: Date, default: Date.now },
    noteType: { type: String, enum: ['progress', 'consultation', 'discharge', 'follow_up', 'other'] },
    chiefComplaint: String,
    historyOfPresentIllness: String,
    physicalExamination: String,
    assessment: String,
    plan: String,
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    providerName: String,
    followUpDate: Date,
    attachments: [String]
  }],

  // Prescriptions History (detailed)
  prescriptions: [{
    prescriptionDate: { type: Date, default: Date.now },
    medicationName: String,
    genericName: String,
    dosage: String,
    route: String,
    frequency: String,
    duration: String,
    quantity: Number,
    refills: Number,
    prescribedBy: String,
    pharmacy: String,
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['active', 'completed', 'discontinued'], default: 'active' },
    reason: String,
    instructions: String
  }],

  // Allergies & Adverse Reactions (detailed)
  allergiesDetailed: [{
    allergen: String,
    allergenType: { type: String, enum: ['medication', 'food', 'environmental', 'other'] },
    reaction: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe', 'life_threatening'] },
    onsetDate: Date,
    verifiedBy: String,
    status: { type: String, enum: ['active', 'inactive', 'resolved'], default: 'active' },
    notes: String
  }],

  // Care Team
  careTeam: [{
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    providerName: String,
    specialty: String,
    role: String,
    isPrimary: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date
  }],

  // Risk Factors
  riskFactors: [{
    factor: String,
    category: { type: String, enum: ['cardiovascular', 'diabetes', 'cancer', 'respiratory', 'other'] },
    severity: { type: String, enum: ['low', 'moderate', 'high'] },
    identifiedDate: Date,
    notes: String
  }],

  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  dataCompleteness: { type: Number, default: 0 }, // percentage
  isActive: { type: Boolean, default: true }
});

// Indexes for efficient querying
ehrSchema.index({ patientId: 1, createdAt: -1 });
ehrSchema.index({ userId: 1 });
ehrSchema.index({ 'diagnoses.status': 1 });
ehrSchema.index({ 'prescriptions.status': 1 });

// Update lastUpdated on save
ehrSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Calculate BMI when vitals are added
ehrSchema.methods.calculateBMI = function(height, weight) {
  if (height && weight) {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return null;
};

// Calculate data completeness
ehrSchema.methods.calculateCompleteness = function() {
  let score = 0;
  const fields = [
    this.demographics?.dateOfBirth,
    this.demographics?.gender,
    this.vitals?.length > 0,
    this.diagnoses?.length > 0,
    this.allergiesDetailed?.length >= 0,
    this.socialHistory?.smokingStatus,
    this.familyHistory?.length >= 0,
    this.careTeam?.length > 0
  ];
  
  score = fields.filter(Boolean).length;
  this.dataCompleteness = Math.round((score / fields.length) * 100);
  return this.dataCompleteness;
};

module.exports = mongoose.model('EHR', ehrSchema);
