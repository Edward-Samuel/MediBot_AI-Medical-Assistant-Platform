import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CalendarConnected = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');

    setSuccess(successParam === 'true');
    setError(errorParam);

    // Refresh auth context to get updated calendar status
    if (successParam === 'true') {
      checkAuth();
    }

    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate('/profile');
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {success ? (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Calendar Connected!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your Google Calendar has been successfully connected. You can now automatically sync appointments and get meeting links.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Go to Profile
              </button>
              <button
                onClick={() => navigate('/appointments/book')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Book an Appointment
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Redirecting to your profile in 3 seconds...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              We couldn't connect your Google Calendar.
            </p>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {decodeURIComponent(error)}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/profile')}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Profile</span>
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can try connecting again from your profile settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarConnected;
