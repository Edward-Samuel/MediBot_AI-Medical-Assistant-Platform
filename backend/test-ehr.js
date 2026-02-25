require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const EHR = require('./models/EHR');
const Doctor = require('./models/Doctor');
const ehrAnalysisService = require('./services/ehrAnalysisService');

async function testEHR() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find patient1@medibot.com
    const user = await User.findOne({ email: 'patient1@medibot.com' });
    if (!user) {
      console.error('User patient1@medibot.com not found');
      console.log('Please run: node scripts/createSampleEHR.js');
      process.exit(1);
    }

    console.log('Found user:', user.email);

    // Find patient profile
    const patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      console.error('Patient profile not found');
      process.exit(1);
    }

    console.log('Found patient profile\n');

    // Find EHR
    const ehr = await EHR.findOne({ patientId: patient._id, isActive: true });
    if (!ehr) {
      console.error('EHR not found');
      console.log('Please run: node scripts/createSampleEHR.js');
      process.exit(1);
    }

    console.log('Found EHR record');
    console.log(`   Data completeness: ${ehr.dataCompleteness}%`);
    console.log(`   Last updated: ${ehr.lastUpdated}\n`);

    // Display EHR summary
    console.log('EHR Data Summary:');
    console.log('─────────────────────────────────────');
    console.log(`   Demographics: ${ehr.demographics ? '✓' : '✗'}`);
    console.log(`   Vital signs: ${ehr.vitals?.length || 0} records`);
    console.log(`   Lab results: ${ehr.labResults?.length || 0} tests`);
    console.log(`   Diagnoses: ${ehr.diagnoses?.length || 0} conditions`);
    console.log(`   Prescriptions: ${ehr.prescriptions?.length || 0} medications`);
    console.log(`   Allergies: ${ehr.allergiesDetailed?.length || 0} allergies`);
    console.log(`   Immunizations: ${ehr.immunizations?.length || 0} vaccines`);
    console.log(`   Family history: ${ehr.familyHistory?.length || 0} entries`);
    console.log(`   Social history: ${ehr.socialHistory ? '✓' : '✗'}`);
    console.log(`   Clinical notes: ${ehr.clinicalNotes?.length || 0} notes`);
    console.log(`   Care team: ${ehr.careTeam?.length || 0} providers`);
    console.log(`   Risk factors: ${ehr.riskFactors?.length || 0} identified\n`);

    // Get holistic analysis
    console.log('Generating Holistic Health Analysis...\n');
    const analysis = await ehrAnalysisService.getHolisticAnalysis(patient._id);

    console.log('HOLISTIC HEALTH ANALYSIS');
    console.log('═════════════════════════════════════\n');

    // Patient Info
    console.log('Patient Information:');
    console.log(`   Age: ${analysis.patientInfo.age} years`);
    console.log(`   Gender: ${analysis.patientInfo.gender}`);
    console.log(`   Occupation: ${analysis.patientInfo.occupation}`);
    console.log(`   Data Completeness: ${analysis.patientInfo.dataCompleteness}%\n`);

    // Current Health Status
    console.log('Current Health Status:');
    console.log(`   Overall Status: ${analysis.currentHealthStatus.overallStatus.toUpperCase()}`);
    console.log(`   Active Diagnoses: ${analysis.currentHealthStatus.activeDiagnosesCount}`);
    console.log(`   Active Medications: ${analysis.currentHealthStatus.activeMedicationsCount}`);
    console.log(`   Active Allergies: ${analysis.currentHealthStatus.activeAllergiesCount}`);
    console.log(`   Last Visit: ${analysis.currentHealthStatus.lastVisit ? new Date(analysis.currentHealthStatus.lastVisit).toLocaleDateString() : 'N/A'}\n`);

    // Chronic Conditions
    if (analysis.chronicConditions.length > 0) {
      console.log('Chronic Conditions:');
      analysis.chronicConditions.forEach((condition, index) => {
        console.log(`   ${index + 1}. ${condition.condition} (${condition.severity})`);
        console.log(`      ICD-10: ${condition.icdCode || 'N/A'}`);
        console.log(`      Diagnosed: ${new Date(condition.diagnosedDate).toLocaleDateString()}`);
      });
      console.log();
    }

    // Active Medications
    if (analysis.activeMedications.length > 0) {
      console.log('Active Medications:');
      analysis.activeMedications.forEach((med, index) => {
        console.log(`   ${index + 1}. ${med.medication} - ${med.dosage}`);
        console.log(`      Frequency: ${med.frequency}`);
        console.log(`      Reason: ${med.reason || 'N/A'}`);
      });
      console.log();
    }

    // Recent Vitals
    if (analysis.recentVitals) {
      console.log('Recent Vital Signs:');
      console.log(`   Date: ${new Date(analysis.recentVitals.recordedDate).toLocaleDateString()}`);
      if (analysis.recentVitals.bloodPressure) {
        console.log(`   Blood Pressure: ${analysis.recentVitals.bloodPressure.systolic}/${analysis.recentVitals.bloodPressure.diastolic} mmHg`);
      }
      console.log(`   Heart Rate: ${analysis.recentVitals.heartRate || 'N/A'} bpm`);
      console.log(`   Temperature: ${analysis.recentVitals.temperature || 'N/A'}°C`);
      console.log(`   O2 Saturation: ${analysis.recentVitals.oxygenSaturation || 'N/A'}%`);
      console.log(`   BMI: ${analysis.recentVitals.bmi || 'N/A'}`);
      console.log(`   Assessment: ${analysis.recentVitals.assessment.join(', ')}\n`);
    }

    // Critical Alerts
    if (analysis.criticalAlerts.length > 0) {
      console.log('CRITICAL ALERTS:');
      analysis.criticalAlerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. [${alert.severity.toUpperCase()}] ${alert.message}`);
      });
      console.log();
    }

    // Risk Assessment
    console.log('Risk Assessment:');
    console.log(`   Overall Risk: ${analysis.riskAssessment.overall.toUpperCase()}`);
    console.log(`   Cardiovascular: ${analysis.riskAssessment.cardiovascular}`);
    console.log(`   Diabetes: ${analysis.riskAssessment.diabetes}`);
    console.log(`   Respiratory: ${analysis.riskAssessment.respiratory}\n`);

    // Lifestyle Factors
    console.log('Lifestyle Factors:');
    console.log(`   Smoking: ${analysis.lifestyleFactors.smoking.status || 'N/A'}`);
    console.log(`   Alcohol: ${analysis.lifestyleFactors.alcohol.status || 'N/A'}`);
    console.log(`   Exercise: ${analysis.lifestyleFactors.exercise || 'N/A'}`);
    console.log(`   Sleep: ${analysis.lifestyleFactors.sleep}`);
    console.log(`   Stress: ${analysis.lifestyleFactors.stress || 'N/A'}\n`);

    // Health Trends
    if (Object.keys(analysis.healthTrends).length > 0) {
      console.log('Health Trends:');
      if (analysis.healthTrends.weight) {
        console.log(`   Weight: ${analysis.healthTrends.weight.direction} (${analysis.healthTrends.weight.change > 0 ? '+' : ''}${analysis.healthTrends.weight.change} kg)`);
      }
      if (analysis.healthTrends.bloodPressure) {
        console.log(`   Blood Pressure: ${analysis.healthTrends.bloodPressure.trend} (avg: ${analysis.healthTrends.bloodPressure.average} mmHg)`);
      }
      console.log();
    }

    // Preventive Care
    if (analysis.preventiveCare.length > 0) {
      console.log('Preventive Care Recommendations:');
      analysis.preventiveCare.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.type}] ${rec.recommendation}`);
        if (rec.frequency) console.log(`      Frequency: ${rec.frequency}`);
        if (rec.priority) console.log(`      Priority: ${rec.priority}`);
      });
      console.log();
    }

    // Upcoming Needs
    if (analysis.upcomingNeeds.length > 0) {
      console.log('Upcoming Needs:');
      analysis.upcomingNeeds.forEach((need, index) => {
        console.log(`   ${index + 1}. ${need.description}`);
        if (need.date) console.log(`      Date: ${new Date(need.date).toLocaleDateString()}`);
        if (need.medications) console.log(`      Medications: ${need.medications.join(', ')}`);
      });
      console.log();
    }

    // Care Team
    if (analysis.careTeamSummary.length > 0) {
      console.log('Care Team:');
      analysis.careTeamSummary.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.name} - ${member.specialty}`);
        console.log(`      Role: ${member.role}${member.isPrimary ? ' (Primary)' : ''}`);
      });
      console.log();
    }

    // Summary
    console.log('Summary:');
    console.log(`   ${analysis.summary}\n`);

    console.log('═════════════════════════════════════');
    console.log('EHR Test Completed Successfully!\n');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error testing EHR:', error);
    process.exit(1);
  }
}

testEHR();
