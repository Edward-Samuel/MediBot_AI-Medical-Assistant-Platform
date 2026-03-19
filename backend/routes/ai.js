const express = require("express");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const ChatHistory = require("../models/ChatHistory");
const auth = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");
const tavilySearch = require("../services/tavilySearch");
const openRouterService = require("../services/openRouterService");
const intentClassifier = require("../services/intentClassifier");
const followUpQuestionsService = require("../services/followUpQuestionsService");
const triageService = require("../services/triageService");
const youtubeService = require("../services/youtubeService");
// const appointmentAgent = require('../services/appointmentAgent');

const router = express.Router();

// Generate response using Gemini with structured templates
async function generateAIResponse(
  message,
  conversationHistory,
  language,
  languageInfo,
  images = [],
) {
  try {
    console.log("Using Gemini for AI response...");

    const response = await openRouterService.generateResponse(
      message,
      conversationHistory,
      {
        language,
        languageInfo,
        images,
        enableReasoning: true,
        maxTokens: 800,
        temperature: 0.3, // Lower temperature for consistency
      },
    );

    console.log(
      `Successfully used Gemini model: ${response.model}${images?.length ? " (with images)" : ""}`,
    );

    // Log if template was used
    if (response.isTemplate) {
      console.log("Used structured template response");
    }

    return response.content;
  } catch (error) {
    console.error("Gemini error:", error);
    throw error;
  }
}

// Fallback response generator using structured templates
function generateFallbackResponse(message, language = "en", languageInfo) {
  try {
    const responseTemplates = require("../services/responseTemplates");

    // Emergency detection removed - proceed directly to symptom extraction

    // Extract symptom and generate structured response
    const symptom = responseTemplates.extractSymptom(message, language);

    // If specific symptom detected, use medical response template
    if (symptom !== (language === "ta" ? "உங்கள் அறிகுறி" : "your symptom")) {
      const medicalResponse = responseTemplates.generateMedicalResponse(
        message,
        symptom,
        language,
      );
      return medicalResponse.formatted; // Use formatted version for backward compatibility
    }

    // Otherwise use general health response
    const generalResponse = responseTemplates.generateGeneralResponse(
      message,
      language,
    );
    return generalResponse.formatted; // Use formatted version for backward compatibility
  } catch (error) {
    console.error("Fallback response generation error:", error);

    // Emergency fallback - should never fail
    return language === "ta"
      ? "மன்னிக்கவும், தற்போது தொழில்நுட்ப சிக்கல் உள்ளது. மருத்துவ நிபுணரை அணுகவும்."
      : "I apologize for the technical difficulty. Please consult a healthcare professional for your medical concerns.";
  }
}

// Medical specialization mapping based on symptoms/conditions
const symptomSpecializationMap = {
  // Cardiology
  "chest pain": "Cardiology",
  "heart palpitations": "Cardiology",
  "shortness of breath": "Cardiology",
  "high blood pressure": "Cardiology",
  "irregular heartbeat": "Cardiology",

  // Tamil terms for common symptoms
  "மார்பு வலி": "Cardiology",
  "இதய படபடப்பு": "Cardiology",
  "மூச்சு திணறல்": "Cardiology",
  "உயர் இரத்த அழுத்தம்": "Cardiology",

  // Dermatology
  "skin rash": "Dermatology",
  acne: "Dermatology",
  moles: "Dermatology",
  eczema: "Dermatology",
  psoriasis: "Dermatology",

  // Tamil dermatology terms
  "தோல் அரிப்பு": "Dermatology",
  முகப்பரு: "Dermatology",
  "தோல் நோய்": "Dermatology",

  // Neurology
  headache: "Neurology",
  migraine: "Neurology",
  seizures: "Neurology",
  "memory loss": "Neurology",
  dizziness: "Neurology",

  // Tamil neurology terms
  தலைவலி: "Neurology",
  மைக்ரேன்: "Neurology",
  வலிப்பு: "Neurology",
  மறதி: "Neurology",
  தலைசுற்றல்: "Neurology",

  // Orthopedics
  "joint pain": "Orthopedics",
  "back pain": "Orthopedics",
  fracture: "Orthopedics",
  arthritis: "Orthopedics",
  "sports injury": "Orthopedics",

  // Tamil orthopedic terms
  "மூட்டு வலி": "Orthopedics",
  "முதுகு வலி": "Orthopedics",
  "எலும்பு முறிவு": "Orthopedics",
  மூட்டுவாதம்: "Orthopedics",

  // Gastroenterology
  "stomach pain": "Gastroenterology",
  nausea: "Gastroenterology",
  diarrhea: "Gastroenterology",
  constipation: "Gastroenterology",
  "acid reflux": "Gastroenterology",

  // Tamil gastro terms
  "வயிற்று வலி": "Gastroenterology",
  குமட்டல்: "Gastroenterology",
  வயிற்றுப்போக்கு: "Gastroenterology",
  மலச்சிக்கல்: "Gastroenterology",

  // ENT
  "ear pain": "ENT",
  "hearing loss": "ENT",
  "sore throat": "ENT",
  "sinus problems": "ENT",
  tinnitus: "ENT",

  // Tamil ENT terms
  "காது வலி": "ENT",
  "கேட்கும் திறன் குறைவு": "ENT",
  "தொண்டை வலி": "ENT",

  // Ophthalmology
  "eye pain": "Ophthalmology",
  "vision problems": "Ophthalmology",
  "blurred vision": "Ophthalmology",
  "eye infection": "Ophthalmology",

  // Tamil eye terms
  "கண் வலி": "Ophthalmology",
  "பார்வை பிரச்சனை": "Ophthalmology",
  "மங்கலான பார்வை": "Ophthalmology",

  // Psychiatry
  depression: "Psychiatry",
  anxiety: "Psychiatry",
  "panic attacks": "Psychiatry",
  insomnia: "Psychiatry",
  "mood swings": "Psychiatry",

  // Tamil mental health terms
  மனச்சோர்வு: "Psychiatry",
  பதட்டம்: "Psychiatry",
  தூக்கமின்மை: "Psychiatry",
  "மன அழுத்தம்": "Psychiatry",
};

// Recommend doctors based on symptoms
router.post("/recommend-doctor", async (req, res) => {
  try {
    const { symptoms, age, gender, urgency } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ message: "Symptoms are required" });
    }

    let aiAnalysis = null;

    // Use Gemini for doctor recommendation
    try {
      console.log("Using Gemini for doctor recommendation...");

      const analysisResult = await openRouterService.analyzeSymptoms(symptoms, {
        age,
        gender,
        urgency,
      });

      if (analysisResult.analysis) {
        aiAnalysis = analysisResult.analysis;
        console.log("Gemini analysis successful");
      } else {
        console.log("Gemini analysis parsing failed, using fallback...");
        aiAnalysis = fallbackSpecializationMatch(symptoms);
      }
    } catch (openRouterError) {
      console.log(
        "Gemini failed, using fallback analysis:",
        openRouterError.message,
      );
      aiAnalysis = fallbackSpecializationMatch(symptoms);
    }

    if (!aiAnalysis) {
      return res.status(500).json({ message: "Unable to analyze symptoms" });
    }

    // Find doctors based on analysis
    const specializations = [
      aiAnalysis.primarySpecialization,
      ...(aiAnalysis.alternativeSpecializations || []),
    ].filter(Boolean);

    const doctors = await Doctor.find({
      specialization: { $in: specializations },
      isVerified: true,
    })
      .populate("userId", "profile")
      .sort({ "rating.average": -1, experience: -1 })
      .limit(10);

    // Format doctor recommendations
    const recommendations = doctors.map((doctor) => ({
      id: doctor._id,
      name: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
      specialization: doctor.specialization,
      experience: doctor.experience,
      rating: doctor.rating.average,
      availability: doctor.availability,
      bio: doctor.bio,
      languages: doctor.languages,
    }));

    res.json({
      analysis: aiAnalysis,
      recommendations,
      totalDoctors: recommendations.length,
      fallbackUsed:
        !aiAnalysis.reasoning ||
        aiAnalysis.reasoning === "Based on symptom keyword matching",
    });
  } catch (error) {
    console.error("AI recommendation error:", error);

    // Emergency fallback - just use General Medicine
    try {
      console.log("🆘 Using emergency fallback for doctor recommendations");
      const { symptoms } = req.body;

      const emergencyAnalysis = {
        primarySpecialization: "General Medicine",
        alternativeSpecializations: [],
        urgencyLevel: "medium",
        reasoning: "Emergency fallback - please consult a general practitioner",
        redFlags: [],
      };

      const doctors = await Doctor.find({
        specialization: "General Medicine",
        isVerified: true,
      })
        .populate("userId", "profile")
        .sort({ "rating.average": -1, experience: -1 })
        .limit(5);

      const recommendations = doctors.map((doctor) => ({
        id: doctor._id,
        name: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
        specialization: doctor.specialization,
        experience: doctor.experience,
        rating: doctor.rating.average,
        availability: doctor.availability,
        bio: doctor.bio,
        languages: doctor.languages,
      }));

      res.json({
        analysis: emergencyAnalysis,
        recommendations,
        totalDoctors: recommendations.length,
        fallbackUsed: true,
        emergencyFallback: true,
      });
    } catch (emergencyError) {
      console.error("Emergency fallback also failed:", emergencyError);
      res.status(500).json({
        message:
          "Error generating doctor recommendations. Please try again later.",
        fallbackUsed: true,
      });
    }
  }
});

// Fallback function for specialization matching
function fallbackSpecializationMatch(symptoms) {
  const lowerSymptoms = symptoms.map((s) => s.toLowerCase());
  const matches = {};

  // Enhanced symptom mapping with more comprehensive coverage
  const enhancedSymptomMap = {
    // Cardiology
    "chest pain": "Cardiology",
    heart: "Cardiology",
    cardiac: "Cardiology",
    palpitations: "Cardiology",
    "shortness of breath": "Cardiology",
    "high blood pressure": "Cardiology",
    hypertension: "Cardiology",
    "irregular heartbeat": "Cardiology",
    "chest tightness": "Cardiology",

    // Dermatology
    skin: "Dermatology",
    rash: "Dermatology",
    acne: "Dermatology",
    moles: "Dermatology",
    eczema: "Dermatology",
    psoriasis: "Dermatology",
    itching: "Dermatology",
    dermatitis: "Dermatology",

    // Neurology
    headache: "Neurology",
    migraine: "Neurology",
    seizure: "Neurology",
    memory: "Neurology",
    dizziness: "Neurology",
    vertigo: "Neurology",
    numbness: "Neurology",
    tingling: "Neurology",
    neurological: "Neurology",

    // Orthopedics
    joint: "Orthopedics",
    bone: "Orthopedics",
    "back pain": "Orthopedics",
    fracture: "Orthopedics",
    arthritis: "Orthopedics",
    "sports injury": "Orthopedics",
    "muscle pain": "Orthopedics",
    spine: "Orthopedics",
    knee: "Orthopedics",

    // Gastroenterology
    stomach: "Gastroenterology",
    abdominal: "Gastroenterology",
    nausea: "Gastroenterology",
    diarrhea: "Gastroenterology",
    constipation: "Gastroenterology",
    "acid reflux": "Gastroenterology",
    digestive: "Gastroenterology",
    bowel: "Gastroenterology",
    intestinal: "Gastroenterology",

    // ENT
    ear: "ENT",
    nose: "ENT",
    throat: "ENT",
    hearing: "ENT",
    sinus: "ENT",
    tinnitus: "ENT",
    "sore throat": "ENT",

    // Ophthalmology
    eye: "Ophthalmology",
    vision: "Ophthalmology",
    sight: "Ophthalmology",
    "blurred vision": "Ophthalmology",
    "eye pain": "Ophthalmology",

    // Psychiatry
    depression: "Psychiatry",
    anxiety: "Psychiatry",
    panic: "Psychiatry",
    insomnia: "Psychiatry",
    mood: "Psychiatry",
    mental: "Psychiatry",
    stress: "Psychiatry",
    psychological: "Psychiatry",

    // Pulmonology
    lung: "Pulmonology",
    breathing: "Pulmonology",
    cough: "Pulmonology",
    asthma: "Pulmonology",
    respiratory: "Pulmonology",
    copd: "Pulmonology",

    // Endocrinology
    diabetes: "Endocrinology",
    thyroid: "Endocrinology",
    hormone: "Endocrinology",
    metabolism: "Endocrinology",
    insulin: "Endocrinology",

    // Urology
    kidney: "Urology",
    bladder: "Urology",
    urinary: "Urology",
    prostate: "Urology",
    urine: "Urology",

    // Gynecology
    menstrual: "Gynecology",
    pregnancy: "Gynecology",
    reproductive: "Gynecology",
    pelvic: "Gynecology",
    gynecological: "Gynecology",

    // Emergency Medicine
    emergency: "Emergency Medicine",
    urgent: "Emergency Medicine",
    severe: "Emergency Medicine",
    acute: "Emergency Medicine",

    // General Medicine (catch-all)
    fever: "General Medicine",
    fatigue: "General Medicine",
    weakness: "General Medicine",
    general: "General Medicine",
    checkup: "General Medicine",
    physical: "General Medicine",
  };

  // Count matches for each specialization
  lowerSymptoms.forEach((symptom) => {
    Object.entries(enhancedSymptomMap).forEach(([key, specialization]) => {
      if (symptom.includes(key) || key.includes(symptom)) {
        matches[specialization] = (matches[specialization] || 0) + 1;
      }
    });
  });

  // Sort by match count
  const sortedMatches = Object.entries(matches).sort((a, b) => b[1] - a[1]);

  // If no matches found, default to General Medicine
  if (sortedMatches.length === 0) {
    return {
      primarySpecialization: "General Medicine",
      alternativeSpecializations: [],
      urgencyLevel: "medium",
      reasoning:
        "Based on symptom keyword matching - General Medicine recommended for comprehensive evaluation",
      redFlags: [],
    };
  }

  return {
    primarySpecialization: sortedMatches[0]?.[0] || "General Medicine",
    alternativeSpecializations: sortedMatches.slice(1, 3).map((m) => m[0]),
    urgencyLevel: "medium",
    reasoning: "Based on symptom keyword matching",
    redFlags: [],
  };
}

// Medical consultation chat
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
      return res
        .status(400)
        .json({ message: "Message or images are required" });
    }

    // Check if user is authenticated (optional middleware)
    let userId = null;
    let currentSessionId = sessionId;

    // Try to get user from token if provided
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId; // Fix: use userId instead of id
        console.log("AI Chat: User authenticated with ID:", userId);
      } catch (error) {
        // Token invalid or expired, continue as guest
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
        const ehrContextService = require('../services/ehrContextService');
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
    // ========== EHR CONTEXT INTEGRATION END ==========

    // Validate domain relevance (only for text messages)
    if (message && message.trim()) {
      console.log("Validating domain relevance...");
      const domainValidator = require("../services/domainValidator");
      const domainValidation = await domainValidator.validateDomain(message, language);
      
      console.log("Domain validation result:", domainValidation);

      if (!domainValidation.isValid) {
        console.log("Off-topic message rejected");
        const rejectionMessage = domainValidator.generateRejectionMessage(language);
        
        return res.json({
          response: rejectionMessage,
          intent: "off_topic",
          domainValidation: {
            isValid: false,
            confidence: domainValidation.confidence,
            method: domainValidation.method,
            reasoning: domainValidation.reasoning
          },
          sessionId: currentSessionId || uuidv4()
        });
      }
      
      console.log("Message validated as healthcare-related");
    }

    let botResponse;
    let usingFallback = false;
    let appointmentData = null;
    let webSearchData = null;
    let faqData = null;
    let searchResults = null; // Declare at top level
    let intentData = null;
    let triageData = null; // Add triage data
    let videoData = null;

    // Classify user intent first
    console.log("Classifying user intent...");
    const intentResult = await intentClassifier.classifyIntent(
      message,
      conversationHistory || [],
      { forceWebSearch },
    );
    console.log("Intent classification result:", intentResult);

    intentData = {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      method: intentResult.method,
      reasoning: intentResult.reasoning,
    };

    // Perform triage assessment for general chat (symptoms)
    if (intentResult.intent === 'general_chat' && message && message.trim().length > 10) {
      try {
        console.log('Performing triage assessment...');
        const triageResult = await triageService.assessSymptoms(
          message,
          {
            age: req.body.patientInfo?.age,
            gender: req.body.patientInfo?.gender,
            duration: req.body.patientInfo?.duration,
            severity: req.body.patientInfo?.severity
          },
          language
        );

        triageData = triageService.formatTriageResult(triageResult, language);
        console.log(`Triage: ${triageData.level} (${triageData.confidence}% confidence)`);

        // If emergency detected, prioritize emergency response
        if (triageData.isEmergency) {
          console.log('EMERGENCY TRIAGE - Sending emergency response');
          botResponse = triageResult.emergencyWarning + '\n\n' + 
                       triageResult.recommendedActions.join('\n\n') + '\n\n' +
                       '**This is a medical emergency. Do not use this chat for emergencies. Call emergency services immediately.**';
        }
      } catch (triageError) {
        console.error('Triage assessment failed:', triageError);
        // Continue without triage data
      }
    }

    // Route based on intent
    switch (intentResult.intent) {
      case "web_search":
        console.log("Web search intent detected - using search API");
        try {
          console.log("Performing web search for:", message);
          searchResults = await tavilySearch.searchMedical(message, {
            maxResults: 5,
          });

          if (
            searchResults &&
            searchResults.results &&
            searchResults.results.length > 0
          ) {
            webSearchData = {
              query: message,
              results: searchResults.results,
              usedWebSearch: true,
              bypassedRAG: true,
              totalResults: searchResults.totalResults,
            };

            // Generate response with web search context
            const searchContext = searchResults.results
              .map(
                (result) =>
                  `**${result.title}**\n${result.content}\nSource: ${result.url}`,
              )
              .join("\n\n---\n\n");

            const contextualMessage = `Based on current web search results for "${message}":\n\n${searchContext}`;
            botResponse = await generateAIResponse(
              contextualMessage,
              conversationHistory,
              language,
              languageInfo,
              images,
            );
            console.log("Generated response with web search results");
          } else {
            console.log("No web search results found");
            botResponse =
              language === "ta"
                ? "மன்னிக்கவும், தற்போது வலை தேடல் முடிவுகள் கிடைக்கவில்லை."
                : "I apologize, but I couldn't find current web search results for your query.";
          }
        } catch (searchError) {
          console.error("Web search failed:", searchError.message);
          webSearchData = {
            query: message,
            error: searchError.message,
            fallback: true,
          };
          botResponse =
            language === "ta"
              ? "மன்னிக்கவும், வலை தேடல் தற்போது கிடைக்கவில்லை."
              : "I apologize, but web search is currently unavailable.";
        }
        break;

      case "appointment":
        console.log("Appointment intent detected");
        try {
          const appointmentUiIntent =
            await openRouterService.classifyAppointmentUiIntent(message, {
              isAuthenticated: !!userId,
              language,
              modeHint: "booking",
            });

          // Check if user is authenticated for appointment booking
          if (!userId) {
            appointmentData = {
              intent: appointmentUiIntent,
              message:
                "To book an appointment, please log in to your account first.",
              requiresLogin: true,
            };

            const responseTemplates = require("../services/responseTemplates");
            const loginResponse =
              responseTemplates.generateLoginRequiredResponse(language);
            botResponse = loginResponse.formatted;
            appointmentData.structuredResponse = loginResponse;
          } else {
            // User is authenticated, proceed with appointment booking
            appointmentData = {
              intent: appointmentUiIntent,
              message:
                "I can help you book an appointment! Please let me know what type of doctor you need.",
              simpleBooking: true,
            };

            const responseTemplates = require("../services/responseTemplates");
            const bookingResponse =
              responseTemplates.generateAppointmentBookingResponse(language);
            botResponse = bookingResponse.formatted;
            appointmentData.structuredResponse = bookingResponse;
          }
        } catch (appointmentError) {
          console.error("Appointment detection error:", appointmentError);
          // Continue with normal chat if appointment processing fails
        }
        break;

      case "appointmentManagement":
        console.log("Appointment management intent detected");
        try {
          const appointmentUiIntent =
            await openRouterService.classifyAppointmentUiIntent(message, {
              isAuthenticated: !!userId,
              language,
              modeHint: "management",
            });

          // Check if it's a reschedule request
          if (appointmentUiIntent === "appointment_reschedule") {
            
            if (!userId) {
              botResponse = "To reschedule an appointment, please log in to your account first.";
            } else {
              const rescheduleAgent = require("../services/rescheduleAgent");
              
              // Parse the reschedule request
              const parsedRequest = await rescheduleAgent.parseRescheduleRequest(message, userId);
              
              // Find the appointment to reschedule
              const findResult = await rescheduleAgent.findAppointmentToReschedule(
                userId,
                parsedRequest.appointmentIdentifier
              );
              
              // Generate response
              botResponse = await rescheduleAgent.generateRescheduleResponse(
                parsedRequest,
                findResult,
                language
              );
              
              // Store reschedule data for frontend
              appointmentData = {
                intent: appointmentUiIntent,
                parsedRequest,
                findResult,
                needsConfirmation: !findResult.error && !findResult.needsClarification && 
                                   parsedRequest.newDate && parsedRequest.newTime
              };
            }
          } 
          // Check if it's a cancellation request
          else if (appointmentUiIntent === "appointment_cancel") {
            
            if (!userId) {
              botResponse = "To cancel an appointment, please log in to your account first.";
            } else {
              const cancellationAgent = require("../services/cancellationAgent");
              
              // Parse the cancellation request
              const parsedRequest = await cancellationAgent.parseCancellationRequest(message, userId);
              
              // Find the appointment to cancel
              const findResult = await cancellationAgent.findAppointmentToCancel(
                userId,
                parsedRequest.appointmentIdentifier
              );
              
              // Generate response
              botResponse = await cancellationAgent.generateCancellationResponse(
                parsedRequest,
                findResult,
                language
              );
              
              // Store cancellation data for frontend
              appointmentData = {
                intent: appointmentUiIntent,
                parsedRequest,
                findResult,
                needsConfirmation: !findResult.error && !findResult.needsClarification
              };
            }
          }
          else {
            // Handle other appointment management (status check, etc.)
            botResponse = await generateAIResponse(
              message,
              conversationHistory,
              language,
              languageInfo,
              images,
            );
          }
        } catch (error) {
          console.error("Appointment management error:", error);
          botResponse = "I encountered an error processing your request. Please try again.";
        }
        break;

      case "faq":
        console.log("❓ FAQ intent detected - searching knowledge base");
        // Check for FAQ query
        const faqService = require("../services/faqService");
        if (faqService.isInitialized()) {
          try {
            console.log("Searching FAQ database for query:", message);
            const faqResults = await faqService.searchFAQ(message, {
              limit: 3,
            });

            console.log(
              ` FAQ search results: ${faqResults.results?.length || 0} results found`,
            );
            if (faqResults.results?.length > 0) {
              console.log(
                "FAQ results preview:",
                faqResults.results.map((r) => ({
                  title: r.title,
                  isQAPair: r.isQAPair,
                  score: r.score,
                  hasQuestion: !!r.question,
                  hasAnswer: !!r.answer,
                })),
              );
            }

            if (faqResults.results && faqResults.results.length > 0) {
              const faqAnswer = await faqService.generateAnswer(
                message,
                faqResults,
              );

              console.log(
                "Generated FAQ answer:",
                faqAnswer?.substring(0, 100) + "...",
              );

              // If we got a meaningful FAQ answer (check for various fallback phrases)
              const fallbackPhrases = [
                "I don't have this information yet",
                "I don't have specific information about that topic yet",
                "I don't have information about that topic",
                "I don't have specific information",
                "I don't have that information",
                "I cannot find information about that topic",
              ];

              const isFallbackResponse = fallbackPhrases.some(
                (phrase) => faqAnswer && faqAnswer.includes(phrase),
              );

              if (faqAnswer && !isFallbackResponse) {
                botResponse = faqAnswer;
                faqData = {
                  query: message,
                  resultsCount: faqResults.totalResults,
                  source: faqResults.source,
                  usedFAQ: true,
                  searchResults: faqResults.results.map((r) => ({
                    title: r.title,
                    category: r.category,
                    isQAPair: r.isQAPair,
                    score: r.score,
                    question: r.question,
                    answer: r.answer,
                  })),
                };
                console.log("Using FAQ answer for query");
              } else {
                console.log(
                  "FAQ answer was fallback response, switching to AI chat",
                );
                // Fall through to general chat - this will be handled by the general AI processing below
              }
            }
          } catch (faqError) {
            console.error("FAQ search failed:", faqError.message);
            // Continue with normal AI processing
          }
        }
        break;

      case "general_chat":
      default:
        console.log("General chat intent detected");
        // Will be handled by the general AI processing below
        break;
    }

    // If no specific response was generated, proceed with general AI processing
    if (!botResponse) {
      // For FAQ intent that didn't get a good answer, treat as general chat
      if (intentResult.intent === "faq") {
        console.log(
          "FAQ intent switching to general AI chat due to no relevant FAQ data",
        );
      }

      // Only check for web search in general chat if not already handled
      if (intentResult.intent === "general_chat" && !forceWebSearch) {
        // Legacy web search detection for backward compatibility
        if (
          message.toLowerCase().includes("search") ||
          message.toLowerCase().includes("latest") ||
          message.toLowerCase().includes("recent")
        ) {
          try {
            console.log("Legacy web search intent detected");
            searchResults = await tavilySearch.searchMedical(message, {
              maxResults: 3,
            });

            if (
              searchResults &&
              searchResults.results &&
              searchResults.results.length > 0
            ) {
              webSearchData = {
                query: message,
                results: searchResults.results,
                usedWebSearch: true,
                legacyDetection: true,
                totalResults: searchResults.totalResults,
              };

              // Generate response with web search context
              const searchContext = searchResults.results
                .map((result) => `${result.title}: ${result.content}`)
                .join("\n\n");

              const contextualMessage = `Based on recent information: ${message}\n\nContext:\n${searchContext}`;
              botResponse = await generateAIResponse(
                contextualMessage,
                conversationHistory,
                language,
                languageInfo,
                images,
              );
              console.log("Generated response with legacy web search context");
            }
          } catch (searchError) {
            console.error("Legacy web search failed:", searchError.message);
            // Continue with normal AI processing
          }
        }
      }

      // If still no response, use general AI processing
      if (!botResponse) {
        try {
          console.log("Using general AI processing");
          
          // ========== EHR CONTEXT ENHANCEMENT START ==========
          // Enhance message with patient context for personalized responses
          let enhancedMessage = message;
          let usedEHRContext = false;

          if (patientContext && patientContext.hasEHR) {
            const ehrContextService = require('../services/ehrContextService');
            enhancedMessage = ehrContextService.enhancePromptWithContext(
              message,
              patientContext,
              conversationHistory
            );
            usedEHRContext = true;
            console.log('Enhanced AI prompt with patient medical context');
          }
          // ========== EHR CONTEXT ENHANCEMENT END ==========
          
          botResponse = await generateAIResponse(
            enhancedMessage,  // Use enhanced message with EHR context
            conversationHistory,
            language,
            languageInfo,
            images,
          );
          
          // ========== SAFETY WARNINGS START ==========
          // Check for safety warnings based on patient context
          let safetyWarnings = [];

          if (patientContext && patientContext.hasEHR && botResponse) {
            try {
              const ehrContextService = require('../services/ehrContextService');
              
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
                  .map(w => `**${w.type.toUpperCase()} ALERT**: ${w.message}`)
                  .join('\n\n');
                
                botResponse = `${criticalWarnings}\n\n---\n\n${botResponse}`;
                console.log('Critical warnings prepended to response');
              }
            } catch (safetyError) {
              console.error('Error checking safety warnings:', safetyError);
              // Continue without safety warnings
            }
          }
          // ========== SAFETY WARNINGS END ==========
          
        } catch (aiError) {
          console.log(
            `Gemini failed: ${aiError.message}, using fallback response`,
          );
          usingFallback = true;

          // Final fallback to simple text responses
          try {
            botResponse = generateFallbackResponse(
              message,
              language,
              languageInfo,
            );
            console.log("Using simple text fallback response");
          } catch (fallbackError) {
            // If even simple fallback fails, provide a basic response
            console.error("All fallbacks failed:", fallbackError);
            botResponse =
              language === "ta"
                ? "மன்னிக்கவும், தற்போது நான் பதிலளிக்க முடியவில்லை. மருத்துவ நிபுணரை அணுகவும்."
                : "I apologize for the technical difficulty. Please consult a healthcare professional for your medical concerns.";
          }
        }
      }
    }

    // Attach YouTube videos for healthcare video requests without replacing the text response.
    if (message && youtubeService.shouldProvideVideos(message)) {
      try {
        console.log("Video request detected - fetching YouTube recommendations");
        videoData = await youtubeService.searchVideos(message);

        if (videoData.videos.length > 0) {
          botResponse +=
            "\n\nI've included a few YouTube videos below that may help you learn visually. Please prefer trusted medical organizations and use them as educational guidance, not a substitute for professional care.";
        } else {
          botResponse +=
            `\n\nI couldn't embed matching videos right now, but you can try this YouTube search: ${videoData.searchUrl}`;
        }
      } catch (videoError) {
        console.error("Video recommendation failed:", videoError.message);
      }
    }

    // Save chat history for logged-in users
    if (userId) {
      try {
        console.log("Saving chat history for user:", userId);
        // Generate session ID if not provided
        if (!currentSessionId) {
          currentSessionId = uuidv4();
          console.log("Generated new session ID:", currentSessionId);
        }

        // Find or create chat session
        let chatHistory = await ChatHistory.findOne({
          userId,
          sessionId: currentSessionId,
          isActive: true,
        });

        if (!chatHistory) {
          console.log("Creating new chat session");
          // Create new session
          const metadata = {
            userAgent: req.headers["user-agent"],
            ipAddress: req.ip || req.connection.remoteAddress,
            deviceType: req.headers["user-agent"]?.includes("Mobile")
              ? "mobile"
              : "desktop",
          };

          chatHistory = await ChatHistory.createSession(
            userId,
            currentSessionId,
            language,
            metadata,
          );
          console.log("Created new session:", chatHistory.sessionId);
        } else {
          console.log("Using existing session:", chatHistory.sessionId);
        }

        // Add user message
        console.log("Saving user message with images:", {
          messageLength: message?.length,
          imagesCount: images?.length,
          imagesType: typeof images,
          firstImageSample: images?.[0]
            ? {
              name: images[0].name,
              size: images[0].size,
              type: images[0].type,
              dataLength: images[0].data?.length,
              dataPrefix: images[0].data?.substring(0, 50),
            }
            : null,
        });

        // Validate and clean images data
        const validImages = Array.isArray(images)
          ? images.filter((img) => {
            const isValid =
              img &&
              typeof img.name === "string" &&
              typeof img.size === "number" &&
              typeof img.type === "string" &&
              typeof img.data === "string" &&
              img.data.startsWith("data:");

            if (!isValid) {
              console.log("Invalid image data:", img);
            }
            return isValid;
          })
          : [];

        console.log("Valid images after filtering:", validImages.length);

        try {
          await chatHistory.addMessage({
            id: uuidv4(),
            role: "user",
            content: message,
            images: validImages,
            language,
            timestamp: new Date(),
          });
          console.log("User message saved successfully");
        } catch (saveError) {
          console.error("Error saving user message:", saveError);
          // Continue without failing the request
        }

        // Add bot response
        try {
          // Ensure botResponse is a string
          let contentToSave = botResponse;
          if (typeof botResponse === "object" && botResponse !== null) {
            // If it's an object, try to extract formatted text
            contentToSave =
              botResponse.formatted ||
              botResponse.text ||
              JSON.stringify(botResponse);
            console.log(
              "Bot response was object, extracted:",
              typeof contentToSave,
            );
          }

          await chatHistory.addMessage({
            id: uuidv4(),
            role: "bot",
            content: contentToSave,
            webSearchData,
            searchResults:
              webSearchData && searchResults
                ? {
                    query: searchResults.query,
                    totalResults: searchResults.totalResults,
                    sources:
                      searchResults.results?.map((r) => ({
                        title: r.title,
                        url: r.url,
                        domain: new URL(r.url).hostname,
                      })) || [],
                  }
                : null,
            triageData,
            videoData,
            language,
            timestamp: new Date(),
          });
          console.log("Bot message saved successfully");
        } catch (saveError) {
          console.error("Error saving bot message:", saveError);
          // Continue without failing the request
        }

        console.log(
          `Chat history saved for user ${userId}, session ${currentSessionId}, total messages: ${chatHistory.messages.length}`,
        );
      } catch (historyError) {
        console.error("Error saving chat history:", historyError);
        // Don't fail the request if history saving fails
      }
    } else {
      console.log("No user ID, skipping chat history save");
    }

    // Send response immediately to user
    res.json({
      response: botResponse,
      timestamp: new Date().toISOString(),
      language: language,
      sessionId: currentSessionId,
      saved: !!userId, // Indicate if the chat was saved
      usingFallback: usingFallback, // Indicate if fallback was used
      intentData: intentData, // Include intent classification data
      appointmentData: appointmentData, // Include appointment data if detected
      webSearchData: webSearchData, // Include web search data if used
      faqData: faqData, // Include FAQ data if used
      triageData: triageData, // Include triage assessment if performed
      videoData: videoData, // Include YouTube video recommendations when requested
      ehrContext: ehrContextData, // Include EHR context summary
      usedEHRContext: patientContext && patientContext.hasEHR, // Flag if EHR was used
      safetyWarnings: typeof safetyWarnings !== 'undefined' && safetyWarnings.length > 0 ? safetyWarnings : undefined, // Include safety warnings
      followUpQuestions: [], // Will be populated asynchronously
      searchResults:
        webSearchData && searchResults
          ? {
            query: searchResults.query,
            totalResults: searchResults.totalResults,
            sources:
              searchResults.results?.map((r) => ({
                title: r.title,
                url: r.url,
                domain: new URL(r.url).hostname,
              })) || [],
          }
          : null,
    });

    // Generate follow-up questions asynchronously after response is sent
    // This doesn't block the user's response
    setImmediate(async () => {
      try {
        console.log('Generating follow-up questions asynchronously...');
        const followUpQuestions = await followUpQuestionsService.generateFollowUpQuestions(
          botResponse,
          message,
          conversationHistory,
          language,
          3 // Generate 3 follow-up questions
        );
        
        // Store follow-up questions in chat history if user is logged in
        if (userId && currentSessionId && followUpQuestions.length > 0) {
          try {
            const chatHistory = await ChatHistory.findOne({
              userId,
              sessionId: currentSessionId,
            });
            
            if (chatHistory && chatHistory.messages.length > 0) {
              // Add follow-up questions to the last bot message
              const lastMessage = chatHistory.messages[chatHistory.messages.length - 1];
              if (lastMessage.role === 'bot') {
                lastMessage.followUpQuestions = followUpQuestions;
                await chatHistory.save();
                console.log(`Saved ${followUpQuestions.length} follow-up questions to chat history`);
              }
            }
          } catch (saveError) {
            console.error('Error saving follow-up questions to history:', saveError);
          }
        }
        
        console.log(`Generated ${followUpQuestions.length} follow-up questions:`, followUpQuestions);
      } catch (followUpError) {
        console.error('Error in async follow-up generation:', followUpError);
      }
    });
  } catch (error) {
    console.error("Chat error:", error);

    // Even if there's an error, try to provide a fallback response instead of failing
    try {
      const fallbackResponse = generateFallbackResponse(
        req.body.message || "help",
        req.body.language || "en",
        req.body.languageInfo,
      );

      console.log("Using emergency fallback due to system error");

      return res.json({
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        language: req.body.language || "en",
        sessionId: req.body.sessionId,
        saved: false,
        usingFallback: true,
        fallbackReason: "System error - using emergency fallback",
      });
    } catch (fallbackError) {
      console.error("Even emergency fallback failed:", fallbackError);

      // Absolute last resort - basic response (this should NEVER fail)
      const emergencyResponse =
        req.body.language === "ta"
          ? "மன்னிக்கவும், தற்போது தொழில்நுட்ப சிக்கல் உள்ளது. மருத்துவ நிபுணரை அணுகவும்."
          : "I apologize for the technical difficulty. Please consult a healthcare professional for your medical concerns.";

      return res.json({
        response: emergencyResponse,
        timestamp: new Date().toISOString(),
        language: req.body.language || "en",
        sessionId: req.body.sessionId,
        saved: false,
        usingFallback: true,
        fallbackReason: "Emergency fallback - all systems unavailable",
      });
    }
  }
});

// Test intent classification endpoint
router.post("/classify-intent", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const intentResult = await intentClassifier.classifyIntent(
      message,
      conversationHistory,
    );

    res.json({
      message,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      method: intentResult.method,
      reasoning: intentResult.reasoning,
      scores: intentResult.scores || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Intent classification error:", error);
    res.status(500).json({
      message: "Error classifying intent",
      error: error.message,
    });
  }
});

// Get intent classifier statistics
router.get("/intent-stats", (req, res) => {
  try {
    const stats = intentClassifier.getIntentStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting intent stats:", error);
    res.status(500).json({
      message: "Error getting intent statistics",
      error: error.message,
    });
  }
});

// Get follow-up questions for a specific session
router.get("/follow-up-questions/:sessionId", auth.optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId || req.user?._id;

    if (!userId || !sessionId) {
      return res.json({ followUpQuestions: [] });
    }

    const chatHistory = await ChatHistory.findOne({
      userId,
      sessionId,
    });

    if (!chatHistory || chatHistory.messages.length === 0) {
      return res.json({ followUpQuestions: [] });
    }

    // Get the last bot message
    const lastBotMessage = [...chatHistory.messages]
      .reverse()
      .find(msg => msg.role === 'bot');

    if (lastBotMessage && lastBotMessage.followUpQuestions) {
      return res.json({ 
        followUpQuestions: lastBotMessage.followUpQuestions,
        messageId: lastBotMessage.id
      });
    }

    return res.json({ followUpQuestions: [] });
  } catch (error) {
    console.error("Error fetching follow-up questions:", error);
    res.json({ followUpQuestions: [] });
  }
});

// Triage assessment endpoint
router.post("/triage", async (req, res) => {
  try {
    const { symptoms, patientInfo, language = 'en' } = req.body;

    if (!symptoms || symptoms.trim().length === 0) {
      return res.status(400).json({
        message: 'Symptoms are required for triage assessment'
      });
    }

    console.log('Triage request:', { symptoms: symptoms.substring(0, 100), language });

    // Perform triage assessment
    const triageResult = await triageService.assessSymptoms(
      symptoms,
      patientInfo || {},
      language
    );

    // Format result for frontend
    const formattedResult = triageService.formatTriageResult(triageResult, language);

    console.log(`Triage completed: ${formattedResult.level} (${formattedResult.confidence}% confidence)`);

    res.json({
      success: true,
      triage: formattedResult,
      raw: triageResult, // Include raw data for advanced use
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Triage endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Triage assessment failed',
      error: error.message
    });
  }
});

// Get triage statistics
router.get("/triage/stats", (req, res) => {
  try {
    const stats = triageService.getTriageStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting triage stats:", error);
    res.status(500).json({
      message: "Error getting triage statistics",
      error: error.message,
    });
  }
});

// Dedicated web search endpoint (bypasses RAG/FAQ)
router.post("/web-search", async (req, res) => {
  try {
    const { query, maxResults = 5, language = "en" } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    console.log("Direct web search request:", query);

    // Perform web search using searchMedical method
    const searchResults = await tavilySearch.searchMedical(query, {
      maxResults,
    });

    if (
      !searchResults ||
      !searchResults.results ||
      searchResults.results.length === 0
    ) {
      return res.json({
        query,
        results: [],
        totalResults: 0,
        message:
          language === "ta"
            ? "தேடல் முடிவுகள் எதுவும் கிடைக்கவில்லை"
            : "No search results found",
        timestamp: new Date().toISOString(),
      });
    }

    // Format results for response
    const formattedResults = searchResults.results.map((result) => ({
      title: result.title,
      content: result.content,
      url: result.url,
      domain: new URL(result.url).hostname,
      publishedDate: result.publishedDate || null,
      score: result.score || 0,
    }));

    // Generate AI summary of search results
    let aiSummary = null;
    try {
      const searchContext = searchResults.results
        .map(
          (result) =>
            `**${result.title}**\n${result.content}\nSource: ${result.url}`,
        )
        .join("\n\n---\n\n");

      const summaryPrompt = `Based on the following web search results for "${query}", provide a comprehensive summary:\n\n${searchContext}`;

      aiSummary = await generateAIResponse(
        summaryPrompt,
        [],
        language,
        null,
        [],
      );
      console.log("Generated AI summary of search results");
    } catch (summaryError) {
      console.error("Failed to generate AI summary:", summaryError.message);
    }

    res.json({
      query,
      results: formattedResults,
      totalResults: searchResults.totalResults || formattedResults.length,
      aiSummary,
      answer: searchResults.answer || null,
      bypassedRAG: true,
      searchMethod: "web_api",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Web search error:", error);
    res.status(500).json({
      message: "Web search failed",
      error: error.message,
    });
  }
});

// Gemini chat endpoint
const handleGeminiChat = async (req, res) => {
  try {
    const {
      message,
      conversationHistory,
      language = "en",
      languageInfo,
      enableReasoning = true,
    } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "Gemini service not configured" });
    }

    // Validate domain relevance
    console.log("Validating domain relevance...");
    const domainValidator = require("../services/domainValidator");
    const domainValidation = await domainValidator.validateDomain(message, language);
    
    console.log("Domain validation result:", domainValidation);

    if (!domainValidation.isValid) {
      console.log("Off-topic message rejected");
      const rejectionMessage = domainValidator.generateRejectionMessage(language);
      
      return res.json({
        response: rejectionMessage,
        intent: "off_topic",
        domainValidation: {
          isValid: false,
          confidence: domainValidation.confidence,
          method: domainValidation.method,
          reasoning: domainValidation.reasoning
        },
        timestamp: new Date().toISOString()
      });
    }
    
    console.log("Message validated as healthcare-related");
    console.log("Gemini chat request");

    const response = await openRouterService.generateResponse(
      message,
      conversationHistory,
      {
        language,
        languageInfo,
        enableReasoning,
        maxTokens: 1000,
        temperature: 0.7,
      },
    );

    res.json({
      response: response.content,
      reasoning: response.reasoning_details,
      model: response.model,
      usage: response.usage,
      timestamp: new Date().toISOString(),
      language: language,
    });
  } catch (error) {
    console.error("Gemini chat error:", error);
    res.status(500).json({
      message: "Gemini service error",
      error: error.message,
    });
  }
};

router.post("/gemini-chat", handleGeminiChat);
router.post("/openrouter-chat", handleGeminiChat);

// Continue Gemini conversation
const handleGeminiContinue = async (req, res) => {
  try {
    const { messages, newMessage, language = "en" } = req.body;

    if (!newMessage || !messages) {
      return res
        .status(400)
        .json({ message: "Messages and new message are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "Gemini service not configured" });
    }

    console.log("Gemini continue conversation");

    const response = await openRouterService.continueConversation(
      messages,
      newMessage,
      {
        maxTokens: 1000,
        temperature: 0.7,
      },
    );

    res.json({
      response: response.content,
      reasoning: response.reasoning_details,
      model: response.model,
      usage: response.usage,
      fullConversation: response.fullConversation,
      timestamp: new Date().toISOString(),
      language: language,
    });
  } catch (error) {
    console.error("Gemini continue conversation error:", error);
    res.status(500).json({
      message: "Gemini service error",
      error: error.message,
    });
  }
};

router.post("/gemini-continue", handleGeminiContinue);
router.post("/openrouter-continue", handleGeminiContinue);

// Get Gemini models
const handleGeminiModels = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "Gemini service not configured" });
    }

    const models = await openRouterService.getAvailableModels();

    res.json({
      models,
      defaultModel: openRouterService.defaultModel,
      configured: true,
    });
  } catch (error) {
    console.error("Gemini models error:", error);
    res.status(500).json({
      message: "Error fetching Gemini models",
      error: error.message,
    });
  }
};

router.get("/gemini-models", handleGeminiModels);
router.get("/openrouter-models", handleGeminiModels);

// Check AI services status
router.get("/status", async (req, res) => {
  console.log(" Status endpoint called");

  const services = {
    gemini: { available: false, priority: "primary" },
    calendar: { available: true },
    tavilySearch: { available: true, configured: true }, // Always true
  };

  // Check Gemini availability
  try {
    if (process.env.GEMINI_API_KEY) {
      services.gemini.available = await openRouterService.checkAvailability();
    }
  } catch (error) {
    console.log("Gemini status check failed:", error.message);
  }

  console.log("Tavily Search hardcoded as configured and available");

  let message = "Gemini AI service";
  if (services.gemini.available) {
    message = "Gemini AI service available";
  } else {
    message = "Gemini AI service unavailable - check API key configuration";
  }

  res.json({
    status: "OK",
    services,
    message,
  });
});

// Confirm appointment booking from chat
router.post("/book-appointment", async (req, res) => {
  try {
    const { doctorId, dateTime, appointmentData, bookingId, timezone } = req.body;

    if (!doctorId || !dateTime) {
      return res
        .status(400)
        .json({ message: "Doctor ID and date/time are required" });
    }

    // Store user's timezone for calendar events
    const userTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let userId;
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Find or create patient profile
    const Patient = require("../models/Patient");
    let patient = await Patient.findOne({ userId });

    if (!patient) {
      // Create basic patient profile
      patient = new Patient({
        userId,
        medicalHistory: [],
        allergies: [],
        medications: [],
      });
      await patient.save();
    }

    // Get doctor details
    const doctor = await Doctor.findById(doctorId).populate(
      "userId",
      "profile email googleCalendar",
    );
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get patient user details
    const patientUser = await User.findById(userId);
    if (!patientUser) {
      return res.status(404).json({ message: "Patient user not found" });
    }

    // Check if appointment slot is available (basic check)
    const Appointment = require("../models/Appointment");
    const existingAppointment = await Appointment.findOne({
      doctorId,
      dateTime: new Date(dateTime),
      status: { $in: ["scheduled", "confirmed"] },
    });

    if (existingAppointment) {
      return res
        .status(409)
        .json({ message: "This time slot is no longer available" });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      dateTime: new Date(dateTime),
      duration: 30,
      type: appointmentData?.appointmentType || "consultation",
      status: "scheduled",
      symptoms: appointmentData?.symptoms || [],
      chiefComplaint: appointmentData?.chiefComplaint || "",
      fee: {
        consultation: 0,
        additional: 0,
        total: 0,
        paid: false,
      },
    });

    const savedAppointment = await appointment.save();

    // Try to create Google Calendar event with comprehensive fallback handling
    let calendarEventId = null;
    let calendarEventLink = null;
    let meetingLink = null;
    let calendarIntegrationStatus = "disabled";
    let calendarErrorMessage = null;

    try {
      const googleCalendar = require("../services/googleCalendar");

      // Debug logging
      console.log("DEBUG - Doctor object:", {
        hasUserId: !!doctor.userId,
        userIdEmail: doctor.userId?.email,
        hasGoogleCalendar: !!doctor.userId?.googleCalendar,
        googleCalendarId: doctor.userId?.googleCalendar?.calendarId
      });
      
      console.log("DEBUG - Patient object:", {
        hasGoogleCalendar: !!patientUser.googleCalendar,
        googleCalendarId: patientUser.googleCalendar?.calendarId,
        email: patientUser.email
      });

      // Get the connected Google Calendar email for the patient
      const connectedPatientEmail = patientUser.googleCalendar?.calendarId || patientUser.email;
      
      // Get the connected Google Calendar email for the doctor (if they have one connected)
      const connectedDoctorEmail = doctor.userId.googleCalendar?.calendarId || doctor.userId.email || 'noreply@medibot.com';

      const calendarData = {
        patientName: `${patientUser.profile.firstName} ${patientUser.profile.lastName}`,
        patientEmail: connectedPatientEmail,
        doctorName: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
        doctorEmail: connectedDoctorEmail,
        dateTime: savedAppointment.dateTime,
        duration: savedAppointment.duration,
        appointmentType: savedAppointment.type,
        chiefComplaint: savedAppointment.chiefComplaint,
        symptoms: savedAppointment.symptoms,
        timezone: userTimezone // Pass user's timezone
      };

      console.log("Attempting to create calendar event...");
      console.log("   Patient email:", calendarData.patientEmail);
      console.log("   Doctor email:", calendarData.doctorEmail);
      console.log("   Full calendar data:", JSON.stringify(calendarData, null, 2));
      
      const calendarResult = await googleCalendar.safeCreateEvent(calendarData, userId);

      if (calendarResult.eventId) {
        // Calendar integration successful
        calendarEventId = calendarResult.eventId;
        calendarEventLink = calendarResult.eventLink;
        meetingLink = calendarResult.meetingLink;
        calendarIntegrationStatus = "success";
        console.log("Calendar event created successfully:", calendarEventId);
        
        // Save the calendar event ID to the appointment
        savedAppointment.googleCalendarEventId = calendarEventId;
        if (meetingLink) {
          savedAppointment.googleMeetLink = meetingLink;
        }
        await savedAppointment.save();
        console.log("Calendar event ID saved to appointment");
      } else {
        // Calendar integration failed, but we have manual instructions
        calendarIntegrationStatus = "manual_required";
        calendarErrorMessage =
          calendarResult.error || "Calendar integration unavailable";

        // Store manual calendar instructions for the response
        savedAppointment.manualCalendarInstructions =
          calendarResult.manualInstructions;
        await savedAppointment.save();

        console.log(
          "Calendar integration failed, manual instructions provided",
        );
      }
    } catch (calendarError) {
      console.error("Calendar integration failed:", calendarError.message);

      // Categorize the error for better user feedback
      if (
        calendarError.message.includes("quota") ||
        calendarError.message.includes("429")
      ) {
        calendarIntegrationStatus = "quota_exceeded";
        calendarErrorMessage =
          "Calendar service temporarily unavailable due to high usage";
      } else if (
        calendarError.message.includes("Not Found") ||
        calendarError.message.includes("404")
      ) {
        calendarIntegrationStatus = "calendar_not_found";
        calendarErrorMessage =
          "Calendar configuration issue - please contact support";
      } else if (
        calendarError.message.includes("Forbidden") ||
        calendarError.message.includes("403")
      ) {
        calendarIntegrationStatus = "permission_denied";
        calendarErrorMessage =
          "Calendar permissions issue - manual coordination required";
      } else if (
        calendarError.message.includes("service not available") ||
        calendarError.message.includes("not initialized")
      ) {
        calendarIntegrationStatus = "service_unavailable";
        calendarErrorMessage = "Calendar service temporarily unavailable";
      } else {
        calendarIntegrationStatus = "unknown_error";
        calendarErrorMessage = "Calendar integration temporarily unavailable";
      }

      console.log(` Calendar integration status: ${calendarIntegrationStatus}`);

      // Don't fail the appointment booking if calendar fails
      // The appointment is still valid and functional without calendar integration
    }

    // Populate the appointment with doctor and patient details
    const populatedAppointment = await Appointment.findById(
      savedAppointment._id,
    )
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "profile" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "profile" },
      });

    // Generate user-friendly calendar status message
    let calendarStatusMessage = "";
    let calendarInstructions = "";

    switch (calendarIntegrationStatus) {
      case "success":
        calendarStatusMessage =
          "Appointment booked successfully with calendar integration";
        calendarInstructions =
          "Check your calendar for the appointment details and reminders.";
        break;
      case "manual_required":
        calendarStatusMessage =
          "Appointment booked successfully (manual calendar setup required)";
        calendarInstructions =
          "Your appointment is confirmed. Please add it to your calendar manually using the provided instructions.";
        break;
      case "quota_exceeded":
        calendarStatusMessage =
          "Appointment booked successfully (calendar temporarily unavailable)";
        calendarInstructions =
          "Your appointment is confirmed. Please manually add this to your calendar and contact the doctor directly.";
        break;
      case "calendar_not_found":
      case "permission_denied":
        calendarStatusMessage =
          "Appointment booked successfully (calendar integration unavailable)";
        calendarInstructions =
          "Your appointment is confirmed. Please manually add this to your calendar and contact the doctor directly.";
        break;
      case "service_unavailable":
      case "unknown_error":
      default:
        calendarStatusMessage =
          "Appointment booked successfully (calendar sync pending)";
        calendarInstructions =
          "Your appointment is confirmed. Calendar integration may sync later, or please add manually to your calendar.";
        break;
    }

    res.json({
      message: calendarStatusMessage,
      appointment: {
        id: populatedAppointment._id,
        doctorName: `Dr. ${populatedAppointment.doctorId.userId.profile.firstName} ${populatedAppointment.doctorId.userId.profile.lastName}`,
        specialization: populatedAppointment.doctorId.specialization,
        dateTime: populatedAppointment.dateTime,
        type: populatedAppointment.type,
        fee: populatedAppointment.fee,
        status: populatedAppointment.status,
        symptoms: populatedAppointment.symptoms,
        chiefComplaint: populatedAppointment.chiefComplaint,
        calendarEventLink: calendarEventLink,
        meetingLink: meetingLink,
      },
      calendarIntegration: {
        status: calendarIntegrationStatus,
        message: calendarErrorMessage,
        instructions: calendarInstructions,
        fallbackUsed: calendarIntegrationStatus !== "success",
      },
      // Provide manual calendar details when needed
      manualCalendarDetails:
        calendarIntegrationStatus !== "success"
          ? {
            title: `Medical Appointment with Dr. ${populatedAppointment.doctorId.userId.profile.firstName} ${populatedAppointment.doctorId.userId.profile.lastName}`,
            dateTime: populatedAppointment.dateTime,
            duration: `${populatedAppointment.duration || 30} minutes`,
            location: "Contact doctor for location/meeting details",
            description: `Appointment Type: ${populatedAppointment.type}\nSymptoms: ${populatedAppointment.symptoms.join(", ")}\nChief Complaint: ${populatedAppointment.chiefComplaint}`,
            doctorContact: doctor.userId.email,
            patientContact: patientUser.email,
            // Include manual calendar links if available
            calendarLinks:
              savedAppointment.manualCalendarInstructions?.instructions ||
              null,
          }
          : null,
    });
  } catch (error) {
    console.error("Appointment booking error:", error);
    res.status(500).json({
      message: error.message || "Error booking appointment",
    });
  }
});

// Get user's appointment history
router.get("/appointments", async (req, res) => {
  try {
    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let userId;
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Find patient
    const Patient = require("../models/Patient");
    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.json({ appointments: [] });
    }

    // Get appointments
    const Appointment = require("../models/Appointment");
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "profile" },
      })
      .sort({ dateTime: -1 })
      .limit(50);

    const formattedAppointments = appointments.map((appointment) => ({
      id: appointment._id,
      doctorName: `Dr. ${appointment.doctorId.userId.profile.firstName} ${appointment.doctorId.userId.profile.lastName}`,
      specialization: appointment.doctorId.specialization,
      dateTime: appointment.dateTime,
      type: appointment.type,
      status: appointment.status,
      fee: appointment.fee,
      symptoms: appointment.symptoms,
      chiefComplaint: appointment.chiefComplaint,
      diagnosis: appointment.diagnosis,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
    }));

    res.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Error fetching appointment history" });
  }
});

// Cancel appointment
router.put("/appointments/:appointmentId/cancel", async (req, res) => {
  try {
    // Get user from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let userId;
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { appointmentId } = req.params;

    // Find patient
    const Patient = require("../models/Patient");
    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Find and update appointment
    const Appointment = require("../models/Appointment");
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: patient._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "completed") {
      return res
        .status(400)
        .json({ message: "Cannot cancel completed appointment" });
    }

    // Check if appointment is within 24 hours
    const appointmentTime = new Date(appointment.dateTime);
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff < 24) {
      return res.status(400).json({
        message: "Cannot cancel appointment within 24 hours of scheduled time",
      });
    }

    // Delete from Google Calendar if event exists
    let calendarDeletionStatus = "not_applicable";
    let calendarDeletionMessage = "";

    if (appointment.googleCalendarEventId) {
      try {
        const googleCalendar = require("../services/googleCalendar");
        // Use user-specific calendar delete method
        await googleCalendar.deleteUserCalendarEvent(
          appointment.googleCalendarEventId,
          userId // Pass the user ID for OAuth
        );
        calendarDeletionStatus = "success";
        calendarDeletionMessage = "Calendar event deleted successfully";
        console.log(
          "Calendar event deleted:",
          appointment.googleCalendarEventId,
        );
      } catch (calendarError) {
        console.error("Calendar deletion failed:", calendarError.message);
        calendarDeletionStatus = "failed";

        if (
          calendarError.message.includes("Not Found") ||
          calendarError.message.includes("404")
        ) {
          calendarDeletionMessage =
            "Calendar event may have been already removed or not found";
        } else if (
          calendarError.message.includes("quota") ||
          calendarError.message.includes("429")
        ) {
          calendarDeletionMessage =
            "Calendar service temporarily unavailable - please manually remove from calendar";
        } else {
          calendarDeletionMessage =
            "Calendar event deletion failed - please manually remove from calendar";
        }

        // Continue with MongoDB deletion even if calendar fails
      }
    } else {
      calendarDeletionMessage =
        "No calendar event was associated with this appointment";
    }

    // Store appointment data before deletion
    const appointmentData = {
      id: appointment._id,
      doctorId: appointment.doctorId,
      dateTime: appointment.dateTime,
      type: appointment.type
    };

    // Delete from MongoDB
    await Appointment.findByIdAndDelete(appointment._id);
    console.log("Appointment deleted from MongoDB:", appointment._id);

    // Generate appropriate response message
    let responseMessage = "Appointment cancelled and removed successfully";
    if (calendarDeletionStatus === "failed") {
      responseMessage += " (please manually remove from calendar)";
    }

    res.json({
      message: responseMessage,
      appointment: appointmentData,
      deleted: true,
      calendarIntegration: {
        status: calendarDeletionStatus,
        message: calendarDeletionMessage,
        fallbackUsed: calendarDeletionStatus === "failed",
      },
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Error cancelling appointment" });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract medication names mentioned in text
 * Used for checking drug interactions and allergy contraindications
 */
function extractMedicationMentions(text) {
  if (!text || typeof text !== 'string') return [];
  
  const medications = [];
  
  // Common medications to check for
  const commonMeds = [
    'ibuprofen', 'acetaminophen', 'aspirin', 'paracetamol', 'tylenol', 'advil', 'motrin',
    'amoxicillin', 'penicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
    'lisinopril', 'metformin', 'atorvastatin', 'simvastatin', 'rosuvastatin',
    'omeprazole', 'pantoprazole', 'ranitidine', 'esomeprazole',
    'cetirizine', 'loratadine', 'diphenhydramine', 'fexofenadine',
    'albuterol', 'prednisone', 'dexamethasone', 'hydrocortisone',
    'warfarin', 'clopidogrel', 'apixaban', 'rivaroxaban',
    'levothyroxine', 'insulin', 'methotrexate', 'gabapentin',
    'sertraline', 'fluoxetine', 'escitalopram', 'duloxetine',
    'amlodipine', 'losartan', 'hydrochlorothiazide', 'furosemide'
  ];
  
  const lowerText = text.toLowerCase();
  
  commonMeds.forEach(med => {
    // Check for whole word matches to avoid false positives
    const regex = new RegExp(`\\b${med}\\b`, 'i');
    if (regex.test(lowerText)) {
      medications.push(med);
    }
  });
  
  return [...new Set(medications)]; // Remove duplicates
}

module.exports = router;

