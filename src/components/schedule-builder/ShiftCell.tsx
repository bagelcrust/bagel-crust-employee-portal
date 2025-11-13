import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { DraggableShift } from './DraggableShift'
import { AvailabilityOverlay } from './AvailabilityOverlay'
import { TimeOffOverlay } from './TimeOffOverlay'
import { formatShiftTime, isAllDayTimeOff } from '@/lib'
import type { ScheduleShift } from '@/hooks'
import type { TimeOff } from '@/supabase/supabase'

/**
 * ShiftCell - Droppable table cell that shows shifts, time-offs, and availability
 *
 * Features:
 * - Droppable zone for drag-and-drop shifts
 * - Renders shifts using DraggableShift component
 * - Shows availability overlay on hover (green)
 * - Shows time-off overlay on hover (orange/gray)
 * - Blocks clicks/drops on unavailable cells
 * - Click empty cell to add new shift
 *
 * Used in: ScheduleBuilderV2 table rows
 */

interface Availability {
  start_time: string
  end_time: string
}

interface ShiftCellProps {
  employeeId: string
  employeeName: string
  dayIndex: number
  shifts: ScheduleShift[]
  timeOffs: TimeOff[]
  availability: Availability[]
  isToday: boolean
  onCellClick: () => void
  onShiftClick: (shift: ScheduleShift, employeeName: string) => void
  onDeleteShift: (shiftId: number) => void
  onAvailabilityClick: (avail: Availability) => void
}

export function ShiftCell({
  employeeId,
  employeeName,
  dayIndex,
  shifts,
  timeOffs,
  availability,
  isToday,
  onCellClick,
  onShiftClick,
  onDeleteShift,
  onAvailabilityClick
}: ShiftCellProps) {
  // Check if there's an all-day time-off
  const hasAllDayTimeOff = timeOffs.some(timeOff => isAllDayTimeOff(timeOff))

  // Filter out partial time-offs (not all-day)
  const partialTimeOffs = timeOffs.filter(timeOff => !isAllDayTimeOff(timeOff))

  // Helper: Check if two time ranges overlap
  const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const parseTime = (timeStr: string) => {
      // Handle both timestamp formats (ISO: "2025-11-14T07:00:00") and time-only formats ("07:00:00")
      let time = timeStr
      if (timeStr.includes('T')) {
        // Convert UTC timestamp to Eastern Time before extracting time portion
        const date = new Date(timeStr)
        const easternTime = date.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        time = easternTime
      }
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }
    const s1 = parseTime(start1)
    const e1 = parseTime(end1)
    const s2 = parseTime(start2)
    const e2 = parseTime(end2)
    return s1 < e2 && s2 < e1
  }

  // Sort availability by start time
  const sortedAvailability = [...availability].sort((a, b) => {
    const aTime = a.start_time.split(':').map(Number)
    const bTime = b.start_time.split(':').map(Number)
    return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1])
  })

  // Filter availability to exclude time-off periods (only show truly available times)
  const filteredAvailability = sortedAvailability.filter(avail => {
    // Exclude if it overlaps with any partial time-off
    const hasOverlap = partialTimeOffs.some(timeOff =>
      timeRangesOverlap(avail.start_time, avail.end_time, timeOff.start_time, timeOff.end_time)
    )
    return !hasOverlap
  })

  // Check if employee has NO availability at all (not available)
  const hasNoAvailability = filteredAvailability.length === 0 && !hasAllDayTimeOff && partialTimeOffs.length === 0

  // Hide availability overlay if there are already shifts scheduled
  const showOverlay = shifts.length === 0

  // Droppable setup
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${employeeId}-${dayIndex}`,
    disabled: hasAllDayTimeOff || hasNoAvailability
  })

  return (
    <td
      ref={setNodeRef}
      className={`
        border-r border-b p-1.5 min-h-[50px] align-top group relative
        ${isOver && !hasAllDayTimeOff && !hasNoAvailability ? 'bg-blue-100/50 ring-2 ring-blue-400' : ''}
        ${hasNoAvailability || hasAllDayTimeOff ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50/30'}
      `}
      style={{
        borderColor: 'rgba(0, 0, 0, 0.04)',
        background: isToday ? 'rgba(224, 231, 255, 0.15)' : 'transparent'
      }}
      onClick={(e) => {
        // Only handle cell click if clicking empty space (not on a shift card)
        const target = e.target as HTMLElement
        const isClickingShift = target.closest('.shift-card')
        // Prevent clicking on unavailable cells (time-off or no availability)
        if (!hasAllDayTimeOff && !hasNoAvailability && !isClickingShift) {
          onCellClick()
        }
      }}
    >
      {(shifts.length > 0 || timeOffs.length > 0) ? (
        <div className="space-y-1">
          {/* Shifts */}
          {shifts.map((shift) => (
            <DraggableShift
              key={shift.id}
              shift={shift}
              employeeName={employeeName}
              onShiftClick={onShiftClick}
              onDeleteShift={onDeleteShift}
            />
          ))}
          {/* Time-offs */}
          {timeOffs.map((timeOff) => {
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
          {!hasAllDayTimeOff && !hasNoAvailability && (
            <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
          )}
        </div>
      )}

      {/* Overlays - shown on hover (only when no shifts scheduled) */}
      {showOverlay && hasAllDayTimeOff && (
        <TimeOffOverlay
          hasAllDayTimeOff={true}
          hasNoAvailability={false}
          timeOffReason={timeOffs.find(t => isAllDayTimeOff(t))?.reason || undefined}
        />
      )}
      {showOverlay && hasNoAvailability && (
        <TimeOffOverlay
          hasAllDayTimeOff={false}
          hasNoAvailability={true}
        />
      )}
      {showOverlay && filteredAvailability.length > 0 && (
        <AvailabilityOverlay
          availability={filteredAvailability}
          onAvailabilityClick={onAvailabilityClick}
        />
      )}
    </td>
  )
}
