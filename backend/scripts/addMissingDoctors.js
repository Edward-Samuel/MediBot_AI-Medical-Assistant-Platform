const mongoose = require('mongoose');
const User = require('../models/User');
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

// Additional doctors to fill gaps
const additionalDoctors = {
  'General Medicine': [
    { firstName: 'Alice', lastName: 'Morgan', experience: 10, rating: 4.7, bio: 'Compassionate family physician with focus on preventive medicine.' },
    { firstName: 'Benjamin', lastName: 'Scott', experience: 14, rating: 4.8, bio: 'Internal medicine specialist with expertise in chronic disease management.' }
  ],
  'Cardiology': [
    { firstName: 'Victoria', lastName: 'Hayes', experience: 16, rating: 4.8, bio: 'Interventional cardiologist specializing in complex coronary procedures.' },
    { firstName: 'Nathan', lastName: 'Fisher', experience: 13, rating: 4.7, bio: 'Heart failure specialist with expertise in advanced cardiac therapies.' }
  ],
  'Dermatology': [
    { firstName: 'Olivia', lastName: 'Pierce', experience: 9, rating: 4.7, bio: 'Dermatologist specializing in acne treatment and cosmetic procedures.' },
    { firstName: 'Lucas', lastName: 'Howard', experience: 15, rating: 4.8, bio: 'Expert in melanoma detection and skin cancer prevention.' }
  ],
  'Endocrinology': [
    { firstName: 'Sophia', lastName: 'Long', experience: 11, rating: 4.7, bio: 'Diabetes specialist with focus on insulin pump therapy.' },
    { firstName: 'Ethan', lastName: 'Patterson', experience: 13, rating: 4.8, bio: 'Thyroid disorder expert and metabolic syndrome specialist.' }
  ],
  'Gastroenterology': [
    { firstName: 'Isabella', lastName: 'Hughes', experience: 12, rating: 4.7, bio: 'GI specialist focusing on IBS and functional bowel disorders.' },
    { firstName: 'Mason', lastName: 'Flores', experience: 16, rating: 4.8, bio: 'Advanced endoscopist with expertise in therapeutic procedures.' }
  ],
  'Neurology': [
    { firstName: 'Emma', lastName: 'Washington', experience: 14, rating: 4.8, bio: 'Headache and migraine specialist with comprehensive treatment approach.' },
    { firstName: 'Alexander', lastName: 'Butler', experience: 17, rating: 4.9, bio: 'Multiple sclerosis expert with focus on disease-modifying therapies.' }
  ],
  'Oncology': [
    { firstName: 'Ava', lastName: 'Simmons', experience: 15, rating: 4.8, bio: 'Hematology-oncology specialist focusing on lymphomas and leukemias.' },
    { firstName: 'William', lastName: 'Foster', experience: 19, rating: 4.9, bio: 'Lung cancer specialist with expertise in targeted therapies.' }
  ],
  'Orthopedics': [
    { firstName: 'Mia', lastName: 'Gonzales', experience: 10, rating: 4.7, bio: 'Sports medicine orthopedist specializing in knee and shoulder injuries.' },
    { firstName: 'James', lastName: 'Bryant', experience: 18, rating: 4.9, bio: 'Spine surgeon with expertise in minimally invasive techniques.' }
  ],
  'Pediatrics': [
    { firstName: 'Charlotte', lastName: 'Alexander', experience: 12, rating: 4.8, bio: 'Pediatrician with special interest in childhood allergies and asthma.' },
    { firstName: 'Benjamin', lastName: 'Russell', experience: 15, rating: 4.8, bio: 'Developmental pediatrician focusing on autism and ADHD.' }
  ],
  'Psychiatry': [
    { firstName: 'Amelia', lastName: 'Griffin', experience: 13, rating: 4.7, bio: 'Psychiatrist specializing in mood disorders and psychotherapy.' },
    { firstName: 'Henry', lastName: 'Diaz', experience: 16, rating: 4.8, bio: 'Forensic psychiatrist with expertise in trauma and PTSD.' }
  ],
  'Pulmonology': [
    { firstName: 'Harper', lastName: 'Hayes', experience: 11, rating: 4.7, bio: 'Pulmonologist specializing in interstitial lung diseases.' },
    { firstName: 'Sebastian', lastName: 'Myers', experience: 14, rating: 4.8, bio: 'Sleep medicine specialist with expertise in sleep apnea treatment.' }
  ],
  'Radiology': [
    { firstName: 'Evelyn', lastName: 'Ford', experience: 13, rating: 4.7, bio: 'Breast imaging specialist with expertise in mammography.' },
    { firstName: 'Jack', lastName: 'Reynolds', experience: 17, rating: 4.9, bio: 'Body imaging radiologist specializing in abdominal CT and MRI.' }
  ],
  'Surgery': [
    { firstName: 'Abigail', lastName: 'Powell', experience: 15, rating: 4.8, bio: 'Colorectal surgeon with expertise in minimally invasive techniques.' },
    { firstName: 'Daniel', lastName: 'Sullivan', experience: 19, rating: 4.9, bio: 'Vascular surgeon specializing in endovascular procedures.' }
  ],
  'Urology': [
    { firstName: 'Emily', lastName: 'Ortiz', experience: 12, rating: 4.7, bio: 'Urologist specializing in male infertility and sexual dysfunction.' },
    { firstName: 'Michael', lastName: 'Freeman', experience: 16, rating: 4.8, bio: 'Robotic urologic surgeon with expertise in prostatectomy.' }
  ],
  'Gynecology': [
    { firstName: 'Elizabeth', lastName: 'Wells', experience: 14, rating: 4.8, bio: 'OB/GYN specializing in minimally invasive gynecologic surgery.' },
    { firstName: 'Matthew', lastName: 'Webb', experience: 17, rating: 4.9, bio: 'Maternal-fetal medicine specialist for high-risk pregnancies.' }
  ],
  'Ophthalmology': [
    { firstName: 'Sofia', lastName: 'Simpson', experience: 11, rating: 4.7, bio: 'Cornea specialist with expertise in LASIK and PRK surgery.' },
    { firstName: 'David', lastName: 'Stevens', experience: 15, rating: 4.8, bio: 'Oculoplastic surgeon specializing in eyelid and orbital surgery.' }
  ],
  'ENT': [
    { firstName: 'Avery', lastName: 'Tucker', experience: 10, rating: 4.7, bio: 'ENT surgeon specializing in voice and swallowing disorders.' },
    { firstName: 'Joseph', lastName: 'Porter', experience: 14, rating: 4.8, bio: 'Otologist with expertise in ear surgery and hearing restoration.' }
  ],
  'Emergency Medicine': [
    { firstName: 'Scarlett', lastName: 'Hunter', experience: 9, rating: 4.7, bio: 'Emergency physician with expertise in resuscitation and trauma.' },
    { firstName: 'Christopher', lastName: 'Hicks', experience: 13, rating: 4.8, bio: 'Emergency medicine physician specializing in disaster medicine.' }
  ]
};

const defaultAvailability = {
  monday: { start: '09:00', end: '17:00', available: true },
  tuesday: { start: '09:00', end: '17:00', available: true },
  wednesday: { start: '09:00', end: '17:00', available: true },
  thursday: { start: '09:00', end: '17:00', available: true },
  friday: { start: '09:00', end: '17:00', available: true },
  saturday: { start: '09:00', end: '13:00', available: true },
  sunday: { start: '10:00', end: '14:00', available: false }
};

async function addMissingDoctors() {
  try {
    console.log('🔍 Checking for missing doctors...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get current count by specialization
    const doctorsBySpec = await Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } }
    ]);

    const specMap = {};
    doctorsBySpec.forEach(spec => {
      specMap[spec._id] = spec.count;
    });

    let addedCount = 0;
    const TARGET_PER_SPEC = 4;

    for (const specialization of ALL_SPECIALIZATIONS) {
      const currentCount = specMap[specialization] || 0;
      const needed = TARGET_PER_SPEC - currentCount;

      if (needed > 0) {
        console.log(`📋 ${specialization}: has ${currentCount}, adding ${needed} more...`);
        
        const doctorsToAdd = additionalDoctors[specialization] || [];
        const doctorsAdded = Math.min(needed, doctorsToAdd.length);

        for (let i = 0; i < doctorsAdded; i++) {
          const doctorData = doctorsToAdd[i];
          
          try {
            // Check if email already exists
            const existingUser = await User.findOne({
              email: `${doctorData.firstName.toLowerCase()}.${doctorData.lastName.toLowerCase()}@medibot.com`
            });

            if (existingUser) {
              console.log(`   ⚠️  Skipping ${doctorData.firstName} ${doctorData.lastName} - email already exists`);
              continue;
            }

            // Create user
            const user = new User({
              email: `${doctorData.firstName.toLowerCase()}.${doctorData.lastName.toLowerCase()}@medibot.com`,
              password: 'password123',
              role: 'doctor',
              profile: {
                firstName: doctorData.firstName,
                lastName: doctorData.lastName,
                phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
                gender: Math.random() > 0.5 ? 'male' : 'female',
                address: {
                  city: 'Medical City',
                  state: 'CA',
                  country: 'USA'
                }
              },
              emailVerified: true,
              isActive: true
            });

            const savedUser = await user.save();

            // Generate unique license number
            const licensePrefix = specialization.substring(0, 2).toUpperCase();
            const licenseNumber = `${licensePrefix}${Date.now().toString().slice(-6)}`;

            // Create doctor profile
            const doctor = new Doctor({
              userId: savedUser._id,
              licenseNumber: licenseNumber,
              specialization: specialization,
              experience: doctorData.experience,
              education: [
                {
                  degree: 'MD',
                  institution: 'Medical University',
                  year: new Date().getFullYear() - doctorData.experience - 4
                },
                {
                  degree: `${specialization} Residency`,
                  institution: 'Teaching Hospital',
                  year: new Date().getFullYear() - doctorData.experience
                }
              ],
              certifications: [
                `Board Certified in ${specialization}`,
                'Advanced Life Support (ALS)',
                'Basic Life Support (BLS)'
              ],
              languages: ['English'],
              availability: defaultAvailability,
              rating: {
                average: doctorData.rating,
                count: Math.floor(Math.random() * 150) + 50
              },
              bio: doctorData.bio,
              isVerified: true
            });

            await doctor.save();
            addedCount++;
            console.log(`   ✅ Added Dr. ${doctorData.firstName} ${doctorData.lastName}`);

          } catch (error) {
            console.error(`   ❌ Error adding ${doctorData.firstName} ${doctorData.lastName}:`, error.message);
          }
        }

        if (doctorsAdded < needed) {
          console.log(`   ⚠️  Only ${doctorsAdded} doctors available to add, still need ${needed - doctorsAdded} more`);
        }
      } else {
        console.log(`✅ ${specialization}: has ${currentCount} doctors (adequate)`);
      }
    }

    console.log(`\n✅ Successfully added ${addedCount} new doctors!\n`);

    // Display final summary
    const finalDoctorsBySpec = await Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Final Doctor Distribution:\n');
    console.log('Specialization'.padEnd(25) + 'Count');
    console.log('─'.repeat(35));

    let totalDoctors = 0;
    finalDoctorsBySpec.forEach(spec => {
      totalDoctors += spec.count;
      const status = spec.count >= 4 ? '✅' : '⚠️ ';
      console.log(`${spec._id.padEnd(25)}${status} ${spec.count}`);
    });

    console.log('─'.repeat(35));
    console.log(`Total Doctors: ${totalDoctors}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

addMissingDoctors();
