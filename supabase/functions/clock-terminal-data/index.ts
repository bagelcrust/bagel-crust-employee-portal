import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CLOCK TERMINAL DATA - AGGREGATE EDGE FUNCTION
 *
 * Single endpoint that returns ALL data needed for Clock In/Out terminal:
 * - Recent clock events (last 10-20 events)
 * - Currently working employees
 * - Server time (Eastern Time)
 *
 * Reduces multiple requests down to 1
 * Used by ClockInOut page for recent activity feed
 *
 * IMPORTANT - PERMISSIONS REQUIRED:
 * This Edge Function requires service_role to have access to the 'employees' schema.
 * Permissions are granted in: supabase/migrations/20251106_grant_service_role_permissions.sql
 *
 * If you get "permission denied for schema employees", run:
 *   GRANT USAGE ON SCHEMA employees TO service_role;
 *   GRANT ALL ON ALL TABLES IN SCHEMA employees TO service_role;
 *   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA employees TO service_role;
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

    // Parse body safely - handle empty body
    let limit = 10;
    try {
      const body = await req.json();
      limit = body.limit || 10;
    } catch {
      // No body provided, use default
      limit = 10;
    }

    // Calculate date range: last 12 hours (for RECENT events only)
    // This ensures only truly recent activity shows, not historical data added to DB
    const now = new Date();
    const twelveHoursAgo = new Date(now);
    twelveHoursAgo.setHours(now.getHours() - 12);

    // Format dates as YYYY-MM-DD for RPC function
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    };

    const startDate = formatDate(twelveHoursAgo);
    const endDate = formatDate(now);

    // ===================================================================
    // FETCH ALL DATA IN PARALLEL
    // ===================================================================
    const [
      recentEventsResult,
      currentlyWorkingResult
    ] = await Promise.all([
      // Get recent clock events (last 3 days) with timezone-aware formatting
      supabase.rpc('get_time_entries_et', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_employee_id: undefined
      }),

      // Get currently working employees (using RPC for efficiency)
      supabase.rpc('get_currently_working')
    ]);

    // Check for errors
    if (recentEventsResult.error) throw recentEventsResult.error;
    if (currentlyWorkingResult.error) throw currentlyWorkingResult.error;

    const recentEvents = recentEventsResult.data || [];
    const currentlyWorking = currentlyWorkingResult.data || [];

    // ===================================================================
    // FORMAT RECENT EVENTS FOR DISPLAY
    // ===================================================================
    const formatRecentEvents = (events: any[]) => {
      // Sort by timestamp descending (most recent first)
      const sortedEvents = events.sort((a: any, b: any) =>
        new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()
      );

      // Limit results
      const limitedEvents = sortedEvents.slice(0, limit);

      // Get today/yesterday dates for relative formatting
      const todayStr = formatDate(new Date());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);

      return limitedEvents.map((event: any) => {
        // Parse pre-formatted Eastern Time string
        // Format: "Nov 6, 2025 08:49 AM EST"
        const parseETTime = (etString: string) => {
          const parts = etString.split(' ');
          return `${parts[3]} ${parts[4]}`; // "08:49 AM"
        };

        const timeStr = parseETTime(event.event_time_et);
        const eventDate = event.event_date_et; // YYYY-MM-DD

        // Determine display format based on date
        let displayTime = timeStr;
        if (eventDate === todayStr) {
          displayTime = timeStr; // Today: just show time
        } else if (eventDate === yesterdayStr) {
          displayTime = `Yesterday ${timeStr}`; // Yesterday: show "Yesterday 3:45 PM"
        } else {
          // Older: show abbreviated date with time (e.g., "Nov 5, 3:45 PM")
          const dateObj = new Date(eventDate);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = monthNames[dateObj.getMonth()];
          const day = dateObj.getDate();
          displayTime = `${month} ${day}, ${timeStr}`;
        }

        return {
          id: event.id,
          employeeId: event.employee_id,
          name: event.employee_name.split(' ')[0], // First name only
          fullName: event.employee_name,
          action: event.event_type === 'in' ? 'Clock In' : 'Clock Out',
          time: displayTime,
          timestamp: event.event_timestamp,
          eventType: event.event_type
        };
      });
    };

    // ===================================================================
    // FORMAT CURRENTLY WORKING EMPLOYEES
    // ===================================================================
    const formatCurrentlyWorking = (workers: any[]) => {
      return workers.map((worker: any) => {
        // Calculate elapsed time
        const clockInTime = new Date(worker.clock_in_time);
        const now = new Date();
        const elapsedMs = now.getTime() - clockInTime.getTime();
        const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
        const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));

        // Format clock in time in Eastern Time
        const clockInET = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(clockInTime);

        return {
          employeeId: worker.employee_id,
          employeeName: worker.employee_name,
          firstName: worker.employee_name.split(' ')[0],
          clockInTime: clockInET,
          clockInTimestamp: worker.clock_in_time,
          elapsedTime: `${elapsedHours}h ${elapsedMinutes}m`
        };
      });
    };

    // ===================================================================
    // GET CURRENT SERVER TIME (Eastern Time)
    // ===================================================================
    const serverTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date());

    // ===================================================================
    // BUILD RESPONSE
    // ===================================================================
    const response = {
      recentEvents: formatRecentEvents(recentEvents),
      currentlyWorking: formatCurrentlyWorking(currentlyWorking),
      serverTime,
      stats: {
        totalRecentEvents: recentEvents.length,
        displayedEvents: Math.min(recentEvents.length, limit),
        currentlyWorkingCount: currentlyWorking.length
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in clock-terminal-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
