/**
 * Frontend Integration Example for Intent Classifier
 * 
 * This example shows how to integrate the intent classifier
 * in your frontend application to provide better user experience.
 */

// Example: Enhanced chat interface with intent-aware UI
class IntentAwareChatInterface {
  constructor(apiBaseUrl = 'http://localhost:5000/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.conversationHistory = [];
  }

  /**
   * Send message with intent classification
   */
  async sendMessage(message, options = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': options.token ? `Bearer ${options.token}` : undefined
        },
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory,
          language: options.language || 'en',
          sessionId: options.sessionId
        })
      });

      const data = await response.json();
      
      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'bot', content: data.response }
      );

      // Handle different intents in the UI
      this.handleIntentResponse(data);
      
      return data;

    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Handle different intent responses in the UI
   */
  handleIntentResponse(data) {
    const { intentData, response, faqData, appointmentData } = data;
    
    console.log('Intent detected:', intentData);

    switch (intentData?.intent) {
      case 'faq':
        this.handleFAQResponse(response, faqData, intentData);
        break;
        
      case 'general_chat':
        this.handleGeneralChatResponse(response, intentData);
        break;
        
      case 'appointment':
        this.handleAppointmentResponse(response, appointmentData, intentData);
        break;
        
      case 'emergency':
        this.handleEmergencyResponse(response, intentData);
        break;
        
      default:
        this.handleDefaultResponse(response);
    }
  }

  /**
   * Handle FAQ responses with enhanced UI
   */
  handleFAQResponse(response, faqData, intentData) {
    console.log('📚 FAQ Response Handler');
    
    // Show FAQ-specific UI elements
    this.showMessage(response, {
      type: 'faq',
      confidence: intentData.confidence,
      sources: faqData?.searchResults || []
    });

    // Show related FAQ suggestions
    if (faqData?.searchResults?.length > 1) {
      this.showRelatedFAQs(faqData.searchResults.slice(1));
    }

    // Add FAQ feedback buttons
    this.addFeedbackButtons('faq', {
      helpful: () => this.sendFeedback('faq_helpful', faqData),
      notHelpful: () => this.sendFeedback('faq_not_helpful', faqData)
    });
  }

  /**
   * Handle general chat responses
   */
  handleGeneralChatResponse(response, intentData) {
    console.log('💬 General Chat Response Handler');
    
    this.showMessage(response, {
      type: 'general_chat',
      confidence: intentData.confidence
    });

    // Show medical disclaimer for health-related conversations
    this.showMedicalDisclaimer();

    // Suggest appointment booking if appropriate
    if (this.shouldSuggestAppointment(response)) {
      this.showAppointmentSuggestion();
    }
  }

  /**
   * Handle appointment booking responses
   */
  handleAppointmentResponse(response, appointmentData, intentData) {
    console.log('Appointment Response Handler');
    
    this.showMessage(response, {
      type: 'appointment',
      confidence: intentData.confidence
    });

    if (appointmentData?.requiresLogin) {
      this.showLoginPrompt();
    } else if (appointmentData?.simpleBooking) {
      this.showAppointmentBookingForm();
    }
  }

  /**
   * Handle emergency responses
   */
  handleEmergencyResponse(response, intentData) {
    console.log('🚨 Emergency Response Handler');
    
    // Show emergency response with high priority styling
    this.showMessage(response, {
      type: 'emergency',
      priority: 'high',
      confidence: intentData.confidence
    });

    // Show emergency contact information
    this.showEmergencyContacts();
    
    // Disable normal chat temporarily
    this.setEmergencyMode(true);
  }

  /**
   * Test intent classification before sending
   */
  async testIntent(message) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/classify-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory
        })
      });

      const data = await response.json();
      console.log('Intent classification result:', data);
      
      return data;

    } catch (error) {
      console.error('Intent classification error:', error);
      return null;
    }
  }

  // UI Helper Methods (implement based on your frontend framework)
  
  showMessage(content, options = {}) {
    console.log(`Showing ${options.type || 'default'} message:`, content);
    // Implement based on your UI framework (React, Vue, etc.)
  }

  showRelatedFAQs(faqs) {
    console.log('Showing related FAQs:', faqs);
    // Show FAQ suggestions in sidebar or below message
  }

  addFeedbackButtons(type, callbacks) {
    console.log(`Adding ${type} feedback buttons`);
    // Add thumbs up/down buttons for user feedback
  }

  showMedicalDisclaimer() {
    console.log('Showing medical disclaimer');
    // Show disclaimer about consulting healthcare professionals
  }

  shouldSuggestAppointment(response) {
    // Logic to determine if appointment should be suggested
    const appointmentTriggers = [
      'consult', 'doctor', 'professional', 'medical attention',
      'healthcare provider', 'specialist'
    ];
    
    return appointmentTriggers.some(trigger => 
      response.toLowerCase().includes(trigger)
    );
  }

  showAppointmentSuggestion() {
    console.log('Showing appointment suggestion');
    // Show "Would you like to book an appointment?" prompt
  }

  showLoginPrompt() {
    console.log('Showing login prompt');
    // Show login/register form or redirect
  }

  showAppointmentBookingForm() {
    console.log('Showing appointment booking form');
    // Show appointment booking interface
  }

  showEmergencyContacts() {
    console.log('Showing emergency contacts');
    // Show emergency phone numbers and instructions
  }

  setEmergencyMode(enabled) {
    console.log('Emergency mode:', enabled);
    // Change UI to emergency mode (red colors, urgent messaging)
  }

  sendFeedback(type, data) {
    console.log('Sending feedback:', type, data);
    // Send feedback to improve the system
  }
}

// Example usage
async function exampleUsage() {
  const chatInterface = new IntentAwareChatInterface();

  // Test different types of messages
  const testMessages = [
    "What is diabetes?", // Should trigger FAQ
    "I have chest pain", // Should trigger general chat
    "Book an appointment", // Should trigger appointment
    "I think I'm having a heart attack" // Should trigger emergency
  ];

  for (const message of testMessages) {
    console.log(`\n--- Testing: "${message}" ---`);
    
    // Optional: Test intent classification first
    const intentResult = await chatInterface.testIntent(message);
    console.log('Predicted intent:', intentResult?.intent);
    
    // Send the message
    const response = await chatInterface.sendMessage(message);
    console.log('Response received:', response.response.substring(0, 100) + '...');
  }
}

// React Component Example
const ReactChatComponent = `
import React, { useState, useEffect } from 'react';

const IntentAwareChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentIntent, setCurrentIntent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const chatInterface = new IntentAwareChatInterface();

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await chatInterface.sendMessage(inputMessage);
      
      setMessages(prev => [...prev, 
        { role: 'user', content: inputMessage },
        { 
          role: 'bot', 
          content: response.response,
          intent: response.intentData?.intent,
          confidence: response.intentData?.confidence
        }
      ]);
      
      setCurrentIntent(response.intentData);
      setInputMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={\`message \${msg.role}\`}>
            <div className="content">{msg.content}</div>
            {msg.intent && (
              <div className="intent-info">
                Intent: {msg.intent} ({(msg.confidence * 100).toFixed(0)}%)
              </div>
            )}
          </div>
        ))}
      </div>
      
      {currentIntent?.intent === 'emergency' && (
        <div className="emergency-banner">
          🚨 Emergency detected - Please seek immediate medical attention
        </div>
      )}
      
      <div className="input-area">
        <input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default IntentAwareChat;
`;

console.log('React Component Example:');
console.log(ReactChatComponent);

// Export for use
module.exports = {
  IntentAwareChatInterface,
  exampleUsage
};

// Run example if executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}