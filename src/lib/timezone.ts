/**
 * TIMEZONE UTILITIES - Single Source of Truth for All Timezone Conversions
 *
 * CRITICAL RULES:
 * - Database ALWAYS stores UTC (PostgreSQL timestamptz)
 * - UI ALWAYS displays Eastern Time (America/New_York)
 * - ALWAYS use etToUTC() before .insert() or .update()
 * - ALWAYS use utcToET() after reading from database
 *
 * This replaces all manual timezone parsing (new Date("...EST")) which is browser-dependent and fragile.
 *
 * Library: date-fns-tz - Handles DST automatically (EST/EDT)
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz'

// Business timezone - single source of truth
export const BUSINESS_TIMEZONE = 'America/New_York'

/**
 * Convert Eastern Time string to UTC ISO for database storage
 *
 * @param etDateString - Date in Eastern Time (format: "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DD HH:mm:ss")
 * @returns UTC ISO string for database (e.g., "2025-11-07T13:00:00.000Z")
 *
 * @example
 * etToUTC('2025-11-07T08:00:00') → '2025-11-07T13:00:00.000Z' (EST, UTC-5)
 * etToUTC('2025-07-15T08:00:00') → '2025-07-15T12:00:00.000Z' (EDT, UTC-4)
 */
export function etToUTC(etDateString: string): string {
  const utcDate = fromZonedTime(etDateString, BUSINESS_TIMEZONE)
  return utcDate.toISOString()
}

/**
 * Convert UTC ISO from database to Eastern Time components
 *
 * @param utcString - UTC ISO string from database (e.g., "2025-11-07T13:00:00.000Z")
 * @returns Object with date, time, and formatted strings in Eastern Time
 *
 * @example
 * utcToET('2025-11-07T13:00:00.000Z') → {
 *   date: '2025-11-07',
 *   time: '08:00',
 *   formatted: 'Nov 7, 2025 8:00 AM'
 * }
 */
export function utcToET(utcString: string) {
  const etDate = toZonedTime(utcString, BUSINESS_TIMEZONE)

  return {
    date: format(etDate, 'yyyy-MM-dd', { timeZone: BUSINESS_TIMEZONE }),
    time: format(etDate, 'HH:mm', { timeZone: BUSINESS_TIMEZONE }),
    formatted: format(etDate, 'MMM d, yyyy h:mm a', { timeZone: BUSINESS_TIMEZONE }),
    dateTime: format(etDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: BUSINESS_TIMEZONE })
  }
}

/**
 * Build Eastern Time datetime string for conversion
 *
 * @param date - Date string (YYYY-MM-DD)
 * @param time - Time string (HH:mm or HH:mm:ss)
 * @returns Eastern Time datetime string ready for etToUTC()
 *
 * @example
 * buildETDateTime('2025-11-07', '08:00') → '2025-11-07T08:00:00'
 */
export function buildETDateTime(date: string, time: string): string {
  // Ensure time has seconds
  const timeWithSeconds = time.includes(':') && time.split(':').length === 2
    ? `${time}:00`
    : time

  return `${date}T${timeWithSeconds}`
}
