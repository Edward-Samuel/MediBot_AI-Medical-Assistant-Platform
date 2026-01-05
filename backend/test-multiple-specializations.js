const axios = require('axios');

const testCases = [
  { symptoms: ['headache'], specialization: 'Neurology' },
  { symptoms: ['skin rash'], specialization: 'Dermatology' },
  { symptoms: ['joint pain'], specialization: 'Orthopedics' },
  { symptoms: ['stomach pain'], specialization: 'Gastroenterology' },
  { symptoms: ['ear pain'], specialization: 'ENT' },
  { symptoms: ['eye pain'], specialization: 'Ophthalmology' },
  { symptoms: ['depression'], specialization: 'Psychiatry' },
  { symptoms: ['fever'], specialization: 'Pediatrics' }
];

async function testMultipleSpecializations() {
  console.log('Testing multiple specializations...\n');
  
  for (const testCase of testCases) {
    try {
      const response = await axios.post('http://localhost:3002/api/ai/recommend-doctor', {
        symptoms: testCase.symptoms,
        age: 30,
        gender: 'not specified',
        urgency: 'normal'
      });

      console.log(`Symptom: ${testCase.symptoms[0]} | Expected: ${testCase.specialization}`);
      console.log(`Doctors found: ${response.data.recommendations?.length || 0}`);
      
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        const specializations = [...new Set(response.data.recommendations.map(d => d.specialization))];
        console.log(`Specializations: ${specializations.join(', ')}`);
        console.log(`Top doctor: ${response.data.recommendations[0].name} (${response.data.recommendations[0].specialization})`);
      }
      
      console.log('---');
      
    } catch (error) {
      console.error(`Error testing ${testCase.symptoms[0]}:`, error.message);
    }
  }
}

testMultipleSpecializations();