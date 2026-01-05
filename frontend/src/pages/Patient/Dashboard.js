import React from 'react';
import { Calendar, MessageCircle, User, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Patient Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Manage your appointments and health information</p>
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
              <Link to="/profile" className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                <span className="text-gray-900 dark:text-white">Update Profile</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-200">Upcoming Appointments</h2>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">No upcoming appointments</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-200">Recent Activity</h2>
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;