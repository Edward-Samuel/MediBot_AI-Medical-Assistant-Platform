/**
 * Date Formatting Utilities
 * 
 * Provides consistent date formatting across the application
 * Format: DD/MM/YYYY
 */

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format date and time to DD/MM/YYYY HH:MM
 * @param {string|Date} dateString - Date to format
 * @param {string} timezone - Optional timezone (e.g., 'America/New_York'). Defaults to local timezone
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString, timezone = undefined) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Use Intl.DateTimeFormat for consistent timezone handling
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    };
    
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(date);
    
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    
    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid Date';
  }
};

/**
 * Format date with month name (e.g., 17 Feb 2026)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateWithMonth = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error('Error formatting date with month:', error);
    return 'Invalid Date';
  }
};

/**
 * Format time only (HH:MM)
 * @param {string|Date} dateString - Date to format
 * @param {string} timezone - Optional timezone (e.g., 'America/New_York'). Defaults to local timezone
 * @returns {string} Formatted time string
 */
export const formatTime = (dateString, timezone = undefined) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Use Intl.DateTimeFormat for consistent timezone handling
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    };
    
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string for input
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Get relative time (e.g., "2 days ago", "Yesterday")
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1}d ago`;
    
    return formatDate(dateString);
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Unknown';
  }
};

const dateFormatter = {
  formatDate,
  formatDateTime,
  formatDateWithMonth,
  formatTime,
  formatDateForInput,
  getRelativeTime
};

export default dateFormatter;
