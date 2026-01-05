import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../UI/ThemeToggle';
import LanguageSelector from '../UI/LanguageSelector';
import { 
  Menu, 
  X, 
  User, 
  Calendar, 
  MessageCircle, 
  LogOut,
  Stethoscope,
  Users
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => {
    return user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-medical-600" />
              <span className="text-2xl font-bold text-gradient">MEDIBOT</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/doctors" 
              className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Find Doctors
            </Link>
            <Link 
              to="/chat" 
              className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              AI Assistant
            </Link>
            <Link 
              to="/calendar" 
              className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Calendar
            </Link>

            <ThemeToggle />
            <LanguageSelector />

            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to={getDashboardLink()}
                  className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/profile"
                  className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
                <Link 
                  to="/appointments"
                  className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Appointments
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  className="btn-medical"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <LanguageSelector />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
              <Link 
                to="/doctors"
                className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="inline h-4 w-4 mr-2" />
                Find Doctors
              </Link>
              <Link 
                to="/chat"
                className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageCircle className="inline h-4 w-4 mr-2" />
                AI Assistant
              </Link>
              <Link 
                to="/calendar"
                className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calendar className="inline h-4 w-4 mr-2" />
                Calendar
              </Link>

              {user ? (
                <>
                  <Link 
                    to={getDashboardLink()}
                    className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile"
                    className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="inline h-4 w-4 mr-2" />
                    Profile
                  </Link>
                  <Link 
                    to="/appointments"
                    className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="inline h-4 w-4 mr-2" />
                    My Appointments
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    <LogOut className="inline h-4 w-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-medical-600 dark:hover:text-medical-400 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register"
                    className="bg-medical-600 text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;