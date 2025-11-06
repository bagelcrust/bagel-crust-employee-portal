import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * EMPLOYEE PORTAL DATA - AGGREGATE EDGE FUNCTION
 *
 * Single endpoint that returns ALL data needed for Employee Portal page:
 * - Employee's personal schedule (this week + next week)
 * - Full team schedule (this week + next week)
 * - Employee's timesheet (this week + last week)
 * - Employee's time-off requests
 *
 * Reduces 6 HTTP requests down to 1
 *
 * IMPORTANT - PERMISSIONS REQUIRED:
 * This Edge Function requires service_role to have access to the 'employees' schema.
 * Permissions are granted in: supabase/migrations/20251106_grant_service_role_permissions.sql
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'employees' }
    });

    const { employeeId } = await req.json();

    if (!employeeId) {
      throw new Error('employeeId is required');
    }

    // Calculate date ranges in Eastern Time
    const today = new Date();

    // Helper to format date as YYYY-MM-DD in Eastern Time
    const formatDateET = (date: Date) => {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    };

    // This week (Monday - Sunday)
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - daysFromMonday);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    // Next week
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(thisWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    // Last week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

    // ===================================================================
    // FETCH ALL DATA IN PARALLEL (Much faster than sequential!)
    // ===================================================================
    const [
      // Personal schedules (filtered to employee)
      employeeThisWeekShifts,
      employeeNextWeekShifts,

      // Full team schedules (all employees)
      teamThisWeekShifts,
      teamNextWeekShifts,

      // Time entries for payroll calculation
      thisWeekTimeEntries,
      lastWeekTimeEntries,

      // Pay rate
      payRate,

      // Time-off requests
      timeOffRequests
    ] = await Promise.all([
      // Get employee's shifts - this week
      supabase
        .from('shifts')
        .select('*, employee:employees(first_name, last_name)')
        .eq('employee_id', employeeId)
        .gte('start_time', thisWeekStart.toISOString())
        .lte('start_time', thisWeekEnd.toISOString())
        .eq('is_published', true)
        .order('start_time'),

      // Get employee's shifts - next week
      supabase
        .from('shifts')
        .select('*, employee:employees(first_name, last_name)')
        .eq('employee_id', employeeId)
        .gte('start_time', nextWeekStart.toISOString())
        .lte('start_time', nextWeekEnd.toISOString())
        .eq('is_published', true)
        .order('start_time'),

      // Get full team shifts - this week
      supabase
        .from('shifts')
        .select('*, employee:employees(first_name, last_name)')
        .gte('start_time', thisWeekStart.toISOString())
        .lte('start_time', thisWeekEnd.toISOString())
        .eq('is_published', true)
        .not('employee_id', 'is', null)
        .order('start_time'),

      // Get full team shifts - next week
      supabase
        .from('shifts')
        .select('*, employee:employees(first_name, last_name)')
        .gte('start_time', nextWeekStart.toISOString())
        .lte('start_time', nextWeekEnd.toISOString())
        .eq('is_published', true)
        .not('employee_id', 'is', null)
        .order('start_time'),

      // Get time entries - this week (for timesheet calculation)
      supabase.rpc('get_time_entries_et', {
        p_start_date: formatDateET(thisWeekStart),
        p_end_date: formatDateET(thisWeekEnd),
        p_employee_id: employeeId
      }),

      // Get time entries - last week (for timesheet calculation)
      supabase.rpc('get_time_entries_et', {
        p_start_date: formatDateET(lastWeekStart),
        p_end_date: formatDateET(lastWeekEnd),
        p_employee_id: employeeId
      }),

      // Get employee's pay rate
      supabase
        .from('pay_rates')
        .select('rate')
        .eq('employee_id', employeeId)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Get time-off requests
      supabase
        .from('time_off_notices')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('start_time', lastWeekStart.toISOString()) // Show recent requests
        .order('start_time', { ascending: false })
    ]);

    // Check for errors
    if (employeeThisWeekShifts.error) throw employeeThisWeekShifts.error;
    if (employeeNextWeekShifts.error) throw employeeNextWeekShifts.error;
    if (teamThisWeekShifts.error) throw teamThisWeekShifts.error;
    if (teamNextWeekShifts.error) throw teamNextWeekShifts.error;
    if (thisWeekTimeEntries.error) throw thisWeekTimeEntries.error;
    if (lastWeekTimeEntries.error) throw lastWeekTimeEntries.error;
    if (payRate.error) throw payRate.error;
    if (timeOffRequests.error) throw timeOffRequests.error;

    // ===================================================================
    // TRANSFORM DATA - Group schedules by day of week
    // ===================================================================
    const groupScheduleByDay = (schedules: any[]) => {
      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const grouped: any = {
        monday: [], tuesday: [], wednesday: [], thursday: [],
        friday: [], saturday: [], sunday: []
      };

      schedules.forEach(schedule => {
        const startDate = new Date(schedule.start_time);
        const endDate = new Date(schedule.end_time);
        const dayOfWeek = startDate.getDay();
        const dayName = dayOrder[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

        // Calculate hours scheduled
        const hoursScheduled = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

        // Format times as HH:MM in Eastern Time
        const formatTimeString = (date: Date) => {
          return new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(date);
        };

        grouped[dayName].push({
          id: schedule.id,
          startTime: formatTimeString(startDate),
          endTime: formatTimeString(endDate),
          hoursScheduled: hoursScheduled.toFixed(1),
          location: schedule.location,
          employee: schedule.employee // Include for team schedule
        });
      });

      return grouped;
    };

    // ===================================================================
    // CALCULATE TIMESHEET DATA (Pair clock in/out events)
    // ===================================================================
    const calculateTimesheet = (timeEntries: any[], hourlyRate: number) => {
      const events = timeEntries || [];

      // Sort by timestamp
      const sortedEvents = events.sort((a: any, b: any) =>
        new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
      );

      // Pair clock-in with clock-out events
      const shifts = [];
      let clockIn = null;

      for (const event of sortedEvents) {
        if (event.event_type === 'in') {
          clockIn = event;
        } else if (event.event_type === 'out' && clockIn) {
          const clockInTime = new Date(clockIn.event_timestamp);
          const clockOutTime = new Date(event.event_timestamp);
          const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

          shifts.push({
            date: clockIn.event_date_et, // YYYY-MM-DD
            dayName: new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/New_York',
              weekday: 'long'
            }).format(clockInTime),
            clockIn: clockIn.event_time_et, // Pre-formatted ET string
            clockOut: event.event_time_et,  // Pre-formatted ET string
            hoursWorked: hoursWorked.toFixed(2)
          });

          clockIn = null; // Reset for next pair
        }
      }

      // Calculate totals
      const totalHours = shifts.reduce((sum, shift) => sum + parseFloat(shift.hoursWorked), 0);
      const totalPay = totalHours * hourlyRate;

      // Find unpaired events (clock-ins without clock-outs)
      const unpaired = sortedEvents.filter((event: any) => {
        if (event.event_type === 'in') {
          // Check if there's a matching clock-out
          const hasClockOut = sortedEvents.some((e: any) =>
            e.event_type === 'out' &&
            new Date(e.event_timestamp).getTime() > new Date(event.event_timestamp).getTime()
          );
          return !hasClockOut;
        }
        return false;
      }).map((event: any) => ({
        timestamp: event.event_time_et,
        date: event.event_date_et
      }));

      return {
        days: shifts,
        totalHours: totalHours.toFixed(2),
        totalPay: totalPay.toFixed(2),
        hourlyRate,
        unpaired
      };
    };

    // Get hourly rate (default to 0 if not found)
    const hourlyRate = payRate.data?.rate || 0;

    // ===================================================================
    // BUILD RESPONSE
    // ===================================================================
    const response = {
      // Personal schedules
      personalSchedule: {
        thisWeek: groupScheduleByDay(employeeThisWeekShifts.data || []),
        nextWeek: groupScheduleByDay(employeeNextWeekShifts.data || [])
      },

      // Full team schedules
      teamSchedule: {
        thisWeek: groupScheduleByDay(teamThisWeekShifts.data || []),
        nextWeek: groupScheduleByDay(teamNextWeekShifts.data || [])
      },

      // Timesheet data
      timesheet: {
        thisWeek: calculateTimesheet(thisWeekTimeEntries.data || [], hourlyRate),
        lastWeek: calculateTimesheet(lastWeekTimeEntries.data || [], hourlyRate)
      },

      // Time-off requests
      timeOffRequests: timeOffRequests.data || []
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in employee-portal-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
