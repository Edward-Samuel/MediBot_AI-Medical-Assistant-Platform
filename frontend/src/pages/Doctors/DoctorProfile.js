import React from 'react';
import { Star, MapPin, Award } from 'lucide-react';

const DoctorProfile = () => {
  // Mock data - in real app, this would come from API
  const doctor = {
    id: 1,
    name: 'Dr. Sarah Johnson',
    specialization: 'Cardiology',
    subSpecialization: 'Interventional Cardiology',
    rating: 4.8,
    reviewCount: 124,
    experience: 12,
    location: 'New York, NY',
    bio: 'Dr. Sarah Johnson is a board-certified cardiologist with over 12 years of experience in treating cardiovascular diseases. She specializes in interventional cardiology and has performed over 1000 successful procedures.',
    education: [
      { degree: 'MD', institution: 'Harvard Medical School', year: 2010 },
      { degree: 'Residency', institution: 'Johns Hopkins Hospital', year: 2014 }
    ],
    languages: ['English', 'Spanish', 'French'],
    availability: {
      monday: { available: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
      tuesday: { available: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
      wednesday: { available: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
      thursday: { available: true, slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
      friday: { available: true, slots: ['09:00', '10:00', '11:00'] },
      saturday: { available: false, slots: [] },
      sunday: { available: false, slots: [] }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Doctor Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="w-32 h-32 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-6">
              <span className="text-green-600 dark:text-green-400 font-semibold text-3xl">
                {doctor.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{doctor.name}</h1>
              <p className="text-xl text-green-600 dark:text-green-400 mb-2">{doctor.specialization}</p>
              {doctor.subSpecialization && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{doctor.subSpecialization}</p>
              )}
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-1" />
                  <span className="font-medium text-gray-900 dark:text-white">{doctor.rating}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">({doctor.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-gray-600 dark:text-gray-400">{doctor.experience} years experience</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-gray-600 dark:text-gray-400">{doctor.location}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About Dr. {doctor.name.split(' ')[1]}</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{doctor.bio}</p>
            </div>

            {/* Education */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Education & Training</h2>
              <div className="space-y-3">
                {doctor.education.map((edu, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{edu.degree}</p>
                      <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">{edu.year}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map((language, index) => (
                  <span key={index} className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm">
                    {language}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Book */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Booking</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  Check Availability
                </button>
              </div>
            </div>

            {/* Availability Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Week's Availability</h3>
              <div className="space-y-2">
                {Object.entries(doctor.availability).slice(0, 5).map(([day, info]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="capitalize text-gray-700 dark:text-gray-300">{day}</span>
                    <span className={`text-sm ${info.available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {info.available ? `${info.slots.length} slots` : 'Unavailable'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;