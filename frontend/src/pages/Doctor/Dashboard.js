import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../../config/axios';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/dateFormatter';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    today: 0,
    total: 0,
    pending: 0,
    rating: 0
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await axios.get('/api/appointments/my-appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allAppointments = response.data.appointments || [];
      
      setAppointments(allAppointments);
      
      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayAppointments = allAppointments.filter(apt => {
        const aptDate = new Date(apt.dateTime);
        return aptDate >= today && aptDate < tomorrow && 
               ['scheduled', 'confirmed'].includes(apt.status);
      }).length;
      
      const pending = allAppointments.filter(apt => 
        apt.status === 'scheduled' && new Date(apt.dateTime) > now
      ).length;
      
      setStats({ 
        today: todayAppointments, 
        total: allAppointments.length,
        pending,
        rating: 5.0 // This should come from doctor profile
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTodayAppointments = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.dateTime);
        return aptDate >= today && aptDate < tomorrow && 
               ['scheduled', 'confirmed'].includes(apt.status);
      })
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  };

  const getRecentPatients = () => {
    return appointments
      .filter(apt => apt.status === 'completed')
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 5);
  };

  const formatDate = (dateString) => {
    return formatDateTime(dateString);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const todayAppointments = getTodayAppointments();
  const recentPatients = getRecentPatients();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
            Welcome, Dr. {user?.profile?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
            Manage your schedule and patients
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Today's Appointments</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.today}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-400 dark:text-blue-600" />
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Patients</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.total}</p>
              </div>
              <Users className="h-12 w-12 text-purple-400 dark:text-purple-600" />
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Pending</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.pending}</p>
              </div>
              <Clock className="h-12 w-12 text-green-400 dark:text-green-600" />
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.rating.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-yellow-400 dark:text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Schedule</h2>
              {todayAppointments.length > 0 && (
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
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <Link
                    key={appointment._id}
                    to={`/appointments/${appointment._id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.patientId?.userId?.profile?.firstName} {appointment.patientId?.userId?.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {appointment.type || 'Consultation'}
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

          {/* Recent Patients */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Consultations</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No recent patient consultations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900 mr-3">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {appointment.patientId?.userId?.profile?.firstName} {appointment.patientId?.userId?.profile?.lastName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {appointment.type || 'Consultation'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(appointment.dateTime)}
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

export default DoctorDashboard;