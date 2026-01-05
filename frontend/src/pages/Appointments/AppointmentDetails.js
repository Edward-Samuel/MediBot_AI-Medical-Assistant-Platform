import React from 'react';
import { Calendar, Clock, User, FileText, MapPin, Phone } from 'lucide-react';

const AppointmentDetails = () => {
  // Mock appointment data
  const appointment = {
    id: 1,
    date: '2024-01-15',
    time: '10:00',
    duration: 30,
    type: 'consultation',
    status: 'confirmed',
    doctor: {
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      phone: '+1 (555) 123-4567',
      location: '123 Medical Center, New York, NY'
    },
    patient: {
      name: 'John Doe',
      phone: '+1 (555) 987-6543'
    },
    chiefComplaint: 'Chest pain and shortness of breath',
    symptoms: ['Chest pain', 'Shortness of breath', 'Fatigue'],
    notes: 'Patient reports intermittent chest pain for the past week.',
    fee: {
      consultation: 150,
      total: 150,
      paid: true
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Details</h1>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Appointment ID:</span>
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">#{appointment.id}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}>
              {appointment.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Info */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Appointment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">{appointment.time} ({appointment.duration} min)</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium capitalize">{appointment.type}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">{appointment.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Information */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Doctor Information</h2>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-medical-100 rounded-full flex items-center justify-center">
                  <span className="text-medical-600 font-semibold text-lg">
                    {appointment.doctor.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{appointment.doctor.name}</h3>
                  <p className="text-medical-600 mb-2">{appointment.doctor.specialization}</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {appointment.doctor.phone}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {appointment.doctor.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Medical Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Chief Complaint</h3>
                  <p className="text-gray-600">{appointment.chiefComplaint}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Symptoms</h3>
                  <div className="flex flex-wrap gap-2">
                    {appointment.symptoms.map((symptom, index) => (
                      <span key={index} className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Additional Notes</h3>
                  <p className="text-gray-600">{appointment.notes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${appointment.fee.total}</span>
                </div>
                <div className="mt-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.fee.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {appointment.fee.paid ? 'Paid' : 'Pending Payment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                {appointment.status === 'scheduled' && (
                  <button className="w-full btn-medical">
                    Join Video Call
                  </button>
                )}
                <button className="w-full btn-secondary">
                  Reschedule
                </button>
                <button className="w-full text-red-600 border border-red-300 hover:bg-red-50 py-2 px-4 rounded-lg transition-colors">
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;