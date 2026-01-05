const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medibot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function listAllDoctors() {
  try {
    const doctors = await Doctor.find({ isVerified: true })
      .populate('userId', 'profile')
      .sort({ specialization: 1, 'rating.average': -1 });

    console.log(`Total doctors in database: ${doctors.length}\n`);

    const groupedBySpecialization = {};
    
    doctors.forEach(doctor => {
      if (!groupedBySpecialization[doctor.specialization]) {
        groupedBySpecialization[doctor.specialization] = [];
      }
      groupedBySpecialization[doctor.specialization].push(doctor);
    });

    Object.keys(groupedBySpecialization).sort().forEach(specialization => {
      console.log(`\n=== ${specialization.toUpperCase()} (${groupedBySpecialization[specialization].length} doctors) ===`);
      
      groupedBySpecialization[specialization].forEach((doctor, index) => {
        const name = `Dr. ${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`;
        console.log(`${index + 1}. ${name}`);
        console.log(`   Experience: ${doctor.experience} years | Rating: ${doctor.rating.average}/5.0 (${doctor.rating.count} reviews)`);
        console.log(`   Languages: ${doctor.languages.join(', ')}`);
        console.log(`   Bio: ${doctor.bio.substring(0, 80)}...`);
      });
    });

    console.log(`\n\nSUMMARY:`);
    console.log(`Total Specializations: ${Object.keys(groupedBySpecialization).length}`);
    console.log(`Total Doctors: ${doctors.length}`);
    console.log(`Average Rating: ${(doctors.reduce((sum, d) => sum + d.rating.average, 0) / doctors.length).toFixed(2)}`);
    console.log(`Average Experience: ${(doctors.reduce((sum, d) => sum + d.experience, 0) / doctors.length).toFixed(1)} years`);

  } catch (error) {
    console.error('Error listing doctors:', error);
  } finally {
    mongoose.connection.close();
  }
}

listAllDoctors();