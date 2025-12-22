import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../shared/supabase-client'
import type { DraftShift, PublishedShift, TimeOff, Employee } from '../shared/supabase-client'
import { startOfWeek, endOfWeek, addWeeks, format, startOfDay, addDays } from 'date-fns'
import { logError, logApiCall } from '../shared/debug-utils'

/**
 * Combined shift type for Schedule Builder UI
 * Can be either a draft shift or a published shift
 */
export type ScheduleShift = (DraftShift | PublishedShift) & {
  status: 'draft' | 'published'
}

/**
 * Custom hook for Schedule Builder
 * Manages week navigation, employee data, and shift data
 *
 * Naming matches Postgres function: fetch_schedule_builder_data
 *
 * Week offset system: -1 = last week, 0 = this week, 1 = next week, 2 = week after
 */
export function useGetScheduleBuilderData() {
  // Week offset from current week (-1, 0, 1, 2)
  const [weekOffset, setWeekOffset] = useState(0)

  // Calculate week start based on offset
  const currentWeekStart = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return addWeeks(thisWeekStart, weekOffset)
  }, [weekOffset])

  // Calculate week end
  const currentWeekEnd = useMemo(() =>
    endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    [currentWeekStart]
  )

  // Format date range string
  const dateRangeString = useMemo(() => {
    return `${format(currentWeekStart, 'MMM d, yyyy')} - ${format(currentWeekEnd, 'MMM d, yyyy')}`
  }, [currentWeekStart, currentWeekEnd])

  // Check if current week is this week
  const isThisWeek = weekOffset === 0

  // Fetch ALL schedule builder data in a single call to Postgres function
  // Calls: fetch_schedule_builder_data(start_date, end_date)
  const { data: scheduleData, isLoading, refetch } = useQuery({
    queryKey: ['scheduleBuilderData', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: async () => {
      const finishLog = logApiCall('SCHEDULE_BUILDER', 'fetch_schedule_builder_data', {
        startDate: format(currentWeekStart, 'yyyy-MM-dd'),
        endDate: format(currentWeekEnd, 'yyyy-MM-dd')
      })

      try {
        const { data, error } = await supabase
          .schema('employees')
          .rpc('fetch_schedule_builder_data', {
            p_start_date: format(currentWeekStart, 'yyyy-MM-dd'),
            p_end_date: format(currentWeekEnd, 'yyyy-MM-dd')
          })

        if (error) {
          logError('SCHEDULE_BUILDER', 'RPC call failed', error)
          throw error
        }

        finishLog?.()
        return data
      } catch (error) {
        logError('SCHEDULE_BUILDER', 'Failed to fetch schedule builder data', error, {
          startDate: format(currentWeekStart, 'yyyy-MM-dd'),
          endDate: format(currentWeekEnd, 'yyyy-MM-dd')
        })
        throw error
      }
    },
    staleTime: 0, // Always fetch fresh data when actively building schedules
  })


  // Extract and sort employees (owners at bottom)
  const employees = useMemo(() => {
    const rawEmployees = (scheduleData?.employees || []) as Employee[]
    const sorted = [...rawEmployees].sort((a, b) => {
      // Put owners at the bottom
      if (a.role === 'owner' && b.role !== 'owner') return 1
      if (a.role !== 'owner' && b.role === 'owner') return -1
      // Otherwise sort alphabetically by first name
      return a.first_name.localeCompare(b.first_name)
    })

    return sorted
  }, [scheduleData?.employees])

  const shifts = (scheduleData?.shifts || []) as ScheduleShift[]
  const openShifts = (scheduleData?.openShifts || []) as DraftShift[]
  const timeOffs = (scheduleData?.timeOffs || []) as TimeOff[]
  const weeklyHours = scheduleData?.weeklyHours || {}
  const isWeekPublished = scheduleData?.isPublished || false

  // Use pre-computed organization from edge function (avoid duplicate work)
  const shiftsByEmployeeAndDayFromServer = (scheduleData?.shiftsByEmployeeAndDay || {}) as Record<string, Record<number, ScheduleShift[]>>
  const timeOffsByEmployeeAndDayFromServer = (scheduleData?.timeOffsByEmployeeAndDay || {}) as Record<string, Record<number, TimeOff[]>>
  const availabilityByEmployeeAndDayFromServer = (scheduleData?.availabilityByEmployeeAndDay || {}) as Record<string, Record<number, any[]>>
  const availabilityByEmployeeAndDateFromServer = (scheduleData?.availabilityByEmployeeAndDate || {}) as Record<string, Record<string, any[]>>

  // Refetch functions for backward compatibility
  const refetchShifts = refetch
  const refetchOpenShifts = refetch
  const refetchPublishStatus = refetch

  // Generate days of week array with dates
  // FIXED: Use addDays() instead of mutation (was: addWeeks(..., 0) then mutating)
  const daysOfWeek = useMemo(() => {
    const days = []
    const today = startOfDay(new Date())

    for (let i = 0; i < 7; i++) {
      const date = addDays(currentWeekStart, i)

      days.push({
        date: date,
        dayName: format(date, 'EEE'), // Mon, Tue, etc.
        dayNumber: format(date, 'd'),  // 3, 4, etc.
        isToday: startOfDay(date).getTime() === today.getTime()
      })
    }

    return days
  }, [currentWeekStart])

  // Use pre-organized data from edge function instead of recalculating
  // Edge function already computed these - no need to do it again client-side
  const shiftsByEmployeeAndDay = shiftsByEmployeeAndDayFromServer
  const timeOffsByEmployeeAndDay = timeOffsByEmployeeAndDayFromServer
  const availabilityByEmployeeAndDay = availabilityByEmployeeAndDayFromServer
  const availabilityByEmployeeAndDate = availabilityByEmployeeAndDateFromServer

  return {
    // Week data
    currentWeekStart,
    currentWeekEnd,
    dateRangeString,
    isThisWeek,
    weekOffset,
    setWeekOffset,
    daysOfWeek,

    // Data
    employees,
    shifts,
    openShifts,
    timeOffs,
    shiftsByEmployeeAndDay,
    timeOffsByEmployeeAndDay,
    availabilityByEmployeeAndDay,
    availabilityByEmployeeAndDate,
    weeklyHours: weeklyHours || {},
    isWeekPublished,

    // Loading states (single query via edge function)
    isLoading,
    isLoadingEmployees: isLoading,
    isLoadingShifts: isLoading,
    isLoadingTimeOffs: isLoading,
    isLoadingOpenShifts: isLoading,

    // Refetch functions
    refetchShifts,
    refetchOpenShifts,
    refetchPublishStatus
  }
}
