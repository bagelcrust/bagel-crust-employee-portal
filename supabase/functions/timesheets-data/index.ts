import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TIMESHEETS DATA - AGGREGATE EDGE FUNCTION
 *
 * Single endpoint that returns ALL data needed for Timesheets page:
 * - All active employees
 * - Time entries for date range (with timezone-aware formatting)
 * - Pay rates for all employees
 * - Pre-calculated employee timesheets (hours + pay)
 *
 * Reduces 3 HTTP requests down to 1
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
      throw new Error('startDate and endDate are required (YYYY-MM-DD format)');
    }

    // ===================================================================
    // FETCH ALL DATA IN PARALLEL
    // ===================================================================
    const [
      employeesResult,
      timeEntriesResult,
      payRatesResult
    ] = await Promise.all([
      // Get all active employees
      supabase
        .from('employees')
        .select('*')
        .eq('active', true)
        .order('first_name'),

      // Get time entries in Eastern Time for date range (using RPC function)
      supabase.rpc('get_time_entries_et', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_employee_id: undefined // All employees
      }),

      // Get all pay rates
      supabase
        .from('pay_rates')
        .select('employee_id, rate, effective_date')
        .order('effective_date', { ascending: false })
    ]);

    // Check for errors
    if (employeesResult.error) throw employeesResult.error;
    if (timeEntriesResult.error) throw timeEntriesResult.error;
    if (payRatesResult.error) throw payRatesResult.error;

    const employees = employeesResult.data || [];
    const timeEntries = timeEntriesResult.data || [];
    const payRatesData = payRatesResult.data || [];

    // ===================================================================
    // BUILD PAY RATES MAP (Most recent rate per employee)
    // ===================================================================
    const payRatesMap = new Map<string, number>();
    payRatesData.forEach((rate: any) => {
      if (!payRatesMap.has(rate.employee_id)) {
        payRatesMap.set(rate.employee_id, parseFloat(rate.rate.toString()));
      }
    });

    // ===================================================================
    // CALCULATE EMPLOYEE TIMESHEETS
    // ===================================================================
    const calculateEmployeeTimesheet = (employeeId: string, employeeName: string) => {
      // Filter events for this employee
      const employeeEvents = timeEntries.filter((e: any) => e.employee_id === employeeId);

      // Sort by timestamp
      const sortedEvents = employeeEvents.sort((a: any, b: any) =>
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

          // Parse pre-formatted Eastern Time strings
          // Format: "Nov 6, 2025 08:49 AM EST"
          const parseETTime = (etString: string) => {
            const parts = etString.split(' ');
            return `${parts[3]} ${parts[4]}`; // "08:49 AM"
          };

          shifts.push({
            date: clockIn.event_date_et, // YYYY-MM-DD
            dayName: new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/New_York',
              weekday: 'long'
            }).format(clockInTime),
            clockIn: parseETTime(clockIn.event_time_et),
            clockOut: parseETTime(event.event_time_et),
            hoursWorked: hoursWorked.toFixed(2)
          });

          clockIn = null; // Reset for next pair
        }
      }

      // Calculate totals
      const totalHours = shifts.reduce((sum, shift) => sum + parseFloat(shift.hoursWorked), 0);
      const hourlyRate = payRatesMap.get(employeeId) || 0;
      const totalPay = totalHours * hourlyRate;

      // Find unpaired events (clock-ins without clock-outs)
      const unpaired = sortedEvents
        .filter((event: any) => {
          if (event.event_type === 'in') {
            // Check if there's a matching clock-out
            const hasClockOut = sortedEvents.some((e: any) =>
              e.event_type === 'out' &&
              new Date(e.event_timestamp).getTime() > new Date(event.event_timestamp).getTime()
            );
            return !hasClockOut;
          }
          return false;
        })
        .map((event: any) => ({
          timestamp: event.event_time_et,
          date: event.event_date_et
        }));

      return {
        employeeId,
        employeeName,
        shifts,
        totalHours: totalHours.toFixed(2),
        totalPay: totalPay.toFixed(2),
        hourlyRate,
        unpaired
      };
    };

    // Build timesheets for all employees
    const employeeTimesheets = employees.map((employee: any) => {
      const employeeName = `${employee.first_name} ${employee.last_name || ''}`.trim();
      return calculateEmployeeTimesheet(employee.id, employeeName);
    });

    // ===================================================================
    // CALCULATE SUMMARY STATS
    // ===================================================================
    const totalHoursAllEmployees = employeeTimesheets.reduce(
      (sum, ts) => sum + parseFloat(ts.totalHours),
      0
    );
    const totalPayAllEmployees = employeeTimesheets.reduce(
      (sum, ts) => sum + parseFloat(ts.totalPay),
      0
    );

    // ===================================================================
    // BUILD RESPONSE
    // ===================================================================
    const response = {
      employees,
      employeeTimesheets,
      payRatesMap: Object.fromEntries(payRatesMap), // Convert Map to object
      summary: {
        totalEmployees: employees.length,
        totalHours: totalHoursAllEmployees.toFixed(2),
        totalPay: totalPayAllEmployees.toFixed(2),
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in timesheets-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
