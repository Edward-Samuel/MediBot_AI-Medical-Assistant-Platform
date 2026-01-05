import React, { useState, useEffect } from 'react';
import { Search, Star, MapPin, Clock, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const DoctorList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const specializations = [
    'All Specializations',
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Surgery',
    'Urology',
    'Gynecology',
    'Ophthalmology',
    'ENT',
    'Emergency Medicine'
  ];

  // Fetch doctors from API
  const fetchDoctors = async (page = 1, specialization = '', search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (specialization && specialization !== 'All Specializations') {
        params.append('specialization', specialization);
      }
      
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await axios.get(`/api/doctors?${params}`);
      
      if (response.data.doctors) {
        setDoctors(response.data.doctors);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setDoctors([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Load doctors on component mount and when filters change
  useEffect(() => {
    fetchDoctors(currentPage, selectedSpecialization, searchTerm);
  }, [currentPage, selectedSpecialization]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchDoctors(1, selectedSpecialization, searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSpecializationChange = (specialization) => {
    setSelectedSpecialization(specialization);
    setCurrentPage(1);
  };

  const handleViewProfile = (doctorId) => {
    navigate(`/doctors/${doctorId}`);
  };

  const formatAvailability = (availability) => {
    if (!availability) return 'Availability not set';
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayAvailability = availability[today];
    
    if (todayAvailability?.available) {
      return 'Available Today';
    }
    
    // Find next available day
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const todayIndex = days.indexOf(today);
    
    for (let i = 1; i < 7; i++) {
      const nextDayIndex = (todayIndex + i) % 7;
      const nextDay = days[nextDayIndex];
      if (availability[nextDay]?.available) {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return `Available ${dayNames[nextDayIndex]}`;
      }
    }
    
    return 'Limited Availability';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Find Doctors</h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search doctors by name or specialization..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
              value={selectedSpecialization}
              onChange={(e) => handleSpecializationChange(e.target.value)}
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-medical-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading doctors...</span>
          </div>
        )}

        {/* Doctor Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doctor => (
              <div key={doctor.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-medical-100 dark:bg-medical-900 rounded-full flex items-center justify-center transition-colors duration-200">
                    {doctor.profileImage ? (
                      <img 
                        src={doctor.profileImage} 
                        alt={doctor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-medical-600 dark:text-medical-400" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 
                      className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200 hover:text-medical-600 cursor-pointer"
                      onClick={() => handleViewProfile(doctor.id)}
                    >
                      {doctor.name}
                    </h3>
                    <p className="text-medical-600 dark:text-medical-400 transition-colors duration-200">
                      {doctor.specialization}
                    </p>
                    {doctor.subSpecialization && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {doctor.subSpecialization}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                        {doctor.rating?.average?.toFixed(1) || '0.0'} ({doctor.rating?.count || 0} reviews)
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {doctor.experience} years exp.
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">
                      {formatAvailability(doctor.availability)}
                    </span>
                  </div>

                  {doctor.languages && doctor.languages.length > 0 && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Languages: {doctor.languages.slice(0, 2).join(', ')}
                        {doctor.languages.length > 2 && ` +${doctor.languages.length - 2} more`}
                      </span>
                    </div>
                  )}

                  {doctor.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {doctor.bio}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2 ml-auto">
                    <button 
                      className="px-3 py-1 text-sm border border-medical-600 text-medical-600 hover:bg-medical-50 dark:hover:bg-medical-900/20 rounded-md transition-colors"
                      onClick={() => handleViewProfile(doctor.id)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && doctors.length === 0 && (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors duration-200 mb-2">
              No doctors found matching your criteria
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-medical-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorList;