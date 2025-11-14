import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with employees schema
// NOTE: Temporarily not using Database generic type due to TypeScript inference issues
// The types are still exported below for manual type assertions where needed
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'employees' }
});

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
      .from('employees')
      .select('*')
      .eq('active', true)
      .order('first_name');

    if (error) throw error;
    return data as Employee[];
  },

  // Get employee by PIN
  async getByPin(pin: string) {
    const { data, error} = await supabase
      .from('employees')
      .select('*')
      .eq('pin', pin)
      .eq('active', true)
      .maybeSingle();

    if (error) throw error;
    return data as Employee | null;
  },

  // Get employee availability
  async getAvailability(employeeId: string) {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('employee_id', employeeId)
      .order('day_of_week');

    if (error) throw error;
    return data as Availability[];
  }
};

// Timeclock API functions
export const timeclockApi = {
  // Get last clock event for employee
  async getLastEvent(employeeId: string) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase.rpc('clock_in_out', {
      p_employee_id: employeeId
    });

    if (error) throw error;
    // RPC function returns TABLE (array), so get first element
    return Array.isArray(data) ? data[0] : data;
  },

  // Get events in date range with employee info (using join - single query!)
  async getEventsInRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase.rpc('get_time_entries_et', {
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
    const { data, error } = await supabase.rpc('get_currently_working');

    if (error) throw error;

    // RPC returns employees with clock_in_time already calculated
    return data || [];
  },

  // Get recent events (with employee info using join - single query!)
  async getRecentEvents(limit = 10) {
    const { data, error } = await supabase
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

    const { data, error } = await supabase.rpc('get_time_entries_et', {
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

// DELETED: scheduleApi
// All schedule operations now use Edge Functions (getSchedule, scheduleBuilder)
// scheduleApi had timezone bugs and was completely unused

// DELETED: timeOffApi, conflictApi
// All time-off and conflict operations now use Edge Functions
// (getTimeOffsForRange, resolveScheduleConflicts from edgeFunctions.ts)
// These APIs had timezone bugs and were completely unused

// Shift Service (for Schedule Builder)
export const shiftService = {
  async createShift(shiftData: DraftShiftInsert) {
    const { data, error } = await supabase
      .from('draft_shifts')
      .insert(shiftData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateShift(shiftId: number, updates: DraftShiftUpdate) {
    const { data, error } = await supabase
      .from('draft_shifts')
      .update(updates)
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteShift(shiftId: number) {
    const { error } = await supabase
      .from('draft_shifts')
      .delete()
      .eq('id', shiftId);

    if (error) throw error;
  },

  async getPublishedShifts(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('published_shifts')
      .select('*')
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time');

    if (error) throw error;
    return data || [];
  }
};

// Publish Service (for Schedule Builder)
export const publishService = {
  async publishWeek(startDate: string, endDate: string, _options: { strictMode?: boolean } = {}) {
    // Simple publish: copy drafts to published_shifts
    const { data: drafts, error: fetchError } = await supabase
      .from('draft_shifts')
      .select('*')
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (fetchError) throw fetchError;

    if (!drafts || drafts.length === 0) {
      return {
        success: false,
        message: 'No draft shifts to publish',
        conflicts: []
      };
    }

    // Insert into published_shifts
    const { error: insertError } = await supabase
      .from('published_shifts')
      .insert(drafts.map(d => ({
        employee_id: d.employee_id,
        start_time: d.start_time,
        end_time: d.end_time,
        location: d.location,
        role: d.role
      })));

    if (insertError) throw insertError;

    return {
      success: true,
      message: `Published ${drafts.length} shifts`,
      conflicts: []
    };
  },

  async clearDrafts(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('draft_shifts')
      .delete()
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .select();

    if (error) throw error;
    return data?.length || 0;
  }
};

// Pay Rates API functions
export const payRatesApi = {
  // Get all pay rates
  async getAll() {
    const { data, error } = await supabase
      .from('pay_rates')
      .select('*')
      .order('employee_id');

    if (error) throw error;
    return data as PayRate[];
  },

  // Get pay rate for specific employee (most recent)
  async getByEmployeeId(employeeId: string) {
    const { data, error } = await supabase
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
