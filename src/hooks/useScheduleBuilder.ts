import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getScheduleBuilderData } from '../supabase/edgeFunctions'
import type { DraftShift, PublishedShift, TimeOff, Employee } from '../supabase/supabase'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, startOfDay, isSameWeek } from 'date-fns'

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
 */
export function useScheduleBuilder() {
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

  // Fetch ALL schedule builder data in a single HTTP request using Edge Function
  // This aggregates: employees, draft shifts, published shifts, open shifts, time-offs, weekly hours, publish status
  // Reduces 7+ HTTP requests down to 1
  const { data: scheduleData, isLoading, refetch } = useQuery({
    queryKey: ['scheduleBuilderData', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: () => getScheduleBuilderData(
      format(currentWeekStart, 'yyyy-MM-dd'),
      format(currentWeekEnd, 'yyyy-MM-dd')
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Extract data from edge function response
  const employees = (scheduleData?.employees || []) as Employee[]
  const shifts = (scheduleData?.shifts || []) as ScheduleShift[]
  const openShifts = (scheduleData?.openShifts || []) as DraftShift[]
  const timeOffs = (scheduleData?.timeOffs || []) as TimeOff[]
  const weeklyHours = scheduleData?.weeklyHours || {}
  const isWeekPublished = scheduleData?.isPublished || false

  // Refetch functions for backward compatibility
  const refetchShifts = refetch
  const refetchOpenShifts = refetch
  const refetchPublishStatus = refetch

  // Generate days of week array with dates
  const daysOfWeek = useMemo(() => {
    const days = []
    const today = startOfDay(new Date())

    for (let i = 0; i < 7; i++) {
      const date = addWeeks(currentWeekStart, 0)
      date.setDate(date.getDate() + i)

      days.push({
        date: date,
        dayName: format(date, 'EEE'), // Mon, Tue, etc.
        dayNumber: format(date, 'd'),  // 3, 4, etc.
        isToday: startOfDay(date).getTime() === today.getTime()
      })
    }

    return days
  }, [currentWeekStart])

  // Organize shifts by employee and day (exclude open shifts - those are shown separately)
  const shiftsByEmployeeAndDay = useMemo(() => {
    const organized: Record<string, Record<number, ScheduleShift[]>> = {}

    shifts.forEach((shift) => {
      // Skip open shifts (employee_id is null) - they're shown in open shifts section
      if (!shift.employee_id) return

      const shiftDate = startOfDay(new Date(shift.start_time))
      const dayIndex = daysOfWeek.findIndex(day =>
        startOfDay(day.date).getTime() === shiftDate.getTime()
      )

      if (dayIndex === -1) return // Shift not in current week

      if (!organized[shift.employee_id]) {
        organized[shift.employee_id] = {}
      }
      if (!organized[shift.employee_id][dayIndex]) {
        organized[shift.employee_id][dayIndex] = []
      }
      organized[shift.employee_id][dayIndex].push(shift)
    })

    return organized
  }, [shifts, daysOfWeek])

  // Organize time-offs by employee and day
  const timeOffsByEmployeeAndDay = useMemo(() => {
    const organized: Record<string, Record<number, TimeOff[]>> = {}

    timeOffs.forEach((timeOff) => {
      const timeOffDate = startOfDay(new Date(timeOff.start_time))
      const dayIndex = daysOfWeek.findIndex(day =>
        startOfDay(day.date).getTime() === timeOffDate.getTime()
      )

      if (dayIndex === -1) return // Time-off not in current week

      if (!organized[timeOff.employee_id]) {
        organized[timeOff.employee_id] = {}
      }
      if (!organized[timeOff.employee_id][dayIndex]) {
        organized[timeOff.employee_id][dayIndex] = []
      }
      organized[timeOff.employee_id][dayIndex].push(timeOff)
    })

    return organized
  }, [timeOffs, daysOfWeek])

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
