const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  language: {
    type: String,
    default: 'en'
  }
});

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Medical Consultation'
  },
  messages: [messageSchema],
  language: {
    type: String,
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceType: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatHistorySchema.index({ userId: 1, createdAt: -1 });
chatHistorySchema.index({ userId: 1, sessionId: 1 });
chatHistorySchema.index({ userId: 1, isActive: 1 });

// Text search index for search functionality
chatHistorySchema.index({ 
  title: 'text', 
  'messages.content': 'text' 
}, {
  weights: {
    title: 10,
    'messages.content': 1
  }
});

// Virtual for message count
chatHistorySchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add a message
chatHistorySchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  this.updatedAt = new Date();
  return this.save();
};

// Method to get recent messages
chatHistorySchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Static method to get user's chat sessions
chatHistorySchema.statics.getUserSessions = function(userId, limit = 20) {
  return this.find({ userId, isActive: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('sessionId title updatedAt messages language');
};

// Static method to create new session
chatHistorySchema.statics.createSession = function(userId, sessionId, language = 'en', metadata = {}) {
  return this.create({
    userId,
    sessionId,
    language,
    metadata,
    messages: []
  });
};

// Pre-save middleware to update title based on first user message
chatHistorySchema.pre('save', function(next) {
  if (this.isNew || this.title === 'Medical Consultation') {
    const firstUserMessage = this.messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      // Create title from first 50 characters of first user message
      const title = firstUserMessage.content.substring(0, 50).trim();
      this.title = title.length > 0 ? title + (title.length === 50 ? '...' : '') : 'Medical Consultation';
    }
  }
  next();
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);