import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';

const GoogleCalendarConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedAt, setConnectedAt] = useState(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await axios.get('/api/auth/google/status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsConnected(response.data.connected);
      setConnectedAt(response.data.connectedAt);
    } catch (error) {
      console.error('Error checking calendar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await axios.get('/api/auth/google/calendar', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Open Google OAuth in new window
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      toast.error('Failed to connect to Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google Calendar?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      await axios.post('/api/auth/google/disconnect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsConnected(false);
      setConnectedAt(null);
      toast.success('Google Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Google Calendar Integration
          </h3>
        </div>
        {isConnected ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <XCircle className="h-6 w-6 text-gray-400" />
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Your Google Calendar is connected
            </p>
            {connectedAt && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Connected on {format(new Date(connectedAt), 'dd/MM/yy')}
              </p>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">With Google Calendar connected, you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Automatically add appointments to your calendar</li>
              <li>Get Google Meet links for virtual consultations</li>
              <li>Receive calendar notifications and reminders</li>
              <li>Share appointments with other attendees</li>
            </ul>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Disconnect Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Connect your Google Calendar to automatically sync appointments and get meeting links.
            </p>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">Benefits of connecting:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Automatic calendar event creation</li>
              <li>Google Meet integration for video calls</li>
              <li>Email notifications to all attendees</li>
              <li>Sync across all your devices</li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Connect Google Calendar</span>
            <ExternalLink className="h-4 w-4" />
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            You'll be redirected to Google to authorize calendar access
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarConnect;
