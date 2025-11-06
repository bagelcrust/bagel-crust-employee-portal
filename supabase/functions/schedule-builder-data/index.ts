import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SCHEDULE BUILDER DATA - AGGREGATE EDGE FUNCTION
 *
 * Single endpoint that returns ALL data needed for Schedule Builder page:
 * - Employees (staff_two role only)
 * - Shifts for date range (all shifts, draft + published)
 * - Open shifts (unassigned)
 * - Time-offs for date range
 * - Weekly hours per employee
 * - Week published status
 * - Conflicts (shifts overlapping with time-offs)
 *
 * Reduces 6 HTTP requests down to 1
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

    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required (ISO format)');
    }

    // Parse dates
    const weekStart = new Date(startDate);
    const weekEnd = new Date(endDate);

    // ===================================================================
    // FETCH ALL DATA IN PARALLEL
    // ===================================================================
    const [
      employeesResult,
      shiftsResult,
      openShiftsResult,
      timeOffsResult,
      publishedWeeksResult
    ] = await Promise.all([
      // Get all active employees with staff_two role
      supabase
        .from('employees')
        .select('*')
        .eq('active', true)
        .eq('role', 'staff_two')
        .order('first_name'),

      // Get all shifts for date range (both draft and published - manager view)
      supabase
        .from('shifts')
        .select('*')
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time'),

      // Get open shifts (unassigned)
      supabase
        .from('shifts')
        .select('*')
        .is('employee_id', null)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time'),

      // Get time-offs for date range
      supabase
        .from('time_off_notices')
        .select('*')
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time'),

      // Check if week is published
      supabase
        .from('published_weeks')
        .select('week_start')
        .eq('week_start', weekStart.toISOString().split('T')[0]) // YYYY-MM-DD
        .maybeSingle()
    ]);

    // Check for errors
    if (employeesResult.error) throw employeesResult.error;
    if (shiftsResult.error) throw shiftsResult.error;
    if (openShiftsResult.error) throw openShiftsResult.error;
    if (timeOffsResult.error) throw timeOffsResult.error;
    if (publishedWeeksResult.error) throw publishedWeeksResult.error;

    const employees = employeesResult.data || [];
    const shifts = shiftsResult.data || [];
    const openShifts = openShiftsResult.data || [];
    const timeOffs = timeOffsResult.data || [];
    const isPublished = !!publishedWeeksResult.data;

    // ===================================================================
    // CALCULATE WEEKLY HOURS PER EMPLOYEE
    // ===================================================================
    const weeklyHours = new Map<string, number>();

    shifts.forEach((shift) => {
      if (!shift.employee_id) return; // Skip open shifts

      const startTime = new Date(shift.start_time);
      const endTime = new Date(shift.end_time);
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      const currentHours = weeklyHours.get(shift.employee_id) || 0;
      weeklyHours.set(shift.employee_id, currentHours + hours);
    });

    // Convert Map to object for JSON serialization
    const weeklyHoursObject: Record<string, number> = {};
    weeklyHours.forEach((hours, employeeId) => {
      weeklyHoursObject[employeeId] = parseFloat(hours.toFixed(2));
    });

    // ===================================================================
    // DETECT CONFLICTS (Shifts overlapping with time-offs)
    // ===================================================================
    const conflicts: Array<{
      shiftId: number;
      employeeId: string;
      employeeName: string;
      shiftDate: string;
      timeOffReason: string;
    }> = [];

    shifts.forEach((shift) => {
      if (!shift.employee_id) return; // Skip open shifts

      const shiftDate = new Date(shift.start_time).toDateString();

      // Check if employee has time-off on this day
      const hasTimeOff = timeOffs.some((timeOff) => {
        const timeOffDate = new Date(timeOff.start_time).toDateString();
        return timeOff.employee_id === shift.employee_id && timeOffDate === shiftDate;
      });

      if (hasTimeOff) {
        const employee = employees.find(e => e.id === shift.employee_id);
        const timeOff = timeOffs.find(
          to => to.employee_id === shift.employee_id &&
          new Date(to.start_time).toDateString() === shiftDate
        );

        conflicts.push({
          shiftId: shift.id,
          employeeId: shift.employee_id,
          employeeName: employee ? `${employee.first_name} ${employee.last_name || ''}`.trim() : 'Unknown',
          shiftDate,
          timeOffReason: timeOff?.reason || 'No reason provided'
        });
      }
    });

    // ===================================================================
    // ORGANIZE SHIFTS BY EMPLOYEE AND DAY
    // ===================================================================
    // Generate 7 days of week starting from weekStart
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      daysOfWeek.push(date);
    }

    const shiftsByEmployeeAndDay: Record<string, Record<number, any[]>> = {};

    shifts.forEach((shift) => {
      if (!shift.employee_id) return; // Skip open shifts

      const shiftDate = new Date(shift.start_time);
      shiftDate.setHours(0, 0, 0, 0);

      const dayIndex = daysOfWeek.findIndex(day => {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === shiftDate.getTime();
      });

      if (dayIndex === -1) return; // Shift not in current week

      if (!shiftsByEmployeeAndDay[shift.employee_id]) {
        shiftsByEmployeeAndDay[shift.employee_id] = {};
      }
      if (!shiftsByEmployeeAndDay[shift.employee_id][dayIndex]) {
        shiftsByEmployeeAndDay[shift.employee_id][dayIndex] = [];
      }

      shiftsByEmployeeAndDay[shift.employee_id][dayIndex].push(shift);
    });

    // ===================================================================
    // ORGANIZE TIME-OFFS BY EMPLOYEE AND DAY
    // ===================================================================
    const timeOffsByEmployeeAndDay: Record<string, Record<number, any[]>> = {};

    timeOffs.forEach((timeOff) => {
      const timeOffDate = new Date(timeOff.start_time);
      timeOffDate.setHours(0, 0, 0, 0);

      const dayIndex = daysOfWeek.findIndex(day => {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === timeOffDate.getTime();
      });

      if (dayIndex === -1) return; // Time-off not in current week

      if (!timeOffsByEmployeeAndDay[timeOff.employee_id]) {
        timeOffsByEmployeeAndDay[timeOff.employee_id] = {};
      }
      if (!timeOffsByEmployeeAndDay[timeOff.employee_id][dayIndex]) {
        timeOffsByEmployeeAndDay[timeOff.employee_id][dayIndex] = [];
      }

      timeOffsByEmployeeAndDay[timeOff.employee_id][dayIndex].push(timeOff);
    });

    // ===================================================================
    // BUILD RESPONSE
    // ===================================================================
    const response = {
      employees,
      shifts,
      openShifts,
      timeOffs,
      isPublished,
      weeklyHours: weeklyHoursObject,
      conflicts,
      shiftsByEmployeeAndDay,
      timeOffsByEmployeeAndDay,
      daysOfWeek: daysOfWeek.map(date => ({
        date: date.toISOString(),
        dayName: new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short'
        }).format(date),
        dayNumber: date.getDate(),
        isToday: new Date().toDateString() === date.toDateString()
      }))
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-builder-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
