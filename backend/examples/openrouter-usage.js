/**
 * OpenRouter Integration Usage Examples
 *
 * This file demonstrates how to use the OpenRouter service
 * with reasoning capabilities in the MEDIBOT application.
 */

const openRouterService = require("../services/openRouterService");

// Example 1: Basic chat with reasoning
async function basicChatExample() {
  try {
    console.log("=== Basic Chat with Reasoning ===");

    const response = await openRouterService.generateResponse(
      "How many r's are in the word 'strawberry'?",
      [], // No conversation history
      {
        enableReasoning: true,
        language: "en",
      },
    );

    console.log("Response:", response.content);
    console.log("Model used:", response.model);

    if (response.reasoning_details) {
      console.log("Reasoning available for follow-up questions");
    }

    return response;
  } catch (error) {
    console.error("Basic chat error:", error.message);
  }
}

// Example 2: Continue conversation with reasoning
async function continueConversationExample() {
  try {
    console.log("\n=== Continue Conversation with Reasoning ===");

    // First message with reasoning
    const firstResponse = await openRouterService.generateResponse(
      "How many r's are in the word 'strawberry'?",
      [],
      { enableReasoning: true },
    );

    // Build conversation history with reasoning_details preserved
    const messages = [
      {
        role: "user",
        content: "How many r's are in the word 'strawberry'?",
      },
      {
        role: "assistant",
        content: firstResponse.content,
        reasoning_details: firstResponse.reasoning_details,
      },
    ];

    // Continue conversation - model can build on previous reasoning
    const continuedResponse = await openRouterService.continueConversation(
      messages,
      "Are you sure? Think carefully.",
    );

    console.log("Continued response:", continuedResponse.content);
    console.log(
      "Full conversation length:",
      continuedResponse.fullConversation.length,
    );

    return continuedResponse;
  } catch (error) {
    console.error("Continue conversation error:", error.message);
  }
}

// Example 3: Medical symptom analysis with reasoning
async function medicalAnalysisExample() {
  try {
    console.log("\n=== Medical Analysis with Reasoning ===");

    const symptoms = ["chest pain", "shortness of breath", "dizziness"];
    const patientInfo = {
      age: 45,
      gender: "male",
      urgency: "high",
    };

    const analysis = await openRouterService.analyzeSymptoms(
      symptoms,
      patientInfo,
    );

    console.log("Analysis result:", analysis.analysis);
    console.log("Model used:", analysis.model);

    if (analysis.reasoning) {
      console.log("Reasoning process available");
    }

    return analysis;
  } catch (error) {
    console.error("Medical analysis error:", error.message);
  }
}

// Example 4: Multilingual support with reasoning
async function multilingualExample() {
  try {
    console.log("\n=== Multilingual Chat with Reasoning ===");

    const response = await openRouterService.generateResponse(
      "என்னுடைய தலைவலி குணமாக என்ன செய்யலாம்?", // Tamil: "What can I do to cure my headache?"
      [],
      {
        language: "ta",
        languageInfo: { name: "Tamil" },
        enableReasoning: true,
      },
    );

    console.log("Tamil response:", response.content);
    console.log("Model used:", response.model);

    return response;
  } catch (error) {
    console.error("Multilingual example error:", error.message);
  }
}

// Example 5: Check service availability
async function checkAvailabilityExample() {
  try {
    console.log("\n=== Service Availability Check ===");

    const isAvailable = await openRouterService.checkAvailability();
    console.log("OpenRouter available:", isAvailable);

    const models = await openRouterService.getAvailableModels();
    console.log(
      "Available models:",
      models.map((m) => m.name),
    );

    return { isAvailable, models };
  } catch (error) {
    console.error("Availability check error:", error.message);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  async function runExamples() {
    console.log("OpenRouter Service Examples\n");

    // Check if OpenRouter is configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.log(
        "❌ OPENROUTER_API_KEY not configured in environment variables",
      );
      console.log("Please add your OpenRouter API key to .env file:");
      console.log("OPENROUTER_API_KEY=your-api-key-here");
      console.log("USE_OPENROUTER=true");
      return;
    }

    await checkAvailabilityExample();
    await basicChatExample();
    await continueConversationExample();
    await medicalAnalysisExample();
    await multilingualExample();

    console.log("\nAll examples completed!");
  }

  runExamples().catch(console.error);
}

module.exports = {
  basicChatExample,
  continueConversationExample,
  medicalAnalysisExample,
  multilingualExample,
  checkAvailabilityExample,
};
