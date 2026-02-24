import React from 'react';
import { AlertCircle, Clock, Activity, Phone } from 'lucide-react';

const TriageAlert = ({ triageData }) => {
  if (!triageData) return null;

  const { level, icon, color, urgency, timeframe, confidence, summary, warnings, actions, isEmergency } = triageData;

  // Color schemes for different triage levels
  const colorSchemes = {
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-300 dark:border-red-700',
      text: 'text-red-800 dark:text-red-200',
      badge: 'bg-red-600 text-white',
      icon: 'text-red-600 dark:text-red-400'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-300 dark:border-orange-700',
      text: 'text-orange-800 dark:text-orange-200',
      badge: 'bg-orange-600 text-white',
      icon: 'text-orange-600 dark:text-orange-400'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-300 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-200',
      badge: 'bg-yellow-600 text-white',
      icon: 'text-yellow-600 dark:text-yellow-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-300 dark:border-green-700',
      text: 'text-green-800 dark:text-green-200',
      badge: 'bg-green-600 text-white',
      icon: 'text-green-600 dark:text-green-400'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.green;

  return (
    <div className={`mt-4 p-4 rounded-lg border-2 ${scheme.bg} ${scheme.border} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className={`font-bold text-lg ${scheme.text}`}>
              {level} Assessment
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {confidence}% confidence • AI-powered triage
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scheme.badge}`}>
          Priority {urgency}
        </span>
      </div>

      {/* Emergency Warning */}
      {isEmergency && (
        <div className="mb-3 p-3 bg-red-600 text-white rounded-lg flex items-start space-x-2 animate-pulse">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">MEDICAL EMERGENCY</p>
            <p className="text-sm">Call 911 or go to the nearest Emergency Room immediately</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-3">
        <p className={`text-sm ${scheme.text}`}>
          <strong>Assessment:</strong> {summary}
        </p>
      </div>

      {/* Timeframe */}
      <div className="flex items-center space-x-2 mb-3">
        <Clock className={`h-4 w-4 ${scheme.icon}`} />
        <span className={`text-sm font-medium ${scheme.text}`}>
          Recommended timeframe: {timeframe}
        </span>
      </div>

      {/* Red Flags / Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className={`h-4 w-4 ${scheme.icon}`} />
            <span className={`text-sm font-semibold ${scheme.text}`}>
              Concerning Symptoms:
            </span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className={`text-sm ${scheme.text}`}>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {actions && actions.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Phone className={`h-4 w-4 ${scheme.icon}`} />
            <span className={`text-sm font-semibold ${scheme.text}`}>
              Recommended Actions:
            </span>
          </div>
          <ul className="space-y-2">
            {actions.map((action, index) => (
              <li key={index} className={`text-sm ${scheme.text} flex items-start space-x-2`}>
                <span className="font-bold mt-0.5">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
          ⚕️ This is an AI-powered assessment and not a substitute for professional medical advice. 
          Always consult with a healthcare provider for proper diagnosis and treatment.
        </p>
      </div>
    </div>
  );
};

export default TriageAlert;
