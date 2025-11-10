import { useQuery } from '@tanstack/react-query'
import { getSchedule } from '../supabase/edgeFunctions'

/**
 * Helper to group schedule by day of week
 * Used for "My Schedule" view (filtered to one employee)
 */
function groupScheduleByDay(schedules: any[]) {
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const grouped: any = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  }

  schedules.forEach(schedule => {
    const startDate = new Date(schedule.start_time)
    const endDate = new Date(schedule.end_time)
    const dayOfWeek = startDate.getDay()
    const dayName = dayOrder[dayOfWeek === 0 ? 6 : dayOfWeek - 1]

    // Calculate hours scheduled
    const hoursScheduled = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

    // Format times as HH:MM
    const formatTimeString = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }

    grouped[dayName].push({
      startTime: formatTimeString(startDate),
      endTime: formatTimeString(endDate),
      hoursScheduled: hoursScheduled.toFixed(1),
      location: schedule.location
    })
  })

  return grouped
}

/**
 * Hook to fetch employee's personal schedule
 * Returns this week and next week, grouped by day
 * USES EDGE FUNCTION for proper Eastern Time timezone handling
 */
export function useEmployeeSchedule(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['employee-schedule', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID required')

      console.log('[SCHEDULE] Fetching employee schedule...', new Date().toISOString())
      const start = performance.now()

      // Fetch both weeks in parallel using Edge Function (handles timezone correctly)
      const [thisWeekSchedules, nextWeekSchedules] = await Promise.all([
        getSchedule('this-week', employeeId),
        getSchedule('next-week', employeeId)
      ])

      console.log(`[SCHEDULE] Employee schedule fetched in ${(performance.now() - start).toFixed(0)}ms`)

      // Group by day
      const thisWeekByDay = groupScheduleByDay(thisWeekSchedules)
      const nextWeekByDay = groupScheduleByDay(nextWeekSchedules)

      return {
        thisWeek: thisWeekByDay,
        nextWeek: nextWeekByDay
      }
    },
    enabled: !!employeeId && enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  })
}

/**
 * Helper to group team schedule by day (keeps full schedule objects with employee data)
 */
function groupTeamScheduleByDay(schedules: any[]) {
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const grouped: any = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  }

  schedules.forEach(schedule => {
    const startDate = new Date(schedule.start_time)
    const dayOfWeek = startDate.getDay()
    const dayName = dayOrder[dayOfWeek === 0 ? 6 : dayOfWeek - 1]

    // Keep the full schedule object with employee data
    grouped[dayName].push(schedule)
  })

  return grouped
}

/**
 * Hook to fetch full team schedule
 * Returns all employees' schedules for this week and next week
 * USES EDGE FUNCTION for proper Eastern Time timezone handling
 */
export function useTeamSchedule(enabled = true) {
  return useQuery({
    queryKey: ['team-schedule'],
    queryFn: async () => {
      console.log('[TEAM SCHEDULE] Fetching team schedule...', new Date().toISOString())
      const start = performance.now()

      // Fetch both weeks in parallel using Edge Function (handles timezone correctly)
      const [thisWeekSchedules, nextWeekSchedules] = await Promise.all([
        getSchedule('this-week'), // No employeeId = all employees
        getSchedule('next-week')
      ])

      console.log(`[TEAM SCHEDULE] Team schedule fetched in ${(performance.now() - start).toFixed(0)}ms`)

      // Group by day (includes all employees)
      const fullThisWeekByDay = groupTeamScheduleByDay(thisWeekSchedules)
      const fullNextWeekByDay = groupTeamScheduleByDay(nextWeekSchedules)

      return {
        thisWeek: fullThisWeekByDay,
        nextWeek: fullNextWeekByDay
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  })
}
