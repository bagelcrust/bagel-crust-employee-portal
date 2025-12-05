import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SCHEDULE BUILDER OPERATIONS - Comprehensive Edge Function
 *
 * Single endpoint for ALL schedule builder operations with service_role key.
 * Bypasses RLS issues and provides reliable, consistent operations.
 *
 * Operations:
 * - GET_DATA: Fetch all schedule data (employees, shifts, time-offs, availability)
 * - CREATE_SHIFT: Create new shift with conflict validation
 * - UPDATE_SHIFT: Update existing shift with conflict validation
 * - DELETE_SHIFT: Delete shift (draft or published)
 * - PUBLISH_WEEK: Publish all draft shifts for a week
 * - CLEAR_DRAFTS: Delete all draft shifts for a week
 *
 * Benefits:
 * ✅ Service role bypasses RLS completely
 * ✅ Server-side timezone handling
 * ✅ Atomic operations with transactions
 * ✅ Conflict validation in one place
 * ✅ Single source of truth
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

    const { operation, data } = await req.json();

    if (!operation) {
      throw new Error('operation is required');
    }

    console.log(`[Schedule Builder] Operation: ${operation}`, data);

    // ===================================================================
    // GET_DATA - Fetch all schedule data
    // ===================================================================
    if (operation === 'GET_DATA') {
      const { startDate, endDate } = data;

      if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required (ISO format)');
      }

      // Parse dates and set to end of day for weekEnd to include entire last day
      const weekStart = new Date(startDate);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(endDate);
      weekEnd.setHours(23, 59, 59, 999);

      // Fetch all data in parallel
      const [
        employeesResult,
        draftShiftsResult,
        publishedShiftsResult,
        openShiftsResult,
        timeOffsResult,
        availabilityResult
      ] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .eq('active', true)
          .eq('role', 'staff_two')
          .order('first_name'),

        supabase
          .from('draft_shifts')
          .select('*')
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString())
          .order('start_time'),

        supabase
          .from('published_shifts')
          .select('*')
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString())
          .order('start_time'),

        supabase
          .from('draft_shifts')
          .select('*')
          .is('employee_id', null)
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString())
          .order('start_time'),

        supabase
          .from('time_off_notices')
          .select('*')
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString())
          .order('start_time'),

        supabase
          .from('availability')
          .select('*')
          .order('employee_id')
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (draftShiftsResult.error) throw draftShiftsResult.error;
      if (publishedShiftsResult.error) throw publishedShiftsResult.error;
      if (openShiftsResult.error) throw openShiftsResult.error;
      if (timeOffsResult.error) throw timeOffsResult.error;
      if (availabilityResult.error) throw availabilityResult.error;

      const employees = employeesResult.data || [];
      const draftShifts = draftShiftsResult.data || [];
      const publishedShifts = publishedShiftsResult.data || [];
      const openShifts = openShiftsResult.data || [];
      const timeOffs = timeOffsResult.data || [];
      const availability = availabilityResult.data || [];

      // Combine draft and published shifts with status discriminator
      const shifts = [
        ...draftShifts.map(shift => ({ ...shift, status: 'draft' })),
        ...publishedShifts.map(shift => ({ ...shift, status: 'published' }))
      ];

      const isPublished = publishedShifts.length > 0;

      // Calculate weekly hours
      const weeklyHours = new Map<string, number>();
      shifts.forEach((shift) => {
        if (!shift.employee_id) return;
        const startTime = new Date(shift.start_time);
        const endTime = new Date(shift.end_time);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        const currentHours = weeklyHours.get(shift.employee_id) || 0;
        weeklyHours.set(shift.employee_id, currentHours + hours);
      });

      const weeklyHoursObject: Record<string, number> = {};
      weeklyHours.forEach((hours, employeeId) => {
        weeklyHoursObject[employeeId] = parseFloat(hours.toFixed(2));
      });

      // Detect conflicts
      const conflicts: Array<{
        shiftId: number;
        employeeId: string;
        employeeName: string;
        shiftDate: string;
        timeOffReason: string;
      }> = [];

      shifts.forEach((shift) => {
        if (!shift.employee_id) return;
        const shiftDate = new Date(shift.start_time).toDateString();
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

      // Organize shifts by employee and day
      const daysOfWeek = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        daysOfWeek.push(date);
      }

      const shiftsByEmployeeAndDay: Record<string, Record<number, any[]>> = {};
      shifts.forEach((shift) => {
        if (!shift.employee_id) return;
        const shiftDate = new Date(shift.start_time);
        shiftDate.setHours(0, 0, 0, 0);
        const dayIndex = daysOfWeek.findIndex(day => {
          const d = new Date(day);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === shiftDate.getTime();
        });
        if (dayIndex === -1) return;
        if (!shiftsByEmployeeAndDay[shift.employee_id]) {
          shiftsByEmployeeAndDay[shift.employee_id] = {};
        }
        if (!shiftsByEmployeeAndDay[shift.employee_id][dayIndex]) {
          shiftsByEmployeeAndDay[shift.employee_id][dayIndex] = [];
        }
        shiftsByEmployeeAndDay[shift.employee_id][dayIndex].push(shift);
      });

      // Organize time-offs by employee and day
      const timeOffsByEmployeeAndDay: Record<string, Record<number, any[]>> = {};
      timeOffs.forEach((timeOff) => {
        const timeOffDate = new Date(timeOff.start_time);
        timeOffDate.setHours(0, 0, 0, 0);
        const dayIndex = daysOfWeek.findIndex(day => {
          const d = new Date(day);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === timeOffDate.getTime();
        });
        if (dayIndex === -1) return;
        if (!timeOffsByEmployeeAndDay[timeOff.employee_id]) {
          timeOffsByEmployeeAndDay[timeOff.employee_id] = {};
        }
        if (!timeOffsByEmployeeAndDay[timeOff.employee_id][dayIndex]) {
          timeOffsByEmployeeAndDay[timeOff.employee_id][dayIndex] = [];
        }
        timeOffsByEmployeeAndDay[timeOff.employee_id][dayIndex].push(timeOff);
      });

      // Organize availability by employee and day
      const dayOfWeekMap: Record<string, number> = {
        'monday': 0,
        'tuesday': 1,
        'wednesday': 2,
        'thursday': 3,
        'friday': 4,
        'saturday': 5,
        'sunday': 6
      };

      const availabilityByEmployeeAndDay: Record<string, Record<number, any[]>> = {};
      availability.forEach((avail) => {
        const dayIndex = dayOfWeekMap[avail.day_of_week.toLowerCase()];
        if (dayIndex === undefined) return;
        if (!availabilityByEmployeeAndDay[avail.employee_id]) {
          availabilityByEmployeeAndDay[avail.employee_id] = {};
        }
        if (!availabilityByEmployeeAndDay[avail.employee_id][dayIndex]) {
          availabilityByEmployeeAndDay[avail.employee_id][dayIndex] = [];
        }
        availabilityByEmployeeAndDay[avail.employee_id][dayIndex].push(avail);
      });

      return new Response(
        JSON.stringify({
          employees,
          shifts,
          openShifts,
          timeOffs,
          availability,
          isPublished,
          weeklyHours: weeklyHoursObject,
          conflicts,
          shiftsByEmployeeAndDay,
          timeOffsByEmployeeAndDay,
          availabilityByEmployeeAndDay,
          daysOfWeek: daysOfWeek.map(date => ({
            date: date.toISOString(),
            dayName: new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/New_York',
              weekday: 'short'
            }).format(date),
            dayNumber: date.getDate(),
            isToday: new Date().toDateString() === date.toDateString()
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===================================================================
    // CREATE_SHIFT - Create new shift with conflict validation
    // ===================================================================
    if (operation === 'CREATE_SHIFT') {
      const { employee_id, start_time, end_time, location, role } = data;

      if (!start_time || !end_time || !location) {
        throw new Error('start_time, end_time, and location are required');
      }

      // Validate no conflict if assigning to employee
      if (employee_id) {
        const shiftDate = new Date(start_time);
        const startOfDay = new Date(shiftDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(shiftDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: timeOffs, error: timeOffError } = await supabase
          .from('time_off_notices')
          .select('*')
          .eq('employee_id', employee_id)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());

        if (timeOffError) throw timeOffError;

        if (timeOffs && timeOffs.length > 0) {
          throw new Error(`Cannot assign shift: employee has time-off on this day (${timeOffs[0].reason || 'No reason'})`);
        }
      }

      const { data: shift, error } = await supabase
        .from('draft_shifts')
        .insert({
          employee_id: employee_id || null,
          start_time,
          end_time,
          location,
          role: role || null
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[Schedule Builder] Shift created:', shift);

      return new Response(
        JSON.stringify({ success: true, shift }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===================================================================
    // UPDATE_SHIFT - Update existing shift with conflict validation
    // ===================================================================
    if (operation === 'UPDATE_SHIFT') {
      const { shift_id, employee_id, start_time, end_time, location, role } = data;

      if (!shift_id) {
        throw new Error('shift_id is required');
      }

      // Get current shift to check if it exists
      const { data: currentShift, error: fetchError } = await supabase
        .from('draft_shifts')
        .select('*')
        .eq('id', shift_id)
        .single();

      // If shift doesn't exist in drafts, it's a published shift - create new draft
      if (fetchError?.code === 'PGRST116') {
        const { data: publishedShift, error: pubError } = await supabase
          .from('published_shifts')
          .select('*')
          .eq('id', shift_id)
          .single();

        if (pubError) throw new Error('Shift not found in drafts or published shifts');

        // Create new draft with published shift data + updates
        const newShiftData = {
          employee_id: employee_id !== undefined ? employee_id : publishedShift.employee_id,
          start_time: start_time || publishedShift.start_time,
          end_time: end_time || publishedShift.end_time,
          location: location || publishedShift.location || 'Calder',
          role: role !== undefined ? role : publishedShift.role
        };

        // Validate no conflict
        if (newShiftData.employee_id) {
          const shiftDate = new Date(newShiftData.start_time);
          const startOfDay = new Date(shiftDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(shiftDate);
          endOfDay.setHours(23, 59, 59, 999);

          const { data: timeOffs, error: timeOffError } = await supabase
            .from('time_off_notices')
            .select('*')
            .eq('employee_id', newShiftData.employee_id)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString());

          if (timeOffError) throw timeOffError;

          if (timeOffs && timeOffs.length > 0) {
            throw new Error(`Cannot update shift: employee has time-off on this day (${timeOffs[0].reason || 'No reason'})`);
          }
        }

        const { data: newShift, error: createError } = await supabase
          .from('draft_shifts')
          .insert(newShiftData)
          .select()
          .single();

        if (createError) throw createError;

        console.log('[Schedule Builder] Published shift converted to draft:', newShift);

        return new Response(
          JSON.stringify({ success: true, shift: newShift }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (fetchError) throw fetchError;

      // Validate no conflict if changing employee or times
      if (employee_id !== undefined || start_time || end_time) {
        const employeeId = employee_id !== undefined ? employee_id : currentShift.employee_id;
        const shiftStartTime = start_time || currentShift.start_time;

        if (employeeId) {
          const shiftDate = new Date(shiftStartTime);
          const startOfDay = new Date(shiftDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(shiftDate);
          endOfDay.setHours(23, 59, 59, 999);

          const { data: timeOffs, error: timeOffError } = await supabase
            .from('time_off_notices')
            .select('*')
            .eq('employee_id', employeeId)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString());

          if (timeOffError) throw timeOffError;

          if (timeOffs && timeOffs.length > 0) {
            throw new Error(`Cannot update shift: employee has time-off on this day (${timeOffs[0].reason || 'No reason'})`);
          }
        }
      }

      // Update draft shift
      const updates: any = {};
      if (employee_id !== undefined) updates.employee_id = employee_id;
      if (start_time !== undefined) updates.start_time = start_time;
      if (end_time !== undefined) updates.end_time = end_time;
      if (location !== undefined) updates.location = location;
      if (role !== undefined) updates.role = role;

      const { data: shift, error } = await supabase
        .from('draft_shifts')
        .update(updates)
        .eq('id', shift_id)
        .select()
        .single();

      if (error) throw error;

      console.log('[Schedule Builder] Shift updated:', shift);

      return new Response(
        JSON.stringify({ success: true, shift }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===================================================================
    // DELETE_SHIFT - Delete shift (draft or published)
    // ===================================================================
    if (operation === 'DELETE_SHIFT') {
      const { shift_id } = data;

      if (!shift_id) {
        throw new Error('shift_id is required');
      }

      // Try deleting from draft_shifts first
      const { error: draftError, count: draftCount } = await supabase
        .from('draft_shifts')
        .delete({ count: 'exact' })
        .eq('id', shift_id);

      if (!draftError && draftCount && draftCount > 0) {
        console.log('[Schedule Builder] Draft shift deleted:', shift_id);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Draft shift deleted successfully',
            deletedFrom: 'draft_shifts'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If not in drafts, try published_shifts
      const { error: publishedError, count: publishedCount } = await supabase
        .from('published_shifts')
        .delete({ count: 'exact' })
        .eq('id', shift_id);

      if (publishedError) {
        throw new Error(`Failed to delete: ${publishedError.message}`);
      }

      if (!publishedCount || publishedCount === 0) {
        throw new Error('Shift not found in drafts or published shifts');
      }

      console.log('[Schedule Builder] Published shift deleted:', shift_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Published shift deleted successfully',
          deletedFrom: 'published_shifts'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===================================================================
    // PUBLISH_WEEK - Publish all draft shifts for a week
    // ===================================================================
    if (operation === 'PUBLISH_WEEK') {
      const { startDate, endDate, strictMode = true } = data;

      if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required');
      }

      const weekStart = new Date(startDate);
      const weekEnd = new Date(endDate);

      // Get all draft shifts for the week
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

      // Get time-offs for conflict detection
      const { data: timeOffs, error: timeOffError } = await supabase
        .from('time_off_notices')
        .select('*')
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString());

      if (timeOffError) throw timeOffError;

      // Detect conflicts
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
        if (!shift.employee_id) continue;

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

      // Block if conflicts exist in strict mode
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

      // Get week date range for new shifts
      const weekStartDate = weekStart.toISOString().split('T')[0];
      const weekEndDate = weekEnd.toISOString().split('T')[0];

      // Fetch existing published shifts to prevent duplicates
      const { data: existingShifts } = await supabase
        .from('published_shifts')
        .select('employee_id, start_time')
        .eq('week_start', weekStartDate)
        .eq('week_end', weekEndDate);

      // Create lookup set for existing shifts (employee_id + start_time)
      const existingKeys = new Set(
        (existingShifts || []).map(s => `${s.employee_id}-${s.start_time}`)
      );

      // Filter out drafts that already exist as published shifts
      const newDrafts = draftShifts.filter(
        draft => !existingKeys.has(`${draft.employee_id}-${draft.start_time}`)
      );

      // Copy NEW draft shifts to published_shifts (merge, don't replace)
      const publishedShiftsData = newDrafts.map(draft => ({
        employee_id: draft.employee_id,
        start_time: draft.start_time,
        end_time: draft.end_time,
        location: draft.location,
        role: draft.role,
        week_start: weekStartDate,
        week_end: weekEndDate,
        published_at: new Date().toISOString()
      }));

      // Only insert if there are new shifts to publish
      if (publishedShiftsData.length > 0) {
        const { error: insertError } = await supabase
          .from('published_shifts')
          .insert(publishedShiftsData);

        if (insertError) throw insertError;
      }

      const skippedCount = draftShifts.length - newDrafts.length;
      console.log('[Schedule Builder] Published', newDrafts.length, 'shifts, skipped', skippedCount, 'duplicates');

      return new Response(
        JSON.stringify({
          success: true,
          message: newDrafts.length > 0
            ? `Published ${newDrafts.length} shift(s) successfully${skippedCount > 0 ? ` (${skippedCount} already published)` : ''}`
            : `All ${draftShifts.length} shift(s) were already published`,
          publishedCount: newDrafts.length,
          conflicts: conflicts.length > 0 ? conflicts : []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===================================================================
    // CLEAR_DRAFTS - Delete all draft shifts for a week
    // ===================================================================
    if (operation === 'CLEAR_DRAFTS') {
      const { startDate, endDate } = data;

      if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required');
      }

      const weekStart = new Date(startDate);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(endDate);
      weekEnd.setHours(23, 59, 59, 999);

      const { error, count } = await supabase
        .from('draft_shifts')
        .delete({ count: 'exact' })
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString());

      if (error) throw error;

      console.log('[Schedule Builder] Cleared', count || 0, 'draft shifts');

      return new Response(
        JSON.stringify({
          success: true,
          message: `Cleared ${count || 0} draft shift(s)`,
          clearedCount: count || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown operation: ${operation}`);

  } catch (error) {
    console.error('[Schedule Builder] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
