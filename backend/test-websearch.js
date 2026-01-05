require('dotenv').config();
const tavilySearch = require('./services/tavilySearch');

async function testWebSearch() {
  console.log('🧪 Testing Tavily Web Search Integration...\n');

  // Test 1: Check initialization
  console.log('1. Checking initialization...');
  console.log(`   Configured: ${tavilySearch.initialized}`);
  console.log(`   API Key: ${process.env.TAVILY_API_KEY ? 'Set' : 'Not set'}\n`);

  if (!tavilySearch.initialized) {
    console.log('❌ Tavily Search not configured. Please set TAVILY_API_KEY in .env file');
    return;
  }

  // Test 2: Search query detection
  console.log('2. Testing search query detection...');
  const testQueries = [
    'What does research say about diabetes?',
    'Find information about heart disease',
    'Latest studies on cancer treatment',
    'Tell me about headaches', // Should not trigger search
    'How are you today?' // Should not trigger search
  ];

  testQueries.forEach(query => {
    const isSearchQuery = tavilySearch.isWebSearchQuery(query);
    console.log(`   "${query}" -> ${isSearchQuery ? '🔍 Search' : '💬 Chat'}`);
  });

  // Test 3: Actual search
  console.log('\n3. Testing medical search...');
  try {
    const searchResults = await tavilySearch.searchMedical('diabetes symptoms treatment', {
      maxResults: 3
    });

    console.log(`✅ Search successful:`);
    console.log(`   Query: ${searchResults.query}`);
    console.log(`   Results: ${searchResults.totalResults}`);
    console.log(`   Search time: ${searchResults.searchTime}`);

    if (searchResults.results && searchResults.results.length > 0) {
      console.log('\n   Top results:');
      searchResults.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title}`);
        console.log(`      Domain: ${new URL(result.url).hostname}`);
        console.log(`      Score: ${result.score}`);
        console.log(`      Content: ${result.content.substring(0, 100)}...\n`);
      });
    }

    // Test 4: Search-enhanced response generation
    console.log('4. Testing search-enhanced response...');
    const enhancedResponse = await tavilySearch.generateSearchEnhancedResponse(
      'diabetes symptoms',
      searchResults,
      'en'
    );

    if (enhancedResponse) {
      console.log('✅ Enhanced response generated:');
      console.log(`   Length: ${enhancedResponse.length} characters`);
      console.log(`   Preview: ${enhancedResponse.substring(0, 200)}...\n`);
    }

  } catch (error) {
    console.error('❌ Search test failed:', error.message);
    
    if (error.message.includes('Invalid Tavily API key')) {
      console.log('💡 Please check your TAVILY_API_KEY in the .env file');
    } else if (error.message.includes('rate limit')) {
      console.log('💡 API rate limit reached, try again later');
    }
  }

  // Test 5: Connection test
  console.log('5. Running connection test...');
  const connectionTest = await tavilySearch.testSearch();
  console.log(`   Connection test: ${connectionTest ? '✅ Passed' : '❌ Failed'}`);

  console.log('\n🎉 Web search integration test completed!');
}

// Run the test
testWebSearch().catch(console.error);