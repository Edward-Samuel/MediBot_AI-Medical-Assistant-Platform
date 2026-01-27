const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'docx', 'txt', 'csv', 'md']
  },
  fileSize: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  chunks: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    metadata: {
      chunkIndex: {
        type: Number,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['qa_pair', 'detected_qa', 'content_chunk']
      },
      question: {
        type: String,
        default: ''
      },
      answer: {
        type: String,
        default: ''
      },
      questionLength: {
        type: Number,
        default: 0
      },
      answerLength: {
        type: Number,
        default: 0
      },
      startChar: {
        type: Number,
        default: 0
      },
      endChar: {
        type: Number,
        default: 0
      }
    }
  }],
  pineconeIds: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  description: {
    type: String,
    trim: true
  },
  // Q&A specific fields
  isQAFormat: {
    type: Boolean,
    default: false
  },
  qaCount: {
    type: Number,
    default: 0
  },
  processingStats: {
    totalChunks: Number,
    qaChunks: Number,
    contentChunks: Number,
    processingTime: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
faqSchema.index({ isActive: 1, category: 1 });
faqSchema.index({ uploadedBy: 1 });
faqSchema.index({ tags: 1 });

// Update lastUpdated on save
faqSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('FAQ', faqSchema);