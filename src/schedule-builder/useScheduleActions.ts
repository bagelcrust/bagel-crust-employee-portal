import { useCallback, useMemo, useState } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { shiftService } from './shifts/shiftCRUD'
import { publishService } from './publishing/publishDrafts'
import {
  isAllDayTimeOff,
  countDraftShifts,
  SCHEDULE_MESSAGES
} from '../lib'
import type { ScheduleShift } from './useScheduleData'

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
        currentWeekStart.toISOString(),
        currentWeekEnd.toISOString(),
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

      // toast removed
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

  // Handle repeat last week
  const handleRepeatLastWeek = useCallback(async () => {
    if (!confirm('Copy all published shifts from last week to this week as drafts?')) {
      return
    }

    try {
      const lastWeekStart = new Date(currentWeekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekEnd = new Date(currentWeekEnd)
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

      const lastWeekShifts = await shiftService.getPublishedShifts(
        lastWeekStart.toISOString().split('T')[0],
        lastWeekEnd.toISOString().split('T')[0]
      )

      if (lastWeekShifts.length === 0) {
        // toast removed
        return
      }

      let createdCount = 0
      for (const shift of lastWeekShifts) {
        const startDate = new Date(shift.start_time)
        startDate.setDate(startDate.getDate() + 7)
        const endDate = new Date(shift.end_time)
        endDate.setDate(endDate.getDate() + 7)

        await shiftService.createShift({
          employee_id: shift.employee_id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          location: shift.location || 'Calder',
          role: shift.role
        })
        createdCount++
      }

      // toast removed
      refetchShifts()
    } catch (error: any) {
      // toast removed
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

    // Parse drop target ID (format: "cell-{employeeId}-{dayIndex}")
    const dropId = over.id as string
    if (!dropId.startsWith('cell-')) {
      return
    }

    const [, targetEmployeeId, targetDayIndexStr] = dropId.split('-')
    const targetDayIndex = parseInt(targetDayIndexStr, 10)

    // Get target date from daysOfWeek
    const targetDay = daysOfWeek[targetDayIndex]
    if (!targetDay) {
      return
    }

    // Check if employee has ALL-DAY time-off on target day
    const timeOffsForDay = timeOffsByEmployeeAndDay[targetEmployeeId]?.[targetDayIndex] || []
    const hasAllDayTimeOff = timeOffsForDay.some((timeOff: any) => isAllDayTimeOff(timeOff))
    if (hasAllDayTimeOff) {
      // toast removed
      return
    }

    // Check if employee has no availability on target day
    const availabilityForTargetDay = availabilityByEmployeeAndDay[targetEmployeeId]?.[targetDayIndex] || []
    const partialTimeOffsForDay = timeOffsForDay.filter((timeOff: any) => !isAllDayTimeOff(timeOff))
    const hasNoAvailability = availabilityForTargetDay.length === 0 && partialTimeOffsForDay.length === 0
    if (hasNoAvailability) {
      // toast removed
      return
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

      // Update shift with new employee and/or date
      await shiftService.updateShift(activeShift.id, {
        employee_id: targetEmployeeId,
        start_time: newStartDate.toISOString(),
        end_time: newEndDate.toISOString()
      })

      // toast removed
      refetchShifts()
    } catch (error: any) {
      console.error('❌ MOVE SHIFT FAILED:', error)
      // toast removed
    }
  }, [activeShift, daysOfWeek, timeOffsByEmployeeAndDay, availabilityByEmployeeAndDay, refetchShifts])

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
