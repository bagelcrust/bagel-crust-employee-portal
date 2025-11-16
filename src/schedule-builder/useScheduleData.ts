import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase/supabase'
import type { DraftShift, PublishedShift, TimeOff, Employee } from '../supabase/supabase'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, startOfDay, isSameWeek, addDays } from 'date-fns'

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
 * Naming matches Postgres function: get_schedule_builder_data
 */
export function useGetScheduleBuilderData() {
  // Current week start date (Sunday = start of week)
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
  )

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
  const isThisWeek = useMemo(() =>
    isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 }),
    [currentWeekStart]
  )

  // Navigation functions
  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1))
  }

  // Fetch ALL schedule builder data in a single call to Postgres function
  // Calls: get_schedule_builder_data(start_date, end_date)
  const { data: scheduleData, isLoading, refetch } = useQuery({
    queryKey: ['scheduleBuilderData', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('employees')
        .rpc('get_schedule_builder_data', {
          start_date: format(currentWeekStart, 'yyyy-MM-dd'),
          end_date: format(currentWeekEnd, 'yyyy-MM-dd')
        })
      if (error) throw error
      return data
    },
    staleTime: 0, // Always fetch fresh data when actively building schedules
  })

  // DEBUG: Log raw edge function response
  console.log('🔌 EDGE FUNCTION RESPONSE:', {
    isLoading,
    hasData: !!scheduleData,
    scheduleData: scheduleData
  })

  // Extract and sort employees (owners at bottom)
  const employees = useMemo(() => {
    const rawEmployees = (scheduleData?.employees || []) as Employee[]
    return [...rawEmployees].sort((a, b) => {
      // Put owners at the bottom
      if (a.role === 'owner' && b.role !== 'owner') return 1
      if (a.role !== 'owner' && b.role === 'owner') return -1
      // Otherwise sort alphabetically by first name
      return a.first_name.localeCompare(b.first_name)
    })
  }, [scheduleData?.employees])

  const shifts = (scheduleData?.shifts || []) as ScheduleShift[]
  const openShifts = (scheduleData?.openShifts || []) as DraftShift[]
  const timeOffs = (scheduleData?.timeOffs || []) as TimeOff[]
  const weeklyHours = scheduleData?.weeklyHours || {}
  const isWeekPublished = scheduleData?.isPublished || false

  console.log('🔌 EXTRACTED DATA:', {
    employeesCount: employees.length,
    shiftsCount: shifts.length,
    openShiftsCount: openShifts.length,
    timeOffsCount: timeOffs.length,
    isWeekPublished
  })

  // Use pre-computed organization from edge function (avoid duplicate work)
  const shiftsByEmployeeAndDayFromServer = (scheduleData?.shiftsByEmployeeAndDay || {}) as Record<string, Record<number, ScheduleShift[]>>
  const timeOffsByEmployeeAndDayFromServer = (scheduleData?.timeOffsByEmployeeAndDay || {}) as Record<string, Record<number, TimeOff[]>>
  const availabilityByEmployeeAndDayFromServer = (scheduleData?.availabilityByEmployeeAndDay || {}) as Record<string, Record<number, any[]>>

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

  return {
    // Week data
    currentWeekStart,
    currentWeekEnd,
    dateRangeString,
    isThisWeek,
    daysOfWeek,

    // Navigation
    goToToday,
    goToPreviousWeek,
    goToNextWeek,

    // Data
    employees,
    shifts,
    openShifts,
    timeOffs,
    shiftsByEmployeeAndDay,
    timeOffsByEmployeeAndDay,
    availabilityByEmployeeAndDay,
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
