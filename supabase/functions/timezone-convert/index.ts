/**
 * TIMEZONE CONVERSION EDGE FUNCTION
 *
 * Converts UTC timestamps to Eastern Time (America/New_York) with automatic DST handling.
 * This solves the timezone headache by doing conversions server-side with proper timezone data.
 *
 * Usage:
 * POST /timezone-convert
 * Body: {
 *   "timestamps": ["2025-11-05T14:30:00Z", "2025-11-06T14:30:00Z"],
 *   "toTimezone": "America/New_York"  // optional, defaults to America/New_York
 * }
 *
 * Returns: {
 *   "conversions": [
 *     {
 *       "utc": "2025-11-05T14:30:00Z",
 *       "local": "2025-11-05T10:30:00-04:00",
 *       "formatted": "Nov 5, 2025 10:30 AM EST",
 *       "timezone": "America/New_York",
 *       "offset": "-04:00",
 *       "isDST": true
 *     }
 *   ]
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// CORS headers for frontend requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { timestamps, toTimezone = 'America/New_York' } = await req.json()

    if (!timestamps || !Array.isArray(timestamps)) {
      return new Response(
        JSON.stringify({ error: 'timestamps array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert each timestamp
    const conversions = timestamps.map((utcTimestamp: string) => {
      // Parse UTC timestamp
      const utcDate = new Date(utcTimestamp)

      if (isNaN(utcDate.getTime())) {
        return {
          utc: utcTimestamp,
          error: 'Invalid timestamp format'
        }
      }

      // Format in target timezone using Intl.DateTimeFormat
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      })

      const formatted = formatter.format(utcDate)

      // Get timezone offset
      const offsetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        timeZoneName: 'longOffset'
      })
      const offsetParts = offsetFormatter.formatToParts(utcDate)
      const offsetPart = offsetParts.find(part => part.type === 'timeZoneName')
      const offset = offsetPart?.value.replace('GMT', '') || ''

      // Check if DST is active
      const tzName = formatted.split(' ').pop() // Gets EST or EDT
      const isDST = tzName === 'EDT'

      // Create ISO string in local timezone
      const localParts = new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(utcDate)

      const year = localParts.find(p => p.type === 'year')?.value
      const month = localParts.find(p => p.type === 'month')?.value
      const day = localParts.find(p => p.type === 'day')?.value
      const hour = localParts.find(p => p.type === 'hour')?.value
      const minute = localParts.find(p => p.type === 'minute')?.value
      const second = localParts.find(p => p.type === 'second')?.value

      const localISO = `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`

      return {
        utc: utcTimestamp,
        local: localISO,
        formatted: formatted,
        timezone: toTimezone,
        offset: offset,
        isDST: isDST,
        timezoneName: tzName
      }
    })

    return new Response(
      JSON.stringify({ conversions }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
