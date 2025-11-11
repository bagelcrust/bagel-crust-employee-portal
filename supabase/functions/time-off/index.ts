/**
 * TIME-OFF EDGE FUNCTION
 *
 * Centralized time-off management - requests, approvals, queries.
 * Handles timezone-aware date range queries.
 *
 * CRITICAL: All date/time logic MUST happen server-side in Eastern Time
 * to avoid browser timezone bugs that cause date shifting.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'employees' }
    })

    const { operation, startDate, endDate, employeeId, id, reason, status } = await req.json()

    /**
     * TIMEZONE-SAFE DATE PARSING
     * Input: "2025-11-20" (YYYY-MM-DD date string)
     * Output: ISO timestamp at midnight Eastern Time
     *
     * CRITICAL: We parse date components manually and construct UTC timestamp
     * to avoid browser/server timezone bugs. Eastern Time = UTC-5 (EST) or UTC-4 (EDT)
     * For simplicity, we use UTC-5 (EST) offset consistently.
     */
    const toISOStart = (dateStr: string): string => {
      const [year, month, day] = dateStr.split('-').map(Number)
      // Midnight ET = 00:00:00 ET = 05:00:00 UTC (EST offset)
      const date = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0))
      return date.toISOString()
    }

    const toISOEnd = (dateStr: string): string => {
      const [year, month, day] = dateStr.split('-').map(Number)
      // End of day ET = 23:59:59.999 ET = 04:59:59.999 UTC next day (EST offset)
      const date = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59, 999))
      return date.toISOString()
    }

    // GET TIME-OFFS FOR RANGE
    if (operation === 'getForRange') {
      if (!startDate || !endDate) throw new Error('Start and end dates required')

      let query = supabase
        .from('time_off_notices')
        .select('*, employee:employees(*)')
        .gte('start_time', toISOStart(startDate))
        .lte('start_time', toISOEnd(endDate))
        .order('start_time')

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      const { data, error } = await query
      if (error) throw error

      return new Response(JSON.stringify({ timeOffs: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET TIME-OFFS FOR EMPLOYEE
    if (operation === 'getForEmployee') {
      if (!employeeId) throw new Error('Employee ID required')

      const { data, error } = await supabase
        .from('time_off_notices')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_time', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify({ timeOffs: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // REQUEST TIME OFF
    if (operation === 'request') {
      if (!employeeId || !startDate || !endDate) {
        throw new Error('Employee ID, start date, and end date required')
      }

      const timeOffData = {
        employee_id: employeeId,
        start_time: toISOStart(startDate),
        end_time: toISOEnd(endDate),
        reason: reason || null,
        status: 'pending',
        requested_date: new Date().toISOString(),
        requested_via: 'app',
        source_text: null
      }

      const { data, error } = await supabase
        .from('time_off_notices')
        .insert(timeOffData)
        .select('*')
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ timeOff: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // APPROVE TIME OFF
    if (operation === 'approve') {
      if (!id) throw new Error('Time-off ID required')

      const { data, error } = await supabase
        .from('time_off_notices')
        .update({ status: 'approved' })
        .eq('id', id)
        .select('*, employee:employees(*)')
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ timeOff: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DENY TIME OFF
    if (operation === 'deny') {
      if (!id) throw new Error('Time-off ID required')

      const { data, error } = await supabase
        .from('time_off_notices')
        .update({ status: 'denied', reason: reason || 'Denied' })
        .eq('id', id)
        .select('*, employee:employees(*)')
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ timeOff: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error(`Unknown operation: ${operation}`)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
