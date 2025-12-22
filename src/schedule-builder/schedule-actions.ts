import { useCallback, useMemo, useState, useEffect } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { shiftService } from './shift-operations'
import { publishService } from './publish-schedule'
import { supabase } from '../shared/supabase-client'
import {
  isAllDayTimeOff,
  countDraftShifts
} from '../shared/scheduleUtils'
import { SCHEDULE_MESSAGES } from '../shared/constants'
import type { ScheduleShift } from './fetch-schedule-data'

/**
 * useScheduleBuilderActions - Business logic and event handlers for Schedule Builder
 *
 * Consolidates all 12 event handlers in one place:
 * - Cell clicks (add shift)
 * - Save/edit/delete shifts
 * - Publish/clear drafts
 * - Duplicate/repeat shifts
 * - Drag and drop
 *
 * Keeps main page clean and focused on layout/data fetching.
 */

interface UseScheduleBuilderActionsProps {
  currentWeekStart: Date
  currentWeekEnd: Date
  employees: any[]
  daysOfWeek: any[]
  timeOffsByEmployeeAndDay: Record<string, Record<number, any[]>>
  availabilityByEmployeeAndDay: Record<string, Record<number, any[]>>
  availabilityByEmployeeAndDate?: Record<string, Record<string, any[]>>
  shiftsByEmployeeAndDay: Record<string, Record<number, ScheduleShift[]>>
  refetchShifts: () => Promise<any>
  refetchPublishStatus: () => Promise<any>
  modalState: any
  setModalState: (state: any) => void
  editModalState: any
  setEditModalState: (state: any) => void
}

export function useScheduleActions({
  currentWeekStart,
  currentWeekEnd,
  employees: _employees, // Unused - kept for interface compatibility
  daysOfWeek,
  timeOffsByEmployeeAndDay,
  availabilityByEmployeeAndDay,
  availabilityByEmployeeAndDate,
  shiftsByEmployeeAndDay,
  refetchShifts,
  refetchPublishStatus,
  modalState,
  setModalState,
  editModalState: _editModalState, // Unused - kept for interface compatibility
  setEditModalState
}: UseScheduleBuilderActionsProps) {
  
  const [activeShift, setActiveShift] = useState<ScheduleShift | null>(null)

  // Calculate draft count - memoized for performance
  const draftCount = useMemo(() => {
    const allShifts = Object.values(shiftsByEmployeeAndDay).flatMap(days =>
      Object.values(days).flatMap(shifts => shifts)
    ) as ScheduleShift[]
    return countDraftShifts(allShifts)
  }, [shiftsByEmployeeAndDay])

  // Auto-kick shifts to open shifts when employee has time off conflict
  useEffect(() => {
    const checkAndKickConflictingShifts = async () => {
      const shiftsToKick: number[] = []

      // Check all employee shifts for time off conflicts
      for (const [employeeId, dayShifts] of Object.entries(shiftsByEmployeeAndDay)) {
        for (const [dayIndexStr, shifts] of Object.entries(dayShifts)) {
          const dayIndex = parseInt(dayIndexStr, 10)
          const timeOffsForDay = timeOffsByEmployeeAndDay[employeeId]?.[dayIndex] || []

          // If employee has ALL-DAY time off, kick all their shifts for that day
          const hasAllDayTimeOff = timeOffsForDay.some((timeOff: any) => isAllDayTimeOff(timeOff))

          if (hasAllDayTimeOff && shifts.length > 0) {
            for (const shift of shifts) {
              // Only kick draft shifts (not published ones)
              if (shift.status === 'draft') {
                shiftsToKick.push(shift.id)
              }
            }
          }
        }
      }

      // Move conflicting shifts to open shifts
      if (shiftsToKick.length > 0) {
        console.log(`🚨 Auto-kicking ${shiftsToKick.length} shifts due to time off conflicts`)
        for (const shiftId of shiftsToKick) {
          try {
            await shiftService.moveToOpenShift(shiftId)
          } catch (error) {
            console.error(`Failed to kick shift ${shiftId}:`, error)
          }
        }
        // Refresh to show updated data
        refetchShifts()
      }
    }

    checkAndKickConflictingShifts()
  }, [shiftsByEmployeeAndDay, timeOffsByEmployeeAndDay, refetchShifts])

  // Handle cell click (add shift)
  const handleCellClick = useCallback((
    employeeId: string | null,
    employeeName: string,
    date: Date,
    dayIndex: number
  ) => {
    if (import.meta.env.DEV) {
      console.log('🖱️ CELL CLICKED:', {
        employeeId,
        employeeName,
        date: date.toISOString(),
        dayIndex,
        dayName: daysOfWeek[dayIndex]?.dayName
      })
    }

    // Check if employee has ALL-DAY time-off on this day (only if employeeId exists)
    const timeOffsForDay = employeeId ? (timeOffsByEmployeeAndDay[employeeId]?.[dayIndex] || []) : []
    const hasAllDayTimeOff = timeOffsForDay.some((timeOff: any) => isAllDayTimeOff(timeOff))
    const timeOffReason = hasAllDayTimeOff ? timeOffsForDay.find((t: any) => isAllDayTimeOff(t))?.reason || 'No reason' : ''

    setModalState({
      isOpen: true,
      employeeId,
      employeeName,
      date,
      hasTimeOff: hasAllDayTimeOff,
      timeOffReason
    })
  }, [timeOffsByEmployeeAndDay, daysOfWeek, setModalState])

  // Handle save shift from modal
  const handleSaveShift = useCallback(async (
    startTime: string,
    endTime: string,
    location: string,
    isOpenShift: boolean
  ) => {
    if (import.meta.env.DEV) {
      console.log('💾 SAVING NEW SHIFT:', {
        employeeId: isOpenShift ? null : modalState.employeeId,
        startTime,
        endTime,
        location,
        isOpenShift
      })
    }

    try {
      await shiftService.createShift({
        employee_id: isOpenShift ? null : modalState.employeeId,
        start_time: startTime,
        end_time: endTime,
        location: location
      })

      await refetchShifts()
    } catch (error: any) {
      console.error('❌ SHIFT CREATION FAILED:', error)
      throw error
    }
  }, [modalState.employeeId, refetchShifts])

  // Handle publish week
  const handlePublish = useCallback(async () => {
    if (!confirm(SCHEDULE_MESSAGES.PUBLISH_CONFIRM)) {
      return
    }

    try {
      const result = await publishService.publishWeek(
        currentWeekStart.toISOString().split('T')[0],
        currentWeekEnd.toISOString().split('T')[0],
        { strictMode: true }
      )

      if (result.success) {
        await publishService.clearDrafts(
          currentWeekStart.toISOString().split('T')[0],
          currentWeekEnd.toISOString().split('T')[0]
        )

        console.log('Schedule Published:', result.message)
        refetchShifts()
        refetchPublishStatus()
      } else {
        console.error('Cannot Publish:', result.message, 'Conflicts:', result.conflicts)
      }
    } catch (error: any) {
      console.error('❌ PUBLISH ERROR:', error)
    }
  }, [currentWeekStart, currentWeekEnd, refetchShifts, refetchPublishStatus])

  // Handle clear drafts
  const handleClearDrafts = useCallback(async () => {
    if (!confirm('Clear all draft shifts for this week? This cannot be undone.')) {
      return
    }

    try {
      await publishService.clearDrafts(
        currentWeekStart.toISOString().split('T')[0],
        currentWeekEnd.toISOString().split('T')[0]
      )

      refetchShifts()
      refetchPublishStatus()
    } catch (error: any) {
      console.error('Error clearing drafts:', error.message)
    }
  }, [currentWeekStart, currentWeekEnd, refetchShifts, refetchPublishStatus])

  // Handle delete shift
  const handleDeleteShift = useCallback(async (shiftId: number) => {
    try {
      await shiftService.deleteShift(shiftId)
      await refetchShifts()
    } catch (error: any) {
      console.error('❌ DELETE FAILED:', error)
    }
  }, [refetchShifts])

  // Handle duplicate shift
  const handleDuplicateShift = useCallback((shift: ScheduleShift, employeeName: string) => {
    // Extract time from UTC timestamp to Eastern Time HH:mm format
    const startDate = new Date(shift.start_time)
    const endDate = new Date(shift.end_time)
    const startHours = String(startDate.getHours()).padStart(2, '0')
    const startMins = String(startDate.getMinutes()).padStart(2, '0')
    const endHours = String(endDate.getHours()).padStart(2, '0')
    const endMins = String(endDate.getMinutes()).padStart(2, '0')

    setModalState({
      isOpen: true,
      employeeId: shift.employee_id,
      employeeName,
      date: startDate,
      hasTimeOff: false,
      timeOffReason: '',
      initialStartTime: `${startHours}:${startMins}`,
      initialEndTime: `${endHours}:${endMins}`,
      initialLocation: shift.location || 'Calder'
    })
  }, [setModalState])

  // Handle repeat last week - uses server-side RPC for proper timezone handling
  const handleRepeatLastWeek = useCallback(async () => {
    if (!confirm('Copy all published shifts from last week to this week as drafts?')) {
      return
    }

    try {
      // Format dates as YYYY-MM-DD for the RPC function
      const formatDate = (d: Date) => d.toISOString().split('T')[0]

      const { data: count, error } = await supabase
        .schema('employees')
        .rpc('repeat_last_week', {
          p_current_week_start: formatDate(currentWeekStart),
          p_current_week_end: formatDate(currentWeekEnd)
        })

      if (error) throw error

      if (count === 0) {
        alert('No published shifts found from last week to copy.')
        return
      }

      refetchShifts()
    } catch (error: any) {
      console.error('❌ REPEAT LAST WEEK FAILED:', error)
      alert('Failed to repeat last week shifts.')
    }
  }, [currentWeekStart, currentWeekEnd, refetchShifts])

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const shiftId = event.active.id as number

    const allShifts = Object.values(shiftsByEmployeeAndDay).flatMap(days =>
      Object.values(days).flatMap(shifts => shifts)
    ) as ScheduleShift[]
    const shift = allShifts.find(s => s.id === shiftId)

    if (shift) {
      setActiveShift(shift)
    }
  }, [shiftsByEmployeeAndDay])

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { over } = event

    setActiveShift(null)

    if (!over || !activeShift) {
      return
    }

    // Parse drop target ID
    // Format: "cell-{employeeId}-{dayIndex}" for employee cells
    // Format: "cell-open-{dayIndex}" for open shift cells
    const dropId = over.id as string
    if (!dropId.startsWith('cell-')) {
      return
    }

    const parts = dropId.split('-')
    const isOpenShiftDrop = parts[1] === 'open'
    const targetEmployeeId = isOpenShiftDrop ? null : parts[1]
    const targetDayIndex = parseInt(parts[isOpenShiftDrop ? 2 : 2], 10)

    // Get target date from daysOfWeek
    const targetDay = daysOfWeek[targetDayIndex]
    if (!targetDay) {
      return
    }

    // For employee cells, validate time-off and availability
    if (!isOpenShiftDrop && targetEmployeeId) {
      // Check if employee has ALL-DAY time-off on target day
      const timeOffsForDay = timeOffsByEmployeeAndDay[targetEmployeeId]?.[targetDayIndex] || []
      const hasAllDayTimeOff = timeOffsForDay.some((timeOff: any) => isAllDayTimeOff(timeOff))
      if (hasAllDayTimeOff) {
        return
      }

      // Check if employee has no availability on target day
      const targetDateString = targetDay.date.toISOString().split('T')[0]
      const specificDateAvailability = availabilityByEmployeeAndDate?.[targetEmployeeId]?.[targetDateString] || []
      const recurringAvailability = availabilityByEmployeeAndDay[targetEmployeeId]?.[targetDayIndex] || []
      const availabilityForTargetDay = specificDateAvailability.length > 0 ? specificDateAvailability : recurringAvailability
      const partialTimeOffsForDay = timeOffsForDay.filter((timeOff: any) => !isAllDayTimeOff(timeOff))
      const hasNoAvailability = availabilityForTargetDay.length === 0 && partialTimeOffsForDay.length === 0
      if (hasNoAvailability) {
        return
      }
    }

    try {
      // Calculate new start/end times for target day
      const originalStartDate = new Date(activeShift.start_time)
      const originalEndDate = new Date(activeShift.end_time)
      const targetDate = new Date(targetDay.date)

      // Preserve the time of day, change only the date
      const newStartDate = new Date(targetDate)
      newStartDate.setHours(originalStartDate.getHours(), originalStartDate.getMinutes(), 0, 0)
      const newEndDate = new Date(targetDate)
      newEndDate.setHours(originalEndDate.getHours(), originalEndDate.getMinutes(), 0, 0)

      // Update shift with new employee (null for open shifts) and/or date
      await shiftService.updateShift(activeShift.id, {
        employee_id: targetEmployeeId,
        start_time: newStartDate.toISOString(),
        end_time: newEndDate.toISOString()
      })

      refetchShifts()
    } catch (error: any) {
      console.error('❌ MOVE SHIFT FAILED:', error)
    }
  }, [activeShift, daysOfWeek, timeOffsByEmployeeAndDay, availabilityByEmployeeAndDay, availabilityByEmployeeAndDate, refetchShifts])

  // Handle shift click to edit
  const handleShiftClick = useCallback((shift: ScheduleShift, employeeName: string) => {
    setEditModalState({
      isOpen: true,
      shift,
      employeeName
    })
  }, [setEditModalState])

  // Handle save edited shift
  const handleEditShift = useCallback(async (
    shiftId: number,
    startTime: string,
    endTime: string,
    location: string
  ) => {
    try {
      await shiftService.updateShift(shiftId, {
        start_time: startTime,
        end_time: endTime,
        location: location
      })

      await refetchShifts()
    } catch (error: any) {
      console.error('❌ SHIFT UPDATE FAILED:', error)
      throw error
    }
  }, [refetchShifts])

  // Handle availability click (preset times in modal)
  const handleAvailabilityClick = useCallback((
    employeeId: string,
    employeeName: string,
    date: Date,
    _dayIndex: number, // Unused - kept for interface compatibility
    avail: any
  ) => {
    setModalState({
      isOpen: true,
      employeeId,
      employeeName,
      date,
      hasTimeOff: false,
      timeOffReason: '',
      initialStartTime: avail.start_time.substring(0, 5), // "09:00:00" -> "09:00"
      initialEndTime: avail.end_time.substring(0, 5),
      initialLocation: 'Calder'
    })
  }, [setModalState])

  return {
    handleCellClick,
    handleSaveShift,
    handlePublish,
    handleClearDrafts,
    handleDeleteShift,
    handleDuplicateShift,
    handleRepeatLastWeek,
    handleDragStart,
    handleDragEnd,
    handleShiftClick,
    handleEditShift,
    handleAvailabilityClick,
    activeShift,
    draftCount
  }
}
