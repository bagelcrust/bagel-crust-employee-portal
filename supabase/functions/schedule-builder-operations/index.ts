import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SCHEDULE BUILDER OPERATIONS - Edge Function
 *
 * Handles ALL schedule builder operations with service_role key:
 * - CREATE shift (draft)
 * - UPDATE shift (draft)
 * - DELETE shift (draft or published)
 *
 * Uses service_role to bypass RLS issues
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
      throw new Error('operation is required (CREATE, UPDATE, or DELETE)');
    }

    // ===================================================================
    // CREATE SHIFT
    // ===================================================================
    if (operation === 'CREATE') {
      const { employee_id, start_time, end_time, location, role } = data;

      if (!start_time || !end_time || !location) {
        throw new Error('start_time, end_time, and location are required');
      }

      const { data: shift, error } = await supabase
        .from('draft_shifts')
        .insert({
          employee_id: employee_id || null, // null = open shift
          start_time,
          end_time,
          location,
          role: role || null
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, shift }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===================================================================
    // UPDATE SHIFT
    // ===================================================================
    if (operation === 'UPDATE') {
      const { shift_id, employee_id, start_time, end_time, location, role } = data;

      if (!shift_id) {
        throw new Error('shift_id is required');
      }

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

      return new Response(
        JSON.stringify({ success: true, shift }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===================================================================
    // DELETE SHIFT
    // ===================================================================
    if (operation === 'DELETE') {
      const { shift_id } = data;

      if (!shift_id) {
        throw new Error('shift_id is required');
      }

      // Try deleting from draft_shifts first
      const { error: draftError, count: draftCount } = await supabase
        .from('draft_shifts')
        .delete({ count: 'exact' })
        .eq('id', shift_id);

      // If found and deleted from drafts, we're done
      if (!draftError && draftCount && draftCount > 0) {
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

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Published shift deleted successfully',
          deletedFrom: 'published_shifts'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown operation: ${operation}`);

  } catch (error) {
    console.error('Error in schedule-builder-operations:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
