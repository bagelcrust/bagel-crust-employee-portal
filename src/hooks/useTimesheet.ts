import { useQuery } from '@tanstack/react-query'
import { timeclockApi } from '../supabase/supabase'
import { format } from 'date-fns'

/**
 * Calculate weekly hours from time entries
 * @param events - Array of time clock events
 * @param weekOffset - 0 for this week, -1 for last week, etc.
 */
function calculateWeeklyHours(events: any[], weekOffset: number = 0) {
  // Week starts on Monday (not Sunday)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - daysFromMonday + (weekOffset * 7))
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  // Filter events for this week using event_timestamp
  const thisWeekEvents = events.filter(e => {
    const eventDate = new Date(e.event_timestamp)
    return eventDate >= weekStart && eventDate < weekEnd
  })

  // Sort all events chronologically
  const sortedEvents = thisWeekEvents.sort((a, b) =>
    new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
  )

  // Calculate daily hours by pairing consecutive IN/OUT events
  const dailyHours: any[] = []
  let totalHours = 0
  let clockIn: any = null

  sortedEvents.forEach(event => {
    if (event.event_type === 'in') {
      clockIn = event
    } else if (event.event_type === 'out' && clockIn) {
      const inTime = new Date(clockIn.event_timestamp)
      const outTime = new Date(event.event_timestamp)
      const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)

      // Skip impossible shifts (over 16 hours = likely missing clock out/in)
      if (hours > 16) {
        console.warn('⚠️ Skipping impossible shift:', hours.toFixed(2), 'hours from', inTime, 'to', outTime)
        clockIn = null
        return
      }

      // Use the clock-in date as the reference date
      const dateKey = inTime.toISOString().split('T')[0]

      dailyHours.push({
        date: dateKey,
        day_name: format(inTime, 'EEEE'),
        clock_in: inTime.toTimeString().slice(0, 5), // HH:MM
        clock_out: outTime.toTimeString().slice(0, 5), // HH:MM
        hours_worked: hours.toFixed(2)
      })

      totalHours += hours
      clockIn = null // Reset for next pair
    }
  })

  return {
    days: dailyHours,
    totalHours: totalHours.toFixed(2)
  }
}

/**
 * Hook to fetch employee's timesheet (hours worked)
 * Returns this week and last week's data
 */
export function useTimesheet(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['timesheet', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID required')

      // Fetch enough events to cover ~2 weeks for one employee
      const recentEvents = await timeclockApi.getRecentEvents(200)

      // Filter for this employee only
      const myEvents = recentEvents.filter(e => e.employee_id === employeeId)

      // Calculate hours for this week and last week
      const thisWeekHours = calculateWeeklyHours(myEvents, 0)
      const lastWeekHours = calculateWeeklyHours(myEvents, -1)

      return {
        thisWeek: thisWeekHours,
        lastWeek: lastWeekHours
      }
    },
    enabled: !!employeeId && enabled,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (hours change more frequently)
    gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
  })
}
