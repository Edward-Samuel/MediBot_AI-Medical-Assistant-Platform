import React from 'react';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';

const DoctorDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Doctor Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Manage your schedule and patients</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="card text-center">
            <Calendar className="h-8 w-8 text-medical-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">0</h3>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Today's Appointments</p>
          </div>
          
          <div className="card text-center">
            <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-gray-600">Total Patients</p>
          </div>
          
          <div className="card text-center">
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
            <p className="text-gray-600">Pending Appointments</p>
          </div>
          
          <div className="card text-center">
            <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-gray-900">5.0</h3>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments scheduled for today</p>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Recent Patients</h2>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent patient consultations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;