/**
 * DATE UTILITIES
 * Centralized date formatting functions
 */

/**
 * Format date string to Vietnamese locale
 * @param {string|Date} dateString - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "—";
  
  try {
    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    };
    
    return new Date(dateString).toLocaleDateString("vi-VN", defaultOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "—";
  }
};

/**
 * Format date and time to Vietnamese locale
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  
  try {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "—";
  }
};

/**
 * Format date for input field (YYYY-MM-DD)
 * @param {string|Date} dateValue - Date to format
 * @returns {string} Formatted date for input
 */
export const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";
  
  try {
    const date = new Date(dateValue);
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
};
