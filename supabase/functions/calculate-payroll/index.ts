/**
 * PAYROLL CALCULATION EDGE FUNCTION
 *
 * Calculates hours worked for employees with CORRECT Eastern Time timezone handling.
 * This solves the DST/EST/EDT conversion headaches by doing all date math server-side.
 *
 * Features:
 * - Automatic DST detection (EST vs EDT)
 * - Proper timezone offset calculation (-4 or -5 hours)
 * - Pairs clock-in with clock-out events
 * - Calculates total hours worked
 * - Returns hourly rate and total pay
 *
 * Usage:
 * POST /calculate-payroll
 * Body: {
 *   "employeeId": "uuid",
 *   "startDate": "2025-11-04",  // Eastern Time date (YYYY-MM-DD)
 *   "endDate": "2025-11-06"     // Eastern Time date (YYYY-MM-DD)
 * }
 *
 * Returns: {
 *   "employeeId": "uuid",
 *   "employeeName": "John Doe",
 *   "startDate": "2025-11-04",
 *   "endDate": "2025-11-06",
 *   "timezone": "America/New_York",
 *   "shifts": [
 *     {
 *       "clockIn": "2025-11-05T06:00:00-05:00",
 *       "clockOut": "2025-11-05T14:30:00-05:00",
 *       "hoursWorked": 8.5,
 *       "clockInEST": "Nov 5, 2025 6:00 AM",
 *       "clockOutEST": "Nov 5, 2025 2:30 PM"
 *     }
 *   ],
 *   "totalHours": 8.5,
 *   "hourlyRate": 18.00,
 *   "totalPay": 153.00
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TimeEntry {
  id: number
  employee_id: string
  event_type: string
  event_timestamp: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string | null
}

interface PayRate {
  rate: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { employeeId, startDate, endDate } = await req.json()

    if (!employeeId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'employeeId, startDate, and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'employees' }
    })

    // Convert Eastern Time dates to UTC for database query
    // User provides dates like "2025-11-05" which are meant to be Eastern Time
    // We need to convert to UTC for database query

    // Helper: Convert Eastern Time date string to UTC timestamp
    const etDateToUTC = (dateStr: string, isEndOfDay: boolean = false): string => {
      // Create date parts for the Eastern Time date
      const [year, month, day] = dateStr.split('-').map(Number)

      // Use Intl.DateTimeFormat to get the correct UTC offset for this date
      const etDate = new Date(Date.UTC(year, month - 1, day, isEndOfDay ? 23 : 0, isEndOfDay ? 59 : 0, isEndOfDay ? 59 : 0))

      // Format in Eastern Time to get the actual wall clock time
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })

      const parts = formatter.formatToParts(etDate)
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || ''

      // Build ISO string: YYYY-MM-DDTHH:MM:SS
      const etTimeStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}:${getPart('second')}`

      // Parse this as a date without timezone (treated as UTC by default)
      // Then we need to get the actual UTC equivalent
      // Actually, let's use a simpler approach: just add/subtract the offset

      // For Eastern Time: EST is UTC-5, EDT is UTC-4
      // We can detect which one by checking if DST is active
      const testDate = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00`)
      const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'short'
      })
      const tzName = tzFormatter.format(testDate).split(' ').pop()
      const isDST = tzName === 'EDT'
      const offsetHours = isDST ? 4 : 5

      // Create UTC timestamp
      const utcHour = isEndOfDay ? 23 + offsetHours : 0 + offsetHours
      const utcDay = isEndOfDay && utcHour >= 24 ? day + 1 : utcHour < 0 ? day - 1 : day
      const utcHourFinal = utcHour >= 24 ? utcHour - 24 : utcHour < 0 ? utcHour + 24 : utcHour

      return `${year}-${month.toString().padStart(2, '0')}-${utcDay.toString().padStart(2, '0')}T${utcHourFinal.toString().padStart(2, '0')}:${isEndOfDay ? '59' : '00'}:${isEndOfDay ? '59' : '00'}Z`
    }

    const startDateUTC = etDateToUTC(startDate, false)
    const endDateUTC = etDateToUTC(endDate, true)

    // Get time entries for employee in date range
    const { data: timeEntries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('event_timestamp', startDateUTC)
      .lte('event_timestamp', endDateUTC)
      .order('event_timestamp', { ascending: true })

    if (entriesError) throw entriesError

    // Get employee info
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .eq('id', employeeId)
      .single()

    if (employeeError) throw employeeError

    // Get pay rate
    const { data: payRate, error: payRateError } = await supabase
      .from('pay_rates')
      .select('rate')
      .eq('employee_id', employeeId)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (payRateError) throw payRateError

    // Helper: Format date in Eastern Time
    const formatET = (utcTimestamp: string) => {
      const date = new Date(utcTimestamp)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      })
      return formatter.format(date)
    }

    // Helper: Get timezone offset
    const getOffset = (utcTimestamp: string) => {
      const date = new Date(utcTimestamp)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'longOffset'
      })
      const parts = formatter.formatToParts(date)
      const offsetPart = parts.find(p => p.type === 'timeZoneName')
      return offsetPart?.value.replace('GMT', '') || ''
    }

    // Pair clock-in with clock-out events
    const shifts: any[] = []
    let currentClockIn: TimeEntry | null = null

    for (const entry of (timeEntries as TimeEntry[])) {
      if (entry.event_type === 'in') {
        currentClockIn = entry
      } else if (entry.event_type === 'out' && currentClockIn) {
        // Calculate hours worked
        const clockInTime = new Date(currentClockIn.event_timestamp)
        const clockOutTime = new Date(entry.event_timestamp)
        const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

        shifts.push({
          clockIn: currentClockIn.event_timestamp,
          clockOut: entry.event_timestamp,
          clockInEST: formatET(currentClockIn.event_timestamp),
          clockOutEST: formatET(entry.event_timestamp),
          clockInOffset: getOffset(currentClockIn.event_timestamp),
          clockOutOffset: getOffset(entry.event_timestamp),
          hoursWorked: Math.round(hoursWorked * 100) / 100 // Round to 2 decimals
        })

        currentClockIn = null
      }
    }

    // Calculate totals
    const totalHours = shifts.reduce((sum, shift) => sum + shift.hoursWorked, 0)
    const hourlyRate = payRate?.rate || 0
    const totalPay = Math.round(totalHours * hourlyRate * 100) / 100

    // Employee name
    const employeeName = employee.last_name
      ? `${employee.first_name} ${employee.last_name}`
      : employee.first_name

    return new Response(
      JSON.stringify({
        employeeId,
        employeeName,
        startDate,
        endDate,
        timezone: 'America/New_York',
        shifts,
        totalHours: Math.round(totalHours * 100) / 100,
        hourlyRate,
        totalPay,
        unpaired: currentClockIn ? [{
          clockIn: currentClockIn.event_timestamp,
          clockInEST: formatET(currentClockIn.event_timestamp),
          note: 'Still clocked in (no clock-out yet)'
        }] : []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Payroll calculation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
