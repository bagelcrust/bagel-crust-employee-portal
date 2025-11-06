/**
 * EDGE FUNCTIONS API
 *
 * Client-side wrappers for calling Supabase Edge Functions.
 * These handle all the complex timezone logic server-side.
 */

import { supabase } from './supabase';

/**
 * Convert UTC timestamps to Eastern Time with automatic DST handling
 *
 * @param timestamps - Array of UTC timestamp strings
 * @param toTimezone - Target timezone (defaults to America/New_York)
 * @returns Array of converted timestamps with timezone info
 */
export async function convertTimezones(
  timestamps: string[],
  toTimezone: string = 'America/New_York'
) {
  const { data, error } = await supabase.functions.invoke('timezone-convert', {
    body: { timestamps, toTimezone }
  });

  if (error) {
    console.error('Timezone conversion failed:', error);
    throw new Error(`Failed to convert timezones: ${error.message || JSON.stringify(error)}`);
  }

  if (!data || !data.conversions) {
    throw new Error('Invalid response from timezone-convert Edge Function');
  }

  return data.conversions;
}

/**
 * Calculate payroll for an employee in a date range (Eastern Time)
 *
 * This Edge Function:
 * - Automatically handles EST/EDT timezone conversions
 * - Pairs clock-in with clock-out events
 * - Calculates total hours worked
 * - Returns total pay based on hourly rate
 *
 * @param employeeId - Employee UUID
 * @param startDate - Start date in Eastern Time (YYYY-MM-DD)
 * @param endDate - End date in Eastern Time (YYYY-MM-DD)
 * @returns Payroll data with shifts, hours, and pay
 */
export async function calculatePayroll(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase.functions.invoke('calculate-payroll', {
    body: { employeeId, startDate, endDate }
  });

  if (error) {
    console.error('Payroll calculation failed:', {
      employeeId,
      startDate,
      endDate,
      error
    });
    throw new Error(`Failed to calculate payroll: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error('Invalid response from calculate-payroll Edge Function');
  }

  return data;
}

/**
 * Calculate payroll for multiple employees in a date range
 *
 * @param employeeIds - Array of employee UUIDs
 * @param startDate - Start date in Eastern Time (YYYY-MM-DD)
 * @param endDate - End date in Eastern Time (YYYY-MM-DD)
 * @returns Array of payroll data for each employee
 */
export async function calculateBulkPayroll(
  employeeIds: string[],
  startDate: string,
  endDate: string
) {
  const results = await Promise.all(
    employeeIds.map(employeeId =>
      calculatePayroll(employeeId, startDate, endDate)
    )
  );

  return results;
}

/**
 * Helper: Format a UTC timestamp to Eastern Time
 *
 * @param utcTimestamp - UTC timestamp string
 * @returns Formatted Eastern Time string
 */
export async function formatEasternTime(utcTimestamp: string) {
  const conversions = await convertTimezones([utcTimestamp]);
  return conversions[0];
}

/**
 * Get schedule with proper Eastern Time handling
 *
 * This Edge Function:
 * - Automatically handles EST/EDT timezone conversions
 * - Calculates weeks based on Eastern Time (not server timezone)
 * - Single source of truth for all schedule queries
 *
 * @param query - Query type: 'today', 'this-week', 'next-week', 'date-range'
 * @param employeeId - Optional: Filter to specific employee
 * @param startDate - For date-range queries (YYYY-MM-DD in Eastern Time)
 * @param endDate - For date-range queries (YYYY-MM-DD in Eastern Time)
 * @returns Schedule data with shifts
 */
export async function getSchedule(
  query: 'today' | 'this-week' | 'next-week' | 'date-range',
  employeeId?: string,
  startDate?: string,
  endDate?: string
) {
  const { data, error } = await supabase.functions.invoke('get-schedule', {
    body: { query, employeeId, startDate, endDate }
  });

  if (error) {
    console.error('Schedule fetch failed:', {
      query,
      employeeId,
      startDate,
      endDate,
      error
    });
    throw new Error(`Failed to fetch schedule: ${error.message || JSON.stringify(error)}`);
  }

  if (!data || !data.shifts) {
    throw new Error('Invalid response from get-schedule Edge Function');
  }

  return data.shifts;
}

/**
 * Types for Edge Function responses
 */
export interface TimezoneConversion {
  utc: string;
  local: string;
  formatted: string;
  timezone: string;
  offset: string;
  isDST: boolean;
  timezoneName: string;
}

export interface PayrollShift {
  clockIn: string;
  clockOut: string;
  clockInEST: string;
  clockOutEST: string;
  clockInOffset: string;
  clockOutOffset: string;
  hoursWorked: number;
}

export interface PayrollData {
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  timezone: string;
  shifts: PayrollShift[];
  totalHours: number;
  hourlyRate: number;
  totalPay: number;
  unpaired?: Array<{
    clockIn: string;
    clockInEST: string;
    note: string;
  }>;
}
