/**
 * Test Web Search Priority
 *
 * This script demonstrates web search functionality
 * with emergency detection completely removed.
 */

const intentClassifier = require("../services/intentClassifier");

// Test cases for different intents (emergency removed)
const testCases = [
  {
    message: "search for chest pain causes",
    expectedIntent: "web_search",
    description: "Search for medical information should be web search",
  },
  {
    message: "look up heart attack symptoms",
    expectedIntent: "web_search",
    description: "Look up medical condition should be web search",
  },
  {
    message: "find information about stroke treatment",
    expectedIntent: "web_search",
    description: "Find medical info should be web search",
  },
  {
    message: "What is diabetes?",
    expectedIntent: "faq",
    description: "Medical question should be FAQ",
  },
  {
    message: "I have chest pain",
    expectedIntent: "general_chat",
    description: "Personal symptom should be general chat",
  },
  {
    message: "Book an appointment",
    expectedIntent: "appointment",
    description: "Appointment request should be appointment",
  },
  {
    message: "I'm having chest pain right now",
    expectedIntent: "general_chat",
    description:
      "Personal medical concern should be general chat (no emergency detection)",
  },
  {
    message: "I think I'm having a heart attack",
    expectedIntent: "general_chat",
    description:
      "Personal medical emergency should be general chat (no emergency detection)",
  },
  {
    message: "Help! I can't breathe",
    expectedIntent: "general_chat",
    description:
      "Urgent personal concern should be general chat (no emergency detection)",
  },
];

async function testIntentClassification() {
  console.log(
    "🔍 Testing Intent Classification (Emergency Detection Removed)\n",
  );
  console.log("=".repeat(80));

  let correctClassifications = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: "${testCase.message}"`);
      console.log(`📋 Description: ${testCase.description}`);
      console.log(`🎯 Expected: ${testCase.expectedIntent}`);

      const result = await intentClassifier.classifyIntent(
        testCase.message,
        [],
      );

      console.log(
        `🤖 Classified as: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`,
      );
      console.log(`🔍 Method: ${result.method}`);
      console.log(`💭 Reasoning: ${result.reasoning}`);

      const isCorrect = result.intent === testCase.expectedIntent;
      console.log(`Result: ${isCorrect ? "CORRECT" : "INCORRECT"}`);

      if (isCorrect) {
        correctClassifications++;
      } else {
        console.log(
          `❌ Expected ${testCase.expectedIntent} but got ${result.intent}`,
        );
      }

      console.log("-".repeat(60));
    } catch (error) {
      console.error(`❌ Error testing "${testCase.message}":`, error.message);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log(" FINAL RESULTS");
  console.log("=".repeat(80));
  console.log(
    `Correct classifications: ${correctClassifications}/${totalTests}`,
  );
  console.log(
    `📈 Accuracy: ${((correctClassifications / totalTests) * 100).toFixed(1)}%`,
  );

  // Test force web search option
  console.log("\n🔧 Testing forceWebSearch option:");
  const medicalMessage = "What are the symptoms of diabetes?";

  console.log(`\nMessage: "${medicalMessage}"`);

  // Without force
  const normalResult = await intentClassifier.classifyIntent(
    medicalMessage,
    [],
  );
  console.log(`Normal classification: ${normalResult.intent}`);

  // With force
  const forcedResult = await intentClassifier.classifyIntent(
    medicalMessage,
    [],
    { forceWebSearch: true },
  );
  console.log(`Forced web search: ${forcedResult.intent}`);
  console.log(`Force reasoning: ${forcedResult.reasoning}`);

  console.log("\n🎉 Intent classification testing completed!");
}

// Test specific patterns
async function testSearchPatterns() {
  console.log("\n\n🔍 Testing Search Pattern Detection\n");
  console.log("=".repeat(80));

  const searchPatterns = [
    "search for",
    "look up",
    "find information about",
    "search the web",
    "latest news",
    "recent updates",
    "current information",
    "web search",
    "online search",
    "research symptoms",
    "studies about",
  ];

  const medicalTerms = [
    "diabetes",
    "hypertension",
    "arthritis",
    "depression",
    "asthma",
    "migraine",
  ];

  console.log("Testing combinations of search patterns + medical terms:\n");

  for (const pattern of searchPatterns.slice(0, 5)) {
    // Test first 5 patterns
    for (const term of medicalTerms.slice(0, 3)) {
      // Test first 3 terms
      const message = `${pattern} ${term}`;
      const result = await intentClassifier.classifyIntent(message, []);

      console.log(
        `"${message}" → ${result.intent} (${result.confidence.toFixed(2)})`,
      );
    }
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testIntentClassification();
    await testSearchPatterns();
  } catch (error) {
    console.error("❌ Test execution failed:", error);
  }
}

// Export for use in other scripts
module.exports = {
  testIntentClassification,
  testSearchPatterns,
  runAllTests,
  testCases,
};

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}
