const axios = require("axios");
const { performance } = require("perf_hooks");

class PerformanceTest {
  constructor(baseURL = "http://localhost:3004") {
    this.baseURL = baseURL;
    this.results = [];
  }

  async testEndpoint(endpoint, data, iterations = 5) {
    console.log(`\n🧪 Testing ${endpoint} (${iterations} iterations)...`);

    const times = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();

        const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        });

        const end = performance.now();
        const responseTime = end - start;
        times.push(responseTime);

        console.log(`   Iteration ${i + 1}: ${responseTime.toFixed(2)}ms`);

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        errors++;
        console.log(`   Iteration ${i + 1}: ERROR - ${error.message}`);
      }
    }

    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      const result = {
        endpoint,
        iterations: times.length,
        errors,
        avgTime: avg,
        minTime: min,
        maxTime: max,
        successRate: ((times.length / iterations) * 100).toFixed(1),
      };

      this.results.push(result);

      console.log(
        `    Average: ${avg.toFixed(2)}ms | Min: ${min.toFixed(2)}ms | Max: ${max.toFixed(2)}ms`,
      );
      console.log(`   Success Rate: ${result.successRate}%`);

      return result;
    } else {
      console.log("   ❌ All requests failed");
      return null;
    }
  }

  async runComparisonTest() {
    console.log("🚀 MediBot Performance Comparison Test");
    console.log("=====================================");

    // Test data
    const testMessages = [
      {
        message: "What is diabetes?",
        description: "FAQ Query",
      },
      {
        message: "I have chest pain and shortness of breath",
        description: "Medical Symptoms",
      },
      {
        message: "Search for latest COVID treatments",
        description: "Web Search",
        forceWebSearch: true,
      },
      {
        message: "I need to book an appointment with a cardiologist",
        description: "Appointment Booking",
      },
    ];

    // Test original endpoint
    console.log("\n Testing Original Chat Endpoint");
    console.log("==================================");

    for (const testData of testMessages) {
      await this.testEndpoint(
        "/api/ai/chat",
        {
          message: testData.message,
          language: "en",
          conversationHistory: [],
          forceWebSearch: testData.forceWebSearch || false,
        },
        3,
      );
    }

    // Test optimized endpoint
    console.log("\n🚀 Testing Optimized Chat Endpoint");
    console.log("===================================");

    for (const testData of testMessages) {
      await this.testEndpoint(
        "/api/ai/chat-optimized",
        {
          message: testData.message,
          language: "en",
          conversationHistory: [],
          forceWebSearch: testData.forceWebSearch || false,
        },
        3,
      );
    }

    // Generate comparison report
    this.generateReport();
  }

  generateReport() {
    console.log("\n📈 Performance Comparison Report");
    console.log("================================");

    const originalResults = this.results.filter(
      (r) => r.endpoint.includes("/chat") && !r.endpoint.includes("optimized"),
    );
    const optimizedResults = this.results.filter((r) =>
      r.endpoint.includes("optimized"),
    );

    if (originalResults.length > 0 && optimizedResults.length > 0) {
      const originalAvg =
        originalResults.reduce((sum, r) => sum + r.avgTime, 0) /
        originalResults.length;
      const optimizedAvg =
        optimizedResults.reduce((sum, r) => sum + r.avgTime, 0) /
        optimizedResults.length;

      const improvement = ((originalAvg - optimizedAvg) / originalAvg) * 100;

      console.log(`\nOverall Results:`);
      console.log(`   Original Average: ${originalAvg.toFixed(2)}ms`);
      console.log(`   Optimized Average: ${optimizedAvg.toFixed(2)}ms`);
      console.log(`   Performance Improvement: ${improvement.toFixed(1)}%`);

      if (improvement > 0) {
        console.log(
          `   Optimization successful! ${improvement.toFixed(1)}% faster`,
        );
      } else {
        console.log(
          `   Optimization needs work. ${Math.abs(improvement).toFixed(1)}% slower`,
        );
      }
    }

    console.log("\n Detailed Results:");
    this.results.forEach((result) => {
      console.log(`\n   ${result.endpoint}:`);
      console.log(`     Average: ${result.avgTime.toFixed(2)}ms`);
      console.log(
        `     Range: ${result.minTime.toFixed(2)}ms - ${result.maxTime.toFixed(2)}ms`,
      );
      console.log(`     Success Rate: ${result.successRate}%`);
    });

    console.log("\n🔧 Recommendations:");
    console.log("   1. Monitor cache hit rates in server logs");
    console.log("   2. Check Redis connection if using external cache");
    console.log("   3. Verify database indexes are created");
    console.log("   4. Monitor memory usage during peak load");
    console.log("   5. Consider horizontal scaling if needed");
  }

  async testCachePerformance() {
    console.log("\n🗄️  Testing Cache Performance");
    console.log("=============================");

    const testMessage = "What is diabetes?";

    // First request (cache miss)
    console.log("First request (cache miss):");
    await this.testEndpoint(
      "/api/ai/chat-optimized",
      {
        message: testMessage,
        language: "en",
        conversationHistory: [],
      },
      1,
    );

    // Second request (cache hit)
    console.log("\nSecond request (cache hit):");
    await this.testEndpoint(
      "/api/ai/chat-optimized",
      {
        message: testMessage,
        language: "en",
        conversationHistory: [],
      },
      1,
    );
  }
}

// Run the test
async function runTests() {
  const tester = new PerformanceTest();

  try {
    await tester.runComparisonTest();
    await tester.testCachePerformance();
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log(
      "\n💡 Make sure your server is running on http://localhost:3004",
    );
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = PerformanceTest;
