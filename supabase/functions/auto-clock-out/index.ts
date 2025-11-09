import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AUTO CLOCK OUT - SCHEDULED EDGE FUNCTION
 *
 * Runs daily at 6:00 PM Eastern Time
 * Automatically clocks out any employees who are still clocked in
 *
 * Purpose:
 * - Prevents multi-day shifts
 * - Ensures employees don't forget to clock out
 * - Runs silently without notifications
 *
 * Schedule: Cron job runs daily at 6:00 PM ET (10:00 PM UTC / 11:00 PM UTC depending on DST)
 *
 * IMPORTANT - PERMISSIONS REQUIRED:
 * This Edge Function requires service_role to have access to the 'employees' schema.
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

    console.log('[Auto Clock Out] Starting auto clock out process...');
    console.log('[Auto Clock Out] Current time:', new Date().toISOString());

    // Get current Eastern Time
    const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const currentTimeET = new Date(nowET);
    console.log('[Auto Clock Out] Eastern Time:', currentTimeET.toISOString());

    // Find all employees currently clocked in (no clock-out record)
    const { data: currentlyWorking, error: workingError } = await supabase
      .rpc('get_currently_working');

    if (workingError) {
      console.error('[Auto Clock Out] Error fetching currently working employees:', workingError);
      throw workingError;
    }

    console.log(`[Auto Clock Out] Found ${currentlyWorking?.length || 0} employees currently clocked in`);

    if (!currentlyWorking || currentlyWorking.length === 0) {
      console.log('[Auto Clock Out] No employees to clock out');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No employees to clock out',
          clockedOut: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clock out each employee
    const results = [];
    for (const worker of currentlyWorking) {
      try {
        console.log(`[Auto Clock Out] Clocking out: ${worker.employee_name} (ID: ${worker.employee_id})`);

        // Insert clock-out event using current timestamp
        const { data: clockOutEvent, error: clockOutError } = await supabase
          .from('time_entries')
          .insert({
            employee_id: worker.employee_id,
            event_type: 'out',
            event_timestamp: new Date().toISOString() // Current time (will be stored in UTC)
          })
          .select()
          .single();

        if (clockOutError) {
          console.error(`[Auto Clock Out] Failed to clock out ${worker.employee_name}:`, clockOutError);
          results.push({
            employeeId: worker.employee_id,
            employeeName: worker.employee_name,
            success: false,
            error: clockOutError.message
          });
        } else {
          console.log(`[Auto Clock Out] ✅ Successfully clocked out: ${worker.employee_name}`);
          results.push({
            employeeId: worker.employee_id,
            employeeName: worker.employee_name,
            success: true,
            clockOutTime: clockOutEvent.event_timestamp
          });
        }
      } catch (err) {
        console.error(`[Auto Clock Out] Exception clocking out ${worker.employee_name}:`, err);
        results.push({
          employeeId: worker.employee_id,
          employeeName: worker.employee_name,
          success: false,
          error: String(err)
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[Auto Clock Out] Completed: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto clock out completed at ${currentTimeET.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} ET`,
        clockedOut: successCount,
        failed: failCount,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Auto Clock Out] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
