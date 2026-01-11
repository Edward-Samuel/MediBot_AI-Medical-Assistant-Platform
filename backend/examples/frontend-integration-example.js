/**
 * Frontend Integration Example for MEDIBOT Structured Responses
 * 
 * This example shows how to handle both structured and formatted responses
 * in your frontend application.
 */

// Example API response from MEDIBOT
const exampleApiResponse = {
  response: "To book an appointment, please log in to your account first.\n\n**To Login:**\n• Have an account? Click the login button\n• New user? Sign up to create an account\n\n**Appointment Booking Benefits:**\n• Your medical history is saved\n• Appointment reminders\n• Easy communication with doctors\n• Secure medical records",
  appointmentData: {
    intent: "appointment_booking_login_required",
    message: "To book an appointment, please log in to your account first.",
    requiresLogin: true,
    structuredResponse: {
      text: "To book an appointment, please log in to your account first.",
      sections: [
        {
          title: "To Login:",
          items: [
            "Have an account? Click the login button",
            "New user? Sign up to create an account"
          ]
        },
        {
          title: "Appointment Booking Benefits:",
          items: [
            "Your medical history is saved",
            "Appointment reminders", 
            "Easy communication with doctors",
            "Secure medical records"
          ]
        }
      ],
      formatted: "To book an appointment, please log in to your account first.\n\n**To Login:**\n• Have an account? Click the login button\n• New user? Sign up to create an account\n\n**Appointment Booking Benefits:**\n• Your medical history is saved\n• Appointment reminders\n• Easy communication with doctors\n• Secure medical records"
    }
  },
  timestamp: "2024-01-11T10:00:00.000Z",
  language: "en"
};

// 1. Simple Implementation - Use formatted text (backward compatibility)
function renderSimpleResponse(response) {
  const messageContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'bot-message';
  
  // Use formatted text with simple markdown conversion
  const formattedText = response.appointmentData?.structuredResponse?.formatted || response.response;
  messageDiv.innerHTML = convertMarkdownToHtml(formattedText);
  
  messageContainer.appendChild(messageDiv);
}

// 2. Rich Implementation - Use structured data for enhanced UI
function renderStructuredResponse(response) {
  const messageContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'bot-message structured';
  
  const structuredData = response.appointmentData?.structuredResponse;
  
  if (structuredData) {
    // Create rich UI components
    const responseElement = createStructuredElement(structuredData);
    messageDiv.appendChild(responseElement);
    
    // Add special handling for appointment booking
    if (response.appointmentData?.requiresLogin) {
      const loginButtons = createLoginButtons();
      messageDiv.appendChild(loginButtons);
    }
  } else {
    // Fallback to simple text
    messageDiv.innerHTML = convertMarkdownToHtml(response.response);
  }
  
  messageContainer.appendChild(messageDiv);
}

// 3. Create structured UI element
function createStructuredElement(data) {
  const container = document.createElement('div');
  container.className = 'structured-response';
  
  // Main text
  if (data.text) {
    const mainText = document.createElement('p');
    mainText.className = 'main-text';
    mainText.textContent = data.text;
    container.appendChild(mainText);
  }
  
  // Sections
  if (data.sections) {
    data.sections.forEach((section, index) => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = `section ${section.type || 'default'}`;
      
      // Section title
      if (section.title) {
        const title = document.createElement('h4');
        title.className = 'section-title';
        title.textContent = section.title;
        sectionDiv.appendChild(title);
      }
      
      // Section items
      if (section.items && section.items.length > 0) {
        const list = document.createElement('ul');
        list.className = 'section-items';
        
        section.items.forEach(item => {
          const listItem = document.createElement('li');
          listItem.innerHTML = item; // Allow for bold text and other formatting
          
          // Add special styling based on section type
          if (section.type === 'warning') {
            listItem.className = 'warning-item';
          } else if (section.type === 'important') {
            listItem.className = 'important-item';
          }
          
          list.appendChild(listItem);
        });
        
        sectionDiv.appendChild(list);
      }
      
      container.appendChild(sectionDiv);
    });
  }
  
  // Instruction text
  if (data.instruction) {
    const instruction = document.createElement('p');
    instruction.className = 'instruction-text';
    instruction.textContent = data.instruction;
    container.appendChild(instruction);
  }
  
  // Disclaimer
  if (data.disclaimer) {
    const disclaimer = document.createElement('p');
    disclaimer.className = 'disclaimer';
    disclaimer.textContent = data.disclaimer;
    container.appendChild(disclaimer);
  }
  
  return container;
}

// 4. Create login buttons for appointment booking
function createLoginButtons() {
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'login-buttons';
  
  const loginButton = document.createElement('button');
  loginButton.className = 'btn btn-primary';
  loginButton.textContent = 'Login';
  loginButton.onclick = () => {
    // Redirect to login page or open login modal
    window.location.href = '/login';
  };
  
  const signupButton = document.createElement('button');
  signupButton.className = 'btn btn-secondary';
  signupButton.textContent = 'Sign Up';
  signupButton.onclick = () => {
    // Redirect to signup page or open signup modal
    window.location.href = '/signup';
  };
  
  buttonContainer.appendChild(loginButton);
  buttonContainer.appendChild(signupButton);
  
  return buttonContainer;
}

// 5. Simple markdown to HTML converter
function convertMarkdownToHtml(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
    .replace(/^• (.+)$/gm, '<li>$1</li>') // Bullet points
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>') // Wrap lists
    .replace(/\n\n/g, '</p><p>') // Paragraphs
    .replace(/^(.+)$/, '<p>$1</p>') // Wrap in paragraph
    .replace(/\n/g, '<br>'); // Line breaks
}

// 6. React Component Example
const MedicalResponseComponent = ({ response }) => {
  const structuredData = response.appointmentData?.structuredResponse;
  
  if (!structuredData) {
    return (
      <div 
        className="bot-message simple"
        dangerouslySetInnerHTML={{ 
          __html: convertMarkdownToHtml(response.response) 
        }} 
      />
    );
  }
  
  return (
    <div className="bot-message structured">
      <div className="structured-response">
        {structuredData.text && (
          <p className="main-text">{structuredData.text}</p>
        )}
        
        {structuredData.sections?.map((section, index) => (
          <div key={index} className={`section ${section.type || 'default'}`}>
            {section.title && (
              <h4 className="section-title">{section.title}</h4>
            )}
            
            {section.items && (
              <ul className="section-items">
                {section.items.map((item, itemIndex) => (
                  <li 
                    key={itemIndex}
                    className={section.type === 'warning' ? 'warning-item' : 
                              section.type === 'important' ? 'important-item' : ''}
                    dangerouslySetInnerHTML={{ __html: item }}
                  />
                ))}
              </ul>
            )}
          </div>
        ))}
        
        {structuredData.instruction && (
          <p className="instruction-text">{structuredData.instruction}</p>
        )}
        
        {structuredData.disclaimer && (
          <p className="disclaimer">{structuredData.disclaimer}</p>
        )}
      </div>
      
      {response.appointmentData?.requiresLogin && (
        <div className="login-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/login'}
          >
            Login
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/signup'}
          >
            Sign Up
          </button>
        </div>
      )}
    </div>
  );
};

// 7. CSS Styles for structured responses
const cssStyles = `
.structured-response {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

.main-text {
  font-size: 16px;
  margin-bottom: 16px;
  font-weight: 500;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 14px;
}

.section-items {
  margin: 0;
  padding-left: 20px;
}

.section-items li {
  margin-bottom: 4px;
}

.section.warning {
  border-left: 4px solid #e74c3c;
  padding-left: 12px;
  background-color: #fdf2f2;
}

.section.important {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 12px;
}

.warning-item {
  color: #c0392b;
}

.important-item {
  font-weight: 500;
}

.instruction-text {
  font-style: italic;
  color: #666;
  margin-top: 12px;
}

.disclaimer {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.login-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.emergency-response {
  background-color: #fee;
  border: 2px solid #e74c3c;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.emergency-response .main-text {
  color: #c0392b;
  font-weight: bold;
  font-size: 18px;
}
`;

// 8. Usage Examples
console.log('=== MEDIBOT Frontend Integration Examples ===');

// Example 1: Simple rendering
console.log('1. Simple rendering (backward compatibility):');
renderSimpleResponse(exampleApiResponse);

// Example 2: Rich rendering
console.log('2. Rich rendering with structured data:');
renderStructuredResponse(exampleApiResponse);

// Example 3: Check for login requirement
if (exampleApiResponse.appointmentData?.requiresLogin) {
  console.log('3. Login required - show login buttons');
}

// Example 4: Handle different response types
function handleMedibotResponse(response) {
  // Check if it's an appointment-related response
  if (response.appointmentData) {
    if (response.appointmentData.requiresLogin) {
      // Show login required UI
      renderStructuredResponse(response);
    } else if (response.appointmentData.simpleBooking) {
      // Show appointment booking flow
      renderStructuredResponse(response);
    }
  } else {
    // Regular medical response
    renderStructuredResponse(response);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderSimpleResponse,
    renderStructuredResponse,
    createStructuredElement,
    createLoginButtons,
    convertMarkdownToHtml,
    MedicalResponseComponent,
    handleMedibotResponse,
    cssStyles
  };
}