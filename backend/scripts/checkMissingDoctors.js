const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const path = require('path');

// Load .env from backend directory regardless of where script is run from
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ALL_SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Surgery',
  'Urology',
  'Gynecology',
  'Ophthalmology',
  'ENT',
  'Emergency Medicine'
];

async function checkMissingDoctors() {
  try {
    console.log('Checking for missing doctor specializations...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get count by specialization
    const doctorsBySpec = await Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const specMap = {};
    doctorsBySpec.forEach(spec => {
      specMap[spec._id] = spec.count;
    });

    console.log('📊 Current Doctor Distribution:\n');
    console.log('Specialization'.padEnd(25) + 'Count');
    console.log('─'.repeat(35));

    let totalDoctors = 0;
    const missingSpecs = [];
    const lowCountSpecs = [];

    ALL_SPECIALIZATIONS.forEach(spec => {
      const count = specMap[spec] || 0;
      totalDoctors += count;
      
      const status = count === 0 ? 'MISSING' : 
                     count < 4 ? ` ${count} (need ${4 - count} more)` : 
                     `${count}`;
      
      console.log(`${spec.padEnd(25)}${status}`);
      
      if (count === 0) {
        missingSpecs.push(spec);
      } else if (count < 4) {
        lowCountSpecs.push({ spec, current: count, needed: 4 - count });
      }
    });

    console.log('─'.repeat(35));
    console.log(`Total Doctors: ${totalDoctors}\n`);

    if (missingSpecs.length > 0) {
      console.log('Missing Specializations:');
      missingSpecs.forEach(spec => console.log(`   - ${spec}`));
      console.log('');
    }

    if (lowCountSpecs.length > 0) {
      console.log(' Specializations with Low Count:');
      lowCountSpecs.forEach(({ spec, current, needed }) => {
        console.log(`   - ${spec}: has ${current}, needs ${needed} more`);
      });
      console.log('');
    }

    if (missingSpecs.length === 0 && lowCountSpecs.length === 0) {
      console.log('All specializations have adequate doctor coverage!\n');
    } else {
      console.log('💡 Recommendation: Run the addMissingDoctors.js script to add missing doctors\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkMissingDoctors();
