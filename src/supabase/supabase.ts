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
}

export interface TimeEntry {
  id: number;
  employee_id: string;
  event_type: 'in' | 'out';
  event_timestamp: string; // ISO timestamp
}

export interface Shift {
  id: number;
  employee_id: string;
  start_time: string; // Full timestamp (e.g., "2025-10-19 02:00:00+00")
  end_time: string;   // Full timestamp (e.g., "2025-10-19 07:00:00+00")
  location: string;
  role: string | null;
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

  // Get currently working employees
  async getCurrentlyWorking() {
    // Get all time entries from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .gte('event_timestamp', todayISO)
      .order('event_timestamp', { ascending: false });

    if (error) throw error;

    // Group by employee and check if they're clocked in
    const employeeStatus = new Map();

    data?.forEach((event: any) => {
      if (!employeeStatus.has(event.employee_id)) {
        employeeStatus.set(event.employee_id, {
          employee_id: event.employee_id,
          last_event: event.event_type,
          clock_in_time: event.event_type === 'in' ? event.event_timestamp : null
        });
      }
    });

    // Get employee details for those currently clocked in
    const clockedInIds = Array.from(employeeStatus.values())
      .filter(emp => emp.last_event === 'in')
      .map(emp => emp.employee_id);

    if (clockedInIds.length === 0) return [];

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .in('id', clockedInIds);

    if (empError) throw empError;

    return employees?.map(emp => ({
      ...emp,
      clock_in_time: employeeStatus.get(emp.id).clock_in_time
    })) || [];
  },

  // Get recent events (last N events with employee info)
  async getRecentEvents(limit = 10) {
    const { data: events, error } = await supabase
      .from('time_entries')
      .select('*')
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get employee IDs
    const employeeIds = [...new Set(events?.map(e => e.employee_id) || [])];

    if (employeeIds.length === 0) return [];

    // Fetch employee details
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .in('id', employeeIds);

    if (empError) throw empError;

    // Create employee lookup map
    const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);

    // Combine events with employee data
    return events?.map(event => ({
      ...event,
      employee: employeeMap.get(event.employee_id)
    })) || [];
  }
};

// Schedule API functions
export const scheduleApi = {
  // Get today's schedule
  async getTodaySchedule() {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('start_time', todayStart)
      .lte('start_time', todayEnd)
      .order('start_time');

    if (error) throw error;

    // Get employee details
    if (!data || data.length === 0) return [];

    const employeeIds = [...new Set(data.map(s => s.employee_id))];

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .in('id', employeeIds);

    if (empError) throw empError;

    const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);

    return data.map(shift => ({
      ...shift,
      employee: employeeMap.get(shift.employee_id)
    }));
  },

  // Get this week's schedule
  async getWeeklySchedule() {
    // First, test if we can get ANY shifts at all
    const { data: allShifts, error: testError } = await supabase
      .from('shifts')
      .select('*')
      .limit(5);

    console.log('🧪 TEST: Can we fetch ANY shifts?', allShifts?.length || 0, 'shifts found');
    if (testError) console.error('🧪 TEST ERROR:', testError);
    if (allShifts && allShifts.length > 0) {
      console.log('🧪 Sample shift:', allShifts[0]);
    }

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    console.log('📅 This week query range:', {
      start: startOfWeek.toISOString(),
      end: endOfWeek.toISOString(),
      startLocal: startOfWeek.toString(),
      endLocal: endOfWeek.toString()
    });

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('start_time', startOfWeek.toISOString())
      .lte('start_time', endOfWeek.toISOString())
      .order('start_time');

    if (error) {
      console.error('❌ Query error:', error);
      throw error;
    }
    console.log('📅 This week query returned:', data?.length, 'shifts');

    // Get employee details
    if (!data || data.length === 0) return [];

    const employeeIds = [...new Set(data.map(s => s.employee_id))];

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .in('id', employeeIds);

    if (empError) throw empError;

    const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);

    return data.map(shift => ({
      ...shift,
      employee: employeeMap.get(shift.employee_id)
    }));
  },

  // Get next week's schedule
  async getNextWeekSchedule() {
    const today = new Date();
    const startOfNextWeek = new Date(today);
    startOfNextWeek.setDate(today.getDate() - today.getDay() + 7);
    startOfNextWeek.setHours(0, 0, 0, 0);

    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);

    console.log('📅 Next week query range:', {
      start: startOfNextWeek.toISOString(),
      end: endOfNextWeek.toISOString(),
      startLocal: startOfNextWeek.toString(),
      endLocal: endOfNextWeek.toString()
    });

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('start_time', startOfNextWeek.toISOString())
      .lte('start_time', endOfNextWeek.toISOString())
      .order('start_time');

    if (error) throw error;
    console.log('📅 Next week query returned:', data?.length, 'shifts');

    // Get employee details
    if (!data || data.length === 0) return [];

    const employeeIds = [...new Set(data.map(s => s.employee_id))];

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .in('id', employeeIds);

    if (empError) throw empError;

    const employeeMap = new Map(employees?.map(emp => [emp.id, emp]) || []);

    return data.map(shift => ({
      ...shift,
      employee: employeeMap.get(shift.employee_id)
    }));
  },

  // Get week schedule
  async getWeekSchedule(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time');

    if (error) throw error;
    return data;
  }
};
