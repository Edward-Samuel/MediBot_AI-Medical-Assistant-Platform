/**
 * Test script for the Intent Classifier
 *
 * This script demonstrates how the intent classifier routes messages
 * between FAQ and general chat functionality.
 */

const intentClassifier = require("../services/intentClassifier");

// Test messages for different intents
const testMessages = [
  // FAQ Intent Examples
  {
    message: "What is diabetes?",
    expectedIntent: "faq",
    description: "Medical information question",
  },
  {
    message: "How do I book an appointment through your system?",
    expectedIntent: "faq",
    description: "System information question",
  },
  {
    message: "Tell me about your privacy policy",
    expectedIntent: "faq",
    description: "Policy information request",
  },
  {
    message: "What are the symptoms of high blood pressure?",
    expectedIntent: "faq",
    description: "Medical facts question",
  },
  {
    message: "How does your appointment booking work?",
    expectedIntent: "faq",
    description: "Process explanation request",
  },

  // General Chat Intent Examples
  {
    message: "I have been feeling dizzy lately",
    expectedIntent: "general_chat",
    description: "Personal symptom description",
  },
  {
    message: "My chest hurts when I breathe",
    expectedIntent: "general_chat",
    description: "Personal medical concern",
  },
  {
    message: "Hello, how are you?",
    expectedIntent: "general_chat",
    description: "Conversational greeting",
  },
  {
    message: "I'm experiencing headaches every morning",
    expectedIntent: "general_chat",
    description: "Personal health experience",
  },
  {
    message: "Can you help me with my back pain?",
    expectedIntent: "general_chat",
    description: "Personal medical help request",
  },

  // Appointment Intent Examples
  {
    message: "I want to book an appointment with a cardiologist",
    expectedIntent: "appointment",
    description: "Appointment booking request",
  },
  {
    message: "Can I schedule a consultation?",
    expectedIntent: "appointment",
    description: "Consultation scheduling",
  },

  // Emergency Intent Examples
  {
    message: "I'm having severe chest pain right now",
    expectedIntent: "emergency",
    description: "Emergency medical situation",
  },
  {
    message: "I think I'm having a heart attack",
    expectedIntent: "emergency",
    description: "Critical emergency",
  },
];

async function testIntentClassifier() {
  console.log("🎯 Testing Intent Classifier\n");
  console.log("=".repeat(80));

  let correctPredictions = 0;
  let totalTests = testMessages.length;

  for (const test of testMessages) {
    try {
      console.log(`\nTesting: "${test.message}"`);
      console.log(`📋 Description: ${test.description}`);
      console.log(`🎯 Expected: ${test.expectedIntent}`);

      const result = await intentClassifier.classifyIntent(test.message, []);

      console.log(
        `🤖 Predicted: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`,
      );
      console.log(`🔍 Method: ${result.method}`);
      console.log(`💭 Reasoning: ${result.reasoning}`);

      if (result.scores) {
        console.log(
          ` Scores: FAQ=${result.scores.faq.toFixed(2)}, General=${result.scores.general_chat.toFixed(2)}`,
        );
      }

      const isCorrect = result.intent === test.expectedIntent;
      console.log(`Result: ${isCorrect ? "CORRECT" : "INCORRECT"}`);

      if (isCorrect) {
        correctPredictions++;
      }

      console.log("-".repeat(60));
    } catch (error) {
      console.error(`❌ Error testing "${test.message}":`, error.message);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log(" FINAL RESULTS");
  console.log("=".repeat(80));
  console.log(`Correct predictions: ${correctPredictions}/${totalTests}`);
  console.log(
    `📈 Accuracy: ${((correctPredictions / totalTests) * 100).toFixed(1)}%`,
  );

  // Get classifier statistics
  const stats = intentClassifier.getIntentStats();
  console.log("\n📋 Classifier Statistics:");
  console.log(`- Supported intents: ${stats.supportedIntents.join(", ")}`);
  console.log(`- FAQ patterns: ${stats.faqPatternCount}`);
  console.log(`- Appointment patterns: ${stats.appointmentPatternCount}`);
  console.log(`- Emergency keywords: ${stats.emergencyKeywordCount}`);
  console.log(`- Conversational patterns: ${stats.conversationalPatternCount}`);
}

// Test with conversation history
async function testWithHistory() {
  console.log("\n\nTesting with Conversation History\n");
  console.log("=".repeat(80));

  const conversationHistory = [
    { role: "user", content: "Hello" },
    {
      role: "bot",
      content:
        "Hello! I can help you with medical questions and appointment booking.",
    },
    { role: "user", content: "I have been feeling tired lately" },
    {
      role: "bot",
      content:
        "I understand you're feeling tired. This could be due to various factors...",
    },
  ];

  const followUpMessage = "What could be causing this?";

  console.log("📜 Conversation History:");
  conversationHistory.forEach((msg, i) => {
    console.log(`  ${i + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
  });

  console.log(`\nFollow-up message: "${followUpMessage}"`);

  const result = await intentClassifier.classifyIntent(
    followUpMessage,
    conversationHistory,
  );

  console.log(
    `🤖 Classified as: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`,
  );
  console.log(`🔍 Method: ${result.method}`);
  console.log(`💭 Reasoning: ${result.reasoning}`);
}

// Run the tests
async function runTests() {
  try {
    await testIntentClassifier();
    await testWithHistory();

    console.log("\n🎉 Intent classifier testing completed!");
  } catch (error) {
    console.error("❌ Test execution failed:", error);
  }
}

// Export for use in other scripts
module.exports = {
  testIntentClassifier,
  testWithHistory,
  runTests,
  testMessages,
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}
