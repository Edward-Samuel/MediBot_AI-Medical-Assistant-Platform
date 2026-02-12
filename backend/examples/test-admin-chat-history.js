/**
 * Test Admin Chat History Endpoints
 *
 * This script tests the admin chat history functionality
 * to ensure proper rendering and data retrieval.
 */

const axios = require("axios");

class AdminChatHistoryTester {
  constructor(baseUrl = "http://localhost:5000/api") {
    this.baseUrl = baseUrl;
    this.adminToken = null;
  }

  /**
   * Login as admin to get authentication token
   */
  async loginAsAdmin(
    credentials = { email: "admin@example.com", password: "admin123" },
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/login`,
        credentials,
      );

      if (response.data.token && response.data.user.role === "admin") {
        this.adminToken = response.data.token;
        console.log("Admin login successful");
        return true;
      } else {
        console.log("❌ Login failed - not an admin user");
        return false;
      }
    } catch (error) {
      console.error(
        "❌ Admin login failed:",
        error.response?.data?.message || error.message,
      );
      return false;
    }
  }

  /**
   * Test getting all chat history
   */
  async testGetAllChatHistory() {
    try {
      console.log("\n📋 Testing: Get All Chat History");

      const response = await axios.get(`${this.baseUrl}/admin/chat-history`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        params: { page: 1, limit: 10 },
      });

      console.log(`Retrieved ${response.data.sessions.length} chat sessions`);
      console.log(` Total sessions: ${response.data.totalSessions}`);
      console.log(`📄 Total pages: ${response.data.totalPages}`);

      if (response.data.sessions.length > 0) {
        const firstSession = response.data.sessions[0];
        console.log(`Sample session: ${firstSession.sessionId}`);
        console.log(
          `👤 User: ${firstSession.user?.name || "Unknown"} (${firstSession.user?.email || "No email"})`,
        );
        console.log(`💬 Messages: ${firstSession.messageCount}`);
        console.log(`🌐 Language: ${firstSession.language}`);
      }

      return response.data;
    } catch (error) {
      console.error(
        "❌ Failed to get chat history:",
        error.response?.data?.message || error.message,
      );
      return null;
    }
  }

  /**
   * Test getting specific chat session details
   */
  async testGetChatSessionDetails(sessionId) {
    try {
      console.log(`\n🔍 Testing: Get Chat Session Details (${sessionId})`);

      const response = await axios.get(
        `${this.baseUrl}/admin/chat-history/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        },
      );

      console.log(`Retrieved session details for: ${response.data.sessionId}`);
      console.log(`Title: ${response.data.title}`);
      console.log(`👤 User: ${response.data.user?.name || "Unknown"}`);
      console.log(`💬 Total messages: ${response.data.messageCount}`);
      console.log(`🌐 Language: ${response.data.language}`);

      if (response.data.messages.length > 0) {
        console.log(
          `📄 First message: ${response.data.messages[0].content.substring(0, 50)}...`,
        );
        console.log(
          `📄 Last message: ${response.data.messages[response.data.messages.length - 1].content.substring(0, 50)}...`,
        );
      }

      return response.data;
    } catch (error) {
      console.error(
        "❌ Failed to get session details:",
        error.response?.data?.message || error.message,
      );
      return null;
    }
  }

  /**
   * Test getting chat history statistics
   */
  async testGetChatHistoryStats() {
    try {
      console.log("\n Testing: Get Chat History Statistics");

      const response = await axios.get(
        `${this.baseUrl}/admin/chat-history/stats/overview`,
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        },
      );

      const stats = response.data.overview;
      console.log(`Retrieved chat history statistics`);
      console.log(`📈 Total sessions: ${stats.totalSessions}`);
      console.log(`💬 Total messages: ${stats.totalMessages}`);
      console.log(`👥 Unique users: ${stats.uniqueUsersCount}`);
      console.log(`🌐 Languages used: ${stats.languagesUsed.join(", ")}`);
      console.log(` Avg messages per session: ${stats.avgMessagesPerSession}`);

      if (response.data.languageBreakdown.length > 0) {
        console.log("\n🌐 Language breakdown:");
        response.data.languageBreakdown.forEach((lang) => {
          console.log(
            `  ${lang._id}: ${lang.count} sessions, ${lang.totalMessages} messages`,
          );
        });
      }

      if (response.data.dailyActivity.length > 0) {
        console.log(
          `\n📅 Daily activity (last ${response.data.dailyActivity.length} days with activity)`,
        );
        response.data.dailyActivity.slice(-5).forEach((day) => {
          console.log(
            `  ${day.date}: ${day.sessions} sessions, ${day.messages} messages`,
          );
        });
      }

      return response.data;
    } catch (error) {
      console.error(
        "❌ Failed to get chat statistics:",
        error.response?.data?.message || error.message,
      );
      return null;
    }
  }

  /**
   * Test search functionality
   */
  async testSearchChatHistory(searchQuery = "diabetes") {
    try {
      console.log(`\n🔍 Testing: Search Chat History ("${searchQuery}")`);

      const response = await axios.get(`${this.baseUrl}/admin/chat-history`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        params: { search: searchQuery, limit: 5 },
      });

      console.log(`Search completed`);
      console.log(
        `📋 Found ${response.data.sessions.length} sessions matching "${searchQuery}"`,
      );

      response.data.sessions.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.sessionId} - ${session.title}`);
        console.log(
          `     User: ${session.user?.name || "Unknown"} | Messages: ${session.messageCount}`,
        );
        if (session.lastMessage) {
          console.log(`     Last: ${session.lastMessage.content}`);
        }
      });

      return response.data;
    } catch (error) {
      console.error(
        "❌ Failed to search chat history:",
        error.response?.data?.message || error.message,
      );
      return null;
    }
  }

  /**
   * Test filtering by user
   */
  async testFilterByUser(userId) {
    try {
      console.log(`\n👤 Testing: Filter by User (${userId})`);

      const response = await axios.get(`${this.baseUrl}/admin/chat-history`, {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        params: { userId, limit: 5 },
      });

      console.log(`Filter completed`);
      console.log(
        `📋 Found ${response.data.sessions.length} sessions for user ${userId}`,
      );

      return response.data;
    } catch (error) {
      console.error(
        "❌ Failed to filter by user:",
        error.response?.data?.message || error.message,
      );
      return null;
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runTests() {
    console.log("🧪 Starting Admin Chat History Tests\n");
    console.log("=".repeat(60));

    // Step 1: Login as admin
    const loginSuccess = await this.loginAsAdmin();
    if (!loginSuccess) {
      console.log("❌ Cannot proceed without admin authentication");
      return;
    }

    // Step 2: Test getting all chat history
    const allHistory = await this.testGetAllChatHistory();
    if (!allHistory) {
      console.log("❌ Cannot proceed without chat history data");
      return;
    }

    // Step 3: Test getting specific session details (if sessions exist)
    if (allHistory.sessions.length > 0) {
      const firstSessionId = allHistory.sessions[0].sessionId;
      await this.testGetChatSessionDetails(firstSessionId);
    } else {
      console.log("⚠️  No chat sessions found to test session details");
    }

    // Step 4: Test statistics
    await this.testGetChatHistoryStats();

    // Step 5: Test search functionality
    await this.testSearchChatHistory();

    // Step 6: Test user filtering (if users exist)
    if (allHistory.sessions.length > 0 && allHistory.sessions[0].user) {
      const firstUserId = allHistory.sessions[0].user.id;
      await this.testFilterByUser(firstUserId);
    } else {
      console.log("⚠️  No user data found to test user filtering");
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Admin Chat History Tests Completed!");

    // Summary
    console.log("\n📋 Test Summary:");
    console.log(`Admin authentication: ${loginSuccess ? "PASSED" : "FAILED"}`);
    console.log(`Get all chat history: ${allHistory ? "PASSED" : "FAILED"}`);
    console.log(`Chat history endpoints: Available`);

    if (allHistory && allHistory.sessions.length === 0) {
      console.log("\n💡 Note: No chat sessions found in database.");
      console.log(
        "   Create some chat sessions by using the chat functionality first.",
      );
    }
  }
}

// Usage example
async function runAdminChatHistoryTests() {
  const tester = new AdminChatHistoryTester();
  await tester.runTests();
}

// Export for use in other scripts
module.exports = {
  AdminChatHistoryTester,
  runAdminChatHistoryTests,
};

// Run tests if this script is executed directly
if (require.main === module) {
  runAdminChatHistoryTests().catch(console.error);
}
