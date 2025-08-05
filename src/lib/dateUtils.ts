import { format } from 'date-fns';

/**
 * Safely formats a date string with fallback handling
 * @param dateString - The date string to format
 * @param formatPattern - The format pattern (default: 'MMMM d, yyyy')
 * @returns Formatted date string or original string if formatting fails
 */
export const formatDate = (dateString: string | null, formatPattern: string = 'MMMM d, yyyy'): string => {
  if (!dateString) return 'N/A';
  
  try {
    return format(new Date(dateString), formatPattern);
  } catch (e) {
    console.warn('Date formatting failed for:', dateString);
    return dateString;
  }
};

/**
 * Formats a date for display in tables
 * @param dateString - The date string to format
 * @returns Formatted date string or 'N/A'
 */
export const formatTableDate = (dateString: string | null): string => {
  return formatDate(dateString, 'MMM d, yyyy');
};

/**
 * Formats a date with time for detailed views
 * @param dateString - The date string to format
 * @returns Formatted datetime string or 'N/A'
 */
export const formatDateTime = (dateString: string | null): string => {
  return formatDate(dateString, 'MMM d, yyyy h:mm a');
};

/**
 * Formats a date for ISO date input fields
 * @param dateString - The date string to format
 * @returns ISO date string (YYYY-MM-DD) or empty string
 */
export const formatDateInput = (dateString: string | null): string => {
  if (!dateString) return '';
  
  try {
    return format(new Date(dateString), 'yyyy-MM-dd');
  } catch (e) {
    console.warn('Date input formatting failed for:', dateString);
    return '';
  }
};

/**
 * Calculates age from date of birth
 * @param dateOfBirth - The date of birth string
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: string): number => {
  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (e) {
    console.warn('Age calculation failed for:', dateOfBirth);
    return 0;
  }
};

/**
 * Checks if a date string represents a future date
 * @param dateString - The date string to check
 * @returns True if the date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    return date > today;
  } catch (e) {
    return false;
  }
};

/**
 * Checks if a date string represents a past date
 * @param dateString - The date string to check
 * @returns True if the date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day
    return date < today;
  } catch (e) {
    return false;
  }
};