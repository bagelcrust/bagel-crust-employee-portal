import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with employees schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'employees' }
});

// Types for YOUR actual database
export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  hire_date: string | null;
  active: boolean;
  location: string;
  role: string;
  pay_schedule: string;
  pin: string;
  phone_number: string | null;
  user_id: string;
  preferred_language: 'en' | 'es';
}

export interface TimeEntry {
  id: number;
  employee_id: string;
  event_type: 'in' | 'out';
  event_timestamp: string; // ISO timestamp
}

export interface Shift {
  id: number;
  employee_id: string | null; // null = open shift (unassigned)
  start_time: string; // Full timestamp (e.g., "2025-10-19 02:00:00+00")
  end_time: string;   // Full timestamp (e.g., "2025-10-19 07:00:00+00")
  location: string;
  role: string | null;
  status: 'draft' | 'published'; // draft = manager only, published = visible to employees
}

export interface TimeOff {
  id: number;
  employee_id: string;
  start_time: string; // Full timestamp
  end_time: string;   // Full timestamp
  reason: string | null;
  status: string;     // "pending", "approved", "denied"
}

export interface PayRate {
  id: number;
  employee_id: string;
  rate: number;
  effective_date: string;
}

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
    const { data, error } = await supabase
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

  // Clock in or out
  async clockInOut(employeeId: string) {
    // Get last event to determine if clocking in or out
    const lastEvent = await this.getLastEvent(employeeId);
    const eventType = (!lastEvent || lastEvent.event_type === 'out') ? 'in' : 'out';

    // Create timestamp in ISO format with timezone
    const now = new Date();
    const timestamp = now.toISOString();

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        employee_id: employeeId,
        event_type: eventType,
        event_timestamp: timestamp
      })
      .select()
      .single();

    if (error) throw error;
    return data as TimeEntry;
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

  // Get currently working employees (optimized with join)
  async getCurrentlyWorking() {
    // Get all time entries from today with employee data in one query
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        employee:employees(*)
      `)
      .gte('event_timestamp', todayISO)
      .order('event_timestamp', { ascending: false });

    if (error) throw error;

    // Group by employee and check if they're clocked in
    const employeeStatus = new Map();

    data?.forEach((event: any) => {
      if (!employeeStatus.has(event.employee_id)) {
        employeeStatus.set(event.employee_id, {
          employee: event.employee,
          last_event: event.event_type,
          clock_in_time: event.event_type === 'in' ? event.event_timestamp : null
        });
      }
    });

    // Return employees currently clocked in
    return Array.from(employeeStatus.values())
      .filter(emp => emp.last_event === 'in')
      .map(emp => ({
        ...emp.employee,
        clock_in_time: emp.clock_in_time
      }));
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
  }
};

// Schedule API functions
export const scheduleApi = {
  // Get today's schedule (optimized with join)
  async getTodaySchedule() {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employee:employees(*)
      `)
      .gte('start_time', todayStart)
      .lte('start_time', todayEnd)
      .order('start_time');

    if (error) throw error;
    return data || [];
  },

  // Get this week's schedule (optimized with join)
  async getWeeklySchedule() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employee:employees(*)
      `)
      .gte('start_time', startOfWeek.toISOString())
      .lte('start_time', endOfWeek.toISOString())
      .order('start_time');

    if (error) throw error;
    return data || [];
  },

  // Get next week's schedule (optimized with join)
  async getNextWeekSchedule() {
    const today = new Date();
    const startOfNextWeek = new Date(today);
    startOfNextWeek.setDate(today.getDate() - today.getDay() + 7);
    startOfNextWeek.setHours(0, 0, 0, 0);

    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employee:employees(*)
      `)
      .gte('start_time', startOfNextWeek.toISOString())
      .lte('start_time', endOfNextWeek.toISOString())
      .order('start_time');

    if (error) throw error;
    return data || [];
  },

  // Get week schedule (with optional join)
  async getWeekSchedule(startDate: string, endDate: string, includeEmployee = false) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const selectQuery = includeEmployee ? `*, employee:employees(*)` : '*';

    const { data, error } = await supabase
      .from('shifts')
      .select(selectQuery)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time');

    if (error) throw error;
    return data || [];
  }
};

// Time-off API functions
export const timeOffApi = {
  // Get time-offs for a date range
  async getTimeOffsForRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('time_off_notices')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time');

    if (error) throw error;
    return data as TimeOff[];
  }
};

// Conflict resolution API
export const conflictApi = {
  // Delete shifts that conflict with time-offs
  // Returns the IDs of deleted shifts
  async resolveConflicts(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all shifts and time-offs for the date range
    const [shifts, timeOffs] = await Promise.all([
      scheduleApi.getWeekSchedule(start.toISOString(), end.toISOString(), false),
      timeOffApi.getTimeOffsForRange(start.toISOString(), end.toISOString())
    ]);

    // Find conflicting shift IDs
    const conflictingShiftIds: number[] = [];

    (shifts as unknown as Shift[]).forEach(shift => {
      const shiftDate = new Date(shift.start_time).toDateString();

      // Check if there's a time-off for this employee on the same day
      const hasTimeOff = timeOffs.some(timeOff => {
        const timeOffDate = new Date(timeOff.start_time).toDateString();
        return timeOff.employee_id === shift.employee_id && timeOffDate === shiftDate;
      });

      if (hasTimeOff) {
        conflictingShiftIds.push(shift.id);
      }
    });

    // Delete conflicting shifts if any found
    if (conflictingShiftIds.length > 0) {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .in('id', conflictingShiftIds);

      if (error) throw error;
    }

    return conflictingShiftIds;
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

// Export new backend services
export { conflictService } from './services/conflictService';
export { shiftService } from './services/shiftService';
export { publishService } from './services/publishService';
export { openShiftsService } from './services/openShiftsService';
export { hoursService } from './services/hoursService';
