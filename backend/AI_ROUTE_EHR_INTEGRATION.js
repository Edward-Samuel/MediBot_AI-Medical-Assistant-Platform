/**
 * CODE SNIPPET: Add EHR Context to AI Chat Route
 * 
 * This file shows the exact code changes needed to integrate EHR context
 * into your existing backend/routes/ai.js file
 */

// ============================================================================
// STEP 1: Add import at the top of backend/routes/ai.js
// ============================================================================

const ehrContextService = require('../services/ehrContextService');


// ============================================================================
// STEP 2: Add this code in the /chat endpoint, after user authentication
// ============================================================================

// Get patient EHR context if user is authenticated
let patientContext = null;
let ehrContextData = null;

if (userId) {
  try {
    console.log('Retrieving patient EHR context for user:', userId);
    patientContext = await ehrContextService.getPatientContext(userId);
    
    if (patientContext && patientContext.hasEHR) {
      console.log('Patient EHR context loaded successfully');
      console.log('   - Active conditions:', patientContext.fullAnalysis.chronicConditions?.length || 0);
      console.log('   - Active medications:', patientContext.fullAnalysis.activeMedications?.length || 0);
      console.log('   - Critical alerts:', patientContext.fullAnalysis.criticalAlerts?.length || 0);
      
      // Format context for UI display
      ehrContextData = ehrContextService.formatContextForUI(patientContext);
    } else {
      console.log('No EHR data found for user (may not be a patient)');
    }
  } catch (ehrError) {
    console.error('Error loading EHR context:', ehrError);
    // Continue without EHR context - don't fail the request
  }
}


// ============================================================================
// STEP 3: Enhance the message with patient context before AI processing
// Add this code before calling generateAIResponse()
// ============================================================================

// Enhance message with patient context for general medical queries
let enhancedMessage = message;
let usedEHRContext = false;

if (patientContext && patientContext.hasEHR && intentResult.intent === 'general_chat') {
  enhancedMessage = ehrContextService.enhancePromptWithContext(
    message,
    patientContext,
    conversationHistory
  );
  usedEHRContext = true;
  console.log('Enhanced AI prompt with patient medical context');
}

// Now use enhancedMessage instead of message when calling AI
// CHANGE THIS:
// botResponse = await generateAIResponse(message, conversationHistory, language, languageInfo, images);
// TO THIS:
botResponse = await generateAIResponse(
  enhancedMessage,  // Use enhanced message with EHR context
  conversationHistory,
  language,
  languageInfo,
  images
);


// ============================================================================
// STEP 4: Add safety checks after getting AI response
// Add this code after botResponse is generated
// ============================================================================

// Check for safety warnings based on patient context
let safetyWarnings = [];

if (patientContext && patientContext.hasEHR && botResponse) {
  try {
    // Extract medication mentions from the AI response
    const medicationMentions = extractMedicationMentions(botResponse);
    
    if (medicationMentions.length > 0) {
      console.log('Checking medications mentioned in response:', medicationMentions);
      
      medicationMentions.forEach(medication => {
        const warnings = ehrContextService.generateSafetyWarnings(
          patientContext,
          medication
        );
        
        if (warnings.length > 0) {
          console.log(`Safety warnings for ${medication}:`, warnings.length);
          safetyWarnings.push(...warnings);
        }
      });
    }

    // If critical warnings found, prepend them to the response
    if (safetyWarnings.some(w => w.type === 'allergy' || w.severity === 'critical')) {
      const criticalWarnings = safetyWarnings
        .filter(w => w.type === 'allergy' || w.severity === 'critical')
        .map(w => `${w.message}`)
        .join('\n\n');
      
      botResponse = `${criticalWarnings}\n\n${botResponse}`;
      console.log('Critical warnings prepended to response');
    }
  } catch (safetyError) {
    console.error('Error checking safety warnings:', safetyError);
    // Continue without safety warnings
  }
}


// ============================================================================
// STEP 5: Add helper function at the bottom of the file
// ============================================================================

/**
 * Extract medication names mentioned in text
 * This is a simple implementation - can be enhanced with NLP
 */
function extractMedicationMentions(text) {
  if (!text || typeof text !== 'string') return [];
  
  const medications = [];
  
  // Common medications to check for
  const commonMeds = [
    'ibuprofen', 'acetaminophen', 'aspirin', 'paracetamol', 'tylenol',
    'amoxicillin', 'penicillin', 'azithromycin', 'ciprofloxacin',
    'lisinopril', 'metformin', 'atorvastatin', 'simvastatin',
    'omeprazole', 'pantoprazole', 'ranitidine',
    'cetirizine', 'loratadine', 'diphenhydramine',
    'albuterol', 'prednisone', 'dexamethasone',
    'warfarin', 'clopidogrel', 'apixaban',
    'levothyroxine', 'insulin', 'methotrexate'
  ];
  
  const lowerText = text.toLowerCase();
  
  commonMeds.forEach(med => {
    // Check for whole word matches
    const regex = new RegExp(`\\b${med}\\b`, 'i');
    if (regex.test(lowerText)) {
      medications.push(med);
    }
  });
  
  return [...new Set(medications)]; // Remove duplicates
}


// ============================================================================
// STEP 6: Update the response JSON to include EHR data
// Modify the res.json() call to include new fields
// ============================================================================

res.json({
  response: botResponse,
  intent: intentData?.intent,
  intentConfidence: intentData?.confidence,
  usingFallback,
  sessionId: currentSessionId,
  appointmentData,
  webSearchData,
  faqData,
  triageData,
  followUpQuestions,
  
  // NEW: Add EHR context data
  ehrContext: ehrContextData,  // Summary for UI display
  usedEHRContext,              // Boolean flag
  safetyWarnings: safetyWarnings.length > 0 ? safetyWarnings : undefined,
});


// ============================================================================
// COMPLETE EXAMPLE: Full chat endpoint with EHR integration
// ============================================================================

/*
router.post("/chat", async (req, res) => {
  try {
    const {
      message,
      images,
      conversationHistory,
      language = "en",
      languageInfo,
      sessionId,
      forceWebSearch = false,
    } = req.body;

    if (!message && (!images || images.length === 0)) {
      return res.status(400).json({ message: "Message or images are required" });
    }

    // Authenticate user
    let userId = null;
    let currentSessionId = sessionId;
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        console.log("AI Chat: User authenticated with ID:", userId);
      } catch (error) {
        console.log("Invalid token, continuing as guest");
      }
    }

    // ========== EHR CONTEXT INTEGRATION START ==========
    
    // Get patient EHR context if user is authenticated
    let patientContext = null;
    let ehrContextData = null;

    if (userId) {
      try {
        console.log('Retrieving patient EHR context for user:', userId);
        patientContext = await ehrContextService.getPatientContext(userId);
        
        if (patientContext && patientContext.hasEHR) {
          console.log('Patient EHR context loaded successfully');
          ehrContextData = ehrContextService.formatContextForUI(patientContext);
        }
      } catch (ehrError) {
        console.error('Error loading EHR context:', ehrError);
      }
    }
    
    // ========== EHR CONTEXT INTEGRATION END ==========

    // Domain validation
    if (message && message.trim()) {
      const domainValidator = require("../services/domainValidator");
      const domainValidation = await domainValidator.validateDomain(message, language);
      
      if (!domainValidation.isValid) {
        const rejectionMessage = domainValidator.generateRejectionMessage(language);
        return res.json({
          response: rejectionMessage,
          intent: "off_topic",
          sessionId: currentSessionId || uuidv4()
        });
      }
    }

    // Intent classification
    const intentResult = await intentClassifier.classifyIntent(
      message,
      conversationHistory || [],
      { forceWebSearch }
    );

    let botResponse;
    let intentData = {
      intent: intentResult.intent,
      confidence: intentResult.confidence
    };

    // Handle different intents...
    // (existing intent handling code)

    // ========== EHR CONTEXT ENHANCEMENT START ==========
    
    // Enhance message with patient context for general medical queries
    let enhancedMessage = message;
    let usedEHRContext = false;

    if (patientContext && patientContext.hasEHR && intentResult.intent === 'general_chat') {
      enhancedMessage = ehrContextService.enhancePromptWithContext(
        message,
        patientContext,
        conversationHistory
      );
      usedEHRContext = true;
      console.log('Enhanced AI prompt with patient medical context');
    }

    // Generate AI response with enhanced context
    if (!botResponse) {
      botResponse = await generateAIResponse(
        enhancedMessage,  // Use enhanced message
        conversationHistory,
        language,
        languageInfo,
        images
      );
    }

    // Check for safety warnings
    let safetyWarnings = [];

    if (patientContext && patientContext.hasEHR && botResponse) {
      const medicationMentions = extractMedicationMentions(botResponse);
      
      medicationMentions.forEach(medication => {
        const warnings = ehrContextService.generateSafetyWarnings(
          patientContext,
          medication
        );
        safetyWarnings.push(...warnings);
      });

      // Prepend critical warnings to response
      if (safetyWarnings.some(w => w.type === 'allergy' || w.severity === 'critical')) {
        const criticalWarnings = safetyWarnings
          .filter(w => w.type === 'allergy' || w.severity === 'critical')
          .map(w => `${w.message}`)
          .join('\n\n');
        
        botResponse = `${criticalWarnings}\n\n${botResponse}`;
      }
    }
    
    // ========== EHR CONTEXT ENHANCEMENT END ==========

    // Save chat history (existing code)...

    // Return response with EHR data
    res.json({
      response: botResponse,
      intent: intentData?.intent,
      intentConfidence: intentData?.confidence,
      sessionId: currentSessionId,
      
      // EHR context data
      ehrContext: ehrContextData,
      usedEHRContext,
      safetyWarnings: safetyWarnings.length > 0 ? safetyWarnings : undefined,
    });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Error processing chat request" });
  }
});

// Helper function
function extractMedicationMentions(text) {
  if (!text || typeof text !== 'string') return [];
  
  const medications = [];
  const commonMeds = [
    'ibuprofen', 'acetaminophen', 'aspirin', 'paracetamol',
    'amoxicillin', 'penicillin', 'lisinopril', 'metformin'
  ];
  
  const lowerText = text.toLowerCase();
  commonMeds.forEach(med => {
    const regex = new RegExp(`\\b${med}\\b`, 'i');
    if (regex.test(lowerText)) {
      medications.push(med);
    }
  });
  
  return [...new Set(medications)];
}
*/
