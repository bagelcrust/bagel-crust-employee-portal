import { useEffect, useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Send, Loader2, Plus, Trash2, Copy, Repeat, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useScheduleBuilder } from '../hooks'
import type { ScheduleShift } from '../hooks'
import { shiftService, publishService } from '../supabase/supabase'
import { AddShiftDialog } from '../components/AddShiftDialog'
import { EditShiftDialog } from '../components/EditShiftDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  formatShiftTime,
  formatShiftHours,
  formatAvailabilityTime,
  isAllDayTimeOff,
  countDraftShifts,
  PAGE_TITLES,
  SCHEDULE_MESSAGES
} from '../lib'

/**
 * SCHEDULE BUILDER - Full-Featured with Draft/Publish Workflow
 *
 * ✅ REFACTORED WITH UTILITIES (Nov 6, 2025)
 * - Uses scheduleUtils for shift formatting, conflict detection, counting
 * - Uses constants for all messages and page titles
 * - Uses useCallback for event handler optimization
 * - Uses useMemo for computed values
 * - Clean, maintainable, utility-driven code
 *
 * Features:
 * - Real employee data from Supabase
 * - Real shifts displayed in weekly grid
 * - Week navigation (Today, Previous, Next)
 * - Click cell to add shift (with conflict validation)
 * - Open shifts pool at top
 * - Publish button to make schedule visible to employees
 * - Weekly hours displayed next to employee names
 * - Drag & drop to reassign shifts (coming soon)
 */

export default function ScheduleBuilder() {
  const { toast } = useToast()
  const {
    dateRangeString,
    isThisWeek,
    daysOfWeek,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    currentWeekStart,
    currentWeekEnd,
    employees,
    openShifts,
    shiftsByEmployeeAndDay,
    timeOffsByEmployeeAndDay,
    availabilityByEmployeeAndDay,
    timeOffs,
    weeklyHours,
    isWeekPublished,
    isLoading,
    refetchShifts,
    refetchOpenShifts,
    refetchPublishStatus
  } = useScheduleBuilder()

  // DEBUG: Comprehensive logging
  console.log('🔍 SCHEDULE BUILDER - RENDER CYCLE')
  console.log('📊 Loading State:', { isLoading })
  console.log('👥 Employees:', {
    count: employees.length,
    data: employees.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }))
  })
  console.log('📅 Week Data:', {
    dateRange: dateRangeString,
    isThisWeek,
    weekStart: currentWeekStart.toISOString(),
    weekEnd: currentWeekEnd.toISOString(),
    daysCount: daysOfWeek.length,
    days: daysOfWeek.map(d => ({ date: d.date.toISOString(), dayName: d.dayName, isToday: d.isToday }))
  })
  console.log('🔓 Open Shifts:', {
    count: openShifts.length,
    shifts: openShifts.map(s => ({
      id: s.id,
      time: `${s.start_time} - ${s.end_time}`,
      location: s.location
    }))
  })
  console.log('📋 Shifts by Employee:', {
    employeeCount: Object.keys(shiftsByEmployeeAndDay).length,
    breakdown: Object.entries(shiftsByEmployeeAndDay).map(([empId, days]) => {
      const emp = employees.find(e => e.id === empId)
      return {
        employee: emp ? `${emp.first_name} ${emp.last_name}` : empId,
        totalShifts: Object.values(days).flat().length,
        byDay: Object.entries(days).map(([dayIdx, shifts]) => ({
          day: daysOfWeek[parseInt(dayIdx)]?.dayName,
          count: shifts.length
        }))
      }
    })
  })
  console.log('🏖️ Time-Offs:', {
    total: timeOffs?.length || 0,
    byEmployee: employees.map(emp => {
      const empTimeOffs = timeOffs.filter(t => t.employee_id === emp.id)
      return {
        name: `${emp.first_name} ${emp.last_name}`,
        count: empTimeOffs.length,
        timeOffs: empTimeOffs.map(t => ({
          start: t.start_time,
          end: t.end_time,
          reason: t.reason
        }))
      }
    }).filter(e => e.count > 0)
  })
  console.log('⏰ Weekly Hours:', weeklyHours)
  console.log('📢 Publish Status:', { isWeekPublished })

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    employeeId: string | null
    employeeName: string
    date: Date
    hasTimeOff: boolean
    timeOffReason: string
    initialStartTime?: string
    initialEndTime?: string
    initialLocation?: string
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: '',
    date: new Date(),
    hasTimeOff: false,
    timeOffReason: ''
  })

  // Edit modal state
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean
    shift: ScheduleShift | null
    employeeName: string
  }>({
    isOpen: false,
    shift: null,
    employeeName: ''
  })

  // Drag state for drag-and-drop
  const [activeShift, setActiveShift] = useState<ScheduleShift | null>(null)

  // Set page title using constant
  useEffect(() => {
    document.title = PAGE_TITLES.SCHEDULE_BUILDER
  }, [])

  // Handle cell click (add shift) - memoized with useCallback
  const handleCellClick = useCallback((
    employeeId: string,
    employeeName: string,
    date: Date,
    dayIndex: number
  ) => {
    console.log('🖱️ CELL CLICKED:', {
      employeeId,
      employeeName,
      date: date.toISOString(),
      dayIndex,
      dayName: daysOfWeek[dayIndex]?.dayName
    })

    // Check if employee has time-off on this day
    const timeOffsForDay = timeOffsByEmployeeAndDay[employeeId]?.[dayIndex] || []
    const hasTimeOff = timeOffsForDay.length > 0
    const timeOffReason = hasTimeOff ? timeOffsForDay[0].reason || 'No reason' : ''

    console.log('🖱️ Time-off check:', { hasTimeOff, timeOffReason, timeOffsForDay })

    setModalState({
      isOpen: true,
      employeeId,
      employeeName,
      date,
      hasTimeOff,
      timeOffReason
    })
  }, [timeOffsByEmployeeAndDay, daysOfWeek])

  // Handle save shift from modal - memoized with useCallback
  const handleSaveShift = useCallback(async (
    startTime: string,
    endTime: string,
    location: string
  ) => {
    console.log('💾 SAVING NEW SHIFT:', {
      employeeId: modalState.employeeId,
      employeeName: modalState.employeeName,
      startTime,
      endTime,
      location
    })

    if (!modalState.employeeId) {
      console.error('❌ Cannot save shift: No employee ID')
      return
    }

    try {
      const result = await shiftService.createShift({
        employee_id: modalState.employeeId,
        start_time: startTime,
        end_time: endTime,
        location: location
      })

      console.log('✅ SHIFT CREATED:', result)
      console.log('🔄 Refetching shifts...')
      refetchShifts()
    } catch (error: any) {
      console.error('❌ SHIFT CREATION FAILED:', error)
      throw error // Re-throw to let modal handle error display
    }
  }, [modalState.employeeId, modalState.employeeName, refetchShifts])

  // Handle publish week - memoized with useCallback
  const handlePublish = useCallback(async () => {
    console.log('📢 PUBLISH BUTTON CLICKED')

    if (!confirm(SCHEDULE_MESSAGES.PUBLISH_CONFIRM)) {
      console.log('❌ Publish cancelled by user')
      return
    }

    console.log('🚀 Publishing week:', {
      weekStart: currentWeekStart.toISOString(),
      weekEnd: currentWeekEnd.toISOString()
    })

    try {
      const result = await publishService.publishWeek(
        currentWeekStart.toISOString(),
        currentWeekEnd.toISOString(),
        { strictMode: true } // Block if any conflicts
      )

      console.log('📢 Publish result:', result)

      if (result.success) {
        console.log('✅ Publish successful, clearing drafts...')
        // Auto-clear drafts after successful publish to prevent duplicate shifts showing
        await publishService.clearDrafts(
          currentWeekStart.toISOString().split('T')[0],
          currentWeekEnd.toISOString().split('T')[0]
        )

        console.log('🔄 Refetching shifts and publish status...')
        toast({
          title: 'Schedule Published',
          description: result.message,
        })
        refetchShifts()
        refetchPublishStatus()
      } else {
        console.error('❌ Publish failed - conflicts detected:', result.conflicts)
        toast({
          title: 'Cannot Publish',
          description: `${result.message}\n\nConflicts: ${result.conflicts.map((c: any) => `${c.employeeName} on ${c.shiftDate}`).join(', ')}`,
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('❌ PUBLISH ERROR:', error)
      toast({
        title: SCHEDULE_MESSAGES.PUBLISH_ERROR,
        description: error.message,
        variant: 'destructive',
      })
    }
  }, [currentWeekStart, currentWeekEnd, refetchShifts, refetchPublishStatus, toast])

  // Handle clear drafts - memoized with useCallback
  const handleClearDrafts = useCallback(async () => {
    if (!confirm('Clear all draft shifts for this week? This cannot be undone.')) {
      return
    }

    try {
      const clearedCount = await publishService.clearDrafts(
        currentWeekStart.toISOString().split('T')[0],
        currentWeekEnd.toISOString().split('T')[0]
      )

      toast({
        title: 'Drafts Cleared',
        description: `Cleared ${clearedCount} draft shift(s)`,
      })
      refetchShifts()
      refetchPublishStatus()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error clearing drafts: ${error.message}`,
        variant: 'destructive',
      })
    }
  }, [currentWeekStart, currentWeekEnd, refetchShifts, refetchPublishStatus, toast])

  // Handle delete shift - memoized with useCallback
  const handleDeleteShift = useCallback(async (shiftId: number) => {
    console.log('🗑️ DELETE SHIFT CLICKED:', { shiftId })

    if (!confirm(SCHEDULE_MESSAGES.DELETE_SHIFT_CONFIRM)) {
      console.log('❌ Delete cancelled by user')
      return
    }

    console.log('🚀 Deleting shift:', shiftId)

    try {
      await shiftService.deleteShift(shiftId)
      console.log('✅ SHIFT DELETED:', shiftId)
      console.log('🔄 Refetching shifts and open shifts...')
      toast({
        title: 'Shift Deleted',
        description: 'The shift has been removed',
      })
      refetchShifts()
      refetchOpenShifts()
    } catch (error: any) {
      console.error('❌ DELETE SHIFT FAILED:', error)
      toast({
        title: SCHEDULE_MESSAGES.DELETE_ERROR,
        description: error.message,
        variant: 'destructive',
      })
    }
  }, [refetchShifts, refetchOpenShifts, toast])

  // Handle duplicate shift - memoized with useCallback
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
  }, [])

  // Handle repeat last week - memoized with useCallback
  const handleRepeatLastWeek = useCallback(async () => {
    if (!confirm('Copy all published shifts from last week to this week as drafts?')) {
      return
    }

    try {
      // Calculate last week's dates
      const lastWeekStart = new Date(currentWeekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekEnd = new Date(currentWeekEnd)
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

      // Fetch published shifts from last week
      const lastWeekShifts = await shiftService.getPublishedShifts(
        lastWeekStart.toISOString().split('T')[0],
        lastWeekEnd.toISOString().split('T')[0]
      )

      if (lastWeekShifts.length === 0) {
        toast({
          title: 'No Shifts Found',
          description: 'No published shifts found in last week',
          variant: 'destructive',
        })
        return
      }

      // Create draft shifts for this week (adjust dates by +7 days)
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

      toast({
        title: 'Shifts Copied',
        description: `Created ${createdCount} draft shift(s) from last week`,
      })
      refetchShifts()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error repeating last week: ${error.message}`,
        variant: 'destructive',
      })
    }
  }, [currentWeekStart, currentWeekEnd, refetchShifts, toast])

  // Handle drag start - memoized with useCallback
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const shiftId = event.active.id as number
    console.log('🎯 DRAG START:', { shiftId })

    // Find shift from all employees and days
    const allShifts = Object.values(shiftsByEmployeeAndDay).flatMap(days =>
      Object.values(days).flatMap(shifts => shifts)
    ) as ScheduleShift[]
    const shift = allShifts.find(s => s.id === shiftId)

    if (shift) {
      console.log('🎯 Shift found for drag:', {
        id: shift.id,
        employeeId: shift.employee_id,
        startTime: shift.start_time,
        endTime: shift.end_time,
        status: shift.status
      })
      setActiveShift(shift)
    } else {
      console.error('❌ Shift not found for drag:', shiftId)
    }
  }, [shiftsByEmployeeAndDay])

  // Handle drag end - memoized with useCallback
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { over } = event
    console.log('🎯 DRAG END:', { over: over?.id, activeShift: activeShift?.id })

    setActiveShift(null)

    if (!over || !activeShift) {
      console.log('❌ No valid drop target or active shift')
      return
    }

    // Parse drop target ID (format: "cell-{employeeId}-{dayIndex}")
    const dropId = over.id as string
    if (!dropId.startsWith('cell-')) {
      console.log('❌ Invalid drop target ID:', dropId)
      return
    }

    const [, targetEmployeeId, targetDayIndexStr] = dropId.split('-')
    const targetDayIndex = parseInt(targetDayIndexStr, 10)

    console.log('🎯 Drop target:', { targetEmployeeId, targetDayIndex })

    // Get target date from daysOfWeek
    const targetDay = daysOfWeek[targetDayIndex]
    if (!targetDay) {
      console.error('❌ Target day not found:', targetDayIndex)
      return
    }

    // Check if employee has time-off on target day
    const timeOffsForDay = timeOffsByEmployeeAndDay[targetEmployeeId]?.[targetDayIndex] || []
    if (timeOffsForDay.length > 0) {
      console.log('❌ Cannot drop - employee has time-off:', timeOffsForDay)
      toast({
        title: 'Cannot Move Shift',
        description: 'Cannot move shift to a day with time-off',
        variant: 'destructive',
      })
      return
    }

    console.log('🚀 Moving shift:', {
      shiftId: activeShift.id,
      from: { employeeId: activeShift.employee_id, date: activeShift.start_time },
      to: { employeeId: targetEmployeeId, date: targetDay.date }
    })

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

      console.log('🚀 Updating shift:', {
        newStartTime: newStartDate.toISOString(),
        newEndTime: newEndDate.toISOString()
      })

      // Update shift with new employee and/or date
      await shiftService.updateShift(activeShift.id, {
        employee_id: targetEmployeeId,
        start_time: newStartDate.toISOString(),
        end_time: newEndDate.toISOString()
      })

      console.log('✅ SHIFT MOVED SUCCESSFULLY')
      console.log('🔄 Refetching shifts...')
      toast({
        title: 'Shift Moved',
        description: 'The shift has been reassigned',
      })
      refetchShifts()
    } catch (error: any) {
      console.error('❌ MOVE SHIFT FAILED:', error)
      toast({
        title: 'Error',
        description: `Error moving shift: ${error.message}`,
        variant: 'destructive',
      })
    }
  }, [activeShift, daysOfWeek, timeOffsByEmployeeAndDay, refetchShifts, toast])

  // Handle click on shift to edit - memoized with useCallback
  const handleShiftClick = useCallback((shift: ScheduleShift, employeeName: string) => {
    console.log('✏️ SHIFT CLICKED FOR EDIT:', {
      shiftId: shift.id,
      employeeName,
      startTime: shift.start_time,
      endTime: shift.end_time,
      location: shift.location,
      status: shift.status
    })

    setEditModalState({
      isOpen: true,
      shift,
      employeeName
    })
  }, [])

  // Handle save edited shift - memoized with useCallback
  // When a shift is edited, it automatically becomes a draft (even if it was published)
  const handleEditShift = useCallback(async (
    shiftId: number,
    startTime: string,
    endTime: string,
    location: string
  ) => {
    console.log('💾 SAVING EDITED SHIFT:', {
      shiftId,
      startTime,
      endTime,
      location
    })

    try {
      const result = await shiftService.updateShift(shiftId, {
        start_time: startTime,
        end_time: endTime,
        location: location
      })

      console.log('✅ SHIFT UPDATED:', result)
      console.log('🔄 Refetching shifts and publish status...')
      refetchShifts()
      refetchPublishStatus()
    } catch (error: any) {
      console.error('❌ SHIFT UPDATE FAILED:', error)
      throw error // Re-throw to let modal handle error display
    }
  }, [refetchShifts, refetchPublishStatus])

  // Calculate draft count using utility - memoized for performance
  const draftCount = useMemo(() => {
    const allShifts = Object.values(shiftsByEmployeeAndDay).flatMap(days =>
      Object.values(days).flatMap(shifts => shifts)
    ) as ScheduleShift[]
    const count = countDraftShifts(allShifts)
    console.log('📝 Draft Count:', count, 'Total shifts:', allShifts.length)
    return count
  }, [shiftsByEmployeeAndDay])

  // Helper component: Draggable Shift
  const DraggableShift = ({ shift, employeeName }: { shift: ScheduleShift; employeeName: string }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: shift.id,
      data: { shift }
    })

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.5 : 1
    } : undefined

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="rounded px-2 py-1 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow text-center group relative"
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation()
            handleShiftClick(shift, employeeName)
          }
        }}
      >
        <div
          style={{
            background: shift.status === 'published'
              ? 'rgba(30, 64, 175, 0.85)' // Dark blue for published
              : 'rgba(147, 197, 253, 0.5)', // Light blue for draft
            border: shift.status === 'published'
              ? '1px solid rgba(30, 64, 175, 1)'
              : '1px solid rgba(147, 197, 253, 0.8)',
            backdropFilter: 'blur(5px)',
            borderRadius: '0.375rem',
            padding: '0.25rem 0.5rem'
          }}
        >
          <div className={`text-xs font-medium ${
            shift.status === 'published' ? 'text-white' : 'text-blue-900'
          }`}>
            {formatShiftTime(shift.start_time, shift.end_time)}
          </div>
          {/* Duplicate button */}
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleDuplicateShift(shift, employeeName)
            }}
            size="icon"
            variant="default"
            className="absolute top-0 left-0 -mt-1 -ml-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Duplicate shift"
          >
            <Copy className="w-3 h-3" />
          </Button>
          {/* Delete button */}
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteShift(shift.id)
            }}
            size="icon"
            variant="destructive"
            className="absolute top-0 right-0 -mt-1 -mr-1 rounded-full h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete shift"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  // Helper component: Droppable Cell with Availability on Hover
  const DroppableCell = ({ employeeId, employeeName, dayIndex, children, className, style, hasTimeOff }: {
    employeeId: string
    employeeName: string
    dayIndex: number
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    hasTimeOff: boolean
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `cell-${employeeId}-${dayIndex}`,
      disabled: hasTimeOff
    })

    // Get time-offs for this employee on this day
    const timeOffsForDay = timeOffsByEmployeeAndDay[employeeId]?.[dayIndex] || []

    // Get availability for this employee on this day
    const availabilityForDay = availabilityByEmployeeAndDay[employeeId]?.[dayIndex] || []

    // Format availability times for display
    const availabilityText = availabilityForDay.length > 0
      ? availabilityForDay.map(avail =>
          `${formatAvailabilityTime(avail.start_time)} - ${formatAvailabilityTime(avail.end_time)}`
        ).join(', ')
      : null

    // Determine what to show on hover
    const hasTimeOffToday = timeOffsForDay.length > 0

    return (
      <td
        ref={setNodeRef}
        className={`${className} ${isOver && !hasTimeOff ? 'bg-blue-100/50 ring-2 ring-blue-400' : ''} group relative`}
        style={style}
        onClick={() => !hasTimeOff && handleCellClick(employeeId, employeeName, daysOfWeek[dayIndex]?.date || new Date(), dayIndex)}
      >
        {children}
        {/* Availability/Unavailability info - shown on hover */}
        {hasTimeOffToday ? (
          // Show "Unavailable" with orange background when time-off exists
          <div className="absolute inset-0 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col justify-center items-center"
            style={{
              background: 'rgba(251, 146, 60, 0.25)',
            }}
          >
            <p className="text-xs font-bold text-orange-900">
              Unavailable
            </p>
            {timeOffsForDay[0].reason && (
              <p className="text-xs text-orange-800 mt-1 text-center">
                {timeOffsForDay[0].reason}
              </p>
            )}
          </div>
        ) : availabilityText ? (
          // Show availability with green background when no time-off
          <div className="absolute inset-0 bg-green-50/95 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col justify-center items-center">
            <p className="text-xs font-medium text-gray-700">
              {availabilityText}
            </p>
          </div>
        ) : null}
      </td>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="max-w-[1600px] mx-auto">
          <Card className="shadow-lg bg-white/90 backdrop-blur-lg border-white/50">
            <CardContent className="flex items-center gap-3 p-5">
            {/* Today Button */}
            <Button
              onClick={goToToday}
              disabled={isThisWeek}
              variant="outline"
              size="sm"
              className="border-2"
            >
              Today
            </Button>

            {/* Date Range Display */}
            <button
              className="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 font-medium text-gray-700"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              {dateRangeString}
            </button>

            {/* Navigation Arrows */}
            <div className="flex gap-1">
              <Button
                onClick={goToPreviousWeek}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                onClick={goToNextWeek}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Repeat Last Week Button */}
            <Button
              onClick={handleRepeatLastWeek}
              variant="outline"
              size="sm"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Repeat className="w-4 h-4 mr-2" />
              Repeat Last Week
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Published Status Badge */}
            {isWeekPublished && (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                ✓ Published
              </Badge>
            )}

            {/* Publish Button */}
            <Button
              onClick={handlePublish}
              disabled={draftCount === 0}
              size="sm"
              className="shadow-md"
            >
              <Send className="w-4 h-4 mr-2" />
              Publish ({draftCount})
            </Button>

            {/* Clear Drafts Button */}
            <Button
              onClick={handleClearDrafts}
              disabled={draftCount === 0}
              variant="destructive"
              size="sm"
              className="shadow-md"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Grid & Availability Container - Scrollable */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Schedule Grid */}
          <Card className="overflow-hidden shadow-lg bg-white/90 backdrop-blur-lg border-white/50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-gray-600">{SCHEDULE_MESSAGES.LOADING_SCHEDULE}</div>
                </div>
              </div>
            ) : (
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th
                        className="sticky top-0 left-0 z-20 border-r border-b px-5 py-4 text-left font-semibold text-sm text-gray-700 min-w-[220px]"
                        style={{
                          background: 'rgba(249, 250, 251, 0.95)',
                          backdropFilter: 'blur(10px)',
                          borderColor: 'rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        Employee ({employees.length})
                      </th>
                      {daysOfWeek.map((day, index) => (
                        <th
                          key={index}
                          className="sticky top-0 z-10 border-r border-b px-3 py-3 text-center font-semibold text-sm min-w-[120px]"
                          style={{
                            background: day.isToday
                              ? 'rgba(224, 231, 255, 0.5)'
                              : 'rgba(249, 250, 251, 0.95)',
                            backdropFilter: 'blur(10px)',
                            borderColor: 'rgba(0, 0, 0, 0.06)'
                          }}
                        >
                          {day.isToday ? (
                            <span className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                              {day.dayName}, {day.dayNumber}
                            </span>
                          ) : (
                            <span className="text-gray-700">
                              {day.dayName}, {day.dayNumber}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Open Shifts Row */}
                    {openShifts.length > 0 && (
                      <tr className="bg-yellow-50/50">
                        <td
                          className="sticky left-0 z-10 border-r border-b px-5 py-3 font-medium text-sm text-gray-800"
                          style={{
                            background: 'rgba(254, 252, 232, 0.9)',
                            backdropFilter: 'blur(10px)',
                            borderColor: 'rgba(0, 0, 0, 0.04)'
                          }}
                        >
                          🔓 Open Shifts ({openShifts.length})
                        </td>
                        {daysOfWeek.map((day, dayIndex) => {
                          const shiftsForDay = openShifts.filter(shift => {
                            const shiftDate = new Date(shift.start_time).toDateString()
                            return shiftDate === day.date.toDateString()
                          })
                          return (
                            <td
                              key={dayIndex}
                              className="border-r border-b p-1.5 min-h-[50px] align-top"
                              style={{
                                borderColor: 'rgba(0, 0, 0, 0.04)',
                                background: 'rgba(254, 243, 199, 0.15)'
                              }}
                            >
                              {shiftsForDay.length > 0 && (
                                <div className="space-y-1">
                                  {shiftsForDay.map((shift) => (
                                    <div
                                      key={shift.id}
                                      className="rounded px-2 py-1 cursor-pointer hover:shadow-md transition-shadow text-center group relative"
                                      style={{
                                        background: 'rgba(147, 197, 253, 0.5)', // Light blue for draft (open shifts are always drafts)
                                        border: '1px solid rgba(147, 197, 253, 0.8)',
                                        backdropFilter: 'blur(5px)'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleShiftClick({ ...shift, status: 'draft' } as ScheduleShift, 'Open Shift')
                                      }}
                                    >
                                      <div className="text-xs font-medium text-blue-900">
                                        {formatShiftTime(shift.start_time, shift.end_time)}
                                      </div>
                                      {/* Duplicate button */}
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDuplicateShift({ ...shift, status: 'draft' } as ScheduleShift, 'Open Shift')
                                        }}
                                        size="icon"
                                        variant="default"
                                        className="absolute top-0 left-0 -mt-1 -ml-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Duplicate shift"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                      {/* Delete button */}
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteShift(shift.id)
                                        }}
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-0 right-0 -mt-1 -mr-1 rounded-full h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete shift"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )}

                    {/* Employee Rows */}
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => {
                        const hours = weeklyHours[employee.id] || 0
                        const formattedHours = formatShiftHours(hours)

                        return (
                          <tr
                            key={employee.id}
                            className="transition-colors hover:bg-white/40"
                          >
                            <td
                              className="sticky left-0 z-10 border-r border-b px-5 py-3 font-medium text-sm text-gray-800"
                              style={{
                                background: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                borderColor: 'rgba(0, 0, 0, 0.04)'
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{employee.first_name}</span>
                                <span className="text-xs text-gray-500 font-normal ml-2">
                                  {formattedHours}
                                </span>
                              </div>
                            </td>
                            {daysOfWeek.map((day, dayIndex) => {
                              const shiftsForDay = shiftsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                              const timeOffsForDay = timeOffsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                              const hasTimeOff = timeOffsForDay.length > 0

                              return (
                                <DroppableCell
                                  key={dayIndex}
                                  employeeId={employee.id}
                                  employeeName={employee.first_name}
                                  dayIndex={dayIndex}
                                  hasTimeOff={hasTimeOff}
                                  className={`border-r border-b p-1.5 min-h-[50px] align-top ${
                                    !hasTimeOff ? 'cursor-pointer hover:bg-blue-50/30' : ''
                                  }`}
                                  style={{
                                    borderColor: 'rgba(0, 0, 0, 0.04)',
                                    background: day.isToday ? 'rgba(224, 231, 255, 0.15)' : 'transparent'
                                  }}
                                >
                                  {(shiftsForDay.length > 0 || timeOffsForDay.length > 0) ? (
                                    <div className="space-y-1">
                                      {/* Shifts */}
                                      {shiftsForDay.map((shift) => (
                                        <DraggableShift
                                          key={shift.id}
                                          shift={shift}
                                          employeeName={employee.first_name}
                                        />
                                      ))}
                                      {/* Time-offs */}
                                      {timeOffsForDay.map((timeOff) => {
                                        const isAllDay = isAllDayTimeOff(timeOff)
                                        return (
                                          <div
                                            key={timeOff.id}
                                            className="rounded px-2 py-1 cursor-not-allowed transition-shadow text-center"
                                            style={{
                                              background: 'rgba(251, 146, 60, 0.15)',
                                              border: '1px solid rgba(251, 146, 60, 0.35)',
                                              backdropFilter: 'blur(5px)'
                                            }}
                                            title={timeOff.reason || 'Time off'}
                                          >
                                            <div className="text-xs font-medium text-orange-900">
                                              {isAllDay ? 'Time Off' : formatShiftTime(timeOff.start_time, timeOff.end_time)}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <div className="h-full min-h-[35px] flex items-center justify-center">
                                      {!hasTimeOff && (
                                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                                      )}
                                    </div>
                                  )}
                                </DroppableCell>
                              )
                            })}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <DragOverlay>
                {activeShift ? (
                  <div className="rounded px-2 py-1 shadow-lg" style={{
                    background: activeShift.status === 'published'
                      ? 'rgba(30, 64, 175, 0.85)'
                      : 'rgba(147, 197, 253, 0.5)',
                    border: activeShift.status === 'published'
                      ? '1px solid rgba(30, 64, 175, 1)'
                      : '1px solid rgba(147, 197, 253, 0.8)'
                  }}>
                    <div className={`text-xs font-medium ${
                      activeShift.status === 'published' ? 'text-white' : 'text-blue-900'
                    }`}>
                      {formatShiftTime(activeShift.start_time, activeShift.end_time)}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
            )}
          </Card>

          {/* Employee Availability & Time-Off List */}
          <Card className="overflow-hidden shadow-lg bg-white/90 backdrop-blur-lg border-white/50">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg">Employee Availability & Time-Offs</CardTitle>
              <CardDescription>Regular availability and time-off notices for this week</CardDescription>
            </CardHeader>

            {/* List */}
            <CardContent className="p-0">
              <div className="divide-y max-h-[400px] overflow-y-auto">
              {employees.map((employee) => {
                // Get time-offs for this employee this week
                const employeeTimeOffs = timeOffs.filter(t => t.employee_id === employee.id)

                // Get availability for this employee (grouped by day)
                const employeeAvailability = availabilityByEmployeeAndDay[employee.id] || {}
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const availabilityText = Object.entries(employeeAvailability)
                  .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
                  .map(([dayIndex, availabilities]) => {
                    const dayName = dayNames[Number(dayIndex)]
                    const times = availabilities.map(avail =>
                      `${formatAvailabilityTime(avail.start_time)}-${formatAvailabilityTime(avail.end_time)}`
                    ).join(', ')
                    return `${dayName}: ${times}`
                  }).join(' | ')

                return (
                  <div
                    key={employee.id}
                    className="px-6 py-4 hover:bg-white/40 transition-colors"
                    style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }}
                  >
                    {/* Employee Name */}
                    <div className="font-semibold text-gray-800 mb-2">
                      {employee.first_name} {employee.last_name || ''}
                    </div>

                    {/* Availability */}
                    <div className="flex items-start gap-2 text-sm mb-2">
                      <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-600 font-medium">Available: </span>
                        <span className="text-gray-700">
                          {availabilityText || 'No availability set'}
                        </span>
                      </div>
                    </div>

                    {/* Time-Offs */}
                    {employeeTimeOffs.length > 0 ? (
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600 font-medium">Time Off: </span>
                          {employeeTimeOffs.map((timeOff, idx) => (
                            <div key={timeOff.id} className="inline">
                              {idx > 0 && ', '}
                              <span className="text-orange-700 font-medium">
                                {format(new Date(timeOff.start_time), 'MMM d')}
                                {format(new Date(timeOff.start_time), 'yyyy-MM-dd') !== format(new Date(timeOff.end_time), 'yyyy-MM-dd') &&
                                  ` - ${format(new Date(timeOff.end_time), 'MMM d')}`
                                }
                              </span>
                              {timeOff.reason && (
                                <span className="text-gray-600"> ({timeOff.reason})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>No time-offs this week</span>
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Shift Dialog */}
      <AddShiftDialog
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveShift}
        employeeName={modalState.employeeName}
        date={modalState.date}
        hasTimeOff={modalState.hasTimeOff}
        timeOffReason={modalState.timeOffReason}
        initialStartTime={modalState.initialStartTime}
        initialEndTime={modalState.initialEndTime}
        initialLocation={modalState.initialLocation}
      />

      {/* Edit Shift Dialog */}
      <EditShiftDialog
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ ...editModalState, isOpen: false })}
        onSave={handleEditShift}
        shift={editModalState.shift}
        employeeName={editModalState.employeeName}
      />
    </div>
  )
}
