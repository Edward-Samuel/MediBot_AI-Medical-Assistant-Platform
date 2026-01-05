import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import EmbeddedCalendar from '../../components/Calendar/EmbeddedCalendar';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const CalendarView = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    todayAppointments: 0,
    thisWeekAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAppointmentStats();
    }
  }, [user]);

  const fetchAppointmentStats = async () => {
    try {
      const token = localStorage.getItem('token');
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

        {/* Calendar Notice for Non-authenticated Users */}
        {!user && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Public Calendar View
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This shows available consultation slots. Log in to schedule consultations and see your personal schedule.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <EmbeddedCalendar
            height="700"
            showTitle={true}
            showNav={true}
            showDate={true}
            showTabs={true}
            mode="MONTH"
            className="w-full"
          />
        </div>

        {/* Calendar Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Real-time Updates
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Calendar automatically updates when new appointments are booked or cancelled through the system.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Multiple Views
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Switch between Month, Week, and Agenda views to see appointments in different formats.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Google Integration
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Appointments automatically sync with Google Calendar and include meeting links for virtual consultations.
            </p>
          </div>
        </div>

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