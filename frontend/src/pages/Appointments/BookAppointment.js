import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, FileText } from 'lucide-react';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [symptoms, setSymptoms] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');

  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'follow-up', label: 'Follow-up Visit' },
    { value: 'routine-checkup', label: 'Routine Checkup' },
    { value: 'emergency', label: 'Emergency Consultation' }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle appointment booking
    console.log('Booking appointment:', {
      doctorId,
      selectedDate,
      selectedTime,
      appointmentType,
      symptoms,
      chiefComplaint
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule Consultation</h1>
            <p className="text-gray-600">Schedule your consultation with Dr. Sarah Johnson</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="input-field"
                required
              >
                {appointmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Select Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 text-sm border rounded-md transition-colors ${
                      selectedTime === time
                        ? 'border-medical-600 bg-medical-50 text-medical-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Chief Complaint
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Brief description of your main concern"
                className="input-field"
              />
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms (Optional)
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms in detail..."
                rows={4}
                className="input-field"
              />
            </div>

            {/* Appointment Summary */}
            {selectedDate && selectedTime && (
              <div className="bg-medical-50 p-4 rounded-lg">
                <h3 className="font-medium text-medical-800 mb-2">Appointment Summary</h3>
                <div className="text-sm text-medical-700 space-y-1">
                  <p>Date: {new Date(selectedDate).toLocaleDateString()}</p>
                  <p>Time: {selectedTime}</p>
                  <p>Type: {appointmentTypes.find(t => t.value === appointmentType)?.label}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="button"
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-medical"
                disabled={!selectedDate || !selectedTime}
              >
                Schedule Consultation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;