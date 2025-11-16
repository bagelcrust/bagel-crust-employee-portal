import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
// RPC functions are in public schema (wrappers) which call employees schema functions
// Table queries use .from('employees.table_name') to access employees schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type aliases using auto-generated types from database.types.ts
// These provide cleaner names and match your existing code
export type Employee = Database['employees']['Tables']['employees']['Row'];
export type TimeEntry = Database['employees']['Tables']['time_entries']['Row'];
export type Shift = Database['employees']['Tables']['shifts']['Row']; // Old archive table
export type DraftShift = Database['employees']['Tables']['draft_shifts']['Row'];
export type PublishedShift = Database['employees']['Tables']['published_shifts']['Row'];
export type TimeOff = Database['employees']['Tables']['time_off_notices']['Row'];
export type PayRate = Database['employees']['Tables']['pay_rates']['Row'];
export type Availability = Database['employees']['Tables']['availability']['Row'];
export type PayrollRecord = Database['employees']['Tables']['payroll_records']['Row'];

// Insert types for creating new records
export type EmployeeInsert = Database['employees']['Tables']['employees']['Insert'];
export type TimeEntryInsert = Database['employees']['Tables']['time_entries']['Insert'];
export type ShiftInsert = Database['employees']['Tables']['shifts']['Insert'];
export type DraftShiftInsert = Database['employees']['Tables']['draft_shifts']['Insert'];
export type PublishedShiftInsert = Database['employees']['Tables']['published_shifts']['Insert'];
export type TimeOffInsert = Database['employees']['Tables']['time_off_notices']['Insert'];
export type PayRateInsert = Database['employees']['Tables']['pay_rates']['Insert'];
export type PayrollRecordInsert = Database['employees']['Tables']['payroll_records']['Insert'];

// Update types for modifying records
export type EmployeeUpdate = Database['employees']['Tables']['employees']['Update'];
export type TimeEntryUpdate = Database['employees']['Tables']['time_entries']['Update'];
export type ShiftUpdate = Database['employees']['Tables']['shifts']['Update'];
export type DraftShiftUpdate = Database['employees']['Tables']['draft_shifts']['Update'];
export type PublishedShiftUpdate = Database['employees']['Tables']['published_shifts']['Update'];
export type TimeOffUpdate = Database['employees']['Tables']['time_off_notices']['Update'];
export type PayRateUpdate = Database['employees']['Tables']['pay_rates']['Update'];
export type PayrollRecordUpdate = Database['employees']['Tables']['payroll_records']['Update'];

// Helper to get display name
export function getDisplayName(employee: Employee): string {
  if (employee.last_name) {
    return `${employee.first_name} ${employee.last_name}`;
  }
  return employee.first_name;
}

// Employee API functions
export const employeeApi = {
  // Get all active employees
  async getAll() {
    const { data, error } = await supabase
      .schema('employees')
      .from('employees')
      .select('*')
      .eq('active', true)
      .order('first_name');

    if (error) throw error;
    return data as Employee[];
  },

  // Get employee by PIN
  async getByPin(pin: string) {
    const { data, error } = await supabase
      .schema('employees')
      .from('employees')
      .select('*')
      .eq('pin', pin)
      .eq('active', true)
      .maybeSingle();

    if (error) throw error;
    return data as Employee | null;
  }
};

// Timeclock API functions
export const timeclockApi = {
  // Get last clock event for employee
  async getLastEvent(employeeId: string) {
    const { data, error} = await supabase
      .schema('employees')
      .from('time_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .order('event_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
    return data as TimeEntry | null;
  },

  // Clock in or out (atomic operation via RPC to prevent race conditions)
  // Uses PostgreSQL function to atomically determine in/out and insert event
  async clockInOut(employeeId: string) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('clock_in_out', {
        p_employee_id: employeeId
      });

    if (error) throw error;
    // RPC function returns TABLE (array), so get first element
    return Array.isArray(data) ? data[0] : data;
  },

  // Get events in date range with employee info (using join - single query!)
  async getEventsInRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .schema('employees')
      .from('time_entries')
      .select(`
        *,
        employee:employees(*)
      `)
      .gte('event_timestamp', startDate)
      .lte('event_timestamp', endDate)
      .order('event_timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get events in Eastern Time date range (timezone-aware!)
  // Pass simple date strings like "2025-11-04" and it handles all timezone conversion
  async getEventsInRangeET(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('get_time_entries_et', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_employee_id: undefined
      });

    if (error) throw error;

    // Transform to match old API format (for backward compatibility)
    return (data || []).map((entry: any) => ({
      id: entry.id,
      employee_id: entry.employee_id,
      event_type: entry.event_type,
      event_timestamp: entry.event_timestamp,
      employee: {
        first_name: entry.employee_name.split(' ')[0],
        last_name: entry.employee_name.split(' ').slice(1).join(' ') || null
      }
    }));
  },

  // Get currently working employees (optimized RPC - returns only clocked-in employees)
  // Replaces client-side logic that fetched ALL today's events and filtered in JavaScript
  async getCurrentlyWorking() {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('get_currently_working');

    if (error) throw error;

    // RPC returns employees with clock_in_time already calculated
    return data || [];
  },

  // Get recent events (with employee info using join - single query!)
  async getRecentEvents(limit = 10) {
    const { data, error } = await supabase
      .schema('employees')
      .from('time_entries')
      .select(`
        *,
        employee:employees(*)
      `)
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get recent events with timezone-aware formatting (uses ET)
  // Returns events from last 3 days with pre-formatted Eastern Time strings
  async getRecentEventsET(limit = 10) {
    // Get date range: 3 days ago to today (in Eastern Time)
    const today = new Date()
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(today.getDate() - 3)
    
    // Format as YYYY-MM-DD for the RPC function
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const startDate = formatDate(threeDaysAgo)
    const endDate = formatDate(today)

    const { data, error } = await supabase
      .schema('employees')
      .rpc('get_time_entries_et', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_employee_id: undefined
      })

    if (error) throw error

    // Transform and limit results
    const events = (data || []).slice(0, limit).map((entry: any) => ({
      id: entry.id,
      employee_id: entry.employee_id,
      event_type: entry.event_type,
      event_timestamp: entry.event_timestamp,
      event_time_et: entry.event_time_et,  // Pre-formatted Eastern Time string
      event_date_et: entry.event_date_et,  // Date in Eastern Time
      employee: {
        first_name: entry.employee_name.split(' ')[0],
        last_name: entry.employee_name.split(' ').slice(1).join(' ') || null
      }
    }))

    return events
  }
};

// Schedule Builder RPC functions (replaces Edge Function)
export const scheduleBuilderRpc = {
  async getData(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('get_schedule_builder_data', {
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) throw error;
    return data;
  },

  async createShift(shiftData: any) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('create_shift', {
        p_employee_id: shiftData.employee_id,
        p_start_time: shiftData.start_time,
        p_end_time: shiftData.end_time,
        p_location: shiftData.location,
        p_role: shiftData.role || null
      });

    if (error) throw error;
    return data;
  },

  async updateShift(shiftId: number, updates: any) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('update_shift', {
        p_shift_id: shiftId,
        p_employee_id: updates.employee_id,
        p_start_time: updates.start_time,
        p_end_time: updates.end_time,
        p_location: updates.location,
        p_role: updates.role || null
      });

    if (error) throw error;
    return data;
  },

  async deleteShift(shiftId: number) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('delete_shift', {
        p_shift_id: shiftId
      });

    if (error) throw error;
    return data;
  },

  async publishWeek(startDate: string, endDate: string, strictMode = true) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('publish_week', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_strict_mode: strictMode
      });

    if (error) throw error;
    return data;
  },

  async clearDrafts(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('clear_drafts', {
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) throw error;
    return data;
  }
};

// Payroll RPC function (replaces calculatePayroll Edge Function)
export async function calculatePayrollRpc(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .schema('employees')
    .rpc('calculate_payroll', {
      p_employee_id: employeeId,
      p_start_date: startDate,
      p_end_date: endDate
    });

  if (error) throw error;
  return data;
}

// Employee RPC functions (replaces Edge Function employees operations)
export const employeeRpc = {
  async getAll(activeOnly = true) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('get_all_employees', {
        p_active_only: activeOnly
      });

    if (error) throw error;
    return data || [];
  },

  async getByPin(pin: string) {
    const { data, error } = await supabase
      .schema('employees')
      .rpc('get_employee_by_pin', {
        p_pin: pin
      });

    if (error) throw error;
    return data;
  }
};

// Timeclock RPC function for events in range (replaces Edge Function)
export async function getClockEventsInRangeRpc(
  startDate: string,
  endDate: string,
  employeeId?: string,
  inET = true
) {
  const { data, error } = await supabase
    .schema('employees')
    .rpc('get_clock_events_in_range', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_employee_id: employeeId,
      p_in_et: inET
    });

  if (error) throw error;
  return data || [];
}

// Pay rates RPC function (replaces Edge Function)
export async function getPayRatesRpc(includeEmployees = false) {
  const { data, error } = await supabase
    .schema('employees')
    .rpc('get_all_pay_rates', {
      p_include_employees: includeEmployees
    });

  if (error) throw error;
  return data || [];
}

// Pay Rates API functions
export const payRatesApi = {
  // Get all pay rates
  async getAll() {
    const { data, error } = await supabase
      .schema('employees')
      .from('pay_rates')
      .select('*')
      .order('employee_id');

    if (error) throw error;
    return data as PayRate[];
  },

  // Get pay rate for specific employee (most recent)
  async getByEmployeeId(employeeId: string) {
    const { data, error } = await supabase
      .schema('employees')
      .from('pay_rates')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as PayRate | null;
  },

  // Get pay rates with employee info (using join)
  async getAllWithEmployees() {
    const { data, error } = await supabase
      .schema('employees')
      .from('pay_rates')
      .select(`
        *,
        employee:employees(*)
      `)
      .order('employee_id');

    if (error) throw error;
    return data || [];
  }
};

// Export new backend services
export { conflictService } from './services/conflictService';
export { shiftService } from './services/shiftService';
export { publishService } from './services/publishService';
export { openShiftsService } from './services/openShiftsService';
export { hoursService } from './services/hoursService';
