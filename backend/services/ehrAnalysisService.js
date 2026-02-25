const EHR = require('../models/EHR');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

class EHRAnalysisService {
  
  // Get comprehensive holistic analysis of patient's health
  async getHolisticAnalysis(patientId) {
    try {
      const ehr = await EHR.findOne({ patientId, isActive: true })
        .populate('patientId');
      // Note: careTeam.providerId populate removed as it may not always have Doctor records

      if (!ehr) {
        throw new Error('EHR not found for patient');
      }

      const analysis = {
        patientInfo: this.getPatientInfo(ehr),
        currentHealthStatus: this.getCurrentHealthStatus(ehr),
        chronicConditions: this.getChronicConditions(ehr),
        activeMedications: this.getActiveMedications(ehr),
        recentVitals: this.getRecentVitals(ehr),
        criticalAlerts: this.getCriticalAlerts(ehr),
        riskAssessment: this.getRiskAssessment(ehr),
        preventiveCare: this.getPreventiveCareRecommendations(ehr),
        lifestyleFactors: this.getLifestyleFactors(ehr),
        careTeamSummary: this.getCareTeamSummary(ehr),
        recentLabResults: this.getRecentLabResults(ehr),
        upcomingNeeds: this.getUpcomingNeeds(ehr),
        healthTrends: this.getHealthTrends(ehr),
        summary: this.generateSummary(ehr)
      };

      return analysis;
    } catch (error) {
      console.error('Error in holistic analysis:', error);
      throw error;
    }
  }

  getPatientInfo(ehr) {
    const demographics = ehr.demographics || {};
    const age = demographics.dateOfBirth 
      ? Math.floor((new Date() - new Date(demographics.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return {
      age,
      gender: demographics.gender,
      occupation: demographics.occupation,
      dataCompleteness: ehr.dataCompleteness || 0
    };
  }

  getCurrentHealthStatus(ehr) {
    const activeDiagnoses = ehr.diagnoses?.filter(d => d.status === 'active' || d.status === 'chronic') || [];
    const activeAllergies = ehr.allergiesDetailed?.filter(a => a.status === 'active') || [];
    const activeMedications = ehr.prescriptions?.filter(p => p.status === 'active') || [];

    return {
      activeDiagnosesCount: activeDiagnoses.length,
      activeAllergiesCount: activeAllergies.length,
      activeMedicationsCount: activeMedications.length,
      lastVisit: this.getLastVisitDate(ehr),
      overallStatus: this.determineOverallStatus(ehr)
    };
  }

  getChronicConditions(ehr) {
    return ehr.diagnoses
      ?.filter(d => d.status === 'chronic' || d.status === 'active')
      .map(d => ({
        condition: d.condition,
        diagnosedDate: d.diagnosedDate,
        severity: d.severity,
        icdCode: d.icdCode,
        treatmentPlan: d.treatmentPlan
      })) || [];
  }

  getActiveMedications(ehr) {
    return ehr.prescriptions
      ?.filter(p => p.status === 'active')
      .map(p => ({
        medication: p.medicationName,
        dosage: p.dosage,
        frequency: p.frequency,
        prescribedBy: p.prescribedBy,
        startDate: p.startDate,
        reason: p.reason
      })) || [];
  }

  getRecentVitals(ehr) {
    const vitals = ehr.vitals || [];
    if (vitals.length === 0) return null;

    // Get most recent vital signs
    const recent = vitals.sort((a, b) => new Date(b.recordedDate) - new Date(a.recordedDate))[0];
    
    return {
      recordedDate: recent.recordedDate,
      bloodPressure: recent.bloodPressure,
      heartRate: recent.heartRate,
      temperature: recent.temperature,
      oxygenSaturation: recent.oxygenSaturation,
      weight: recent.weight,
      height: recent.height,
      bmi: recent.bmi,
      assessment: this.assessVitals(recent)
    };
  }

  assessVitals(vitals) {
    const concerns = [];
    
    if (vitals.bloodPressure) {
      if (vitals.bloodPressure.systolic > 140 || vitals.bloodPressure.diastolic > 90) {
        concerns.push('Elevated blood pressure');
      }
    }
    
    if (vitals.heartRate) {
      if (vitals.heartRate > 100) concerns.push('Elevated heart rate');
      if (vitals.heartRate < 60) concerns.push('Low heart rate');
    }
    
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 95) {
      concerns.push('Low oxygen saturation');
    }
    
    if (vitals.bmi) {
      if (vitals.bmi > 30) concerns.push('BMI indicates obesity');
      if (vitals.bmi < 18.5) concerns.push('BMI indicates underweight');
    }

    return concerns.length > 0 ? concerns : ['All vitals within normal range'];
  }

  getCriticalAlerts(ehr) {
    const alerts = [];

    // Check for life-threatening allergies
    const severeAllergies = ehr.allergiesDetailed?.filter(a => 
      a.severity === 'life_threatening' && a.status === 'active'
    ) || [];
    
    if (severeAllergies.length > 0) {
      alerts.push({
        type: 'allergy',
        severity: 'critical',
        message: `Life-threatening allergies: ${severeAllergies.map(a => a.allergen).join(', ')}`
      });
    }

    // Check for critical diagnoses
    const criticalDiagnoses = ehr.diagnoses?.filter(d => 
      d.severity === 'critical' && d.status === 'active'
    ) || [];
    
    if (criticalDiagnoses.length > 0) {
      alerts.push({
        type: 'diagnosis',
        severity: 'critical',
        message: `Critical conditions: ${criticalDiagnoses.map(d => d.condition).join(', ')}`
      });
    }

    // Check for abnormal lab results
    const recentAbnormalLabs = ehr.labResults
      ?.filter(lab => {
        const daysSince = (new Date() - new Date(lab.testDate)) / (1000 * 60 * 60 * 24);
        return daysSince <= 30 && lab.results?.some(r => r.status === 'critical');
      }) || [];
    
    if (recentAbnormalLabs.length > 0) {
      alerts.push({
        type: 'lab',
        severity: 'warning',
        message: `Recent critical lab results require attention`
      });
    }

    return alerts;
  }

  getRiskAssessment(ehr) {
    const risks = {
      cardiovascular: this.assessCardiovascularRisk(ehr),
      diabetes: this.assessDiabetesRisk(ehr),
      respiratory: this.assessRespiratoryRisk(ehr),
      overall: 'low'
    };

    // Determine overall risk
    const riskLevels = Object.values(risks).filter(r => typeof r === 'string');
    if (riskLevels.includes('high')) risks.overall = 'high';
    else if (riskLevels.includes('moderate')) risks.overall = 'moderate';

    return risks;
  }

  assessCardiovascularRisk(ehr) {
    let riskScore = 0;
    
    // Check vitals
    const recentVitals = ehr.vitals?.[ehr.vitals.length - 1];
    if (recentVitals?.bloodPressure?.systolic > 140) riskScore += 2;
    if (recentVitals?.bmi > 30) riskScore += 1;
    
    // Check smoking
    if (ehr.socialHistory?.smokingStatus === 'current') riskScore += 2;
    
    // Check family history
    const cvFamilyHistory = ehr.familyHistory?.some(f => 
      f.condition?.toLowerCase().includes('heart') || 
      f.condition?.toLowerCase().includes('stroke')
    );
    if (cvFamilyHistory) riskScore += 1;
    
    // Check diagnoses
    const cvDiagnoses = ehr.diagnoses?.some(d => 
      d.condition?.toLowerCase().includes('hypertension') ||
      d.condition?.toLowerCase().includes('cholesterol')
    );
    if (cvDiagnoses) riskScore += 2;

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'moderate';
    return 'low';
  }

  assessDiabetesRisk(ehr) {
    let riskScore = 0;
    
    const recentVitals = ehr.vitals?.[ehr.vitals.length - 1];
    if (recentVitals?.bmi > 30) riskScore += 2;
    
    const diabetesFamilyHistory = ehr.familyHistory?.some(f => 
      f.condition?.toLowerCase().includes('diabetes')
    );
    if (diabetesFamilyHistory) riskScore += 2;
    
    const prediabetes = ehr.diagnoses?.some(d => 
      d.condition?.toLowerCase().includes('prediabetes')
    );
    if (prediabetes) riskScore += 3;

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'moderate';
    return 'low';
  }

  assessRespiratoryRisk(ehr) {
    let riskScore = 0;
    
    if (ehr.socialHistory?.smokingStatus === 'current') riskScore += 3;
    if (ehr.socialHistory?.smokingStatus === 'former') riskScore += 1;
    
    const respiratoryDiagnoses = ehr.diagnoses?.some(d => 
      d.condition?.toLowerCase().includes('asthma') ||
      d.condition?.toLowerCase().includes('copd')
    );
    if (respiratoryDiagnoses) riskScore += 2;

    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'moderate';
    return 'low';
  }

  getPreventiveCareRecommendations(ehr) {
    const recommendations = [];
    const demographics = ehr.demographics || {};
    const age = demographics.dateOfBirth 
      ? Math.floor((new Date() - new Date(demographics.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    // Age-based screenings
    if (age >= 50) {
      recommendations.push({
        type: 'screening',
        recommendation: 'Colorectal cancer screening',
        frequency: 'Every 10 years or as recommended'
      });
    }

    if (age >= 40 && demographics.gender === 'female') {
      recommendations.push({
        type: 'screening',
        recommendation: 'Mammography',
        frequency: 'Annually or biennially'
      });
    }

    // Immunization recommendations
    if (age >= 65) {
      recommendations.push({
        type: 'immunization',
        recommendation: 'Pneumococcal vaccine',
        frequency: 'Once or as recommended'
      });
    }

    // Lifestyle recommendations
    if (ehr.socialHistory?.smokingStatus === 'current') {
      recommendations.push({
        type: 'lifestyle',
        recommendation: 'Smoking cessation program',
        priority: 'high'
      });
    }

    if (ehr.socialHistory?.exerciseFrequency === 'sedentary') {
      recommendations.push({
        type: 'lifestyle',
        recommendation: 'Increase physical activity to 150 minutes/week',
        priority: 'moderate'
      });
    }

    return recommendations;
  }

  getLifestyleFactors(ehr) {
    const social = ehr.socialHistory || {};
    
    return {
      smoking: {
        status: social.smokingStatus,
        details: social.smokingDetails
      },
      alcohol: {
        status: social.alcoholUse,
        details: social.alcoholDetails
      },
      exercise: social.exerciseFrequency,
      sleep: social.sleepHours ? `${social.sleepHours} hours/night` : 'Not recorded',
      stress: social.stressLevel,
      diet: social.diet || 'Not recorded'
    };
  }

  getCareTeamSummary(ehr) {
    return ehr.careTeam?.map(member => ({
      name: member.providerName,
      specialty: member.specialty,
      role: member.role,
      isPrimary: member.isPrimary
    })) || [];
  }

  getRecentLabResults(ehr) {
    const labs = ehr.labResults || [];
    const recentLabs = labs
      .filter(lab => {
        const daysSince = (new Date() - new Date(lab.testDate)) / (1000 * 60 * 60 * 24);
        return daysSince <= 90; // Last 90 days
      })
      .sort((a, b) => new Date(b.testDate) - new Date(a.testDate))
      .slice(0, 5);

    return recentLabs.map(lab => ({
      testDate: lab.testDate,
      testName: lab.testName,
      testType: lab.testType,
      abnormalResults: lab.results?.filter(r => r.status !== 'normal').length || 0,
      orderedBy: lab.orderedBy
    }));
  }

  getUpcomingNeeds(ehr) {
    const needs = [];

    // Check for follow-up appointments
    const recentNotes = ehr.clinicalNotes
      ?.filter(note => note.followUpDate && new Date(note.followUpDate) > new Date())
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

    if (recentNotes && recentNotes.length > 0) {
      needs.push({
        type: 'follow_up',
        description: 'Scheduled follow-up appointment',
        date: recentNotes[0].followUpDate
      });
    }

    // Check for medication refills
    const expiringMeds = ehr.prescriptions
      ?.filter(p => {
        if (p.status !== 'active' || !p.endDate) return false;
        const daysUntilExpiry = (new Date(p.endDate) - new Date()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      });

    if (expiringMeds && expiringMeds.length > 0) {
      needs.push({
        type: 'medication_refill',
        description: `${expiringMeds.length} medication(s) need refill soon`,
        medications: expiringMeds.map(m => m.medicationName)
      });
    }

    return needs;
  }

  getHealthTrends(ehr) {
    const trends = {};

    // Weight trend
    if (ehr.vitals && ehr.vitals.length >= 2) {
      const sortedVitals = [...ehr.vitals].sort((a, b) => 
        new Date(a.recordedDate) - new Date(b.recordedDate)
      );
      
      const weights = sortedVitals.filter(v => v.weight).map(v => v.weight);
      if (weights.length >= 2) {
        const weightChange = weights[weights.length - 1] - weights[0];
        trends.weight = {
          change: weightChange.toFixed(1),
          direction: weightChange > 0 ? 'increasing' : weightChange < 0 ? 'decreasing' : 'stable'
        };
      }

      // Blood pressure trend
      const bpReadings = sortedVitals.filter(v => v.bloodPressure?.systolic);
      if (bpReadings.length >= 2) {
        const avgRecent = bpReadings.slice(-3).reduce((sum, v) => sum + v.bloodPressure.systolic, 0) / Math.min(3, bpReadings.length);
        const avgOlder = bpReadings.slice(0, 3).reduce((sum, v) => sum + v.bloodPressure.systolic, 0) / Math.min(3, bpReadings.length);
        
        trends.bloodPressure = {
          average: avgRecent.toFixed(0),
          trend: avgRecent > avgOlder ? 'increasing' : avgRecent < avgOlder ? 'decreasing' : 'stable'
        };
      }
    }

    return trends;
  }

  getLastVisitDate(ehr) {
    const notes = ehr.clinicalNotes || [];
    if (notes.length === 0) return null;
    
    const sorted = notes.sort((a, b) => new Date(b.noteDate) - new Date(a.noteDate));
    return sorted[0].noteDate;
  }

  determineOverallStatus(ehr) {
    const criticalAlerts = this.getCriticalAlerts(ehr);
    
    if (criticalAlerts.some(a => a.severity === 'critical')) {
      return 'requires_attention';
    }
    
    const activeDiagnoses = ehr.diagnoses?.filter(d => 
      d.status === 'active' && d.severity === 'severe'
    ) || [];
    
    if (activeDiagnoses.length > 0) {
      return 'monitoring_required';
    }
    
    return 'stable';
  }

  generateSummary(ehr) {
    const demographics = ehr.demographics || {};
    const age = demographics.dateOfBirth 
      ? Math.floor((new Date() - new Date(demographics.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : 'unknown';
    
    const activeDiagnoses = ehr.diagnoses?.filter(d => d.status === 'active' || d.status === 'chronic') || [];
    const activeMeds = ehr.prescriptions?.filter(p => p.status === 'active') || [];
    const criticalAllergies = ehr.allergiesDetailed?.filter(a => 
      a.severity === 'life_threatening' && a.status === 'active'
    ) || [];

    let summary = `Patient is a ${age}-year-old ${demographics.gender || 'individual'}`;
    
    if (activeDiagnoses.length > 0) {
      summary += ` with ${activeDiagnoses.length} active condition(s): ${activeDiagnoses.slice(0, 3).map(d => d.condition).join(', ')}`;
    }
    
    if (activeMeds.length > 0) {
      summary += `. Currently on ${activeMeds.length} medication(s)`;
    }
    
    if (criticalAllergies.length > 0) {
      summary += `. CRITICAL: Life-threatening allergies to ${criticalAllergies.map(a => a.allergen).join(', ')}`;
    }
    
    const riskAssessment = this.getRiskAssessment(ehr);
    if (riskAssessment.overall === 'high') {
      summary += `. High-risk patient requiring close monitoring`;
    }

    return summary;
  }
}

module.exports = new EHRAnalysisService();
