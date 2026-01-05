const axios = require('axios');

async function testChatHistorySearch() {
  try {
    console.log('🧪 Testing Chat History Search...\n');

    // First, we need to login to get a token
    console.log('1. Logging in to get authentication token...');
    
    // Try to login with a test user (you may need to create one first)
    let token;
    try {
      const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
        email: 'test@example.com', // Replace with actual test user
        password: 'password123'
      });
      token = loginResponse.data.token;
      console.log('✅ Login successful');
    } catch (loginError) {
      console.log('❌ Login failed. Creating a test user first...');
      
      // Create a test user
      try {
        await axios.post('http://localhost:3002/api/auth/register', {
          email: 'test@example.com',
          password: 'password123',
          role: 'patient',
          firstName: 'Test',
          lastName: 'User'
        });
        console.log('✅ Test user created');
        
        // Now login
        const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
          email: 'test@example.com',
          password: 'password123'
        });
        token = loginResponse.data.token;
        console.log('✅ Login successful');
      } catch (createError) {
        console.error('❌ Failed to create test user:', createError.response?.data || createError.message);
        return;
      }
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Test 2: Create a test chat session with messages
    console.log('\n2. Creating test chat session...');
    const sessionResponse = await axios.post('http://localhost:3002/api/chat-history/session', {
      language: 'en'
    }, { headers });
    
    const sessionId = sessionResponse.data.sessionId;
    console.log(`✅ Created session: ${sessionId}`);

    // Add some test messages
    const testMessages = [
      { role: 'user', content: 'I have a headache and fever' },
      { role: 'bot', content: 'I understand you have a headache and fever. These symptoms could indicate various conditions...' },
      { role: 'user', content: 'What should I do about chest pain?' },
      { role: 'bot', content: 'Chest pain can be serious. I recommend consulting a cardiologist immediately...' }
    ];

    for (const message of testMessages) {
      await axios.post(`http://localhost:3002/api/chat-history/session/${sessionId}/message`, message, { headers });
    }
    console.log('✅ Added test messages to session');

    // Test 3: Get all sessions
    console.log('\n3. Testing session retrieval...');
    const sessionsResponse = await axios.get('http://localhost:3002/api/chat-history/sessions', { headers });
    console.log(`✅ Retrieved ${sessionsResponse.data.sessions.length} sessions`);

    // Test 4: Search chat history
    console.log('\n4. Testing chat history search...');
    
    const searchQueries = [
      'headache',
      'chest pain',
      'fever',
      'cardiologist'
    ];

    for (const query of searchQueries) {
      try {
        const searchResponse = await axios.get('http://localhost:3002/api/chat-history/search', {
          params: { query, limit: 5 },
          headers
        });
        
        console.log(`   Search for "${query}": ${searchResponse.data.results.length} results`);
        
        if (searchResponse.data.results.length > 0) {
          const firstResult = searchResponse.data.results[0];
          console.log(`     - Found in session: ${firstResult.title}`);
          console.log(`     - Matching messages: ${firstResult.matchingMessages.length}`);
        }
      } catch (searchError) {
        console.error(`   ❌ Search for "${query}" failed:`, searchError.response?.data || searchError.message);
      }
    }

    // Test 5: Test empty search
    console.log('\n5. Testing empty search...');
    try {
      await axios.get('http://localhost:3002/api/chat-history/search', {
        params: { query: '' },
        headers
      });
      console.log('❌ Empty search should have failed');
    } catch (emptySearchError) {
      if (emptySearchError.response?.status === 400) {
        console.log('✅ Empty search correctly rejected');
      } else {
        console.log('❌ Unexpected error for empty search:', emptySearchError.response?.data);
      }
    }

    // Test 6: Test search with no results
    console.log('\n6. Testing search with no results...');
    const noResultsResponse = await axios.get('http://localhost:3002/api/chat-history/search', {
      params: { query: 'nonexistentterm12345', limit: 5 },
      headers
    });
    console.log(`✅ Search with no results: ${noResultsResponse.data.results.length} results (expected 0)`);

    console.log('\n🎉 Chat history search test completed!');

  } catch (error) {
    console.error('❌ Chat history search test failed:', error.response?.data || error.message);
  }
}

testChatHistorySearch();