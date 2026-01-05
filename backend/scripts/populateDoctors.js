const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medibot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const doctorsData = [
  // General Medicine
  {
    firstName: 'Sarah', lastName: 'Johnson', specialization: 'General Medicine',
    experience: 8, rating: 4.8,
    bio: 'Experienced family physician with expertise in preventive care and chronic disease management.',
    languages: ['English', 'Spanish'], licenseNumber: 'GM001'
  },
  {
    firstName: 'Michael', lastName: 'Chen', specialization: 'General Medicine',
    experience: 12, rating: 4.7,
    bio: 'Board-certified internal medicine physician specializing in adult primary care.',
    languages: ['English', 'Mandarin'], licenseNumber: 'GM002'
  },
  {
    firstName: 'Emily', lastName: 'Rodriguez', specialization: 'General Medicine',
    experience: 6, rating: 4.6,
    bio: 'Dedicated primary care physician focused on holistic patient care and wellness.',
    languages: ['English', 'Spanish'], licenseNumber: 'GM003'
  },
  {
    firstName: 'David', lastName: 'Thompson', specialization: 'General Medicine',
    experience: 15, rating: 4.9,
    bio: 'Senior family medicine physician with extensive experience in community healthcare.',
    languages: ['English'], licenseNumber: 'GM004'
  },

  // Cardiology
  {
    firstName: 'Robert', lastName: 'Williams', specialization: 'Cardiology',
    experience: 18, rating: 4.9,
    bio: 'Leading cardiologist specializing in interventional cardiology and heart disease prevention.',
    languages: ['English'], licenseNumber: 'CD001'
  },
  {
    firstName: 'Lisa', lastName: 'Anderson', specialization: 'Cardiology',
    experience: 14, rating: 4.8,
    bio: 'Expert in non-invasive cardiology, echocardiography, and cardiac rehabilitation.',
    languages: ['English', 'French'], licenseNumber: 'CD002'
  },
  {
    firstName: 'James', lastName: 'Kumar', specialization: 'Cardiology',
    experience: 20, rating: 4.9,
    bio: 'Renowned cardiac surgeon with expertise in complex heart procedures and transplants.',
    languages: ['English', 'Hindi'], licenseNumber: 'CD003'
  },
  {
    firstName: 'Maria', lastName: 'Garcia', specialization: 'Cardiology',
    experience: 11, rating: 4.7,
    bio: 'Pediatric cardiologist specializing in congenital heart defects and pediatric heart surgery.',
    languages: ['English', 'Spanish'], licenseNumber: 'CD004'
  },

  // Dermatology
  {
    firstName: 'Jennifer', lastName: 'Lee', specialization: 'Dermatology',
    experience: 10, rating: 4.8,
    bio: 'Board-certified dermatologist specializing in medical and cosmetic dermatology.',
    languages: ['English', 'Korean'], licenseNumber: 'DM001'
  },
  {
    firstName: 'Christopher', lastName: 'Brown', specialization: 'Dermatology',
    experience: 16, rating: 4.9,
    bio: 'Expert in dermatopathology and Mohs surgery for skin cancer treatment.',
    languages: ['English'], licenseNumber: 'DM002'
  },
  {
    firstName: 'Amanda', lastName: 'Wilson', specialization: 'Dermatology',
    experience: 8, rating: 4.6,
    bio: 'Dermatologist focused on pediatric dermatology and inflammatory skin conditions.',
    languages: ['English'], licenseNumber: 'DM003'
  },
  {
    firstName: 'Daniel', lastName: 'Martinez', specialization: 'Dermatology',
    experience: 13, rating: 4.7,
    bio: 'Specialist in psoriasis, eczema, and advanced dermatological treatments.',
    languages: ['English', 'Spanish'], licenseNumber: 'DM004'
  },

  // Neurology
  {
    firstName: 'Patricia', lastName: 'Davis', specialization: 'Neurology',
    experience: 17, rating: 4.9,
    bio: 'Leading neurologist specializing in stroke care and neurocritical care.',
    languages: ['English'], licenseNumber: 'NR001'
  },
  {
    firstName: 'Kevin', lastName: 'Singh', specialization: 'Neurology',
    experience: 12, rating: 4.8,
    bio: 'Expert in epilepsy treatment and neurophysiology with advanced EEG training.',
    languages: ['English', 'Hindi', 'Punjabi'], licenseNumber: 'NR002'
  },
  {
    firstName: 'Rachel', lastName: 'Taylor', specialization: 'Neurology',
    experience: 14, rating: 4.7,
    bio: 'Specialist in movement disorders, Parkinson\'s disease, and deep brain stimulation.',
    languages: ['English'], licenseNumber: 'NR003'
  },
  {
    firstName: 'Mark', lastName: 'Johnson', specialization: 'Neurology',
    experience: 19, rating: 4.9,
    bio: 'Pediatric neurologist with expertise in childhood epilepsy and developmental disorders.',
    languages: ['English'], licenseNumber: 'NR004'
  },

  // Orthopedics
  {
    firstName: 'Steven', lastName: 'Miller', specialization: 'Orthopedics',
    experience: 16, rating: 4.8,
    bio: 'Orthopedic surgeon specializing in joint replacement and sports medicine.',
    languages: ['English'], licenseNumber: 'OR001'
  },
  {
    firstName: 'Nicole', lastName: 'White', specialization: 'Orthopedics',
    experience: 11, rating: 4.7,
    bio: 'Expert in pediatric orthopedics and spinal deformity correction.',
    languages: ['English'], licenseNumber: 'OR002'
  },
  {
    firstName: 'Thomas', lastName: 'Clark', specialization: 'Orthopedics',
    experience: 20, rating: 4.9,
    bio: 'Senior orthopedic surgeon with expertise in trauma surgery and fracture care.',
    languages: ['English'], licenseNumber: 'OR003'
  },
  {
    firstName: 'Jessica', lastName: 'Lopez', specialization: 'Orthopedics',
    experience: 9, rating: 4.6,
    bio: 'Orthopedic specialist focused on hand and wrist surgery.',
    languages: ['English', 'Spanish'], licenseNumber: 'OR004'
  },

  // Gastroenterology
  {
    firstName: 'Brian', lastName: 'Moore', specialization: 'Gastroenterology',
    experience: 15, rating: 4.8,
    bio: 'Gastroenterologist specializing in inflammatory bowel disease and endoscopy.',
    languages: ['English'], licenseNumber: 'GS001'
  },
  {
    firstName: 'Catherine', lastName: 'Adams', specialization: 'Gastroenterology',
    experience: 12, rating: 4.7,
    bio: 'Expert in liver diseases, hepatitis treatment, and liver transplant evaluation.',
    languages: ['English'], licenseNumber: 'GS002'
  },
  {
    firstName: 'Richard', lastName: 'Turner', specialization: 'Gastroenterology',
    experience: 18, rating: 4.9,
    bio: 'Advanced endoscopist specializing in ERCP and pancreatic disorders.',
    languages: ['English'], licenseNumber: 'GS003'
  },
  {
    firstName: 'Laura', lastName: 'Hill', specialization: 'Gastroenterology',
    experience: 10, rating: 4.6,
    bio: 'Pediatric gastroenterologist focused on childhood digestive disorders.',
    languages: ['English'], licenseNumber: 'GS004'
  },

  // ENT
  {
    firstName: 'Andrew', lastName: 'Green', specialization: 'ENT',
    experience: 14, rating: 4.8,
    bio: 'ENT surgeon specializing in sinus surgery and rhinoplasty.',
    languages: ['English'], licenseNumber: 'ENT001'
  },
  {
    firstName: 'Michelle', lastName: 'Baker', specialization: 'ENT',
    experience: 11, rating: 4.7,
    bio: 'Pediatric ENT specialist with expertise in tonsillectomy and adenoidectomy.',
    languages: ['English'], licenseNumber: 'ENT002'
  },
  {
    firstName: 'Paul', lastName: 'Nelson', specialization: 'ENT',
    experience: 17, rating: 4.9,
    bio: 'Head and neck surgeon specializing in thyroid and parathyroid surgery.',
    languages: ['English'], licenseNumber: 'ENT003'
  },
  {
    firstName: 'Stephanie', lastName: 'Carter', specialization: 'ENT',
    experience: 8, rating: 4.6,
    bio: 'ENT specialist focused on hearing disorders and cochlear implants.',
    languages: ['English'], licenseNumber: 'ENT004'
  },

  // Ophthalmology
  {
    firstName: 'Jonathan', lastName: 'Phillips', specialization: 'Ophthalmology',
    experience: 16, rating: 4.8,
    bio: 'Ophthalmologist specializing in cataract and refractive surgery.',
    languages: ['English'], licenseNumber: 'OP001'
  },
  {
    firstName: 'Karen', lastName: 'Evans', specialization: 'Ophthalmology',
    experience: 13, rating: 4.7,
    bio: 'Retinal specialist expert in diabetic retinopathy and macular degeneration.',
    languages: ['English'], licenseNumber: 'OP002'
  },
  {
    firstName: 'Gregory', lastName: 'Roberts', specialization: 'Ophthalmology',
    experience: 19, rating: 4.9,
    bio: 'Pediatric ophthalmologist specializing in strabismus and amblyopia.',
    languages: ['English'], licenseNumber: 'OP003'
  },
  {
    firstName: 'Diana', lastName: 'Collins', specialization: 'Ophthalmology',
    experience: 10, rating: 4.6,
    bio: 'Glaucoma specialist with expertise in minimally invasive glaucoma surgery.',
    languages: ['English'], licenseNumber: 'OP004'
  },

  // Psychiatry
  {
    firstName: 'Matthew', lastName: 'Stewart', specialization: 'Psychiatry',
    experience: 15, rating: 4.8,
    bio: 'Psychiatrist specializing in anxiety disorders and cognitive behavioral therapy.',
    languages: ['English'], licenseNumber: 'PS001'
  },
  {
    firstName: 'Susan', lastName: 'Morris', specialization: 'Psychiatry',
    experience: 18, rating: 4.9,
    bio: 'Child and adolescent psychiatrist with expertise in ADHD and autism spectrum disorders.',
    languages: ['English'], licenseNumber: 'PS002'
  },
  {
    firstName: 'Joseph', lastName: 'Reed', specialization: 'Psychiatry',
    experience: 12, rating: 4.7,
    bio: 'Addiction psychiatrist specializing in substance abuse treatment and recovery.',
    languages: ['English'], licenseNumber: 'PS003'
  },
  {
    firstName: 'Elizabeth', lastName: 'Cook', specialization: 'Psychiatry',
    experience: 14, rating: 4.6,
    bio: 'Geriatric psychiatrist focused on dementia care and late-life depression.',
    languages: ['English'], licenseNumber: 'PS004'
  },

  // Pediatrics
  {
    firstName: 'William', lastName: 'Bailey', specialization: 'Pediatrics',
    experience: 13, rating: 4.8,
    bio: 'Board-certified pediatrician with expertise in newborn care and childhood development.',
    languages: ['English'], licenseNumber: 'PD001'
  },
  {
    firstName: 'Mary', lastName: 'Rivera', specialization: 'Pediatrics',
    experience: 16, rating: 4.9,
    bio: 'Pediatric infectious disease specialist with expertise in childhood immunizations.',
    languages: ['English', 'Spanish'], licenseNumber: 'PD002'
  },
  {
    firstName: 'Charles', lastName: 'Cooper', specialization: 'Pediatrics',
    experience: 11, rating: 4.7,
    bio: 'Pediatrician specializing in adolescent medicine and sports medicine.',
    languages: ['English'], licenseNumber: 'PD003'
  },
  {
    firstName: 'Linda', lastName: 'Richardson', specialization: 'Pediatrics',
    experience: 19, rating: 4.9,
    bio: 'Pediatric endocrinologist with expertise in childhood diabetes and growth disorders.',
    languages: ['English'], licenseNumber: 'PD004'
  },

  // Endocrinology
  {
    firstName: 'Anthony', lastName: 'Ward', specialization: 'Endocrinology',
    experience: 14, rating: 4.8,
    bio: 'Endocrinologist specializing in diabetes management and thyroid disorders.',
    languages: ['English'], licenseNumber: 'EN001'
  },
  {
    firstName: 'Barbara', lastName: 'Torres', specialization: 'Endocrinology',
    experience: 17, rating: 4.9,
    bio: 'Expert in reproductive endocrinology and hormone replacement therapy.',
    languages: ['English', 'Spanish'], licenseNumber: 'EN002'
  },
  {
    firstName: 'Donald', lastName: 'Peterson', specialization: 'Endocrinology',
    experience: 12, rating: 4.7,
    bio: 'Pediatric endocrinologist specializing in childhood growth and puberty disorders.',
    languages: ['English'], licenseNumber: 'EN003'
  },
  {
    firstName: 'Helen', lastName: 'Gray', specialization: 'Endocrinology',
    experience: 15, rating: 4.8,
    bio: 'Endocrinologist focused on metabolic disorders and obesity management.',
    languages: ['English'], licenseNumber: 'EN004'
  },

  // Oncology
  {
    firstName: 'Kenneth', lastName: 'Ramirez', specialization: 'Oncology',
    experience: 18, rating: 4.9,
    bio: 'Medical oncologist specializing in breast cancer and immunotherapy.',
    languages: ['English', 'Spanish'], licenseNumber: 'ON001'
  },
  {
    firstName: 'Dorothy', lastName: 'James', specialization: 'Oncology',
    experience: 16, rating: 4.8,
    bio: 'Radiation oncologist with expertise in stereotactic radiosurgery.',
    languages: ['English'], licenseNumber: 'ON002'
  },
  {
    firstName: 'Jason', lastName: 'Watson', specialization: 'Oncology',
    experience: 14, rating: 4.7,
    bio: 'Pediatric oncologist specializing in childhood leukemia and solid tumors.',
    languages: ['English'], licenseNumber: 'ON003'
  },
  {
    firstName: 'Nancy', lastName: 'Brooks', specialization: 'Oncology',
    experience: 20, rating: 4.9,
    bio: 'Surgical oncologist with expertise in gastrointestinal and hepatobiliary cancers.',
    languages: ['English'], licenseNumber: 'ON004'
  },

  // Pulmonology
  {
    firstName: 'Gary', lastName: 'Kelly', specialization: 'Pulmonology',
    experience: 15, rating: 4.8,
    bio: 'Pulmonologist specializing in asthma, COPD, and sleep disorders.',
    languages: ['English'], licenseNumber: 'PL001'
  },
  {
    firstName: 'Betty', lastName: 'Sanders', specialization: 'Pulmonology',
    experience: 13, rating: 4.7,
    bio: 'Expert in interventional pulmonology and lung cancer screening.',
    languages: ['English'], licenseNumber: 'PL002'
  },
  {
    firstName: 'Edward', lastName: 'Price', specialization: 'Pulmonology',
    experience: 17, rating: 4.9,
    bio: 'Critical care pulmonologist with expertise in mechanical ventilation.',
    languages: ['English'], licenseNumber: 'PL003'
  },
  {
    firstName: 'Sandra', lastName: 'Bennett', specialization: 'Pulmonology',
    experience: 11, rating: 4.6,
    bio: 'Pediatric pulmonologist specializing in cystic fibrosis and childhood asthma.',
    languages: ['English'], licenseNumber: 'PL004'
  },

  // Radiology
  {
    firstName: 'Ronald', lastName: 'Wood', specialization: 'Radiology',
    experience: 16, rating: 4.8,
    bio: 'Diagnostic radiologist specializing in musculoskeletal and emergency imaging.',
    languages: ['English'], licenseNumber: 'RD001'
  },
  {
    firstName: 'Lisa', lastName: 'Barnes', specialization: 'Radiology',
    experience: 14, rating: 4.7,
    bio: 'Interventional radiologist expert in minimally invasive procedures.',
    languages: ['English'], licenseNumber: 'RD002'
  },
  {
    firstName: 'Frank', lastName: 'Ross', specialization: 'Radiology',
    experience: 19, rating: 4.9,
    bio: 'Neuroradiologist specializing in brain and spine imaging.',
    languages: ['English'], licenseNumber: 'RD003'
  },
  {
    firstName: 'Carol', lastName: 'Henderson', specialization: 'Radiology',
    experience: 12, rating: 4.6,
    bio: 'Pediatric radiologist with expertise in childhood imaging and safety.',
    languages: ['English'], licenseNumber: 'RD004'
  },

  // Surgery
  {
    firstName: 'Raymond', lastName: 'Coleman', specialization: 'Surgery',
    experience: 20, rating: 4.9,
    bio: 'General surgeon specializing in laparoscopic and robotic surgery.',
    languages: ['English'], licenseNumber: 'SG001'
  },
  {
    firstName: 'Sharon', lastName: 'Jenkins', specialization: 'Surgery',
    experience: 17, rating: 4.8,
    bio: 'Trauma surgeon with expertise in emergency and critical care surgery.',
    languages: ['English'], licenseNumber: 'SG002'
  },
  {
    firstName: 'Jerry', lastName: 'Perry', specialization: 'Surgery',
    experience: 15, rating: 4.7,
    bio: 'Pediatric surgeon specializing in congenital anomalies and neonatal surgery.',
    languages: ['English'], licenseNumber: 'SG003'
  },
  {
    firstName: 'Deborah', lastName: 'Powell', specialization: 'Surgery',
    experience: 18, rating: 4.9,
    bio: 'Plastic and reconstructive surgeon with expertise in microsurgery.',
    languages: ['English'], licenseNumber: 'SG004'
  },

  // Urology
  {
    firstName: 'Dennis', lastName: 'Long', specialization: 'Urology',
    experience: 16, rating: 4.8,
    bio: 'Urologist specializing in kidney stones and minimally invasive procedures.',
    languages: ['English'], licenseNumber: 'UR001'
  },
  {
    firstName: 'Cynthia', lastName: 'Hughes', specialization: 'Urology',
    experience: 13, rating: 4.7,
    bio: 'Female urologist expert in pelvic floor disorders and incontinence.',
    languages: ['English'], licenseNumber: 'UR002'
  },
  {
    firstName: 'Peter', lastName: 'Flores', specialization: 'Urology',
    experience: 19, rating: 4.9,
    bio: 'Urologic oncologist specializing in prostate and bladder cancer.',
    languages: ['English', 'Spanish'], licenseNumber: 'UR003'
  },
  {
    firstName: 'Ruth', lastName: 'Washington', specialization: 'Urology',
    experience: 11, rating: 4.6,
    bio: 'Pediatric urologist with expertise in congenital urological conditions.',
    languages: ['English'], licenseNumber: 'UR004'
  },

  // Gynecology
  {
    firstName: 'Harold', lastName: 'Butler', specialization: 'Gynecology',
    experience: 18, rating: 4.8,
    bio: 'OB/GYN specializing in high-risk pregnancies and maternal-fetal medicine.',
    languages: ['English'], licenseNumber: 'GY001'
  },
  {
    firstName: 'Virginia', lastName: 'Simmons', specialization: 'Gynecology',
    experience: 15, rating: 4.9,
    bio: 'Gynecologic oncologist expert in ovarian and cervical cancer treatment.',
    languages: ['English'], licenseNumber: 'GY002'
  },
  {
    firstName: 'Arthur', lastName: 'Foster', specialization: 'Gynecology',
    experience: 14, rating: 4.7,
    bio: 'Reproductive endocrinologist specializing in fertility treatments and IVF.',
    languages: ['English'], licenseNumber: 'GY003'
  },
  {
    firstName: 'Frances', lastName: 'Gonzales', specialization: 'Gynecology',
    experience: 12, rating: 4.6,
    bio: 'Minimally invasive gynecologic surgeon specializing in endometriosis.',
    languages: ['English', 'Spanish'], licenseNumber: 'GY004'
  },

  // Emergency Medicine
  {
    firstName: 'Henry', lastName: 'Bryant', specialization: 'Emergency Medicine',
    experience: 12, rating: 4.8,
    bio: 'Emergency medicine physician with expertise in trauma and critical care.',
    languages: ['English'], licenseNumber: 'EM001'
  },
  {
    firstName: 'Marie', lastName: 'Alexander', specialization: 'Emergency Medicine',
    experience: 10, rating: 4.7,
    bio: 'Emergency physician specializing in pediatric emergency medicine.',
    languages: ['English'], licenseNumber: 'EM002'
  },
  {
    firstName: 'Wayne', lastName: 'Russell', specialization: 'Emergency Medicine',
    experience: 15, rating: 4.9,
    bio: 'Emergency medicine physician with expertise in toxicology and overdose management.',
    languages: ['English'], licenseNumber: 'EM003'
  },
  {
    firstName: 'Kathryn', lastName: 'Griffin', specialization: 'Emergency Medicine',
    experience: 8, rating: 4.6,
    bio: 'Emergency physician focused on emergency ultrasound and point-of-care testing.',
    languages: ['English'], licenseNumber: 'EM004'
  }
];

const defaultAvailability = {
  monday: { start: '09:00', end: '17:00', available: true },
  tuesday: { start: '09:00', end: '17:00', available: true },
  wednesday: { start: '09:00', end: '17:00', available: true },
  thursday: { start: '09:00', end: '17:00', available: true },
  friday: { start: '09:00', end: '17:00', available: true },
  saturday: { start: '09:00', end: '13:00', available: true },
  sunday: { start: '10:00', end: '14:00', available: false }
};

async function populateDoctors() {
  try {
    console.log('Starting to populate doctors...');

    // Clear existing doctors and users with doctor role
    await Doctor.deleteMany({});
    await User.deleteMany({ role: 'doctor' });
    console.log('Cleared existing doctor data');

    let createdCount = 0;

    for (const doctorData of doctorsData) {
      try {
        // Create user first
        const user = new User({
          email: `${doctorData.firstName.toLowerCase()}.${doctorData.lastName.toLowerCase()}@medibot.com`,
          password: 'password123', // This will be hashed automatically
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

        // Create doctor profile
        const doctor = new Doctor({
          userId: savedUser._id,
          licenseNumber: doctorData.licenseNumber,
          specialization: doctorData.specialization,
          experience: doctorData.experience,
          education: [
            {
              degree: 'MD',
              institution: 'Medical University',
              year: new Date().getFullYear() - doctorData.experience - 4
            },
            {
              degree: `${doctorData.specialization} Residency`,
              institution: 'Teaching Hospital',
              year: new Date().getFullYear() - doctorData.experience
            }
          ],
          certifications: [
            `Board Certified in ${doctorData.specialization}`,
            'Advanced Life Support (ALS)',
            'Basic Life Support (BLS)'
          ],
          languages: doctorData.languages,
          
          availability: defaultAvailability,
          rating: {
            average: doctorData.rating,
            count: Math.floor(Math.random() * 200) + 50 // Random review count between 50-250
          },
          bio: doctorData.bio,
          isVerified: true
        });

        await doctor.save();
        createdCount++;
        console.log(`Created doctor: Dr. ${doctorData.firstName} ${doctorData.lastName} (${doctorData.specialization})`);

      } catch (error) {
        console.error(`Error creating doctor ${doctorData.firstName} ${doctorData.lastName}:`, error.message);
      }
    }

    console.log(`\nSuccessfully created ${createdCount} doctors!`);
    
    // Display summary by specialization
    const specializations = await Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\nDoctors by specialization:');
    specializations.forEach(spec => {
      console.log(`${spec._id}: ${spec.count} doctors`);
    });

  } catch (error) {
    console.error('Error populating doctors:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
populateDoctors();
