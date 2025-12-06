import { useQuery } from '@tanstack/react-query'
import { supabase } from '../shared/supabase-client'
import { logData, logError, logApiCall } from '../shared/debug-utils'

/**
 * Get current date/time in Eastern timezone
 * CRITICAL: All date calculations must use this, not new Date()
 */
function getEasternNow(): Date {
  const etString = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  return new Date(etString)
}

/**
 * Helper to group schedule by day of week
 * Uses server-provided day_of_week_et (from Postgres get_eastern_dow)
 * Day mapping: 0=Monday, 1=Tuesday, ..., 6=Sunday
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
    // USE SERVER-PROVIDED day_of_week_et - don't recalculate!
    // Postgres get_eastern_dow returns: 0=Mon, 1=Tue, ..., 6=Sun
    const dayOfWeek = schedule.day_of_week_et
    const dayName = dayOrder[dayOfWeek]

    // Parse times from Eastern time strings (format: "2025-12-03 07:00:00")
    const startTimeParts = schedule.start_time.split(' ')[1]?.split(':') || ['0', '0']
    const endTimeParts = schedule.end_time.split(' ')[1]?.split(':') || ['0', '0']

    const startHours = parseInt(startTimeParts[0])
    const startMinutes = parseInt(startTimeParts[1])
    const endHours = parseInt(endTimeParts[0])
    const endMinutes = parseInt(endTimeParts[1])

    // Calculate hours scheduled
    const hoursScheduled = (endHours * 60 + endMinutes - startHours * 60 - startMinutes) / 60

    grouped[dayName].push({
      startTime: `${startTimeParts[0]}:${startTimeParts[1]}`,
      endTime: `${endTimeParts[0]}:${endTimeParts[1]}`,
      hoursScheduled: hoursScheduled.toFixed(1),
      location: schedule.location,
      // Pass through server data for next shift calculation
      day_of_week_et: dayOfWeek,
      start_date_et: schedule.start_date_et
    })
  })

  return grouped
}

/**
 * Hook to fetch employee's personal schedule
 * Returns this week and next week, grouped by day
 * USES POSTGRES RPC for proper Eastern Time timezone handling
 *
 * Naming matches Postgres function: fetch_my_schedule
 */
export function useGetMySchedule(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['employee-schedule', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID required')

      console.log('[SCHEDULE] Fetching employee schedule...', new Date().toISOString())
      const start = performance.now()
      const finishLog = logApiCall('SCHEDULE', 'fetch_my_schedule', { employeeId: employeeId.substring(0, 8) + '...' })

      // Calculate week boundaries IN EASTERN TIME (Monday-Sunday weeks)
      const today = getEasternNow()
      const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...6=Sat
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      const thisWeekStart = new Date(today)
      thisWeekStart.setDate(today.getDate() - daysFromMonday) // Monday
      const thisWeekEnd = new Date(thisWeekStart)
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6) // Sunday

      const nextWeekStart = new Date(thisWeekEnd)
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1) // Next Monday
      const nextWeekEnd = new Date(nextWeekStart)
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6) // Next Sunday

      // Format dates as YYYY-MM-DD (already in Eastern from getEasternNow)
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      // Fetch both weeks in parallel using Postgres RPC
      const [thisWeek, nextWeek] = await Promise.all([
        supabase
          .schema('employees')
          .rpc('fetch_my_schedule', {
            p_employee_id: employeeId,
            p_start_date: formatDate(thisWeekStart),
            p_end_date: formatDate(thisWeekEnd)
          }),
        supabase
          .schema('employees')
          .rpc('fetch_my_schedule', {
            p_employee_id: employeeId,
            p_start_date: formatDate(nextWeekStart),
            p_end_date: formatDate(nextWeekEnd)
          })
      ])

      if (thisWeek.error) {
        logError('SCHEDULE', 'Failed to fetch this week', thisWeek.error)
        throw new Error(`Failed to fetch this week: ${thisWeek.error.message}`)
      }
      if (nextWeek.error) {
        logError('SCHEDULE', 'Failed to fetch next week', nextWeek.error)
        throw new Error(`Failed to fetch next week: ${nextWeek.error.message}`)
      }

      finishLog?.()
      console.log(`[SCHEDULE] Employee schedule fetched in ${(performance.now() - start).toFixed(0)}ms`)

      logData('SCHEDULE', 'This week raw data', thisWeek.data, ['start_time_et', 'end_time_et', 'location'])
      logData('SCHEDULE', 'Next week raw data', nextWeek.data, ['start_time_et', 'end_time_et', 'location'])

      // Map RPC field names to expected format
      const mapScheduleFields = (schedule: any) => ({
        ...schedule,
        start_time: schedule.start_time_et,
        end_time: schedule.end_time_et
      })

      // Group by day
      const thisWeekByDay = groupScheduleByDay((thisWeek.data || []).map(mapScheduleFields))
      const nextWeekByDay = groupScheduleByDay((nextWeek.data || []).map(mapScheduleFields))

      logData('SCHEDULE', 'This week grouped', thisWeekByDay)
      logData('SCHEDULE', 'Next week grouped', nextWeekByDay)

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
 * Uses server-provided day_of_week_et (from Postgres get_eastern_dow)
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
    // USE SERVER-PROVIDED day_of_week_et - don't recalculate!
    const dayOfWeek = schedule.day_of_week_et
    const dayName = dayOrder[dayOfWeek]

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
 * Naming matches Postgres function: fetch_team_schedule
 */
export function useGetTeamSchedule(enabled = true) {
  return useQuery({
    queryKey: ['team-schedule'],
    queryFn: async () => {
      console.log('[TEAM SCHEDULE] Fetching team schedule...', new Date().toISOString())
      const start = performance.now()
      const finishLog = logApiCall('TEAM_SCHEDULE', 'fetch_team_schedule', {})

      // Calculate week boundaries IN EASTERN TIME (Monday-Sunday weeks)
      const today = getEasternNow()
      const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...6=Sat
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      const thisWeekStart = new Date(today)
      thisWeekStart.setDate(today.getDate() - daysFromMonday) // Monday
      const thisWeekEnd = new Date(thisWeekStart)
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6) // Sunday

      const nextWeekStart = new Date(thisWeekEnd)
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1) // Next Monday
      const nextWeekEnd = new Date(nextWeekStart)
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6) // Next Sunday

      // Format dates as YYYY-MM-DD (already in Eastern from getEasternNow)
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      // Fetch both weeks in parallel using Postgres RPC
      const [thisWeek, nextWeek] = await Promise.all([
        supabase
          .schema('employees')
          .rpc('fetch_team_schedule', {
            p_start_date: formatDate(thisWeekStart),
            p_end_date: formatDate(thisWeekEnd)
          }),
        supabase
          .schema('employees')
          .rpc('fetch_team_schedule', {
            p_start_date: formatDate(nextWeekStart),
            p_end_date: formatDate(nextWeekEnd)
          })
      ])

      if (thisWeek.error) {
        logError('TEAM_SCHEDULE', 'Failed to fetch this week', thisWeek.error)
        throw new Error(`Failed to fetch this week: ${thisWeek.error.message}`)
      }
      if (nextWeek.error) {
        logError('TEAM_SCHEDULE', 'Failed to fetch next week', nextWeek.error)
        throw new Error(`Failed to fetch next week: ${nextWeek.error.message}`)
      }

      finishLog?.()
      console.log(`[TEAM SCHEDULE] Team schedule fetched in ${(performance.now() - start).toFixed(0)}ms`)

      logData('TEAM_SCHEDULE', 'This week team data', thisWeek.data, ['start_time_et', 'end_time_et', 'employee_id'])
      logData('TEAM_SCHEDULE', 'Next week team data', nextWeek.data, ['start_time_et', 'end_time_et', 'employee_id'])

      // Map RPC field names to expected format (including nested employee object)
      const mapTeamScheduleFields = (schedule: any) => ({
        ...schedule,
        start_time: schedule.start_time_et,
        end_time: schedule.end_time_et,
        employee: {
          first_name: schedule.employee_first_name,
          last_name: schedule.employee_last_name
        }
      })

      // Group by day (includes all employees)
      const fullThisWeekByDay = groupTeamScheduleByDay((thisWeek.data || []).map(mapTeamScheduleFields))
      const fullNextWeekByDay = groupTeamScheduleByDay((nextWeek.data || []).map(mapTeamScheduleFields))

      logData('TEAM_SCHEDULE', 'This week grouped by day', fullThisWeekByDay)
      logData('TEAM_SCHEDULE', 'Next week grouped by day', fullNextWeekByDay)

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
