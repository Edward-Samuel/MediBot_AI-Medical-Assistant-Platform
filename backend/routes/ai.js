const express = require("express");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const ChatHistory = require("../models/ChatHistory");
const auth = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");
const tavilySearch = require("../services/tavilySearch");
const openRouterService = require("../services/openRouterService");
const intentClassifier = require("../services/intentClassifier");
// const appointmentAgent = require('../services/appointmentAgent');

const router = express.Router();

// Generate response using OpenRouter with structured templates
async function generateAIResponse(
  message,
  conversationHistory,
  language,
  languageInfo,
  images = [],
) {
  try {
    console.log("Using OpenRouter for AI response...");

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
      `Successfully used OpenRouter model: ${response.model}${images?.length ? " (with images)" : ""}`,
    );

    // Log if template was used
    if (response.isTemplate) {
      console.log("📋 Used structured template response");
    }

    return response.content;
  } catch (error) {
    console.error("OpenRouter error:", error);
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

    // Use OpenRouter for doctor recommendation
    try {
      console.log("Using OpenRouter for doctor recommendation...");

      const analysisResult = await openRouterService.analyzeSymptoms(symptoms, {
        age,
        gender,
        urgency,
      });

      if (analysisResult.analysis) {
        aiAnalysis = analysisResult.analysis;
        console.log("OpenRouter analysis successful");
      } else {
        console.log("⚠️ OpenRouter analysis parsing failed, using fallback...");
        aiAnalysis = fallbackSpecializationMatch(symptoms);
      }
    } catch (openRouterError) {
      console.log(
        "❌ OpenRouter failed, using fallback analysis:",
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

    let botResponse;
    let usingFallback = false;
    let appointmentData = null;
    let webSearchData = null;
    let faqData = null;
    let searchResults = null; // Declare at top level
    let intentData = null;

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

    // Route based on intent
    switch (intentResult.intent) {
      case "web_search":
        console.log("🔍 Web search intent detected - using search API");
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
          // Check if user is authenticated for appointment booking
          if (!userId) {
            appointmentData = {
              intent: "appointment_booking_login_required",
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
              intent: "appointment_booking",
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

      case "faq":
        console.log("❓ FAQ intent detected - searching knowledge base");
        // Check for FAQ query
        const faqService = require("../services/faqService");
        if (faqService.isInitialized()) {
          try {
            console.log("🔍 Searching FAQ database for query:", message);
            const faqResults = await faqService.searchFAQ(message, {
              limit: 3,
            });

            console.log(
              ` FAQ search results: ${faqResults.results?.length || 0} results found`,
            );
            if (faqResults.results?.length > 0) {
              console.log(
                "📋 FAQ results preview:",
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
            console.log("🔍 Legacy web search intent detected");
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
          botResponse = await generateAIResponse(
            message,
            conversationHistory,
            language,
            languageInfo,
            images,
          );
        } catch (aiError) {
          console.log(
            `❌ OpenRouter failed: ${aiError.message}, using fallback response`,
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
            console.error("❌ All fallbacks failed:", fallbackError);
            botResponse =
              language === "ta"
                ? "மன்னிக்கவும், தற்போது நான் பதிலளிக்க முடியவில்லை. மருத்துவ நிபுணரை அணுகவும்."
                : "I apologize for the technical difficulty. Please consult a healthcare professional for your medical concerns.";
          }
        }
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

// OpenRouter chat with reasoning capabilities
router.post("/openrouter-chat", async (req, res) => {
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

    if (!process.env.OPENROUTER_API_KEY) {
      return res
        .status(503)
        .json({ message: "OpenRouter service not configured" });
    }

    console.log("OpenRouter reasoning chat request");

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
    console.error("OpenRouter chat error:", error);
    res.status(500).json({
      message: "OpenRouter service error",
      error: error.message,
    });
  }
});

// Continue OpenRouter conversation with reasoning
router.post("/openrouter-continue", async (req, res) => {
  try {
    const { messages, newMessage, language = "en" } = req.body;

    if (!newMessage || !messages) {
      return res
        .status(400)
        .json({ message: "Messages and new message are required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res
        .status(503)
        .json({ message: "OpenRouter service not configured" });
    }

    console.log("OpenRouter continue conversation with reasoning");

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
    console.error("OpenRouter continue conversation error:", error);
    res.status(500).json({
      message: "OpenRouter service error",
      error: error.message,
    });
  }
});

// Get OpenRouter models
router.get("/openrouter-models", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res
        .status(503)
        .json({ message: "OpenRouter service not configured" });
    }

    const models = await openRouterService.getAvailableModels();

    res.json({
      models,
      defaultModel: openRouterService.defaultModel,
      configured: true,
    });
  } catch (error) {
    console.error("OpenRouter models error:", error);
    res.status(500).json({
      message: "Error fetching OpenRouter models",
      error: error.message,
    });
  }
});

// Check AI services status
router.get("/status", async (req, res) => {
  console.log(" Status endpoint called");

  const services = {
    openrouter: { available: false, priority: "primary" },
    calendar: { available: true },
    tavilySearch: { available: true, configured: true }, // Always true
  };

  // Check OpenRouter availability
  try {
    if (process.env.OPENROUTER_API_KEY) {
      services.openrouter.available =
        await openRouterService.checkAvailability();
    }
  } catch (error) {
    console.log("OpenRouter status check failed:", error.message);
  }

  console.log("Tavily Search hardcoded as configured and available");

  let message = "OpenRouter AI service";
  if (services.openrouter.available) {
    message = "OpenRouter AI service available";
  } else {
    message = "OpenRouter AI service unavailable - check API key configuration";
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
    const { doctorId, dateTime, appointmentData, bookingId } = req.body;

    if (!doctorId || !dateTime) {
      return res
        .status(400)
        .json({ message: "Doctor ID and date/time are required" });
    }

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
      "profile",
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

      const calendarData = {
        patientName: `${patientUser.profile.firstName} ${patientUser.profile.lastName}`,
        patientEmail: patientUser.email,
        doctorName: `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`,
        doctorEmail: doctor.userId.email,
        dateTime: savedAppointment.dateTime,
        duration: savedAppointment.duration,
        appointmentType: savedAppointment.type,
        chiefComplaint: savedAppointment.chiefComplaint,
        symptoms: savedAppointment.symptoms,
      };

      console.log("🗓️  Attempting to create calendar event...");
      const calendarResult = await googleCalendar.safeCreateEvent(calendarData);

      if (calendarResult.eventId) {
        // Calendar integration successful
        calendarEventId = calendarResult.eventId;
        calendarEventLink = calendarResult.eventLink;
        meetingLink = calendarResult.meetingLink;
        calendarIntegrationStatus = "success";
        console.log("Calendar event created successfully:", calendarEventId);
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
          "📋 Calendar integration failed, manual instructions provided",
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

    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Appointment is already cancelled" });
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

    // Cancel Google Calendar event if it exists (with fallback handling)
    let calendarCancellationStatus = "not_applicable";
    let calendarCancellationMessage = "";

    if (appointment.googleCalendarEventId) {
      try {
        const googleCalendar = require("../services/googleCalendar");
        await googleCalendar.cancelAppointmentEvent(
          appointment.googleCalendarEventId,
        );
        calendarCancellationStatus = "success";
        calendarCancellationMessage = "Calendar event cancelled successfully";
        console.log(
          "Calendar event cancelled:",
          appointment.googleCalendarEventId,
        );
      } catch (calendarError) {
        console.error("Calendar cancellation failed:", calendarError.message);
        calendarCancellationStatus = "failed";

        if (
          calendarError.message.includes("Not Found") ||
          calendarError.message.includes("404")
        ) {
          calendarCancellationMessage =
            "Calendar event may have been already removed or not found";
        } else if (
          calendarError.message.includes("quota") ||
          calendarError.message.includes("429")
        ) {
          calendarCancellationMessage =
            "Calendar service temporarily unavailable - please manually remove from calendar";
        } else {
          calendarCancellationMessage =
            "Calendar event cancellation failed - please manually remove from calendar";
        }

        // Don't fail the appointment cancellation if calendar fails
        // The appointment cancellation is still valid
      }
    } else {
      calendarCancellationMessage =
        "No calendar event was associated with this appointment";
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Generate appropriate response message
    let responseMessage = "Appointment cancelled successfully";
    if (calendarCancellationStatus === "failed") {
      responseMessage += " (please manually remove from calendar)";
    }

    res.json({
      message: responseMessage,
      appointment: {
        id: appointment._id,
        status: appointment.status,
      },
      calendarIntegration: {
        status: calendarCancellationStatus,
        message: calendarCancellationMessage,
        fallbackUsed: calendarCancellationStatus === "failed",
      },
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Error cancelling appointment" });
  }
});

module.exports = router;
