# Intent Classifier for Healthcare Chatbot

## Overview

The Intent Classifier is a sophisticated routing system that automatically determines user intent and routes messages to the appropriate handler (FAQ system, general chat, appointment booking, or emergency response). This ensures users get the most relevant and helpful responses.

## Supported Intents

### 1. FAQ Intent
**Purpose**: Route factual questions and information requests to the knowledge base

**Triggers**:
- Questions starting with what/how/why/when/where
- Information-seeking phrases ("tell me about", "explain", "information about")
- Questions ending with "?"
- Longer messages (>50 characters) seeking information
- Safety/security related queries
- Medical fact questions

**Examples**:
- "What is diabetes?"
- "How do I book an appointment?"
- "Tell me about your privacy policy"
- "What are the symptoms of high blood pressure?"

### 2. General Chat Intent
**Purpose**: Route personal medical concerns and conversational interactions to AI chat

**Triggers**:
- Personal symptom descriptions ("I feel", "I have", "My ... hurts")
- Conversational greetings and responses
- Personal health experiences
- Requests for personalized medical advice

**Examples**:
- "I have been feeling dizzy lately"
- "My chest hurts when I breathe"
- "Hello, how are you?"
- "Can you help me with my back pain?"

### 3. Appointment Intent
**Purpose**: Route appointment booking requests to the booking system

**Triggers**:
- Appointment booking keywords
- Scheduling requests
- Doctor consultation requests

**Examples**:
- "I want to book an appointment"
- "Schedule a consultation"
- "See a cardiologist"

### 4. Emergency Intent
**Purpose**: Route urgent medical situations to emergency response

**Triggers**:
- Emergency keywords (chest pain, heart attack, stroke, etc.)
- Life-threatening situations
- Urgent medical terms

**Examples**:
- "I'm having severe chest pain"
- "I think I'm having a heart attack"
- "Difficulty breathing"

## Architecture

### Classification Methods

1. **Rule-Based Classification**
   - Pattern matching using regex
   - Keyword detection
   - Length-based scoring
   - Context analysis

2. **AI-Based Classification**
   - OpenRouter AI for ambiguous cases
   - Fallback when rule-based confidence is low
   - Natural language understanding

3. **Hybrid Approach**
   - Combines both methods for optimal accuracy
   - Uses rule-based for clear patterns
   - Falls back to AI for edge cases

### Confidence Scoring

The classifier returns confidence scores (0.0 to 1.0) indicating certainty:
- **0.8-1.0**: High confidence, use classification
- **0.5-0.8**: Medium confidence, may use AI fallback
- **0.0-0.5**: Low confidence, requires AI assistance

## API Endpoints

### Chat with Intent Classification
```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "What is diabetes?",
  "conversationHistory": [],
  "language": "en"
}
```

**Response**:
```json
{
  "response": "Diabetes is a chronic condition...",
  "intentData": {
    "intent": "faq",
    "confidence": 0.95,
    "method": "rule_based",
    "reasoning": "FAQ score: 0.85, General chat score: 0.20"
  },
  "faqData": {
    "usedFAQ": true,
    "resultsCount": 3,
    "source": "pinecone"
  }
}
```

### Test Intent Classification
```http
POST /api/ai/classify-intent
Content-Type: application/json

{
  "message": "I have chest pain",
  "conversationHistory": []
}
```

**Response**:
```json
{
  "message": "I have chest pain",
  "intent": "general_chat",
  "confidence": 0.87,
  "method": "rule_based",
  "reasoning": "Personal symptom description detected",
  "scores": {
    "faq": 0.15,
    "general_chat": 0.87
  }
}
```

### Get Classifier Statistics
```http
GET /api/ai/intent-stats
```

**Response**:
```json
{
  "supportedIntents": ["faq", "general_chat", "appointment", "emergency"],
  "faqPatternCount": 15,
  "appointmentPatternCount": 8,
  "emergencyKeywordCount": 14,
  "conversationalPatternCount": 12
}
```

## Integration Guide

### Backend Integration

1. **Import the classifier**:
```javascript
const intentClassifier = require('./services/intentClassifier');
```

2. **Classify user intent**:
```javascript
const intentResult = await intentClassifier.classifyIntent(message, conversationHistory);
```

3. **Route based on intent**:
```javascript
switch (intentResult.intent) {
  case 'faq':
    // Use FAQ service
    break;
  case 'general_chat':
    // Use AI chat
    break;
  case 'appointment':
    // Use appointment booking
    break;
  case 'emergency':
    // Use emergency response
    break;
}
```

### Frontend Integration

1. **Enhanced UI based on intent**:
```javascript
// Show different UI elements based on intent
if (intentData.intent === 'faq') {
  showFAQSources(faqData.searchResults);
} else if (intentData.intent === 'emergency') {
  showEmergencyBanner();
}
```

2. **Intent-aware suggestions**:
```javascript
// Suggest related actions based on intent
if (intentData.intent === 'general_chat' && shouldSuggestAppointment(response)) {
  showAppointmentSuggestion();
}
```

## Testing

### Run Intent Classifier Tests
```bash
cd backend
node examples/test-intent-classifier.js
```

### Test Specific Messages
```javascript
const intentClassifier = require('./services/intentClassifier');

async function testMessage(message) {
  const result = await intentClassifier.classifyIntent(message);
  console.log('Intent:', result.intent);
  console.log('Confidence:', result.confidence);
}

testMessage("What is diabetes?"); // Should be FAQ
testMessage("I have chest pain"); // Should be general_chat
```

## Configuration

### Customizing Patterns

Edit `backend/services/intentClassifier.js` to modify:

1. **FAQ Patterns**: Add new regex patterns for FAQ detection
2. **Emergency Keywords**: Add medical emergency terms
3. **Appointment Patterns**: Add booking-related phrases
4. **Conversational Patterns**: Add greeting and personal expressions

### Adjusting Confidence Thresholds

```javascript
// In intentClassifier.js
const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.5;
```

## Performance Monitoring

### Metrics to Track

1. **Classification Accuracy**: Percentage of correct intent predictions
2. **Confidence Distribution**: How often high/medium/low confidence occurs
3. **Method Usage**: Rule-based vs AI classification frequency
4. **Response Times**: Time taken for intent classification

### Logging

The classifier logs detailed information:
```
🎯 Intent classification result: {
  intent: 'faq',
  confidence: 0.95,
  method: 'rule_based',
  reasoning: 'FAQ score: 0.85, General chat score: 0.20'
}
```

## Best Practices

### For Developers

1. **Always check confidence**: Use AI fallback for low confidence
2. **Log classifications**: Monitor accuracy and improve patterns
3. **Handle edge cases**: Provide fallbacks for classification failures
4. **Test regularly**: Use the test script to validate changes

### For Content Creators

1. **Clear FAQ structure**: Write FAQs that match user questions
2. **Comprehensive coverage**: Cover common user intents
3. **Regular updates**: Update patterns based on user feedback

## Troubleshooting

### Common Issues

1. **Low accuracy**: Add more patterns or improve existing ones
2. **Slow performance**: Optimize regex patterns or increase rule-based confidence
3. **Wrong classifications**: Review and adjust scoring weights

### Debug Mode

Enable detailed logging:
```javascript
// Set environment variable
DEBUG_INTENT_CLASSIFIER=true
```

## Future Enhancements

1. **Machine Learning**: Train custom models on conversation data
2. **Multi-language**: Extend patterns for Tamil and other languages
3. **Context Awareness**: Improve classification using conversation context
4. **User Feedback**: Learn from user corrections and feedback
5. **A/B Testing**: Test different classification strategies

## Examples

See the `backend/examples/` directory for:
- `test-intent-classifier.js`: Comprehensive testing script
- `frontend-intent-integration.js`: Frontend integration examples

## Support

For questions or issues with the intent classifier:
1. Check the logs for classification details
2. Run the test script to validate functionality
3. Review patterns and thresholds for your use case
4. Consider adding new patterns for unhandled cases