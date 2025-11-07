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
 * - Draft shifts (experimental workspace)
 * - Published shifts (immutable historical record)
 * - Combined shifts with status discriminator
 * - Open shifts (unassigned drafts)
 * - Time-offs for date range
 * - Weekly hours per employee
 * - Week published status
 * - Conflicts (shifts overlapping with time-offs)
 *
 * Reduces 7+ HTTP requests down to 1
 *
 * HYBRID ARCHITECTURE:
 * - draft_shifts: Manager's experimental workspace (can freely edit/delete)
 * - published_shifts: Immutable historical record (visible to employees)
 * - Publishing copies draft_shifts → published_shifts
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

    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required (ISO format)');
    }

    // Parse dates and set to end of day for weekEnd to include entire last day
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0); // Start of first day

    const weekEnd = new Date(endDate);
    weekEnd.setHours(23, 59, 59, 999); // End of last day

    // ===================================================================
    // FETCH ALL DATA IN PARALLEL
    // ===================================================================
    const [
      employeesResult,
      draftShiftsResult,
      publishedShiftsResult,
      openShiftsResult,
      timeOffsResult
    ] = await Promise.all([
      // Get all active employees with staff_two role
      supabase
        .from('employees')
        .select('*')
        .eq('active', true)
        .eq('role', 'staff_two')
        .order('first_name'),

      // Get draft shifts for date range (experimental workspace)
      supabase
        .from('draft_shifts')
        .select('*')
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time'),

      // Get published shifts for date range (immutable historical record)
      supabase
        .from('published_shifts')
        .select('*')
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time'),

      // Get open shifts (unassigned drafts only)
      supabase
        .from('draft_shifts')
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
        .order('start_time')
    ]);

    // Check for errors
    if (employeesResult.error) throw employeesResult.error;
    if (draftShiftsResult.error) throw draftShiftsResult.error;
    if (publishedShiftsResult.error) throw publishedShiftsResult.error;
    if (openShiftsResult.error) throw openShiftsResult.error;
    if (timeOffsResult.error) throw timeOffsResult.error;

    const employees = employeesResult.data || [];
    const draftShifts = draftShiftsResult.data || [];
    const publishedShifts = publishedShiftsResult.data || [];
    const openShifts = openShiftsResult.data || [];
    const timeOffs = timeOffsResult.data || [];

    // Combine draft and published shifts with status discriminator
    const shifts = [
      ...draftShifts.map(shift => ({ ...shift, status: 'draft' })),
      ...publishedShifts.map(shift => ({ ...shift, status: 'published' }))
    ];

    // Check if week has any published shifts
    const isPublished = publishedShifts.length > 0;

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
