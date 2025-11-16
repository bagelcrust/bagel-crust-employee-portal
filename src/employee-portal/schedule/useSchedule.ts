import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabase/supabase'

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
 * USES POSTGRES RPC for proper Eastern Time timezone handling
 *
 * Naming matches Postgres function: get_my_schedule
 */
export function useGetMySchedule(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['employee-schedule', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID required')

      console.log('[SCHEDULE] Fetching employee schedule...', new Date().toISOString())
      const start = performance.now()

      // Calculate week boundaries
      const today = new Date()
      const thisWeekStart = new Date(today)
      thisWeekStart.setDate(today.getDate() - today.getDay()) // Sunday
      const thisWeekEnd = new Date(thisWeekStart)
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6) // Saturday

      const nextWeekStart = new Date(thisWeekEnd)
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1)
      const nextWeekEnd = new Date(nextWeekStart)
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6)

      // Format dates as YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split('T')[0]

      // Fetch both weeks in parallel using Postgres RPC
      const [thisWeek, nextWeek] = await Promise.all([
        supabase
          .schema('employees')
          .rpc('get_my_schedule', {
            p_employee_id: employeeId,
            p_start_date: formatDate(thisWeekStart),
            p_end_date: formatDate(thisWeekEnd)
          }),
        supabase
          .schema('employees')
          .rpc('get_my_schedule', {
            p_employee_id: employeeId,
            p_start_date: formatDate(nextWeekStart),
            p_end_date: formatDate(nextWeekEnd)
          })
      ])

      if (thisWeek.error) throw new Error(`Failed to fetch this week: ${thisWeek.error.message}`)
      if (nextWeek.error) throw new Error(`Failed to fetch next week: ${nextWeek.error.message}`)

      console.log(`[SCHEDULE] Employee schedule fetched in ${(performance.now() - start).toFixed(0)}ms`)

      // Group by day
      const thisWeekByDay = groupScheduleByDay(thisWeek.data || [])
      const nextWeekByDay = groupScheduleByDay(nextWeek.data || [])

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
 * USES POSTGRES RPC for proper Eastern Time timezone handling
 *
 * Naming matches Postgres function: get_team_schedule
 */
export function useGetTeamSchedule(enabled = true) {
  return useQuery({
    queryKey: ['team-schedule'],
    queryFn: async () => {
      console.log('[TEAM SCHEDULE] Fetching team schedule...', new Date().toISOString())
      const start = performance.now()

      // Calculate week boundaries
      const today = new Date()
      const thisWeekStart = new Date(today)
      thisWeekStart.setDate(today.getDate() - today.getDay()) // Sunday
      const thisWeekEnd = new Date(thisWeekStart)
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6) // Saturday

      const nextWeekStart = new Date(thisWeekEnd)
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1)
      const nextWeekEnd = new Date(nextWeekStart)
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6)

      // Format dates as YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split('T')[0]

      // Fetch both weeks in parallel using Postgres RPC
      const [thisWeek, nextWeek] = await Promise.all([
        supabase
          .schema('employees')
          .rpc('get_team_schedule', {
            p_start_date: formatDate(thisWeekStart),
            p_end_date: formatDate(thisWeekEnd)
          }),
        supabase
          .schema('employees')
          .rpc('get_team_schedule', {
            p_start_date: formatDate(nextWeekStart),
            p_end_date: formatDate(nextWeekEnd)
          })
      ])

      if (thisWeek.error) throw new Error(`Failed to fetch this week: ${thisWeek.error.message}`)
      if (nextWeek.error) throw new Error(`Failed to fetch next week: ${nextWeek.error.message}`)

      console.log(`[TEAM SCHEDULE] Team schedule fetched in ${(performance.now() - start).toFixed(0)}ms`)

      // Group by day (includes all employees)
      const fullThisWeekByDay = groupTeamScheduleByDay(thisWeek.data || [])
      const fullNextWeekByDay = groupTeamScheduleByDay(nextWeek.data || [])

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
