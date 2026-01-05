import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, 
  Calendar, 
  MessageCircle, 
  Users, 
  Shield, 
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <MessageCircle className="h-8 w-8 text-medical-600" />,
      title: "AI Medical Assistant",
      description: "Get instant medical guidance powered by Gemini AI and MedGemma for accurate health information."
    },
    {
      icon: <Users className="h-8 w-8 text-medical-600" />,
      title: "Smart Doctor Matching",
      description: "Our AI analyzes your symptoms to recommend the most suitable specialists for your condition."
    },
    {
      icon: <Calendar className="h-8 w-8 text-medical-600" />,
      title: "Easy Consultation Scheduling",
      description: "Schedule consultations with verified doctors and sync with Google Calendar for seamless scheduling."
    },
    {
      icon: <Shield className="h-8 w-8 text-medical-600" />,
      title: "Secure EHR Integration",
      description: "Your medical records are securely stored and accessible to authorized healthcare providers."
    },
    {
      icon: <Clock className="h-8 w-8 text-medical-600" />,
      title: "24/7 Availability",
      description: "Access medical guidance and schedule consultations anytime, anywhere with our platform."
    },
    {
      icon: <Star className="h-8 w-8 text-medical-600" />,
      title: "Verified Doctors",
      description: "All doctors on our platform are verified professionals with proper credentials and ratings."
    }
  ];

  const stats = [
    { number: "500+", label: "Verified Doctors" },
    { number: "10,000+", label: "Happy Patients" },
    { number: "18", label: "Medical Specialties" },
    { number: "24/7", label: "AI Support" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-medical-50 to-primary-50 dark:from-gray-800 dark:to-gray-700 py-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Stethoscope className="h-16 w-16 text-medical-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-200">
              Welcome to <span className="text-gradient">MEDIBOT</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto transition-colors duration-200">
              Your intelligent medical assistant powered by AI. Get personalized doctor recommendations, 
              schedule consultations, and access 24/7 medical guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/chat" 
                className="btn-medical text-lg px-8 py-3 flex items-center justify-center space-x-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Try AI Assistant</span>
              </Link>
              <Link 
                to="/doctors" 
                className="btn-secondary text-lg px-8 py-3 flex items-center justify-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>Find Doctors</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-medical-600 dark:text-medical-400 mb-2 transition-colors duration-200">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium transition-colors duration-200">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
              Why Choose MEDIBOT?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-200">
              Experience the future of healthcare with our AI-powered platform designed 
              to make medical care more accessible and efficient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-3 transition-colors duration-200">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-200">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
              How MEDIBOT Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-200">
              Get the medical care you need in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-medical-100 dark:bg-medical-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
                <MessageCircle className="h-8 w-8 text-medical-600 dark:text-medical-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
                1. Describe Your Symptoms
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
                Chat with our AI assistant and describe your symptoms or health concerns. 
                Our AI will analyze your input using advanced medical knowledge.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-medical-100 dark:bg-medical-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
                <Users className="h-8 w-8 text-medical-600 dark:text-medical-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
                2. Get Doctor Recommendations
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
                Based on your symptoms, our AI recommends the most suitable specialists. 
                Browse verified doctors with ratings and availability.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-medical-100 dark:bg-medical-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
                <Calendar className="h-8 w-8 text-medical-600 dark:text-medical-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
                3. Book Your Appointment
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
                Schedule your appointment with your chosen doctor. Get calendar integration 
                and receive reminders for your upcoming consultation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-medical-600 to-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Experience Better Healthcare?
          </h2>
          <p className="text-xl text-medical-100 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who trust MEDIBOT for their healthcare needs. 
            Start your journey to better health today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-white text-medical-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              to="/chat" 
              className="border-2 border-white text-white hover:bg-white hover:text-medical-600 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Try AI Assistant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;