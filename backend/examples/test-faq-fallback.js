/**
 * Test FAQ Fallback to AI Response
 *
 * This script tests that when FAQ doesn't have relevant information,
 * the system properly falls back to AI-generated responses.
 */

const axios = require("axios");

class FAQFallbackTester {
  constructor(baseUrl = "http://localhost:5000/api") {
    this.baseUrl = baseUrl;
  }

  /**
   * Test a message that should trigger FAQ but fall back to AI
   */
  async testFAQFallback(message) {
    try {
      console.log(`\n🧪 Testing FAQ fallback for: "${message}"`);

      const response = await axios.post(`${this.baseUrl}/ai/chat`, {
        message,
        conversationHistory: [],
        language: "en",
      });

      const data = response.data;

      console.log(`Intent detected: ${data.intentData?.intent}`);
      console.log(`🔍 Method: ${data.intentData?.method}`);
      console.log(` Confidence: ${data.intentData?.confidence}`);

      if (data.faqData) {
        console.log(`📚 FAQ used: ${data.faqData.usedFAQ}`);
        console.log(`📋 FAQ results: ${data.faqData.resultsCount || 0}`);
        console.log(`🔍 FAQ source: ${data.faqData.source}`);
      } else {
        console.log("📚 FAQ data: Not used");
      }

      console.log(`Response preview: ${data.response.substring(0, 100)}...`);

      // Check if it's a fallback response
      const fallbackPhrases = [
        "I don't have specific information about that topic yet",
        "I don't have this information yet",
        "I don't have information about that topic",
      ];

      const isFallbackResponse = fallbackPhrases.some((phrase) =>
        data.response.includes(phrase),
      );

      if (isFallbackResponse) {
        console.log(
          "❌ ISSUE: Still getting fallback response instead of AI answer",
        );
        return false;
      } else {
        console.log("SUCCESS: Got meaningful AI response");
        return true;
      }
    } catch (error) {
      console.error(
        "❌ Error testing FAQ fallback:",
        error.response?.data?.message || error.message,
      );
      return false;
    }
  }

  /**
   * Test multiple scenarios
   */
  async runTests() {
    console.log("🧪 Testing FAQ Fallback to AI Response\n");
    console.log("=".repeat(70));

    const testCases = [
      {
        message: "What are the symptoms of diabetes?",
        description: "Medical question that might not be in FAQ",
      },
      {
        message: "What causes high blood pressure?",
        description: "Another medical question",
      },
      {
        message: "How is arthritis treated?",
        description: "Treatment question",
      },
      {
        message: "What is the difference between Type 1 and Type 2 diabetes?",
        description: "Specific medical comparison",
      },
      {
        message: "What are the side effects of metformin?",
        description: "Medication question",
      },
    ];

    let successCount = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      console.log(`\n📋 ${testCase.description}`);
      const success = await this.testFAQFallback(testCase.message);
      if (success) {
        successCount++;
      }
      console.log("-".repeat(50));
    }

    console.log("\n" + "=".repeat(70));
    console.log(" FINAL RESULTS");
    console.log("=".repeat(70));
    console.log(`Successful fallbacks: ${successCount}/${totalTests}`);
    console.log(
      `Success rate: ${((successCount / totalTests) * 100).toFixed(1)}%`,
    );

    if (successCount === totalTests) {
      console.log(
        "🎉 All tests passed! FAQ properly falls back to AI when needed.",
      );
    } else {
      console.log("Some tests failed. FAQ fallback may need adjustment.");
    }

    return successCount === totalTests;
  }

  /**
   * Test specific FAQ vs AI routing
   */
  async testIntentRouting() {
    console.log("\n\nTesting Intent Routing\n");
    console.log("=".repeat(70));

    const routingTests = [
      {
        message: "What is diabetes?",
        expectedIntent: "faq",
        description: "Simple medical question - should be FAQ",
      },
      {
        message: "I have been feeling tired and thirsty lately",
        expectedIntent: "general_chat",
        description: "Personal symptoms - should be general chat",
      },
      {
        message: "search for latest diabetes research",
        expectedIntent: "web_search",
        description: "Search request - should be web search",
      },
      {
        message: "book an appointment with endocrinologist",
        expectedIntent: "appointment",
        description: "Appointment request - should be appointment",
      },
    ];

    for (const test of routingTests) {
      try {
        console.log(`\nTesting: "${test.message}"`);
        console.log(`📋 Expected: ${test.expectedIntent}`);

        const response = await axios.post(`${this.baseUrl}/ai/chat`, {
          message: test.message,
          conversationHistory: [],
          language: "en",
        });

        const actualIntent = response.data.intentData?.intent;
        console.log(`Actual: ${actualIntent}`);
        console.log(
          `Match: ${actualIntent === test.expectedIntent ? "YES" : "NO"}`,
        );
      } catch (error) {
        console.error(
          "❌ Error:",
          error.response?.data?.message || error.message,
        );
      }
    }
  }
}

// Usage example
async function runFAQFallbackTests() {
  const tester = new FAQFallbackTester();

  const success = await tester.runTests();
  await tester.testIntentRouting();

  if (success) {
    console.log("\n🎉 FAQ fallback system is working correctly!");
  } else {
    console.log("\nFAQ fallback system needs attention.");
  }
}

// Export for use in other scripts
module.exports = {
  FAQFallbackTester,
  runFAQFallbackTests,
};

// Run tests if this script is executed directly
if (require.main === module) {
  runFAQFallbackTests().catch(console.error);
}
