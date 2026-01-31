const express = require('express');
const ChatHistory = require('../models/ChatHistory');
const { v4: uuidv4 } = require('uuid');
const tavilySearch = require('../services/tavilySearch');
const openRouterService = require('../services/openRouterService');
const intentClassifier = require('../services/intentClassifier');
const faqService = require('../services/faqService');
const cacheService = require('../services/cacheService');

const router = express.Router();

// Optimized chat endpoint with parallel processing
router.post('/chat-optimized', async (req, res) => {
  try {
    const { message, images, conversationHistory, language = 'en', languageInfo, sessionId, forceWebSearch = false } = req.body;

    if (!message && (!images || images.length === 0)) {
      return res.status(400).json({ message: 'Message or images are required' });
    }

    // Get user ID from token (non-blocking)
    let userId = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        // Continue as guest
      }
    }

    // Check cache first for exact message match
    const cacheKey = cacheService.generateKey('chat_response', message.toLowerCase().trim(), language);
    const cachedResponse = await cacheService.get(cacheKey);
    if (cachedResponse && !forceWebSearch) {
      console.log('🚀 Chat response cache hit');
      return res.json({
        response: cachedResponse.response,
        cached: true,
        ...cachedResponse.metadata
      });
    }

    // Start parallel operations immediately
    const parallelOperations = {
      // Intent classification (always needed)
      intent: intentClassifier.classifyIntent(message, conversationHistory || [], { forceWebSearch }),
      
      // FAQ search (start immediately, might not be used)
      faq: faqService.searchFAQ(message, { limit: 3 }).catch(err => {
        console.warn('FAQ search failed:', err.message);
        return null;
      }),
      
      // Web search (start immediately, might not be used)
      webSearch: forceWebSearch ? 
        tavilySearch.searchMedical(message, { maxResults: 5 }).catch(err => {
          console.warn('Web search failed:', err.message);
          return null;
        }) : 
        Promise.resolve(null)
    };

    // Wait for intent classification first (fastest operation)
    const intentResult = await parallelOperations.intent;
    console.log('🎯 Intent:', intentResult.intent, 'Confidence:', intentResult.confidence);

    let botResponse;
    let responseMetadata = {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      method: intentResult.method,
      processingTime: Date.now()
    };

    // Route based on intent with optimized parallel processing
    switch (intentResult.intent) {
      case 'web_search':
        console.log('🔍 Web search intent - using parallel web search');
        const webResults = await parallelOperations.webSearch || 
          await tavilySearch.searchMedical(message, { maxResults: 5 }).catch(() => null);
        
        if (webResults?.results?.length > 0) {
          const searchContext = webResults.results.map(result => 
            `**${result.title}**\n${result.content}\nSource: ${result.url}`
          ).join('\n\n---\n\n');
          
          const contextualMessage = `Based on current web search results for "${message}":\n\n${searchContext}`;
          botResponse = await generateAIResponse(contextualMessage, conversationHistory, language, languageInfo, images);
          
          responseMetadata.webSearch = {
            query: message,
            resultsCount: webResults.results.length,
            totalResults: webResults.totalResults
          };
        } else {
          botResponse = language === 'ta' 
            ? "மன்னிக்கவும், தற்போது வலை தேடல் முடிவுகள் கிடைக்கவில்லை."
            : "I apologize, but I couldn't find current web search results for your query.";
        }
        break;

      case 'faq': {
        console.log('❓ FAQ intent - using parallel FAQ search');
        const faqResults = await parallelOperations.faq;
        
        if (faqResults?.results?.length > 0) {
          // Use the best FAQ result
          const bestResult = faqResults.results[0];
          const faqContext = `Based on our medical knowledge base:\n\n${bestResult.relevantText}`;
          
          botResponse = await generateAIResponse(faqContext, conversationHistory, language, languageInfo, images);
          
          responseMetadata.faq = {
            query: message,
            resultsCount: faqResults.results.length,
            bestMatch: {
              title: bestResult.title,
              score: bestResult.score,
              category: bestResult.category
            }
          };
        } else {
          // Fallback to general AI response
          botResponse = await generateAIResponse(message, conversationHistory, language, languageInfo, images);
          responseMetadata.faqFallback = true;
        }
        break;
      }

      case 'appointment': {
        console.log('📅 Appointment intent detected');
        if (!userId) {
          botResponse = language === 'ta'
            ? "முன்பதிவு செய்ய உள்நுழைய வேண்டும். தயவுசெய்து உள்நுழைந்து மீண்டும் முயற்சிக்கவும்."
            : "Please log in to book an appointment. I can help you once you're authenticated.";
        } else {
          // Handle appointment booking (existing logic)
          botResponse = await generateAIResponse(
            `I understand you want to book an appointment. Let me help you with that. ${message}`,
            conversationHistory, language, languageInfo, images
          );
          responseMetadata.appointmentIntent = true;
        }
        break;
      }

      default: { // general_chat
        console.log('💬 General chat intent');
        
        // For general chat, try FAQ first, then fallback to AI
        const faqResults = await parallelOperations.faq;
        
        if (faqResults?.results?.length > 0 && faqResults.results[0].score > 0.7) {
          // High confidence FAQ match
          const bestResult = faqResults.results[0];
          const faqContext = `Based on our medical knowledge: ${bestResult.relevantText}`;
          botResponse = await generateAIResponse(faqContext, conversationHistory, language, languageInfo, images);
          
          responseMetadata.faq = {
            query: message,
            bestMatch: {
              title: bestResult.title,
              score: bestResult.score
            }
          };
        } else {
          // Direct AI response
          botResponse = await generateAIResponse(message, conversationHistory, language, languageInfo, images);
        }
        break;
      }
    }

    responseMetadata.processingTime = Date.now() - responseMetadata.processingTime;

    // Cache the response (async, don't wait)
    if (botResponse && responseMetadata.processingTime < 5000) { // Only cache fast responses
      cacheService.set(cacheKey, {
        response: botResponse,
        metadata: responseMetadata
      }, 1800); // 30 minutes
    }

    // Save chat history (async, don't wait)
    if (userId && sessionId) {
      saveChatHistoryAsync(userId, sessionId, message, botResponse, language, images);
    }

    res.json({
      response: botResponse,
      ...responseMetadata,
      cached: false
    });

  } catch (error) {
    console.error('❌ Optimized chat error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Async helper functions
async function generateAIResponse(message, conversationHistory, language, languageInfo, images = []) {
  try {
    const response = await openRouterService.generateResponse(
      message,
      conversationHistory,
      {
        language,
        languageInfo,
        images,
        enableReasoning: true,
        maxTokens: 800,
        temperature: 0.3
      }
    );
    return response.content;
  } catch (error) {
    console.error('AI response error:', error);
    return language === 'ta'
      ? "மன்னிக்கவும், தற்போது தொழில்நுட்ப சிக்கல் உள்ளது."
      : "I apologize for the technical difficulty. Please try again.";
  }
}

async function saveChatHistoryAsync(userId, sessionId, message, response, language, images) {
  try {
    let chatHistory = await ChatHistory.findOne({ userId, sessionId, isActive: true });
    
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId,
        sessionId,
        messages: [],
        language,
        isActive: true
      });
    }

    // Add user message
    chatHistory.messages.push({
      id: uuidv4(),
      role: 'user',
      content: message,
      images: images || [],
      timestamp: new Date(),
      language
    });

    // Add bot response
    chatHistory.messages.push({
      id: uuidv4(),
      role: 'bot',
      content: response,
      timestamp: new Date(),
      language
    });

    await chatHistory.save();
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

module.exports = router;