/**
 * Employee Portal utility functions
 * Formatting helpers for time and hours display
 */

/**
 * Format 24-hour time string to 12-hour format with AM/PM
 * @param time - Time string in HH:MM format (e.g., "14:30")
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(time: string): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

/**
 * Format decimal hours to hours and minutes display
 * @param decimal - Hours as decimal number (e.g., 8.5)
 * @returns Formatted string (e.g., "8h 30m" or "8h")
 */
export function formatHoursMinutes(decimal: string | number): string {
  const hours = Math.floor(Number(decimal))
  const minutes = Math.round((Number(decimal) - hours) * 60)
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
