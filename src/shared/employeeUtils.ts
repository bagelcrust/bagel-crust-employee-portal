/**
 * Employee Portal utility functions
 * Formatting helpers for time and hours display
 */

import { logData } from './debug-utils';

/**
 * Format 24-hour time string to 12-hour format with AM/PM
 * @param time - Time string in HH:MM format (e.g., "14:30")
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(time: string): string {
  logData('formatTime', 'Input', { time });

  if (!time) {
    logData('formatTime', 'Empty time - returning empty string', { result: '' });
    return '';
  }

  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const result = `${displayHour}:${minutes} ${ampm}`;

  logData('formatTime', 'Formatted', { input: time, hour24: hour, hour12: displayHour, ampm, result });
  return result;
}

/**
 * Format decimal hours to hours and minutes display
 * @param decimal - Hours as decimal number (e.g., 8.5)
 * @returns Formatted string (e.g., "8h 30m" or "8h")
 */
export function formatHoursMinutes(decimal: string | number): string {
  logData('formatHoursMinutes', 'Input', { decimal, type: typeof decimal });

  const decimalNum = Number(decimal);
  const hours = Math.floor(decimalNum)
  const minutes = Math.round((decimalNum - hours) * 60)
  const result = minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;

  logData('formatHoursMinutes', 'Formatted', {
    input: decimal,
    decimalNum,
    hours,
    minutes,
    result
  });

  return result;
}
