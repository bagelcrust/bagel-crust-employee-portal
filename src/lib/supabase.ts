import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Employee {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  display_name: string;
  pin: string;
  active: boolean;
  phone_number?: string;
  email?: string;
}

export interface TimeclockEvent {
  id: string;
  employee_id: string;
  event_type: 'in' | 'out';
  event_date: string;
  event_time_est: string;
}

export interface PostedSchedule {
  id: number;
  employee_id: string;
  schedule_date: string;
  shift_start_time_est: string;
  shift_end_time_est: string;
  location: string;
  hours_scheduled: number;
}

// Employee API functions
export const employeeApi = {
  // Get all active employees
  async getAll() {
    const { data, error } = await supabase
      .from('core_employees')
      .select('*')
      .eq('active', true)
      .order('last_name');

    if (error) throw error;
    return data as Employee[];
  },

  // Get employee by PIN
  async getByPin(pin: string) {
    const { data, error } = await supabase
      .from('core_employees')
      .select('*')
      .eq('pin', pin)
      .eq('active', true)
      .single();

    if (error) throw error;
    return data as Employee;
  }
};

// Timeclock API functions
export const timeclockApi = {
  // Get last clock event for employee
  async getLastEvent(employeeId: string) {
    const { data, error } = await supabase
      .from('timeclock_events')
      .select('*')
      .eq('employee_id', employeeId)
      .order('event_date', { ascending: false })
      .order('event_time_est', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
    return data as TimeclockEvent | null;
  },

  // Clock in or out
  async clockInOut(employeeId: string) {
    // Get last event to determine if clocking in or out
    const lastEvent = await this.getLastEvent(employeeId);
    const eventType = (!lastEvent || lastEvent.event_type === 'out') ? 'in' : 'out';

    // Create timestamp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const { data, error } = await supabase
      .from('timeclock_events')
      .insert({
        id: `${employeeId}_${Date.now()}`,
        employee_id: employeeId,
        event_type: eventType,
        event_date: dateStr,
        event_time_est: `${dateStr} ${timeStr} EST`
      })
      .select()
      .single();

    if (error) throw error;
    return data as TimeclockEvent;
  },

  // Get currently working employees
  async getCurrentlyWorking() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('timeclock_events')
      .select(`
        employee_id,
        event_type,
        event_time_est,
        core_employees!inner (
          name,
          display_name
        )
      `)
      .eq('event_date', today)
      .order('event_time_est', { ascending: false });

    if (error) throw error;

    // Group by employee and check if they're clocked in
    const employeeStatus = new Map();

    data?.forEach(event => {
      if (!employeeStatus.has(event.employee_id)) {
        employeeStatus.set(event.employee_id, {
          employee_id: event.employee_id,
          name: event.core_employees.name,
          display_name: event.core_employees.display_name,
          last_event: event.event_type,
          clock_in_time: event.event_type === 'in' ? event.event_time_est : null
        });
      }
    });

    // Filter to only those currently clocked in
    return Array.from(employeeStatus.values()).filter(emp => emp.last_event === 'in');
  },

  // Get recent events
  async getRecentEvents(limit = 10) {
    const { data, error } = await supabase
      .from('timeclock_events')
      .select(`
        *,
        core_employees!inner (
          name,
          display_name
        )
      `)
      .order('event_time_est', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};

// Schedule API functions
export const scheduleApi = {
  // Get today's schedule
  async getTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('posted_schedules')
      .select(`
        *,
        core_employees!inner (
          name,
          display_name
        )
      `)
      .eq('schedule_date', today)
      .order('shift_start_time_est');

    if (error) throw error;
    return data;
  },

  // Get this week's schedule
  async getWeeklySchedule() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { data, error } = await supabase
      .from('posted_schedules')
      .select(`
        *,
        core_employees!inner (
          name,
          display_name
        )
      `)
      .gte('schedule_date', startOfWeek.toISOString().split('T')[0])
      .lte('schedule_date', endOfWeek.toISOString().split('T')[0])
      .order('schedule_date')
      .order('shift_start_time_est');

    if (error) throw error;
    return data || [];
  },

  // Get next week's schedule
  async getNextWeekSchedule() {
    const today = new Date();
    const startOfNextWeek = new Date(today);
    startOfNextWeek.setDate(today.getDate() - today.getDay() + 7);

    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

    const { data, error } = await supabase
      .from('posted_schedules')
      .select(`
        *,
        core_employees!inner (
          name,
          display_name
        )
      `)
      .gte('schedule_date', startOfNextWeek.toISOString().split('T')[0])
      .lte('schedule_date', endOfNextWeek.toISOString().split('T')[0])
      .order('schedule_date')
      .order('shift_start_time_est');

    if (error) throw error;
    return data || [];
  },

  // Get week schedule
  async getWeekSchedule(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('posted_schedules')
      .select(`
        *,
        core_employees!inner (
          name,
          display_name
        )
      `)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date')
      .order('shift_start_time_est');

    if (error) throw error;
    return data;
  }
};