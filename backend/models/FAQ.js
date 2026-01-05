const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'General',
      'Appointments',
      'Doctors',
      'Medical',
      'Technical',
      'Billing',
      'Privacy',
      'Emergency'
    ],
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  viewCount: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Text search index for RAG functionality
faqSchema.index({ 
  question: 'text', 
  answer: 'text', 
  tags: 'text' 
}, {
  weights: {
    question: 10,
    tags: 5,
    answer: 1
  }
});

// Category and priority index
faqSchema.index({ category: 1, priority: -1 });

// Update timestamp on save
faqSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to increment view count
faqSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to mark as helpful
faqSchema.methods.markHelpful = function() {
  this.helpfulCount += 1;
  return this.save();
};

// Method to mark as not helpful
faqSchema.methods.markNotHelpful = function() {
  this.notHelpfulCount += 1;
  return this.save();
};

module.exports = mongoose.model('FAQ', faqSchema);