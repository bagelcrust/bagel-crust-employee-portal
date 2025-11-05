import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { employeeApi, scheduleApi, Employee, Shift } from '../supabase/supabase'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, startOfDay, isSameWeek } from 'date-fns'

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

  // Fetch all active employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees', 'active'],
    queryFn: () => employeeApi.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch shifts for current week
  const { data: shifts = [], isLoading: isLoadingShifts, refetch: refetchShifts } = useQuery({
    queryKey: ['shifts', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: () => scheduleApi.getWeekSchedule(
      currentWeekStart.toISOString(),
      currentWeekEnd.toISOString()
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

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

  // Organize shifts by employee and day
  const shiftsByEmployeeAndDay = useMemo(() => {
    const organized: Record<string, Record<number, Shift[]>> = {}

    shifts.forEach((shift) => {
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
    shiftsByEmployeeAndDay,

    // Loading states
    isLoading: isLoadingEmployees || isLoadingShifts,
    isLoadingEmployees,
    isLoadingShifts,

    // Refetch
    refetchShifts
  }
}
