import React, { useState, useEffect } from 'react';
import { Calendar, MessageCircle, User, Clock, Plus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateFormatter';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/appointments/my-appointments');
      const allAppointments = response.data.appointments || [];
      
      setAppointments(allAppointments);
      
      // Calculate stats
      const now = new Date();
      const upcoming = allAppointments.filter(apt => 
        new Date(apt.dateTime) > now && 
        ['scheduled', 'confirmed'].includes(apt.status)
      ).length;
      
      const completed = allAppointments.filter(apt => 
        apt.status === 'completed'
      ).length;
      
      const cancelled = allAppointments.filter(apt => 
        apt.status === 'cancelled'
      ).length;
      
      setStats({ upcoming, completed, cancelled });
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments
      .filter(apt => 
        new Date(apt.dateTime) > now && 
        ['scheduled', 'confirmed'].includes(apt.status)
      )
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      .slice(0, 3);
  };

  const getRecentActivity = () => {
    return appointments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  };

  const formatDate = (dateString) => {
    return formatDateTime(dateString);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const upcomingAppointments = getUpcomingAppointments();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
            Welcome back, {user?.profile?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
            Manage your appointments and health information
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Upcoming</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.upcoming}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-400 dark:text-blue-600" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.completed}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-400 dark:text-green-600" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{appointments.length}</p>
              </div>
              <Clock className="h-12 w-12 text-purple-400 dark:text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-200">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/chat" className="flex items-center p-3 bg-medical-50 dark:bg-medical-900 rounded-lg hover:bg-medical-100 dark:hover:bg-medical-800 transition-colors">
                <MessageCircle className="h-5 w-5 text-medical-600 dark:text-medical-400 mr-3" />
                <span className="text-gray-900 dark:text-white">Chat with AI Assistant</span>
              </Link>
              <Link to="/doctors" className="flex items-center p-3 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors">
                <Plus className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3" />
                <span className="text-gray-900 dark:text-white">Book New Appointment</span>
              </Link>
              <Link to="/appointments/history" className="flex items-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="text-gray-900 dark:text-white">View All Appointments</span>
              </Link>
              <Link to="/profile" className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                <span className="text-gray-900 dark:text-white">Update Profile</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-200">
                Upcoming Appointments
              </h2>
              {upcomingAppointments.length > 0 && (
                <Link to="/appointments/history" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  View All
                </Link>
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">No upcoming appointments</p>
                <Link to="/doctors" className="text-primary-600 dark:text-primary-400 hover:underline text-sm mt-2 inline-block">
                  Book an appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <Link
                    key={appointment._id}
                    to={`/appointments/${appointment._id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Dr. {appointment.doctorId?.userId?.profile?.firstName} {appointment.doctorId?.userId?.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {appointment.doctorId?.specialization}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(appointment.dateTime)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-200">
              Recent Activity
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full ${getStatusColor(appointment.status)} mr-3`}>
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.status === 'completed' ? 'Completed appointment' : 
                           appointment.status === 'cancelled' ? 'Cancelled appointment' : 
                           'Booked appointment'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          with Dr. {appointment.doctorId?.userId?.profile?.firstName} {appointment.doctorId?.userId?.profile?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(appointment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;