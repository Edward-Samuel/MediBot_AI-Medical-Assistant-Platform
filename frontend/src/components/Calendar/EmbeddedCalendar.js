import { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Maximize2, Minimize2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const EmbeddedCalendar = ({ 
  calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID || "primary",
  height = "600",
  showTitle = true,
  showNav = true,
  showDate = true,
  showPrint = false,
  showTabs = true,
  showCalendarList = false,
  showTz = false,
  mode = "MONTH", // MONTH, WEEK, AGENDA
  className = ""
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showFallback, setShowFallback] = useState(false);
  const { isDarkMode } = useTheme(); // Use global theme context

  // Handle theme changes with loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [isDarkMode, currentMode]);

  // Fetch appointments for fallback display
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('/api/ai/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.log('Could not fetch appointments for calendar fallback');
    }
  };

  // Handle iframe load error
  const handleIframeError = () => {
    console.log('Calendar iframe failed to load, showing fallback');
    setCalendarError('Calendar requires authentication or is not publicly accessible');
    setShowFallback(true);
  };

  // Check if calendar is accessible
  const checkCalendarAccess = () => {
    setIsLoading(true);
    setCalendarError(null);
    setShowFallback(false);
    
    // Reset iframe by changing key
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  };

  // Build the embed URL with all parameters, using global theme
  const buildEmbedUrl = () => {
    const baseUrl = "https://calendar.google.com/calendar/embed";
    // Use appropriate background color based on global theme
    const backgroundColor = isDarkMode ? '%23374151' : '%23ffffff'; // gray-700 for dark, white for light
    
    const params = new URLSearchParams({
      src: calendarId,
      ctz: "Asia/Kolkata",
      mode: currentMode,
      bgcolor: backgroundColor,
      showTitle: showTitle ? "1" : "0",
      showNav: showNav ? "1" : "0",
      showDate: showDate ? "1" : "0",
      showPrint: showPrint ? "1" : "0",
      showTabs: showTabs ? "1" : "0",
      showCalendarList: showCalendarList ? "1" : "0",
      showTz: showTz ? "1" : "0"
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  const handleModeChange = (newMode) => {
    if (newMode !== currentMode) {
      setIsLoading(true);
      setCurrentMode(newMode);
    }
  };

  const openInNewTab = () => {
    const calendarUrl = `https://calendar.google.com/calendar/u/0?cid=${calendarId}`;
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4"
    : `${className}`;

  const iframeHeight = isFullscreen ? "calc(100vh - 120px)" : height;

  // Fallback calendar component
  const FallbackCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get appointments for current month
    const monthAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.dateTime);
      return aptDate.getMonth() === currentMonth && 
             aptDate.getFullYear() === currentYear &&
             apt.status !== 'cancelled';
    });

    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
        <div className="text-center mb-6">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Calendar Integration Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {calendarError || 'The embedded calendar requires authentication to view.'}
          </p>
          <button
            onClick={checkCalendarAccess}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Calendar
          </button>
        </div>

        {/* Show appointments if available */}
        {monthAppointments.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              Your Appointments This Month
            </h4>
            <div className="space-y-3">
              {monthAppointments.slice(0, 5).map((apt, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {apt.doctorName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(apt.dateTime).toLocaleDateString()} at{' '}
                      {new Date(apt.dateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    apt.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative calendar options */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
            Alternative Options
          </h4>
          <div className="space-y-2 text-sm">
            <button
              onClick={openInNewTab}
              className="flex items-center text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Google Calendar in new tab
            </button>
            <p className="text-blue-600 dark:text-blue-400">
              • Book appointments through our AI chat assistant
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              • View your appointment history in your profile
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={containerClasses}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Appointment Calendar
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Selector */}
          <div className="flex bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
            {[
              { mode: 'MONTH', label: 'Month' },
              { mode: 'WEEK', label: 'Week' },
              { mode: 'AGENDA', label: 'Agenda' }
            ].map(({ mode: viewMode, label }) => (
              <button
                key={viewMode}
                onClick={() => handleModeChange(viewMode)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  currentMode === viewMode
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                } ${viewMode === 'MONTH' ? 'rounded-l-md' : ''} ${viewMode === 'AGENDA' ? 'rounded-r-md' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          
          <button
            onClick={openInNewTab}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Open in Google Calendar"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Embed or Fallback */}
      {showFallback ? (
        <FallbackCalendar />
      ) : (
        <div className="relative bg-white dark:bg-gray-800 rounded-b-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <iframe
            key={`calendar-${isDarkMode ? 'dark' : 'light'}-${currentMode}-${Date.now()}`} // Force re-render on theme/mode change
            src={buildEmbedUrl()}
            style={{ 
              border: 0,
              width: '100%',
              height: iframeHeight,
              minHeight: '400px'
            }}
            title="MEDIBOT Appointment Calendar"
            className="w-full"
            onError={handleIframeError}
            onLoad={() => {
              // Check if iframe loaded successfully after a delay
              setTimeout(() => {
                const iframe = document.querySelector(`iframe[title="MEDIBOT Appointment Calendar"]`);
                if (iframe) {
                  try {
                    // Try to access iframe content to detect auth issues
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc.title.includes('Sign in') || iframeDoc.body.innerHTML.includes('sign in')) {
                      handleIframeError();
                    }
                  } catch (e) {
                    // Cross-origin restrictions prevent access, which is normal
                    // Only show error if we detect specific auth-related content
                    if (e.message.includes('sign in') || e.message.includes('authentication')) {
                      handleIframeError();
                    }
                  }
                }
              }, 2000);
            }}
          />
          
          {/* Loading Overlay */}
          <div className={`absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-opacity duration-300 ${
            isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {isLoading ? 'Loading calendar...' : 'Loading calendar...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Info */}
      {!showFallback && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Live Appointment Calendar</p>
              <p>This calendar shows all scheduled appointments in real-time. New bookings will appear automatically.</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Timezone: Asia/Kolkata (GMT+05:30) • Updates automatically
                </p>
                {calendarError && (
                  <button
                    onClick={() => setShowFallback(true)}
                    className="text-xs text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 underline"
                  >
                    Having issues? Try alternative view
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">
          Press ESC or click minimize to exit fullscreen
        </div>
      )}
    </div>
  );
};

export default EmbeddedCalendar;