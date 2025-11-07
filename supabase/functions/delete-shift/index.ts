import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * DELETE SHIFT - Edge Function
 *
 * Deletes a shift from either draft_shifts or published_shifts table.
 * Uses service_role to bypass RLS and delete from published_shifts.
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

    const { shiftId } = await req.json();

    if (!shiftId) {
      throw new Error('shiftId is required');
    }

    // Try deleting from draft_shifts first
    const { error: draftError, count: draftCount } = await supabase
      .from('draft_shifts')
      .delete({ count: 'exact' })
      .eq('id', shiftId);

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
      .eq('id', shiftId);

    if (publishedError) {
      throw new Error(`Failed to delete from published_shifts: ${publishedError.message}`);
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

  } catch (error) {
    console.error('Error deleting shift:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Unknown error'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
