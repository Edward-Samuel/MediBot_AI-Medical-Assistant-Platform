import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import GoogleCalendarConnect from '../../components/Calendar/GoogleCalendarConnect';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';

const CalendarView = () => {
  const { user } = useAuth();
  const [connectedCalendarId, setConnectedCalendarId] = useState(null);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    todayAppointments: 0,
    thisWeekAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  const handleConnectionChange = (isConnected, calendarId) => {
    setIsCalendarConnected(isConnected);
    setConnectedCalendarId(calendarId);
  };

  useEffect(() => {
    if (user) {
      fetchAppointmentStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAppointmentStats = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get('/api/ai/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const appointments = response.data.appointments;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const stats = {
        totalAppointments: appointments.length,
        upcomingAppointments: appointments.filter(apt =>
          new Date(apt.dateTime) > now && apt.status !== 'cancelled'
        ).length,
        todayAppointments: appointments.filter(apt => {
          const aptDate = new Date(apt.dateTime);
          return aptDate >= today &&
            aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000) &&
            apt.status !== 'cancelled';
        }).length,
        thisWeekAppointments: appointments.filter(apt =>
          new Date(apt.dateTime) > now &&
          new Date(apt.dateTime) < weekFromNow &&
          apt.status !== 'cancelled'
        ).length
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, description }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Appointment Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all scheduled appointments and manage your calendar
          </p>
        </div>

        {/* Stats Cards */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Calendar}
              title="Total Appointments"
              value={loading ? "..." : stats.totalAppointments}
              color="bg-blue-500"
              description="All time"
            />
            <StatCard
              icon={Clock}
              title="Today's Appointments"
              value={loading ? "..." : stats.todayAppointments}
              color="bg-green-500"
              description="Scheduled for today"
            />
            <StatCard
              icon={TrendingUp}
              title="This Week"
              value={loading ? "..." : stats.thisWeekAppointments}
              color="bg-purple-500"
              description="Next 7 days"
            />
            <StatCard
              icon={Users}
              title="Upcoming"
              value={loading ? "..." : stats.upcomingAppointments}
              color="bg-orange-500"
              description="Future appointments"
            />
          </div>
        )}

        {/* Google Calendar Connection & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Google Calendar Connect Component */}
          <GoogleCalendarConnect onConnectionChange={handleConnectionChange} />

          {/* Info Cards */}
          <div className="space-y-6">
            {/* Debug Info - Remove this after testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow border border-blue-200 dark:border-blue-700 p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Debug Info:</h4>
                <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p>Connected: {isCalendarConnected ? 'Yes' : 'No'}</p>
                  <p>Calendar ID: {connectedCalendarId || 'Not set'}</p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Seamless Integration
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Connect your Google Calendar to automatically sync all your appointments. Get instant notifications and Google Meet links for your virtual consultations.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Smart Scheduling
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Use our AI Chatbot to find the perfect time slot. It checks doctor availability in real-time to prevent scheduling conflicts.
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Google Calendar */}
        {isCalendarConnected ? (
          connectedCalendarId ? (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Your Google Calendar
                    </h2>
                  </div>
                  <a
                    href="https://calendar.google.com/calendar/u/0/r"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Open in Google Calendar</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="relative w-full" style={{ height: '600px' }}>
                <iframe
                  src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(connectedCalendarId)}&mode=MONTH&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1&bgcolor=%23ffffff`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 0
                  }}
                  title="Google Calendar"
                  className="dark:invert dark:hue-rotate-180"
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  All appointments booked through MediBot will automatically appear in your calendar
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Calendar Connected but ID Not Available
                  </h3>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                    Your calendar is connected, but we couldn't retrieve the calendar ID. This might happen if:
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 ml-4 list-disc mb-3">
                    <li>The OAuth flow didn't complete properly</li>
                    <li>Your calendar privacy settings need adjustment</li>
                    <li>The connection was interrupted</li>
                  </ul>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Refresh Page
                  </button>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-3">
                    or try disconnecting and reconnecting your calendar
                  </span>
                </div>
              </div>
            </div>
          )
        ) : null}

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Ready to Book an Appointment?</h3>
              <p className="text-green-100">
                Use our AI assistant to find the right doctor and schedule your appointment instantly.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <a
                href="/chat"
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Book with AI
              </a>
              <a
                href="/doctors"
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors border border-green-400"
              >
                Browse Doctors
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;