import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  shiftService,
  openShiftsService,
  hoursService,
  publishService
} from '../supabase/supabase'
import { getEmployees, getTimeOffsForRange } from '../supabase/edgeFunctions'
import type { Shift, TimeOff, Employee } from '../supabase/supabase'
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

  // Fetch all active employees (filtered to staff_two role only) using Edge Function
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['employees', 'active'],
    queryFn: () => getEmployees(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Filter to only show staff_two role
  const employees = useMemo(() =>
    allEmployees.filter(emp => emp.role === 'staff_two'),
    [allEmployees]
  )

  // Fetch ALL shifts for current week (manager view - both draft and published)
  const { data: shifts = [], isLoading: isLoadingShifts, refetch: refetchShifts } = useQuery({
    queryKey: ['shifts', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: () => shiftService.getAllShifts(
      currentWeekStart.toISOString(),
      currentWeekEnd.toISOString()
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Fetch open shifts (unassigned)
  const { data: openShifts = [], isLoading: isLoadingOpenShifts, refetch: refetchOpenShifts } = useQuery({
    queryKey: ['openShifts', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: () => openShiftsService.getOpenShifts(
      currentWeekStart.toISOString(),
      currentWeekEnd.toISOString()
    ),
    staleTime: 2 * 60 * 1000,
  })

  // Fetch time-offs for current week using Edge Function
  const { data: timeOffs = [], isLoading: isLoadingTimeOffs } = useQuery<TimeOff[]>({
    queryKey: ['timeoffs', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: () => getTimeOffsForRange(
      format(currentWeekStart, 'yyyy-MM-dd'),
      format(currentWeekEnd, 'yyyy-MM-dd')
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Fetch weekly hours for all employees
  const { data: weeklyHours } = useQuery({
    queryKey: ['weeklyHours', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: () => hoursService.calculateAllEmployeeHours(
      currentWeekStart.toISOString(),
      currentWeekEnd.toISOString()
    ),
    staleTime: 2 * 60 * 1000,
  })

  // Check if week is published
  const { data: isWeekPublished = false, refetch: refetchPublishStatus } = useQuery({
    queryKey: ['weekPublished', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: () => publishService.isWeekPublished(
      currentWeekStart.toISOString(),
      currentWeekEnd.toISOString()
    ),
    staleTime: 2 * 60 * 1000,
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

  // Organize shifts by employee and day (exclude open shifts - those are shown separately)
  const shiftsByEmployeeAndDay = useMemo(() => {
    const organized: Record<string, Record<number, Shift[]>> = {}

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
    weeklyHours: weeklyHours || new Map(),
    isWeekPublished,

    // Loading states
    isLoading: isLoadingEmployees || isLoadingShifts || isLoadingTimeOffs || isLoadingOpenShifts,
    isLoadingEmployees,
    isLoadingShifts,
    isLoadingTimeOffs,
    isLoadingOpenShifts,

    // Refetch functions
    refetchShifts,
    refetchOpenShifts,
    refetchPublishStatus
  }
}
