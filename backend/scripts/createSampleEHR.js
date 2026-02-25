require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const EHR = require('../models/EHR');

async function createSampleEHR() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find patient1@medibot.com
    const user = await User.findOne({ email: 'patient1@medibot.com' });
    if (!user) {
      console.error('User patient1@medibot.com not found. Please create this user first.');
      process.exit(1);
    }

    console.log('Found user:', user.email);

    // Find or create patient profile
    let patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      patient = new Patient({
        userId: user._id,
        bloodType: 'A+',
        height: 175,
        weight: 78,
        preferredLanguage: 'English'
      });
      await patient.save();
      console.log('Created patient profile');
    }

    // Delete existing EHR if any
    await EHR.deleteMany({ patientId: patient._id });
    console.log('Cleared existing EHR data');

    // Create comprehensive EHR
    const ehr = new EHR({
      patientId: patient._id,
      userId: user._id,

      // Demographics
      demographics: {
        dateOfBirth: new Date('1985-06-15'),
        gender: 'male',
        ethnicity: 'Caucasian',
        maritalStatus: 'married',
        occupation: 'Software Engineer',
        address: {
          street: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'USA'
        }
      },

      // Vital Signs History
      vitals: [
        {
          recordedDate: new Date('2024-01-15'),
          bloodPressure: { systolic: 128, diastolic: 82 },
          heartRate: 72,
          temperature: 36.8,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          weight: 80,
          height: 175,
          bmi: 26.1,
          recordedBy: 'Dr. Smith',
          notes: 'Routine checkup'
        },
        {
          recordedDate: new Date('2024-06-20'),
          bloodPressure: { systolic: 125, diastolic: 80 },
          heartRate: 68,
          temperature: 36.7,
          respiratoryRate: 15,
          oxygenSaturation: 99,
          weight: 78,
          height: 175,
          bmi: 25.5,
          recordedBy: 'Dr. Smith',
          notes: 'Follow-up visit, weight loss progress'
        },
        {
          recordedDate: new Date('2024-12-10'),
          bloodPressure: { systolic: 122, diastolic: 78 },
          heartRate: 70,
          temperature: 36.9,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          weight: 77,
          height: 175,
          bmi: 25.1,
          recordedBy: 'Dr. Smith',
          notes: 'Annual physical exam'
        }
      ],

      // Lab Results
      labResults: [
        {
          testDate: new Date('2024-01-20'),
          testName: 'Complete Blood Count',
          testType: 'blood',
          results: [
            { parameter: 'WBC', value: '7.2', unit: 'K/uL', referenceRange: '4.5-11.0', status: 'normal' },
            { parameter: 'RBC', value: '5.1', unit: 'M/uL', referenceRange: '4.5-5.9', status: 'normal' },
            { parameter: 'Hemoglobin', value: '15.2', unit: 'g/dL', referenceRange: '13.5-17.5', status: 'normal' },
            { parameter: 'Platelets', value: '245', unit: 'K/uL', referenceRange: '150-400', status: 'normal' }
          ],
          orderedBy: 'Dr. Smith',
          performedAt: 'LabCorp',
          notes: 'All values within normal range'
        },
        {
          testDate: new Date('2024-01-20'),
          testName: 'Lipid Panel',
          testType: 'blood',
          results: [
            { parameter: 'Total Cholesterol', value: '210', unit: 'mg/dL', referenceRange: '<200', status: 'abnormal' },
            { parameter: 'LDL', value: '135', unit: 'mg/dL', referenceRange: '<100', status: 'abnormal' },
            { parameter: 'HDL', value: '52', unit: 'mg/dL', referenceRange: '>40', status: 'normal' },
            { parameter: 'Triglycerides', value: '115', unit: 'mg/dL', referenceRange: '<150', status: 'normal' }
          ],
          orderedBy: 'Dr. Smith',
          performedAt: 'LabCorp',
          notes: 'Elevated cholesterol and LDL - lifestyle modifications recommended'
        },
        {
          testDate: new Date('2024-06-25'),
          testName: 'Lipid Panel Follow-up',
          testType: 'blood',
          results: [
            { parameter: 'Total Cholesterol', value: '195', unit: 'mg/dL', referenceRange: '<200', status: 'normal' },
            { parameter: 'LDL', value: '118', unit: 'mg/dL', referenceRange: '<100', status: 'abnormal' },
            { parameter: 'HDL', value: '55', unit: 'mg/dL', referenceRange: '>40', status: 'normal' },
            { parameter: 'Triglycerides', value: '110', unit: 'mg/dL', referenceRange: '<150', status: 'normal' }
          ],
          orderedBy: 'Dr. Smith',
          performedAt: 'LabCorp',
          notes: 'Improvement noted with diet and exercise'
        }
      ],

      // Diagnoses
      diagnoses: [
        {
          diagnosisDate: new Date('2024-01-15'),
          condition: 'Hyperlipidemia',
          icdCode: 'E78.5',
          severity: 'moderate',
          status: 'chronic',
          diagnosedBy: 'Dr. Smith',
          notes: 'Elevated cholesterol levels',
          treatmentPlan: 'Lifestyle modifications: diet and exercise. Monitor lipid levels every 6 months.'
        },
        {
          diagnosisDate: new Date('2023-03-10'),
          condition: 'Seasonal Allergic Rhinitis',
          icdCode: 'J30.2',
          severity: 'mild',
          status: 'chronic',
          diagnosedBy: 'Dr. Johnson',
          notes: 'Spring and fall allergies',
          treatmentPlan: 'Antihistamines as needed during allergy season'
        },
        {
          diagnosisDate: new Date('2022-11-05'),
          condition: 'Lower Back Pain',
          icdCode: 'M54.5',
          severity: 'mild',
          status: 'resolved',
          diagnosedBy: 'Dr. Smith',
          notes: 'Resolved with physical therapy',
          treatmentPlan: 'Physical therapy completed. Core strengthening exercises recommended.'
        }
      ],

      // Procedures
      procedures: [
        {
          procedureDate: new Date('2023-08-15'),
          procedureName: 'Colonoscopy',
          procedureCode: '45378',
          performedBy: 'Dr. Williams',
          facility: 'SF Medical Center',
          outcome: 'Normal findings, no polyps detected',
          complications: 'None',
          notes: 'Routine screening. Next screening in 10 years.'
        }
      ],

      // Immunizations
      immunizations: [
        {
          vaccineName: 'Influenza Vaccine',
          vaccineCode: '141',
          administeredDate: new Date('2024-10-15'),
          doseNumber: 1,
          administeredBy: 'Nurse Johnson',
          lotNumber: 'FLU2024-A',
          expirationDate: new Date('2025-06-30'),
          site: 'Left deltoid',
          route: 'Intramuscular',
          reactions: 'None'
        },
        {
          vaccineName: 'Tdap (Tetanus, Diphtheria, Pertussis)',
          vaccineCode: '115',
          administeredDate: new Date('2022-05-10'),
          doseNumber: 1,
          administeredBy: 'Nurse Smith',
          lotNumber: 'TDAP2022-B',
          expirationDate: new Date('2024-12-31'),
          site: 'Right deltoid',
          route: 'Intramuscular',
          reactions: 'Mild soreness at injection site'
        },
        {
          vaccineName: 'COVID-19 Vaccine (Moderna)',
          vaccineCode: '207',
          administeredDate: new Date('2024-09-01'),
          doseNumber: 5,
          administeredBy: 'Pharmacist Lee',
          lotNumber: 'COVID2024-M',
          expirationDate: new Date('2025-03-31'),
          site: 'Left deltoid',
          route: 'Intramuscular',
          reactions: 'None'
        }
      ],

      // Family History
      familyHistory: [
        {
          relationship: 'father',
          condition: 'Coronary Artery Disease',
          ageOfOnset: 58,
          status: 'living',
          notes: 'Had stent placement at age 58'
        },
        {
          relationship: 'mother',
          condition: 'Type 2 Diabetes',
          ageOfOnset: 62,
          status: 'living',
          notes: 'Well controlled with medication'
        },
        {
          relationship: 'grandfather',
          condition: 'Stroke',
          ageOfOnset: 72,
          status: 'deceased',
          notes: 'Passed away at age 75'
        },
        {
          relationship: 'sibling',
          condition: 'Asthma',
          ageOfOnset: 12,
          status: 'living',
          notes: 'Childhood onset, well controlled'
        }
      ],

      // Social History
      socialHistory: {
        smokingStatus: 'never',
        alcoholUse: 'moderate',
        alcoholDetails: {
          drinksPerWeek: 4
        },
        drugUse: 'never',
        exerciseFrequency: 'moderate',
        diet: 'Mediterranean diet, low sodium',
        stressLevel: 'moderate',
        sleepHours: 7,
        occupation: 'Software Engineer',
        livingArrangement: 'Lives with spouse and two children'
      },

      // Clinical Notes
      clinicalNotes: [
        {
          noteDate: new Date('2024-12-10'),
          noteType: 'progress',
          chiefComplaint: 'Annual physical examination',
          historyOfPresentIllness: 'Patient presents for routine annual physical. Reports feeling well overall. Has been following diet and exercise recommendations. No new concerns.',
          physicalExamination: 'Vital signs stable. Heart: Regular rate and rhythm, no murmurs. Lungs: Clear to auscultation bilaterally. Abdomen: Soft, non-tender. Extremities: No edema.',
          assessment: '39-year-old male in good health. Hyperlipidemia improving with lifestyle modifications. Continue current management plan.',
          plan: 'Continue diet and exercise. Repeat lipid panel in 6 months. Schedule colonoscopy at age 45. Influenza vaccine administered today.',
          providerName: 'Dr. Smith',
          followUpDate: new Date('2025-06-10'),
          attachments: []
        },
        {
          noteDate: new Date('2024-06-20'),
          noteType: 'follow_up',
          chiefComplaint: 'Follow-up for hyperlipidemia',
          historyOfPresentIllness: 'Patient returns for follow-up of elevated cholesterol. Reports adherence to Mediterranean diet and exercising 4-5 times per week. Weight loss of 2 kg since last visit.',
          physicalExamination: 'BP 125/80, HR 68, Weight 78 kg. General appearance: Well-nourished, no acute distress.',
          assessment: 'Hyperlipidemia showing improvement with lifestyle modifications. Weight loss and improved lipid profile.',
          plan: 'Continue current lifestyle modifications. Repeat lipid panel in 6 months. Encouraged to maintain exercise routine.',
          providerName: 'Dr. Smith',
          followUpDate: new Date('2024-12-20'),
          attachments: []
        }
      ],

      // Prescriptions
      prescriptions: [
        {
          prescriptionDate: new Date('2024-03-15'),
          medicationName: 'Cetirizine',
          genericName: 'Cetirizine HCl',
          dosage: '10 mg',
          route: 'Oral',
          frequency: 'Once daily',
          duration: 'As needed during allergy season',
          quantity: 90,
          refills: 3,
          prescribedBy: 'Dr. Smith',
          pharmacy: 'CVS Pharmacy',
          startDate: new Date('2024-03-15'),
          status: 'active',
          reason: 'Seasonal allergic rhinitis',
          instructions: 'Take one tablet daily during allergy season or as needed for symptoms'
        },
        {
          prescriptionDate: new Date('2023-11-10'),
          medicationName: 'Ibuprofen',
          genericName: 'Ibuprofen',
          dosage: '400 mg',
          route: 'Oral',
          frequency: 'Every 6 hours as needed',
          duration: '2 weeks',
          quantity: 30,
          refills: 0,
          prescribedBy: 'Dr. Smith',
          pharmacy: 'Walgreens',
          startDate: new Date('2023-11-10'),
          endDate: new Date('2023-11-24'),
          status: 'completed',
          reason: 'Lower back pain',
          instructions: 'Take with food. Do not exceed 1200 mg in 24 hours'
        }
      ],

      // Allergies
      allergiesDetailed: [
        {
          allergen: 'Penicillin',
          allergenType: 'medication',
          reaction: 'Rash and hives',
          severity: 'moderate',
          onsetDate: new Date('2010-05-15'),
          verifiedBy: 'Dr. Johnson',
          status: 'active',
          notes: 'Developed rash within 24 hours of taking penicillin for strep throat'
        },
        {
          allergen: 'Pollen (grass, trees)',
          allergenType: 'environmental',
          reaction: 'Sneezing, runny nose, itchy eyes',
          severity: 'mild',
          onsetDate: new Date('2015-04-01'),
          verifiedBy: 'Dr. Smith',
          status: 'active',
          notes: 'Seasonal allergies, worse in spring and fall'
        }
      ],

      // Care Team
      careTeam: [
        {
          providerName: 'Dr. Robert Smith',
          specialty: 'Family Medicine',
          role: 'Primary Care Physician',
          isPrimary: true,
          startDate: new Date('2020-01-15')
        },
        {
          providerName: 'Dr. Emily Williams',
          specialty: 'Gastroenterology',
          role: 'Specialist',
          isPrimary: false,
          startDate: new Date('2023-07-01')
        }
      ],

      // Risk Factors
      riskFactors: [
        {
          factor: 'Family history of coronary artery disease',
          category: 'cardiovascular',
          severity: 'moderate',
          identifiedDate: new Date('2024-01-15'),
          notes: 'Father had CAD at age 58'
        },
        {
          factor: 'Family history of diabetes',
          category: 'diabetes',
          severity: 'moderate',
          identifiedDate: new Date('2024-01-15'),
          notes: 'Mother has Type 2 diabetes'
        },
        {
          factor: 'Elevated LDL cholesterol',
          category: 'cardiovascular',
          severity: 'moderate',
          identifiedDate: new Date('2024-01-20'),
          notes: 'Improving with lifestyle modifications'
        }
      ]
    });

    // Calculate completeness
    ehr.calculateCompleteness();

    await ehr.save();

    console.log('\nSample EHR created successfully for patient1@medibot.com');
    console.log(`Data completeness: ${ehr.dataCompleteness}%`);
    console.log(`\nEHR Summary:`);
    console.log(`- Vitals records: ${ehr.vitals.length}`);
    console.log(`- Lab results: ${ehr.labResults.length}`);
    console.log(`- Diagnoses: ${ehr.diagnoses.length}`);
    console.log(`- Prescriptions: ${ehr.prescriptions.length}`);
    console.log(`- Allergies: ${ehr.allergiesDetailed.length}`);
    console.log(`- Immunizations: ${ehr.immunizations.length}`);
    console.log(`- Family history entries: ${ehr.familyHistory.length}`);
    console.log(`- Clinical notes: ${ehr.clinicalNotes.length}`);
    console.log(`- Care team members: ${ehr.careTeam.length}`);
    console.log(`- Risk factors: ${ehr.riskFactors.length}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating sample EHR:', error);
    process.exit(1);
  }
}

createSampleEHR();
