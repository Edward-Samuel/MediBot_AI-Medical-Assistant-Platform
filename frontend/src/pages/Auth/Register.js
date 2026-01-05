import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Stethoscope, Users } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    firstName: '',
    lastName: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const specializations = [
    'General Medicine', 'Cardiology', 'Dermatology', 'Endocrinology',
    'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Pulmonology', 'Surgery'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    await register(formData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Stethoscope className="h-12 w-12 text-medical-600 dark:text-medical-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white transition-colors duration-200">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-medical-600 hover:text-medical-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md transition-colors duration-200" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
              I am a:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'patient'})}
                className={`flex items-center justify-center px-4 py-2 border rounded-md transition-colors duration-200 ${
                  formData.role === 'patient'
                    ? 'border-medical-600 bg-medical-50 dark:bg-medical-900 text-medical-700 dark:text-medical-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'doctor'})}
                className={`flex items-center justify-center px-4 py-2 border rounded-md transition-colors duration-200 ${
                  formData.role === 'doctor'
                    ? 'border-medical-600 bg-medical-50 dark:bg-medical-900 text-medical-700 dark:text-medical-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Doctor
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-1 input-field"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-1 input-field"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 input-field"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="mt-1 input-field"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* Doctor-specific fields */}
          {formData.role === 'doctor' && (
            <>
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                  Specialization
                </label>
                <select
                  id="specialization"
                  name="specialization"
                  required
                  className="mt-1 input-field"
                  value={formData.specialization}
                  onChange={handleChange}
                >
                  <option value="">Select Specialization</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                  Medical License Number
                </label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  required
                  className="mt-1 input-field"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                  Years of Experience
                </label>
                <input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  className="mt-1 input-field"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 input-field"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="mt-1 input-field"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-medical disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <div className="spinner"></div> : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;