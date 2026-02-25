const ehrAnalysisService = require('./ehrAnalysisService');
const Patient = require('../models/Patient');

class EHRContextService {
  
  /**
   * Get EHR context for AI chatbot
   * This prepares patient medical history as context for diagnosis
   */
  async getPatientContext(userId) {
    try {
      // Find patient profile
      const patient = await Patient.findOne({ userId });
      if (!patient) {
        return null; // User is not a patient or no profile exists
      }

      // Get holistic analysis
      const analysis = await ehrAnalysisService.getHolisticAnalysis(patient._id);
      
      // Build concise context for AI
      const context = this.buildConciseContext(analysis);
      
      return {
        hasEHR: true,
        patientId: patient._id,
        context,
        fullAnalysis: analysis // Include full analysis for detailed queries
      };
    } catch (error) {
      console.error('Error getting patient context:', error);
      return null;
    }
  }

  /**
   * Build concise context string for AI prompt
   */
  buildConciseContext(analysis) {
    const parts = [];

    // Patient demographics
    if (analysis.patientInfo) {
      parts.push(`PATIENT: ${analysis.patientInfo.age}yo ${analysis.patientInfo.gender}`);
    }

    // Active chronic conditions
    if (analysis.chronicConditions && analysis.chronicConditions.length > 0) {
      const conditions = analysis.chronicConditions
        .map(c => `${c.condition} (${c.severity})`)
        .join(', ');
      parts.push(`CHRONIC CONDITIONS: ${conditions}`);
    }

    // Active medications
    if (analysis.activeMedications && analysis.activeMedications.length > 0) {
      const meds = analysis.activeMedications
        .map(m => `${m.medication} ${m.dosage} ${m.frequency}`)
        .join('; ');
      parts.push(`CURRENT MEDICATIONS: ${meds}`);
    }

    // Critical allergies
    if (analysis.criticalAlerts && analysis.criticalAlerts.length > 0) {
      const allergies = analysis.criticalAlerts
        .filter(a => a.type === 'allergy')
        .map(a => a.message);
      if (allergies.length > 0) {
        parts.push(`⚠️ ALLERGIES: ${allergies.join('; ')}`);
      }
    }

    // Recent vitals
    if (analysis.recentVitals) {
      const vitals = [];
      if (analysis.recentVitals.bloodPressure) {
        vitals.push(`BP ${analysis.recentVitals.bloodPressure.systolic}/${analysis.recentVitals.bloodPressure.diastolic}`);
      }
      if (analysis.recentVitals.heartRate) {
        vitals.push(`HR ${analysis.recentVitals.heartRate}`);
      }
      if (analysis.recentVitals.bmi) {
        vitals.push(`BMI ${analysis.recentVitals.bmi}`);
      }
      if (vitals.length > 0) {
        parts.push(`RECENT VITALS: ${vitals.join(', ')}`);
      }
    }

    // Risk assessment
    if (analysis.riskAssessment) {
      const risks = [];
      if (analysis.riskAssessment.cardiovascular !== 'low') {
        risks.push(`CV: ${analysis.riskAssessment.cardiovascular}`);
      }
      if (analysis.riskAssessment.diabetes !== 'low') {
        risks.push(`DM: ${analysis.riskAssessment.diabetes}`);
      }
      if (analysis.riskAssessment.respiratory !== 'low') {
        risks.push(`Resp: ${analysis.riskAssessment.respiratory}`);
      }
      if (risks.length > 0) {
        parts.push(`RISK FACTORS: ${risks.join(', ')}`);
      }
    }

    // Lifestyle factors (important for recommendations)
    if (analysis.lifestyleFactors) {
      const lifestyle = [];
      if (analysis.lifestyleFactors.smoking?.status && analysis.lifestyleFactors.smoking.status !== 'never') {
        lifestyle.push(`Smoking: ${analysis.lifestyleFactors.smoking.status}`);
      }
      if (analysis.lifestyleFactors.alcohol?.status && analysis.lifestyleFactors.alcohol.status !== 'never') {
        lifestyle.push(`Alcohol: ${analysis.lifestyleFactors.alcohol.status}`);
      }
      if (analysis.lifestyleFactors.exercise) {
        lifestyle.push(`Exercise: ${analysis.lifestyleFactors.exercise}`);
      }
      if (lifestyle.length > 0) {
        parts.push(`LIFESTYLE: ${lifestyle.join(', ')}`);
      }
    }

    // Recent lab abnormalities
    if (analysis.recentLabResults && analysis.recentLabResults.length > 0) {
      const abnormalLabs = analysis.recentLabResults.filter(lab => lab.abnormalResults > 0);
      if (abnormalLabs.length > 0) {
        parts.push(`RECENT LABS: ${abnormalLabs.length} test(s) with abnormal results`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Build detailed context for specific medical queries
   */
  buildDetailedContext(analysis, focusArea = null) {
    let context = this.buildConciseContext(analysis);

    // Add more details based on focus area
    if (focusArea === 'medications' && analysis.activeMedications) {
      context += '\n\nDETAILED MEDICATION HISTORY:\n';
      analysis.activeMedications.forEach((med, index) => {
        context += `${index + 1}. ${med.medication} (${med.dosage})\n`;
        context += `   Frequency: ${med.frequency}\n`;
        context += `   Reason: ${med.reason || 'Not specified'}\n`;
        context += `   Prescribed by: ${med.prescribedBy || 'Unknown'}\n`;
      });
    }

    if (focusArea === 'allergies' && analysis.criticalAlerts) {
      const allergyAlerts = analysis.criticalAlerts.filter(a => a.type === 'allergy');
      if (allergyAlerts.length > 0) {
        context += '\n\nALLERGY DETAILS:\n';
        allergyAlerts.forEach((alert, index) => {
          context += `${index + 1}. ${alert.message}\n`;
        });
      }
    }

    if (focusArea === 'history' && analysis.chronicConditions) {
      context += '\n\nMEDICAL HISTORY:\n';
      analysis.chronicConditions.forEach((condition, index) => {
        context += `${index + 1}. ${condition.condition}\n`;
        context += `   Severity: ${condition.severity}\n`;
        context += `   Diagnosed: ${new Date(condition.diagnosedDate).toLocaleDateString()}\n`;
        if (condition.treatmentPlan) {
          context += `   Treatment: ${condition.treatmentPlan}\n`;
        }
      });
    }

    return context;
  }

  /**
   * Enhance AI prompt with patient context
   */
  enhancePromptWithContext(userMessage, patientContext, conversationHistory = []) {
    if (!patientContext || !patientContext.hasEHR) {
      return userMessage; // No EHR data available
    }

    // Build enhanced prompt
    const enhancedPrompt = `
PATIENT MEDICAL RECORD:
${patientContext.context}

PATIENT QUESTION: ${userMessage}

INSTRUCTIONS:
- Consider the patient's complete medical history when responding
- Check for drug interactions with current medications
- Be aware of documented allergies
- Consider risk factors in your recommendations
- Reference specific conditions or medications when relevant
- If prescribing or recommending medications, check against allergy list
- Provide personalized advice based on their health profile
- If the question is about their medical history, use the information above

Provide a helpful, personalized response:`;

    return enhancedPrompt;
  }

  /**
   * Check for medication interactions
   */
  checkMedicationInteractions(newMedication, currentMedications) {
    // This is a simplified version - in production, use a drug interaction database
    const interactions = [];
    
    // Common interaction patterns (simplified)
    const interactionPatterns = {
      'warfarin': ['aspirin', 'ibuprofen', 'naproxen'],
      'metformin': ['alcohol'],
      'lisinopril': ['potassium', 'nsaid'],
      'atorvastatin': ['grapefruit'],
      'levothyroxine': ['calcium', 'iron']
    };

    const newMedLower = newMedication.toLowerCase();
    
    currentMedications.forEach(med => {
      const currentMedLower = med.medication.toLowerCase();
      
      // Check if new medication has known interactions with current medications
      Object.entries(interactionPatterns).forEach(([drug, interactsWith]) => {
        if (newMedLower.includes(drug)) {
          interactsWith.forEach(interactingDrug => {
            if (currentMedLower.includes(interactingDrug)) {
              interactions.push({
                medication1: newMedication,
                medication2: med.medication,
                severity: 'moderate',
                description: `Potential interaction between ${newMedication} and ${med.medication}`
              });
            }
          });
        }
      });
    });

    return interactions;
  }

  /**
   * Check if medication is contraindicated due to allergies
   */
  checkAllergyContraindications(medication, allergies) {
    const contraindications = [];
    
    if (!allergies || allergies.length === 0) {
      return contraindications;
    }

    const medLower = medication.toLowerCase();
    
    allergies.forEach(allergy => {
      const allergyMessage = allergy.message.toLowerCase();
      
      // Check for direct matches or related medications
      if (allergyMessage.includes('penicillin') && 
          (medLower.includes('penicillin') || medLower.includes('amoxicillin') || medLower.includes('ampicillin'))) {
        contraindications.push({
          medication,
          allergy: allergy.message,
          severity: allergy.severity,
          warning: `CONTRAINDICATED: Patient has documented ${allergy.message}`
        });
      }
      
      // Add more allergy checks as needed
    });

    return contraindications;
  }

  /**
   * Generate safety warnings based on patient context
   */
  generateSafetyWarnings(patientContext, proposedTreatment) {
    const warnings = [];

    if (!patientContext || !patientContext.fullAnalysis) {
      return warnings;
    }

    const analysis = patientContext.fullAnalysis;

    // Check critical alerts
    if (analysis.criticalAlerts && analysis.criticalAlerts.length > 0) {
      analysis.criticalAlerts.forEach(alert => {
        if (alert.severity === 'critical') {
          warnings.push({
            type: 'critical',
            message: alert.message,
            source: 'EHR'
          });
        }
      });
    }

    // Check medication interactions if treatment involves medications
    if (proposedTreatment && analysis.activeMedications) {
      const interactions = this.checkMedicationInteractions(
        proposedTreatment,
        analysis.activeMedications
      );
      
      interactions.forEach(interaction => {
        warnings.push({
          type: 'interaction',
          message: interaction.description,
          severity: interaction.severity,
          source: 'Drug Interaction Check'
        });
      });

      // Check allergies
      const allergyAlerts = analysis.criticalAlerts?.filter(a => a.type === 'allergy') || [];
      const contraindications = this.checkAllergyContraindications(
        proposedTreatment,
        allergyAlerts
      );
      
      contraindications.forEach(contra => {
        warnings.push({
          type: 'allergy',
          message: contra.warning,
          severity: 'critical',
          source: 'Allergy Check'
        });
      });
    }

    return warnings;
  }

  /**
   * Format context for display in chat UI
   */
  formatContextForUI(patientContext) {
    if (!patientContext || !patientContext.hasEHR) {
      return null;
    }

    const analysis = patientContext.fullAnalysis;

    return {
      summary: {
        age: analysis.patientInfo?.age,
        gender: analysis.patientInfo?.gender,
        overallStatus: analysis.currentHealthStatus?.overallStatus
      },
      activeConditions: analysis.chronicConditions?.length || 0,
      activeMedications: analysis.activeMedications?.length || 0,
      criticalAlerts: analysis.criticalAlerts?.length || 0,
      riskLevel: analysis.riskAssessment?.overall,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = new EHRContextService();
