const axios = require('axios');

async function testFAQSystem() {
  try {
    console.log('🧪 Testing FAQ System...\n');

    // Test 1: Get all FAQs
    console.log('1. Testing FAQ retrieval...');
    const allFAQsResponse = await axios.get('http://localhost:3002/api/faq');
    console.log(`✅ Retrieved ${allFAQsResponse.data.faqs.length} FAQs`);

    // Test 2: Search FAQs
    console.log('\n2. Testing FAQ search...');
    const searchResponse = await axios.post('http://localhost:3002/api/faq/search', {
      query: 'how to schedule appointment',
      limit: 3
    });
    console.log(`✅ Found ${searchResponse.data.faqs.length} FAQs matching search`);
    
    if (searchResponse.data.faqs.length > 0) {
      console.log('   First result:', searchResponse.data.faqs[0].question);
    }

    // Test 3: Get categories
    console.log('\n3. Testing categories...');
    const categoriesResponse = await axios.get('http://localhost:3002/api/faq/categories');
    console.log(`✅ Found ${categoriesResponse.data.categories.length} categories`);
    categoriesResponse.data.categories.forEach(cat => {
      console.log(`   - ${cat._id}: ${cat.count} FAQs`);
    });

    // Test 4: Test FAQ service integration
    console.log('\n4. Testing FAQ service...');
    const faqService = require('./services/faqService');
    
    const faqContext = await faqService.getFAQContext('how do I book appointment');
    if (faqContext) {
      console.log(`✅ FAQ service returned ${faqContext.count} relevant FAQs`);
      console.log('   Context preview:', faqContext.context.substring(0, 100) + '...');
    } else {
      console.log('❌ FAQ service returned no context');
    }

    // Test 5: Test FAQ query detection
    const testQueries = [
      'How do I schedule an appointment?',
      'What is the cost?',
      'I have chest pain',
      'Help me understand the platform'
    ];

    console.log('\n5. Testing FAQ query detection...');
    testQueries.forEach(query => {
      const isFAQ = faqService.isFAQQuery(query);
      console.log(`   "${query}" -> ${isFAQ ? '✅ FAQ' : '❌ Not FAQ'}`);
    });

    console.log('\n🎉 FAQ system test completed successfully!');

  } catch (error) {
    console.error('❌ FAQ test failed:', error.response?.data || error.message);
  }
}

testFAQSystem();