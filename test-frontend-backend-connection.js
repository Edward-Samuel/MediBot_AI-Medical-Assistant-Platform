// Test script to verify frontend can reach backend
const axios = require('axios');

async function testConnection() {
  console.log('🧪 Testing frontend-backend connection...\n');
  
  try {
    // Test 1: Direct backend connection
    console.log('1. Testing direct backend connection (http://localhost:3002/api/ai/status)...');
    const directResponse = await axios.get('http://localhost:3002/api/ai/status', {
      timeout: 5000
    });
    console.log('✅ Direct backend connection: SUCCESS');
    console.log(`   Status: ${directResponse.data.status}`);
    console.log(`   Tavily Search: ${directResponse.data.services.tavilySearch.available ? 'Available' : 'Not Available'}`);
    console.log(`   Tavily Configured: ${directResponse.data.services.tavilySearch.configured ? 'Yes' : 'No'}`);
    console.log('');
    
    // Test 2: Proxy connection (if frontend is running)
    try {
      console.log('2. Testing proxy connection (http://localhost:3000/api/ai/status)...');
      const proxyResponse = await axios.get('http://localhost:3000/api/ai/status', {
        timeout: 5000
      });
      console.log('✅ Proxy connection: SUCCESS');
      console.log(`   Status: ${proxyResponse.data.status}`);
      console.log(`   Tavily Search: ${proxyResponse.data.services.tavilySearch.available ? 'Available' : 'Not Available'}`);
      console.log('');
    } catch (proxyError) {
      console.log('❌ Proxy connection: FAILED');
      console.log(`   Error: ${proxyError.message}`);
      console.log('   This is expected if frontend is not running or proxy is not configured');
      console.log('');
    }
    
    // Test 3: Web search functionality
    console.log('3. Testing web search functionality...');
    const searchResponse = await axios.get('http://localhost:3002/api/ai/test-search?query=diabetes symptoms', {
      timeout: 10000
    });
    console.log('✅ Web search test: SUCCESS');
    console.log(`   Query: ${searchResponse.data.query}`);
    console.log(`   Results: ${searchResponse.data.totalResults}`);
    console.log('');
    
    console.log('🎉 All backend tests passed!');
    console.log('\n📋 SOLUTION:');
    console.log('The backend is working correctly. The frontend should use:');
    console.log('- Direct backend URLs: http://localhost:3002/api/*');
    console.log('- Clear localStorage cache for web search status');
    console.log('- Restart frontend development server');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUTION: Backend server is not running');
      console.log('Start the backend server with: npm start (in backend directory)');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 SOLUTION: Connection timeout');
      console.log('Check if backend server is running on port 3002');
    } else {
      console.log('\n💡 Check backend server logs for more details');
    }
  }
}

testConnection();