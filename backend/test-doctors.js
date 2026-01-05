const axios = require('axios');

async function testDoctorRecommendation() {
  try {
    console.log('Testing doctor recommendation API...');
    
    const response = await axios.post('http://localhost:3002/api/ai/recommend-doctor', {
      symptoms: ['cardiology'],
      age: 30,
      gender: 'not specified',
      urgency: 'normal'
    });

    console.log('API Response Status:', response.status);
    console.log('Number of recommendations:', response.data.recommendations?.length || 0);
    
    if (response.data.recommendations && response.data.recommendations.length > 0) {
      console.log('\nFirst few doctors:');
      response.data.recommendations.slice(0, 3).forEach((doctor, index) => {
        console.log(`${index + 1}. ${doctor.name} - ${doctor.specialization}`);
        console.log(`   Experience: ${doctor.experience} years, Rating: ${doctor.rating}`);
      });
    }

    console.log('\nAI Analysis:', response.data.analysis);
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testDoctorRecommendation();