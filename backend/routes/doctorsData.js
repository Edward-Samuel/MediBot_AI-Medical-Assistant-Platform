// Comprehensive doctors data for production setup
module.exports = [
  // General Medicine (4 doctors)
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

  // Cardiology (4 doctors)
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
    bio: 'Renowned cardiac surgeon with expertise in complex heart procedures.',
    languages: ['English', 'Hindi'], licenseNumber: 'CD003'
  },
  {
    firstName: 'Maria', lastName: 'Garcia', specialization: 'Cardiology',
    experience: 11, rating: 4.7,
    bio: 'Pediatric cardiologist specializing in congenital heart defects.',
    languages: ['English', 'Spanish'], licenseNumber: 'CD004'
  },

  // Dermatology (4 doctors)
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

  // Neurology (4 doctors)
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

  // Orthopedics (4 doctors)
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

  // Gastroenterology (3 doctors)
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

  // ENT (3 doctors)
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

  // Ophthalmology (3 doctors)
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

  // Psychiatry (3 doctors)
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

  // Pediatrics (3 doctors)
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

  // Endocrinology (3 doctors)
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

  // Oncology (3 doctors)
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

  // Pulmonology (3 doctors)
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

  // Radiology (2 doctors)
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

  // Surgery (3 doctors)
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

  // Urology (3 doctors)
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

  // Gynecology (3 doctors)
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

  // Emergency Medicine (3 doctors)
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
  }
];
