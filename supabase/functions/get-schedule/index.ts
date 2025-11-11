/**
 * GET-SCHEDULE EDGE FUNCTION
 *
 * Centralized schedule fetching with CORRECT Eastern Time timezone handling.
 * This is the single source of truth for all schedule queries across the app.
 *
 * CRITICAL: Queries published_shifts table (not shifts table which is for drafts only)
 *
 * Features:
 * - Automatic DST detection (EST vs EDT)
 * - Proper timezone offset calculation (-4 or -5 hours)
 * - Week calculations always in Eastern Time
 * - Handles today, this week, next week, custom date ranges
 *
 * Usage:
 * POST /get-schedule
 * Body: {
 *   "query": "this-week" | "next-week" | "today" | "date-range",
 *   "employeeId": "uuid" (optional - filters to one employee),
 *   "startDate": "2025-11-03" (for date-range query),
 *   "endDate": "2025-11-09" (for date-range query)
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, employeeId, startDate, endDate } = await req.json()

    if (!query) {
      return new Response(JSON.stringify({ error: 'query parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'employees' }
    })

    // Helper: Get current date in Eastern Time
    const getEasternDate = () => {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const parts = formatter.formatToParts(now)
      const year = parts.find(p => p.type === 'year')?.value || '2025'
      const month = parts.find(p => p.type === 'month')?.value || '01'
      const day = parts.find(p => p.type === 'day')?.value || '01'
      return new Date(`${year}-${month}-${day}T12:00:00`)
    }

    // Helper: Convert Eastern Time date to UTC date range for database query
    const etDateToUTCRange = (dateStr: string, isEndOfDay = false) => {
      const [year, month, day] = dateStr.split('-').map(Number)

      // Detect if DST is active for this date
      const testDate = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00`)
      const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'short'
      })
      const tzName = tzFormatter.format(testDate).split(' ').pop()
      const isDST = tzName === 'EDT'
      const offsetHours = isDST ? 4 : 5

      // Create UTC timestamp
      const hour = isEndOfDay ? 23 : 0
      const minute = isEndOfDay ? 59 : 0
      const second = isEndOfDay ? 59 : 0

      const utcHour = hour + offsetHours
      const utcDay = utcHour >= 24 ? day + 1 : (utcHour < 0 ? day - 1 : day)
      const utcHourFinal = utcHour >= 24 ? utcHour - 24 : (utcHour < 0 ? utcHour + 24 : utcHour)

      return `${year}-${month.toString().padStart(2, '0')}-${utcDay.toString().padStart(2, '0')}T${utcHourFinal.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}Z`
    }

    let startUTC: string
    let endUTC: string

    // Calculate date range based on query type
    if (query === 'today') {
      const todayET = getEasternDate()
      const todayStr = todayET.toISOString().split('T')[0]
      startUTC = etDateToUTCRange(todayStr, false)
      endUTC = etDateToUTCRange(todayStr, true)
    } else if (query === 'this-week') {
      const todayET = getEasternDate()
      const dayOfWeek = todayET.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const mondayET = new Date(todayET)
      mondayET.setDate(todayET.getDate() - daysFromMonday)
      const sundayET = new Date(mondayET)
      sundayET.setDate(mondayET.getDate() + 6)

      const mondayStr = mondayET.toISOString().split('T')[0]
      const sundayStr = sundayET.toISOString().split('T')[0]

      startUTC = etDateToUTCRange(mondayStr, false)
      endUTC = etDateToUTCRange(sundayStr, true)
    } else if (query === 'next-week') {
      const todayET = getEasternDate()
      const dayOfWeek = todayET.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const mondayNextWeek = new Date(todayET)
      mondayNextWeek.setDate(todayET.getDate() - daysFromMonday + 7)
      const sundayNextWeek = new Date(mondayNextWeek)
      sundayNextWeek.setDate(mondayNextWeek.getDate() + 6)

      const mondayStr = mondayNextWeek.toISOString().split('T')[0]
      const sundayStr = sundayNextWeek.toISOString().split('T')[0]

      startUTC = etDateToUTCRange(mondayStr, false)
      endUTC = etDateToUTCRange(sundayStr, true)
    } else if (query === 'date-range') {
      if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: 'startDate and endDate required for date-range query' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      startUTC = etDateToUTCRange(startDate, false)
      endUTC = etDateToUTCRange(endDate, true)
    } else {
      return new Response(JSON.stringify({ error: 'Invalid query type. Use: today, this-week, next-week, or date-range' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build query - CRITICAL: Use published_shifts table (not shifts which is drafts only)
    let dbQuery = supabase
      .from('published_shifts')
      .select(`
        *,
        employee:employees(*)
      `)
      .gte('start_time', startUTC)
      .lte('start_time', endUTC)
      .order('start_time')

    // Filter by employee if specified
    if (employeeId) {
      dbQuery = dbQuery.eq('employee_id', employeeId)
    }

    const { data, error } = await dbQuery

    if (error) throw error

    return new Response(JSON.stringify({ shifts: data || [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Schedule fetch error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
