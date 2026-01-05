const axios = require('axios');

async function testAppointmentBooking() {
  try {
    console.log('Testing appointment booking system...\n');

    // First, get a doctor to book with
    console.log('1. Getting doctors...');
    const doctorsResponse = await axios.post('http://localhost:3002/api/ai/recommend-doctor', {
      symptoms: ['cardiology'],
      age: 30,
      gender: 'not specified',
      urgency: 'normal'
    });

    if (!doctorsResponse.data.recommendations || doctorsResponse.data.recommendations.length === 0) {
      console.log('No doctors found!');
      return;
    }

    const doctor = doctorsResponse.data.recommendations[0];
    console.log(`Selected doctor: ${doctor.name} (${doctor.specialization})`);

    // Create a test user token (you'll need to replace this with a real token)
    console.log('\n2. Note: You need to login first to get a valid token');
    console.log('The booking endpoint requires authentication');
    console.log('Example booking request would be:');
    console.log({
      doctorId: doctor.id,
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      appointmentData: {
        appointmentType: 'consultation',
        symptoms: ['chest pain'],
        chiefComplaint: 'Experiencing chest pain for the past week'
      }
    });

    console.log('\n3. Testing appointment history endpoint...');
    console.log('This also requires authentication');
    console.log('GET /api/ai/appointments');

  } catch (error) {
    console.error('Error testing appointment system:', error.response?.data || error.message);
  }
}

testAppointmentBooking();