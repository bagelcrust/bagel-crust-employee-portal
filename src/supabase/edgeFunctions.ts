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
  clockInTime: string; // 24-hour format time (e.g., "08:00", "14:30") for formatTime()
  clockOutTime: string; // 24-hour format time (e.g., "08:00", "14:30") for formatTime()
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

// ============================================================================
// EMPLOYEES API - All employee management operations
// ============================================================================

/**
 * Get all employees
 * @param activeOnly - Only return active employees (default: true)
 */
export async function getEmployees(activeOnly = true) {
  const { data, error } = await supabase.functions.invoke('employees', {
    body: { operation: 'getAll', activeOnly }
  });

  if (error) throw new Error(`Failed to get employees: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.employees) throw new Error('Invalid response from employees Edge Function');

  return data.employees;
}

/**
 * Get employee by PIN
 */
export async function getEmployeeByPin(pin: string) {
  const { data, error } = await supabase.functions.invoke('employees', {
    body: { operation: 'getByPin', pin }
  });

  if (error) throw new Error(`Failed to get employee by PIN: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from employees Edge Function');

  return data.employee;
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string) {
  const { data, error } = await supabase.functions.invoke('employees', {
    body: { operation: 'getById', id }
  });

  if (error) throw new Error(`Failed to get employee by ID: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.employee) throw new Error('Invalid response from employees Edge Function');

  return data.employee;
}

/**
 * Update employee
 */
export async function updateEmployee(id: string, updateData: any) {
  const { data, error } = await supabase.functions.invoke('employees', {
    body: { operation: 'update', id, data: updateData }
  });

  if (error) throw new Error(`Failed to update employee: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.employee) throw new Error('Invalid response from employees Edge Function');

  return data.employee;
}

/**
 * Create employee
 */
export async function createEmployee(employeeData: any) {
  const { data, error } = await supabase.functions.invoke('employees', {
    body: { operation: 'create', data: employeeData }
  });

  if (error) throw new Error(`Failed to create employee: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.employee) throw new Error('Invalid response from employees Edge Function');

  return data.employee;
}

// ============================================================================
// TIMECLOCK API - All time tracking operations
// ============================================================================

/**
 * Clock in or out (atomic operation)
 */
export async function clockInOut(employeeId: string) {
  const { data, error } = await supabase.functions.invoke('timeclock', {
    body: { operation: 'clockInOut', employeeId }
  });

  if (error) throw new Error(`Failed to clock in/out: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.event) throw new Error('Invalid response from timeclock Edge Function');

  return data.event;
}

/**
 * Get last clock event for employee
 */
export async function getLastClockEvent(employeeId: string) {
  const { data, error } = await supabase.functions.invoke('timeclock', {
    body: { operation: 'getLastEvent', employeeId }
  });

  if (error) throw new Error(`Failed to get last event: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from timeclock Edge Function');

  return data.event;
}

/**
 * Get currently working employees
 */
export async function getCurrentlyWorking() {
  const { data, error } = await supabase.functions.invoke('timeclock', {
    body: { operation: 'getCurrentlyWorking' }
  });

  if (error) throw new Error(`Failed to get currently working: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.employees) throw new Error('Invalid response from timeclock Edge Function');

  return data.employees;
}

/**
 * Get recent clock events
 * @param limit - Number of events to return (default: 10)
 * @param inET - Return with Eastern Time formatting (default: true)
 */
export async function getRecentClockEvents(limit = 10, inET = true) {
  const { data, error } = await supabase.functions.invoke('timeclock', {
    body: { operation: 'getRecentEvents', limit, inET }
  });

  if (error) throw new Error(`Failed to get recent events: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.events) throw new Error('Invalid response from timeclock Edge Function');

  return data.events;
}

/**
 * Get clock events in date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param employeeId - Optional: filter to specific employee
 * @param inET - Return with Eastern Time formatting (default: true)
 */
export async function getClockEventsInRange(
  startDate: string,
  endDate: string,
  employeeId?: string,
  inET = true
) {
  const { data, error } = await supabase.functions.invoke('timeclock', {
    body: { operation: 'getEventsInRange', startDate, endDate, employeeId, inET }
  });

  if (error) throw new Error(`Failed to get events in range: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.events) throw new Error('Invalid response from timeclock Edge Function');

  return data.events;
}

// ============================================================================
// TIME-OFF API - Time-off request management
// ============================================================================

/**
 * Get time-offs for date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param employeeId - Optional: filter to specific employee
 */
export async function getTimeOffsForRange(
  startDate: string,
  endDate: string,
  employeeId?: string
) {
  const { data, error } = await supabase.functions.invoke('time-off', {
    body: { operation: 'getForRange', startDate, endDate, employeeId }
  });

  if (error) throw new Error(`Failed to get time-offs: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.timeOffs) throw new Error('Invalid response from time-off Edge Function');

  return data.timeOffs;
}

/**
 * Request time off
 */
export async function requestTimeOff(
  employeeId: string,
  startDate: string,
  endDate: string,
  reason?: string
) {
  const { data, error } = await supabase.functions.invoke('time-off', {
    body: { operation: 'request', employeeId, startDate, endDate, reason }
  });

  if (error) throw new Error(`Failed to request time off: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.timeOff) throw new Error('Invalid response from time-off Edge Function');

  return data.timeOff;
}

/**
 * Approve time-off request
 */
export async function approveTimeOff(id: string) {
  const { data, error } = await supabase.functions.invoke('time-off', {
    body: { operation: 'approve', id }
  });

  if (error) throw new Error(`Failed to approve time off: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.timeOff) throw new Error('Invalid response from time-off Edge Function');

  return data.timeOff;
}

/**
 * Deny time-off request
 */
export async function denyTimeOff(id: string, reason?: string) {
  const { data, error } = await supabase.functions.invoke('time-off', {
    body: { operation: 'deny', id, reason }
  });

  if (error) throw new Error(`Failed to deny time off: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.timeOff) throw new Error('Invalid response from time-off Edge Function');

  return data.timeOff;
}

// ============================================================================
// PAY RATES API - Pay rate management
// ============================================================================

/**
 * Get all pay rates
 * @param includeEmployees - Include employee data in response (default: false)
 */
export async function getPayRates(includeEmployees = false) {
  const { data, error } = await supabase.functions.invoke('pay-rates', {
    body: { operation: 'getAll', includeEmployees }
  });

  if (error) throw new Error(`Failed to get pay rates: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.payRates) throw new Error('Invalid response from pay-rates Edge Function');

  return data.payRates;
}

/**
 * Get pay rate for employee (most recent)
 */
export async function getPayRateByEmployeeId(employeeId: string) {
  const { data, error } = await supabase.functions.invoke('pay-rates', {
    body: { operation: 'getByEmployeeId', employeeId }
  });

  if (error) throw new Error(`Failed to get pay rate: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from pay-rates Edge Function');

  return data.payRate;
}

/**
 * Update pay rate for employee (creates new rate record)
 */
export async function updatePayRate(
  employeeId: string,
  rate: number,
  effectiveDate?: string
) {
  const { data, error } = await supabase.functions.invoke('pay-rates', {
    body: { operation: 'update', employeeId, rate, effectiveDate }
  });

  if (error) throw new Error(`Failed to update pay rate: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.payRate) throw new Error('Invalid response from pay-rates Edge Function');

  return data.payRate;
}

// ============================================================================
// SCHEDULE CONFLICTS API - Conflict detection and resolution
// ============================================================================

/**
 * Find schedule conflicts (shifts that overlap with time-off)
 */
export async function findScheduleConflicts(startDate: string, endDate: string) {
  const { data, error } = await supabase.functions.invoke('schedule-conflicts', {
    body: { operation: 'findConflicts', startDate, endDate }
  });

  if (error) throw new Error(`Failed to find conflicts: ${error.message || JSON.stringify(error)}`);
  if (!data || !data.conflicts) throw new Error('Invalid response from schedule-conflicts Edge Function');

  return data.conflicts;
}

/**
 * Resolve schedule conflicts (optionally delete conflicting shifts)
 */
export async function resolveScheduleConflicts(
  startDate: string,
  endDate: string,
  deleteConflictingShifts = false
) {
  const { data, error } = await supabase.functions.invoke('schedule-conflicts', {
    body: { operation: 'resolveConflicts', startDate, endDate, deleteConflictingShifts }
  });

  if (error) throw new Error(`Failed to resolve conflicts: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from schedule-conflicts Edge Function');

  return data;
}

// ============================================================================
// PUBLISH SCHEDULE API - Uses service_role to bypass RLS
// ============================================================================

/**
 * Publish draft shifts for a week (creates published_shifts)
 * Uses edge function with service_role key to bypass RLS restrictions
 */
export async function publishSchedule(
  startDate: string,
  endDate: string,
  strictMode = true
) {
  const { data, error } = await supabase.functions.invoke('publish-schedule', {
    body: { startDate, endDate, strictMode }
  });

  if (error) throw new Error(`Failed to publish schedule: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from publish-schedule Edge Function');

  return data;
}

/**
 * Delete a shift (draft or published)
 * Uses edge function with service_role key to bypass RLS restrictions
 */
export async function deleteShift(shiftId: number) {
  const { data, error } = await supabase.functions.invoke('delete-shift', {
    body: { shiftId }
  });

  if (error) throw new Error(`Failed to delete shift: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from delete-shift Edge Function');

  return data;
}

// ============================================================================
// SCHEDULE BUILDER - Comprehensive Operations (Single Edge Function)
// ============================================================================

/**
 * Schedule Builder namespace - All operations go through one edge function
 * Uses service_role key to bypass RLS issues
 */
export const scheduleBuilder = {
  /**
   * Get all schedule data (employees, shifts, time-offs, availability)
   */
  async getData(startDate: string, endDate: string) {
    console.log('🌐 [Schedule Builder] GET_DATA', { startDate, endDate });

    const { data, error } = await supabase.functions.invoke('schedule-builder-operations', {
      body: { operation: 'GET_DATA', data: { startDate, endDate } }
    });

    if (error) {
      console.error('❌ [Schedule Builder] GET_DATA failed:', error);
      throw new Error(`Failed to get schedule data: ${error.message || JSON.stringify(error)}`);
    }
    if (!data) {
      throw new Error('Invalid response from schedule-builder-operations');
    }

    return data;
  },

  /**
   * Create new shift with conflict validation
   */
  async createShift(shiftData: {
    employee_id: string | null
    start_time: string
    end_time: string
    location: string
    role?: string | null
  }) {
    console.log('🌐 [Schedule Builder] CREATE_SHIFT', shiftData);

    const { data, error } = await supabase.functions.invoke('schedule-builder-operations', {
      body: { operation: 'CREATE_SHIFT', data: shiftData }
    });

    if (error) {
      console.error('❌ [Schedule Builder] CREATE_SHIFT failed:', error);
      throw new Error(`Failed to create shift: ${error.message || JSON.stringify(error)}`);
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Failed to create shift');
    }

    return data.shift;
  },

  /**
   * Update existing shift with conflict validation
   */
  async updateShift(shiftId: number, updates: {
    employee_id?: string | null
    start_time?: string
    end_time?: string
    location?: string
    role?: string | null
  }) {
    console.log('🌐 [Schedule Builder] UPDATE_SHIFT', { shiftId, updates });

    const { data, error } = await supabase.functions.invoke('schedule-builder-operations', {
      body: { operation: 'UPDATE_SHIFT', data: { shift_id: shiftId, ...updates } }
    });

    if (error) {
      console.error('❌ [Schedule Builder] UPDATE_SHIFT failed:', error);
      throw new Error(`Failed to update shift: ${error.message || JSON.stringify(error)}`);
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Failed to update shift');
    }

    return data.shift;
  },

  /**
   * Delete shift (draft or published)
   */
  async deleteShift(shiftId: number) {
    console.log('🌐 [Schedule Builder] DELETE_SHIFT', { shiftId });

    const { data, error } = await supabase.functions.invoke('schedule-builder-operations', {
      body: { operation: 'DELETE_SHIFT', data: { shift_id: shiftId } }
    });

    if (error) {
      console.error('❌ [Schedule Builder] DELETE_SHIFT failed:', error);
      throw new Error(`Failed to delete shift: ${error.message || JSON.stringify(error)}`);
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Failed to delete shift');
    }

    return data;
  },

  /**
   * Publish all draft shifts for a week
   */
  async publishWeek(startDate: string, endDate: string, strictMode = true) {
    console.log('🌐 [Schedule Builder] PUBLISH_WEEK', { startDate, endDate, strictMode });

    const { data, error } = await supabase.functions.invoke('schedule-builder-operations', {
      body: { operation: 'PUBLISH_WEEK', data: { startDate, endDate, strictMode } }
    });

    if (error) {
      console.error('❌ [Schedule Builder] PUBLISH_WEEK failed:', error);
      throw new Error(`Failed to publish week: ${error.message || JSON.stringify(error)}`);
    }

    return data;
  },

  /**
   * Clear all draft shifts for a week
   */
  async clearDrafts(startDate: string, endDate: string) {
    console.log('🌐 [Schedule Builder] CLEAR_DRAFTS', { startDate, endDate });

    const { data, error } = await supabase.functions.invoke('schedule-builder-operations', {
      body: { operation: 'CLEAR_DRAFTS', data: { startDate, endDate } }
    });

    if (error) {
      console.error('❌ [Schedule Builder] CLEAR_DRAFTS failed:', error);
      throw new Error(`Failed to clear drafts: ${error.message || JSON.stringify(error)}`);
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Failed to clear drafts');
    }

    return data.clearedCount;
  }
};

// ============================================================================
// AGGREGATE PAGE-SPECIFIC APIs - Single endpoint per page
// ============================================================================

/**
 * Get all data for Employee Portal page
 * Aggregates: personal schedule, team schedule, timesheet, time-off requests
 *
 * Reduces 6 HTTP requests down to 1
 */
export async function getEmployeePortalData(employeeId: string) {
  const { data, error } = await supabase.functions.invoke('employee-portal-data', {
    body: { employeeId }
  });

  if (error) throw new Error(`Failed to get employee portal data: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from employee-portal-data Edge Function');

  return data;
}

/**
 * Get all data for Schedule Builder page
 * Aggregates: employees, shifts, open shifts, time-offs, weekly hours, publish status, conflicts
 *
 * Reduces 6 HTTP requests down to 1
 */
export async function getScheduleBuilderData(startDate: string, endDate: string) {
  console.log('🌐 CALLING EDGE FUNCTION: schedule-builder-data', { startDate, endDate });

  const { data, error } = await supabase.functions.invoke('schedule-builder-data', {
    body: { startDate, endDate }
  });

  console.log('🌐 EDGE FUNCTION RESPONSE:', {
    hasData: !!data,
    hasError: !!error,
    error: error,
    data: data
  });

  if (error) {
    console.error('❌ EDGE FUNCTION ERROR:', error);
    throw new Error(`Failed to get schedule builder data: ${error.message || JSON.stringify(error)}`);
  }
  if (!data) {
    console.error('❌ NO DATA FROM EDGE FUNCTION');
    throw new Error('Invalid response from schedule-builder-data Edge Function');
  }

  return data;
}

/**
 * Get all data for Timesheets page
 * Aggregates: employees, time entries, pay rates, pre-calculated timesheets
 *
 * Reduces 3 HTTP requests down to 1
 */
export async function getTimesheetsData(startDate: string, endDate: string) {
  const { data, error } = await supabase.functions.invoke('timesheets-data', {
    body: { startDate, endDate }
  });

  if (error) throw new Error(`Failed to get timesheets data: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from timesheets-data Edge Function');

  return data;
}

/**
 * Get all data for Clock Terminal page
 * Aggregates: recent events, currently working employees, server time
 *
 * Single endpoint for terminal display
 */
export async function getClockTerminalData(limit = 10) {
  const { data, error } = await supabase.functions.invoke('clock-terminal-data', {
    body: { limit }
  });

  if (error) throw new Error(`Failed to get clock terminal data: ${error.message || JSON.stringify(error)}`);
  if (!data) throw new Error('Invalid response from clock-terminal-data Edge Function');

  return data;
}
