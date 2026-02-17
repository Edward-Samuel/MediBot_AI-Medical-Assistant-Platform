import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertCircle, Loader } from 'lucide-react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';

const AppointmentSelectionWidget = ({ 
  appointmentData, 
  onClose, 
  onConfirm,
  mode = 'reschedule' // 'reschedule' or 'cancel'
}) => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

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

      // Filter only upcoming appointments that can be rescheduled/cancelled
      const upcomingAppointments = response.data.appointments.filter(apt => 
        ['scheduled', 'confirmed'].includes(apt.status) && 
        new Date(apt.dateTime) > new Date()
      );

      setAppointments(upcomingAppointments);

      // Auto-select if only one appointment or if appointment is specified
      if (appointmentData?.findResult?.appointment) {
        setSelectedAppointment(appointmentData.findResult.appointment);
      } else if (upcomingAppointments.length === 1) {
        setSelectedAppointment(upcomingAppointments[0]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedAppointment) {
      toast.error('Please select an appointment');
      return;
    }

    setConfirming(true);
    try {
      if (mode === 'cancel') {
        // Cancel the appointment
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const response = await axios.delete(
          `/api/appointments/${selectedAppointment._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success('Appointment cancelled successfully!');
        onConfirm(response.data);
      } else {
        // For reschedule, pass the selected appointment to parent
        onConfirm(selectedAppointment);
      }
    } catch (error) {
      console.error(`Error ${mode}ing appointment:`, error);
      toast.error(error.response?.data?.message || `Failed to ${mode} appointment`);
    } finally {
      setConfirming(false);
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'cancel' ? 'Cancel Appointment' : 'Select Appointment to Reschedule'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === 'cancel' 
              ? 'Choose the appointment you want to cancel'
              : 'Choose the appointment you want to reschedule'
            }
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading appointments...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No upcoming appointments found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.dateTime);
              const isSelected = selectedAppointment?._id === appointment._id;

              return (
                <div
                  key={appointment._id}
                  onClick={() => setSelectedAppointment(appointment)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {appointment.doctorId?.name || 'Doctor'}
                        </h3>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Specialization:</span>
                          <span>{appointment.doctorId?.specialization || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{date}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{time}</span>
                        </div>

                        {appointment.type && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Type:</span>
                            <span className="capitalize">{appointment.type.replace('-', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="ml-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Warning for cancellation */}
        {mode === 'cancel' && selectedAppointment && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Are you sure?</p>
                <p>This action cannot be undone. The appointment will be cancelled and removed from your calendar.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          disabled={confirming}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedAppointment || confirming || loading}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            mode === 'cancel'
              ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700'
              : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700'
          } disabled:cursor-not-allowed`}
        >
          {confirming ? (
            <span className="flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </span>
          ) : mode === 'cancel' ? (
            'Cancel Appointment'
          ) : (
            'Continue to Reschedule'
          )}
        </button>
      </div>
    </div>
  );
};

export default AppointmentSelectionWidget;
