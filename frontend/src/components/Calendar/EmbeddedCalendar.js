import { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const EmbeddedCalendar = ({ 
  calendarId = "14459a0f9ed5396251532f51800722268903bb47ef8f13fa380a8c41dfe7c531@group.calendar.google.com",
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
  const { isDarkMode } = useTheme(); // Use global theme context

  // Handle theme changes with loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [isDarkMode, currentMode]);

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

      {/* Calendar Embed */}
      <div className="relative bg-white dark:bg-gray-800 rounded-b-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <iframe
          key={`calendar-${isDarkMode ? 'dark' : 'light'}-${currentMode}`} // Force re-render on theme/mode change
          src={buildEmbedUrl()}
          style={{ 
            border: 0,
            width: '100%',
            height: iframeHeight,
            minHeight: '400px'
          }}
          title="MEDIBOT Appointment Calendar"
          className="w-full"
        />
        
        {/* Loading Overlay */}
        <div className={`absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-opacity duration-300 ${
          isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {isLoading ? 'Updating calendar theme...' : 'Loading calendar...'}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Info */}
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
            </div>
          </div>
        </div>
      </div>

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