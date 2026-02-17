import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertCircle, Loader } from 'lucide-react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/dateFormatter';

const RescheduleWidget = ({ appointment, onClose, onRescheduleComplete }) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  useEffect(() => {
    // Generate available slots when component mounts
    const slots = generateAvailableSlots();
    setAvailableSlots(slots);
    setIsLoadingSlots(false);
  }, []);

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

  const generateAvailableSlots = () => {
    const slots = [];
    const today = new Date();
    
    // Generate slots for next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Get the date string in local timezone (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const daySlots = {
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        slots: [
          { time: '09:00 AM', dateTime: `${dateString}T09:00:00` },
          { time: '10:30 AM', dateTime: `${dateString}T10:30:00` },
          { time: '12:00 PM', dateTime: `${dateString}T12:00:00` },
          { time: '02:00 PM', dateTime: `${dateString}T14:00:00` },
          { time: '03:30 PM', dateTime: `${dateString}T15:30:00` },
          { time: '05:00 PM', dateTime: `${dateString}T17:00:00` }
        ]
      };
      slots.push(daySlots);
    }
    
    return slots;
  };

  const handleSlotSelect = (daySlots, slot) => {
    setSelectedSlot({
      date: daySlots.date,
      dayName: daySlots.dayName,
      time: slot.time,
      dateTime: slot.dateTime
    });
  };

  const handleReschedule = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    // Convert local datetime string to proper Date object
    const newDateTime = new Date(selectedSlot.dateTime);
    
    // Validate future date
    if (newDateTime <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      
      const response = await axios.patch(
        `/api/appointments/${appointment._id}/reschedule`,
        { newDateTime: newDateTime.toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Appointment rescheduled successfully!');
      onRescheduleComplete(response.data);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const { date: currentDate, time: currentTime } = formatDateTime(appointment.dateTime);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reschedule Appointment
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select a new date and time for your appointment
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
        {/* Current Appointment Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Current Appointment
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                {appointment.doctorId?.name || 'Doctor'}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ({appointment.doctorId?.specialization || 'N/A'})
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{currentDate}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Time Slot Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select New Time Slot
          </h3>
          
          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading available slots...</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableSlots.map((daySlots) => (
                <div key={daySlots.date} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    {daySlots.dayName} - {formatDate(daySlots.date)}
                  </h5>
                  <div className="grid grid-cols-3 gap-2">
                    {daySlots.slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotSelect(daySlots, slot)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          selectedSlot?.dateTime === slot.dateTime
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Clock className="h-3 w-3 inline mr-1" />
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Slot Summary */}
        {selectedSlot && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Selected Time</h4>
            <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{selectedSlot.dayName}, {formatDate(selectedSlot.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-medium">{selectedSlot.time}</span>
              </div>
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Important</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your Google Calendar will be automatically updated</li>
                <li>Please ensure the doctor is available at the new time</li>
                <li>You'll receive a confirmation email</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleReschedule}
          disabled={!selectedSlot || loading}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Rescheduling...</span>
            </>
          ) : (
            <span>Confirm Reschedule</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default RescheduleWidget;
