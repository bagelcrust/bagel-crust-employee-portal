import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * PUBLISH SCHEDULE - Edge Function
 *
 * Publishes draft shifts for a week by copying them to published_shifts table.
 * Uses service_role to bypass RLS and insert into published_shifts.
 *
 * Process:
 * 1. Validate no conflicts (shifts overlapping with time-offs)
 * 2. Get all draft shifts for the week
 * 3. Copy drafts → published_shifts table
 * 4. Return success/failure with conflict details
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

    const { startDate, endDate, strictMode = true } = await req.json();

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required (YYYY-MM-DD format)');
    }

    const weekStart = new Date(startDate);
    const weekEnd = new Date(endDate);

    // Step 1: Get all draft shifts for the week
    const { data: draftShifts, error: draftsError } = await supabase
      .from('draft_shifts')
      .select('*')
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString())
      .order('start_time');

    if (draftsError) throw draftsError;

    if (!draftShifts || draftShifts.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No draft shifts to publish',
          publishedCount: 0,
          conflicts: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get time-offs for conflict detection
    const { data: timeOffs, error: timeOffError } = await supabase
      .from('time_off_notices')
      .select('*')
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString());

    if (timeOffError) throw timeOffError;

    // Step 3: Detect conflicts
    const conflicts: Array<{
      shiftId: number;
      employeeId: string;
      employeeName: string;
      shiftDate: string;
      timeOffReason: string;
    }> = [];

    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, first_name, last_name');

    if (empError) throw empError;

    for (const shift of draftShifts) {
      if (!shift.employee_id) continue; // Skip open shifts

      const shiftDate = new Date(shift.start_time).toDateString();
      const hasConflict = timeOffs?.some((timeOff) => {
        const timeOffDate = new Date(timeOff.start_time).toDateString();
        return timeOff.employee_id === shift.employee_id && timeOffDate === shiftDate;
      });

      if (hasConflict) {
        const employee = employees?.find(e => e.id === shift.employee_id);
        const timeOff = timeOffs?.find(
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
    }

    // Step 4: Block if conflicts exist in strict mode
    if (strictMode && conflicts.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Cannot publish: ${conflicts.length} shift(s) conflict with time-off`,
          publishedCount: 0,
          conflicts
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Copy draft shifts to published_shifts
    const publishedShiftsData = draftShifts.map(draft => ({
      employee_id: draft.employee_id,
      start_time: draft.start_time,
      end_time: draft.end_time,
      location: draft.location,
      role: draft.role,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      published_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('published_shifts')
      .insert(publishedShiftsData);

    if (insertError) throw insertError;

    // Success!
    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${draftShifts.length} shift(s) successfully`,
        publishedCount: draftShifts.length,
        conflicts: conflicts.length > 0 ? conflicts : []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error publishing schedule:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Unknown error',
        publishedCount: 0,
        conflicts: []
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
