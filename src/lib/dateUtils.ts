/**
 * Date and timezone utility functions for Bagel Crust
 *
 * CRITICAL TIMEZONE INFO:
 * - Database stores all timestamps in UTC (e.g., "2025-11-04T11:30:00+00:00")
 * - Display to users ALWAYS in Eastern Time (America/New_York)
 * - Eastern Time automatically handles DST:
 *   - EDT (UTC-4): Second Sunday in March → First Sunday in November
 *   - EST (UTC-5): First Sunday in November → Second Sunday in March
 *
 * USE THIS MODULE for all timezone conversions to avoid bugs like showing UTC times directly to users.
 */

/**
 * Convert UTC Date to Eastern Time formatted string
 * Handles DST automatically
 *
 * @param date - Date object (assumed to be UTC from database)
 * @param format - Output format: 'time' | 'date' | 'datetime' | 'weekday'
 * @returns Formatted string in Eastern Time
 *
 * Examples:
 * - formatInEasternTime(date, 'time') → "6:30am"
 * - formatInEasternTime(date, 'date') → "2025-11-04"
 * - formatInEasternTime(date, 'datetime') → "November 4, 2025 at 6:30am"
 * - formatInEasternTime(date, 'weekday') → "Monday"
 */
export function formatInEasternTime(
  date: Date,
  format: 'time' | 'date' | 'datetime' | 'weekday'
): string {
  if (format === 'time') {
    // Format: "6:30am" or "5:07pm"
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    return formatter.format(date).toLowerCase().replace(/\s/g, '')
  }

  if (format === 'date') {
    // Format: "2025-11-04" (YYYY-MM-DD for sorting)
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date)

    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value

    return `${year}-${month}-${day}`
  }

  if (format === 'weekday') {
    // Format: "Monday"
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long'
    }).format(date)
  }

  if (format === 'datetime') {
    // Format: "November 4, 2025 at 6:30am"
    const dateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date)

    const timeStr = formatInEasternTime(date, 'time')

    return `${dateStr} at ${timeStr}`
  }

  return date.toISOString()
}

/**
 * Get Eastern Time date parts for advanced formatting
 *
 * @param date - Date object (UTC from database)
 * @returns Object with date/time parts in Eastern Time
 *
 * Example:
 * getEasternTimeParts(date) → {
 *   year: "2025",
 *   month: "11",
 *   day: "04",
 *   hour: "6",
 *   minute: "30",
 *   dayPeriod: "am",
 *   weekday: "Monday"
 * }
 */
export function getEasternTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    weekday: 'long'
  }).formatToParts(date)

  return {
    year: parts.find(p => p.type === 'year')?.value || '',
    month: parts.find(p => p.type === 'month')?.value || '',
    day: parts.find(p => p.type === 'day')?.value || '',
    hour: parts.find(p => p.type === 'hour')?.value || '',
    minute: parts.find(p => p.type === 'minute')?.value || '',
    dayPeriod: parts.find(p => p.type === 'dayPeriod')?.value?.toLowerCase() || '',
    weekday: parts.find(p => p.type === 'weekday')?.value || ''
  }
}

/**
 * Create a UTC Date from Eastern Time values
 * Use this when user enters a time in Eastern Time and you need to store it in database
 *
 * @param easternTimeString - Date/time string in Eastern Time (e.g., "2025-11-04 06:30:00")
 * @returns Date object in UTC (ready for database)
 *
 * Example:
 * easternTimeToUTC("2025-11-04 06:30:00") → Date object representing UTC time
 */
export function easternTimeToUTC(easternTimeString: string): Date {
  // Parse as if it's in America/New_York timezone
  // JavaScript will handle the conversion to UTC
  const date = new Date(easternTimeString + ' GMT-0500') // EST offset (will adjust for EDT automatically)
  return date
}

/**
 * Check if a date falls within DST (Daylight Saving Time)
 *
 * @param date - Date to check
 * @returns true if date is in EDT (UTC-4), false if EST (UTC-5)
 */
export function isDST(date: Date): boolean {
  // Get timezone offset in January (definitely EST) and July (definitely EDT)
  const jan = new Date(date.getFullYear(), 0, 1)
  const jul = new Date(date.getFullYear(), 6, 1)

  const janOffset = jan.getTimezoneOffset()
  const julOffset = jul.getTimezoneOffset()

  // DST is when offset is less (closer to UTC)
  return Math.max(janOffset, julOffset) !== date.getTimezoneOffset()
}

/**
 * Get current offset for Eastern Time
 *
 * @param date - Date to check
 * @returns Offset string (e.g., "UTC-5" for EST, "UTC-4" for EDT)
 */
export function getEasternOffset(date: Date): string {
  return isDST(date) ? 'UTC-4' : 'UTC-5'
}
