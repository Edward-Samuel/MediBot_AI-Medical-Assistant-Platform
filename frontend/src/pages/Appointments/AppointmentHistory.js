import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, Eye, X, CheckCircle, AlertCircle, Video } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const AppointmentHistory = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/ai/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointment history');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setCancelling(appointmentId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/ai/appointments/${appointmentId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the appointment in the list
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' }
          : apt
      ));
      
      toast.success('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel appointment';
      toast.error(errorMessage);
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.dateTime);
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return appointmentDate > now && appointment.status !== 'cancelled';
      case 'past':
        return appointmentDate < now || appointment.status === 'completed';
      case 'cancelled':
        return appointment.status === 'cancelled';
      default:
        return true;
    }
  });

  const canCancelAppointment = (appointment) => {
    const appointmentTime = new Date(appointment.dateTime);
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return appointment.status === 'scheduled' && hoursDiff >= 24;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading appointments...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Appointments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your appointment history
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Appointments', count: appointments.length },
                { key: 'upcoming', label: 'Upcoming', count: appointments.filter(a => new Date(a.dateTime) > new Date() && a.status !== 'cancelled').length },
                { key: 'past', label: 'Past', count: appointments.filter(a => new Date(a.dateTime) < new Date() || a.status === 'completed').length },
                { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? "You haven't booked any appointments yet."
                : `No ${filter} appointments found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {appointment.doctorName}
                      </h3>
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {appointment.specialization}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1 capitalize">{appointment.status}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {new Date(appointment.dateTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {new Date(appointment.dateTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm capitalize">{appointment.type}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="text-sm font-medium">
                      Free Consultation
                    </span>
                  </div>
                </div>

                {appointment.chiefComplaint && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Chief Complaint:</strong> {appointment.chiefComplaint}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Booked on {new Date(appointment.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetails(true);
                      }}
                      className="flex items-center px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    
                    {appointment.calendarEventLink && (
                      <a
                        href={appointment.calendarEventLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Calendar
                      </a>
                    )}
                    
                    {appointment.meetingLink && (
                      <a
                        href={appointment.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Join Meeting
                      </a>
                    )}
                    
                    {canCancelAppointment(appointment) && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        disabled={cancelling === appointment.id}
                        className="flex items-center px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancelling === appointment.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Appointment Details Modal */}
        {showDetails && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Appointment Details
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Doctor Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Doctor</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedAppointment.doctorName}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {selectedAppointment.specialization}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Appointment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedAppointment.dateTime).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {selectedAppointment.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                          {getStatusIcon(selectedAppointment.status)}
                          <span className="ml-1 capitalize">{selectedAppointment.status}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Free Consultation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Info */}
                  {(selectedAppointment.chiefComplaint || selectedAppointment.symptoms?.length > 0) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Medical Information</h3>
                      {selectedAppointment.chiefComplaint && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Chief Complaint</p>
                          <p className="text-gray-900 dark:text-white">{selectedAppointment.chiefComplaint}</p>
                        </div>
                      )}
                      {selectedAppointment.symptoms?.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Symptoms</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedAppointment.symptoms.map((symptom, index) => (
                              <span key={index} className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-sm">
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes and Diagnosis */}
                  {(selectedAppointment.notes || selectedAppointment.diagnosis) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Clinical Notes</h3>
                      {selectedAppointment.diagnosis && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Diagnosis</p>
                          <p className="text-gray-900 dark:text-white">{selectedAppointment.diagnosis}</p>
                        </div>
                      )}
                      {selectedAppointment.notes && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                          <p className="text-gray-900 dark:text-white">{selectedAppointment.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentHistory;