// Test script to verify web search functionality
const axios = require('axios');

async function testWebSearchFrontend() {
  console.log('🧪 Testing Web Search Frontend Integration...\n');

  try {
    // Test 1: Check backend status
    console.log('1. Testing backend API status...');
    const statusResponse = await axios.get('http://localhost:3002/api/ai/status');
    
    console.log('✅ Backend API is responding');
    console.log(`   Status: ${statusResponse.data.status}`);
    
    if (statusResponse.data.services?.tavilySearch) {
      const tavilyStatus = statusResponse.data.services.tavilySearch;
      console.log(`   Tavily Available: ${tavilyStatus.available}`);
      console.log(`   Tavily Configured: ${tavilyStatus.configured}`);
      console.log(`   Tavily Error: ${tavilyStatus.error || 'None'}`);
      
      if (tavilyStatus.available && tavilyStatus.configured) {
        console.log('🎉 Web search should work in frontend!');
      } else if (tavilyStatus.configured && !tavilyStatus.available) {
        console.log('⚠️ Web search is configured but temporarily unavailable');
      } else {
        console.log('❌ Web search is not properly configured');
      }
    } else {
      console.log('❌ No Tavily search service found in response');
    }

    // Test 2: Test actual search functionality
    console.log('\n2. Testing search functionality...');
    const searchResponse = await axios.post('http://localhost:3002/api/ai/chat', {
      message: 'search for diabetes symptoms',
      conversationHistory: [],
      language: 'en',
      languageInfo: { code: 'en', name: 'English' }
    });

    if (searchResponse.data.webSearchData) {
      console.log('✅ Web search integration working');
      console.log(`   Results found: ${searchResponse.data.webSearchData.resultsCount}`);
      console.log(`   Search error: ${searchResponse.data.webSearchData.error || 'None'}`);
    } else {
      console.log('⚠️ No web search data in response');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 3002');
    }
  }
}

// Run the test
testWebSearchFrontend();