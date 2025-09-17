/**
 * Safe date utilities to handle timezone issues with date string inputs
 */

/**
 * Safely creates a Date object from a "YYYY-MM-DD" string without timezone issues
 * This prevents the common bug where new Date("2025-09-16") creates a UTC date
 * that gets converted to local timezone, potentially showing the previous day
 * 
 * @param dateString - Date string in "YYYY-MM-DD" format
 * @returns Date object in local timezone
 */
export function createSafeDateFromString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Month is 0-indexed in JavaScript Date constructor
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date object to "YYYY-MM-DD" string format
 * Safe for use with HTML date inputs
 * 
 * @param date - Date object to format
 * @returns Date string in "YYYY-MM-DD" format
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Creates a Date object representing today in local timezone
 * Useful for comparisons with dates from HTML date inputs
 * 
 * @returns Date object for today with time set to 00:00:00
 */
export function getTodayLocalDate(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}