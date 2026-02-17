import React, { useState } from 'react';
import { Clock, User, CheckCircle, X } from 'lucide-react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';
import { SPECIALIZATIONS } from '../../constants/specializations';
import { formatDateTime, formatDate } from '../../utils/dateFormatter';

const AppointmentBookingWidget = ({ appointmentData, onClose, onBookingComplete }) => {
  const [selectedDoctor, setSelectedDoctor] = useState(appointmentData?.doctors?.[0] || null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [step, setStep] = useState('mode'); // 'mode', 'specialization', 'symptoms', 'doctors', 'slots'
  const [bookingMode, setBookingMode] = useState(null); // 'manual' or 'ai'
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const handleSpecializationSelect = async (specialization) => {
    setSelectedSpecialization(specialization);
    setIsLoadingDoctors(true);
    
    try {
      // Directly fetch doctors by specialization
      const response = await axios.get(`/api/doctors?specialization=${encodeURIComponent(specialization)}&limit=10`);

      if (response.data.doctors && response.data.doctors.length > 0) {
        setDoctors(response.data.doctors);
        const mockSlots = generateMockSlots();
        setAvailableSlots(mockSlots);
        setStep('doctors');
      } else {
        toast.error('No doctors found for this specialization');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleSymptomAnalysis = async () => {
    if (!symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }

    setIsLoadingDoctors(true);
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.post('/api/ai/recommend-doctor', {
        symptoms: [symptoms],
        age: 30,
        gender: 'not specified',
        urgency: 'normal'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.recommendations && response.data.recommendations.length > 0) {
        const analysis = response.data.analysis;
        setAiAnalysis(analysis);
        setSelectedSpecialization(analysis.primarySpecialization);
        
        // Filter doctors to only show primary specialization
        const primaryDoctors = response.data.recommendations.filter(
          doctor => doctor.specialization === analysis.primarySpecialization
        );
        
        if (primaryDoctors.length > 0) {
          setDoctors(primaryDoctors);
          const mockSlots = generateMockSlots();
          setAvailableSlots(mockSlots);
          setStep('doctors');
        } else {
          // If no doctors for primary, show all recommendations
          setDoctors(response.data.recommendations);
          const mockSlots = generateMockSlots();
          setAvailableSlots(mockSlots);
          setStep('doctors');
          toast.info(`Showing doctors from related specializations`);
        }
      } else {
        toast.error('No doctors found for your symptoms');
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      toast.error('Failed to analyze symptoms');
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const generateMockSlots = () => {
    const slots = [];
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
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
          { time: '09:00 AM', dateTime: `${dateString}T09:00:00`, preferred: i === 1 },
          { time: '10:30 AM', dateTime: `${dateString}T10:30:00`, preferred: false },
          { time: '02:00 PM', dateTime: `${dateString}T14:00:00`, preferred: false },
          { time: '03:30 PM', dateTime: `${dateString}T15:30:00`, preferred: false },
          { time: '05:00 PM', dateTime: `${dateString}T17:00:00`, preferred: false },
          { time: '06:30 PM', dateTime: `${dateString}T18:30:00`, preferred: false }
        ]
      };
      slots.push(daySlots);
    }
    
    return slots;
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setStep('slots');
  };

  const handleSlotSelect = (daySlots, slot) => {
    setSelectedSlot({
      date: daySlots.date,
      dayName: daySlots.dayName,
      time: slot.time,
      dateTime: slot.dateTime
    });
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) {
      toast.error('Please select a doctor and time slot');
      return;
    }

    setIsBooking(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      // Get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Convert local datetime string to proper Date object
      // selectedSlot.dateTime is in format "YYYY-MM-DDTHH:MM:SS"
      const localDateTime = new Date(selectedSlot.dateTime);
      
      const response = await axios.post('/api/ai/book-appointment', {
        doctorId: selectedDoctor.id,
        dateTime: localDateTime.toISOString(), // Send as ISO string
        timezone: userTimezone, // Send user's timezone
        appointmentData: {
          appointmentType: 'consultation',
          symptoms: [],
          chiefComplaint: `Appointment booked via chat for ${selectedSpecialization}`
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookedAppointment(response.data.appointment);
      setBookingComplete(true);
      toast.success('Appointment booked successfully!');
      
      if (onBookingComplete) {
        onBookingComplete(response.data.appointment);
      }

    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to schedule consultation';
      toast.error(errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  if (bookingComplete && bookedAppointment) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Appointment Confirmed!
          </h3>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
            <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
              <p><strong>Doctor:</strong> {bookedAppointment.doctorName}</p>
              <p><strong>Specialization:</strong> {bookedAppointment.specialization}</p>
              <p><strong>Date & Time:</strong> {formatDateTime(bookedAppointment.dateTime)}</p>
              <p><strong>Type:</strong> {bookedAppointment.type}</p>
              <p><strong>Fee:</strong> ${bookedAppointment.fee.total}</p>
              {bookedAppointment.calendarEventLink && (
                <p>
                  <strong>Calendar:</strong>{' '}
                  <a 
                    href={bookedAppointment.calendarEventLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View in Google Calendar
                  </a>
                </p>
              )}
              {bookedAppointment.meetingLink && (
                <p>
                  <strong>Meeting:</strong>{' '}
                  <a 
                    href={bookedAppointment.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Join Google Meet
                  </a>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Schedule Consultation
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Mode Selection */}
        {step === 'mode' && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">How would you like to find a doctor?</h4>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setBookingMode('ai');
                  setStep('symptoms');
                }}
                className="p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  Describe Your Symptoms
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tell us what you're experiencing and we'll recommend the right specialist
                </div>
              </button>
              <button
                onClick={() => {
                  setBookingMode('manual');
                  setStep('specialization');
                }}
                className="p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  Choose Specialization
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  I know which type of doctor I need
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Symptom Input */}
        {step === 'symptoms' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Describe Your Symptoms</h4>
              <button
                onClick={() => setStep('mode')}
                className="text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                Back
              </button>
            </div>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Example: I have chest pain and shortness of breath..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[120px]"
            />
            <button
              onClick={handleSymptomAnalysis}
              disabled={isLoadingDoctors || !symptoms.trim()}
              className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {isLoadingDoctors ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </div>
              ) : (
                'Find Recommended Doctors'
              )}
            </button>
          </div>
        )}

        {/* Specialization Selection */}
        {step === 'specialization' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Select Medical Specialization</h4>
              <button
                onClick={() => setStep('mode')}
                className="text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                Back
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SPECIALIZATIONS.map((specialization) => (
                <button
                  key={specialization}
                  onClick={() => handleSpecializationSelect(specialization)}
                  disabled={isLoadingDoctors}
                  className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {specialization}
                  </div>
                </button>
              ))}
            </div>
            {isLoadingDoctors && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading doctors...</span>
              </div>
            )}
          </div>
        )}

        {/* Doctor Selection */}
        {step === 'doctors' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {aiAnalysis ? `Recommended Doctors - ${selectedSpecialization}` : `Select Doctor - ${selectedSpecialization}`}
              </h4>
              <button
                onClick={() => setStep(bookingMode === 'ai' ? 'symptoms' : 'specialization')}
                className="text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                {bookingMode === 'ai' ? 'Change Symptoms' : 'Change Specialization'}
              </button>
            </div>
            
            {/* AI Analysis Info */}
            {aiAnalysis && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Analysis:</strong> {aiAnalysis.reasoning || 'Based on your symptoms, we recommend these specialists.'}
                </p>
                {aiAnalysis.urgencyLevel === 'high' && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    ⚠️ High urgency detected. Please seek immediate medical attention if symptoms worsen.
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer transition-colors"
                  onClick={() => handleDoctorSelect(doctor)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">{doctor.name}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.specialization}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>⭐ {doctor.rating?.average?.toFixed(1) || doctor.rating || '4.5'}</span>
                          <span>{doctor.experience} years</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <span className="font-medium">Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Slot Selection */}
        {step === 'slots' && selectedDoctor && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Select Time Slot</h4>
              <button
                onClick={() => setStep('doctors')}
                className="text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                Change Doctor
              </button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Selected:</strong> {selectedDoctor.name} - {selectedDoctor.specialization}
              </p>
            </div>
            <div className="space-y-4">
              {availableSlots.map((daySlots) => (
                <div key={daySlots.date} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    {daySlots.dayName} - {formatDate(daySlots.date)}
                  </h5>
                  <div className="grid grid-cols-3 gap-2">
                    {daySlots.slots.slice(0, 6).map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotSelect(daySlots, slot)}
                        className={`p-2 text-sm rounded-md border transition-colors ${
                          selectedSlot?.dateTime === slot.dateTime
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                        } ${slot.preferred ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
                      >
                        <Clock className="h-3 w-3 inline mr-1" />
                        {slot.time}
                        {slot.preferred && <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">✨</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Summary */}
        {selectedDoctor && selectedSlot && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Booking Summary</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Doctor:</span>
                <span className="text-gray-900 dark:text-white">{selectedDoctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Specialization:</span>
                <span className="text-gray-900 dark:text-white">{selectedDoctor.specialization}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="text-gray-900 dark:text-white">{selectedSlot.dayName}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="text-gray-900 dark:text-white">{selectedSlot.time}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          {selectedDoctor && selectedSlot && (
            <button
              onClick={handleBookAppointment}
              disabled={isBooking}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
            >
              {isBooking ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </div>
              ) : (
                'Schedule Consultation'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingWidget;