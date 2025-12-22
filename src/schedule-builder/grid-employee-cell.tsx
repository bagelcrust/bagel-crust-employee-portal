import { Trash2 } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { formatAvailabilityTime } from '../shared/scheduleUtils'
import { DraggableShiftCard } from './draggable-shift-card'
import type { ScheduleShift } from './fetch-schedule-data'
import type { TimeOff } from '@/shared/supabase-client'

interface Availability {
  start_time: string
  end_time: string
}

interface ShiftCellProps {
  employeeId: string
  employeeName: string
  dayIndex: number
  date: Date
  shifts: ScheduleShift[]
  timeOffs: TimeOff[]
  availability: Availability[]
  isToday: boolean
  onCellClick: () => void
  onShiftClick: (shift: ScheduleShift, employeeName: string) => void
  onDeleteShift: (shiftId: number) => void
  onAvailabilityClick: (avail: Availability) => void
}

export function EmployeeDayCell({
  employeeId,
  employeeName,
  dayIndex,
  date,
  shifts,
  timeOffs,
  availability,
  isToday: _isToday,
  onCellClick,
  onShiftClick,
  onDeleteShift
}: ShiftCellProps) {
  // Set up droppable zone - ID format: "cell-{employeeId}-{dayIndex}"
  const { setNodeRef, isOver, active } = useDroppable({
    id: `cell-${employeeId}-${dayIndex}`,
    data: { employeeId, dayIndex, date }
  })

  const hasTimeOff = timeOffs.length > 0
  const hasAvailability = availability.length > 0
  const isClickable = shifts.length === 0 && !hasTimeOff && hasAvailability

  // Determine if this is a valid drop target
  // Invalid if: has all-day time-off OR no availability
  const isValidDropTarget = !hasTimeOff && hasAvailability
  const isDragging = active !== null

  // Visual feedback colors for drag-and-drop
  let dropFeedback = ''
  if (isDragging && isOver) {
    dropFeedback = isValidDropTarget
      ? 'ring-2 ring-blue-400 bg-blue-50'  // Valid: blue highlight
      : 'ring-2 ring-red-400 bg-red-50'    // Invalid: red highlight
  } else if (isDragging && !isValidDropTarget) {
    dropFeedback = 'bg-red-50/30'
  }

  // Background color logic (no special today background - just text)
  let bgColor = 'transparent'
  if (dropFeedback) {
    bgColor = undefined as any // Let dropFeedback class handle it
  }

  return (
    <td
      ref={setNodeRef}
      className={`border-b border-gray-200 border-r border-gray-100 p-1.5 align-middle group transition-all ${isClickable ? 'cursor-pointer hover:bg-blue-50/50' : ''} ${dropFeedback}`}
      style={{
        background: bgColor,
        height: '56px',
        minWidth: '100px'
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        const isClickingShift = target.closest('.shift-card')
        if (isClickable && !isClickingShift) {
          onCellClick()
        }
      }}
    >
      {shifts.length > 0 ? (
        <div className="flex flex-col gap-1">
          {shifts.map((shift) => (
            <div key={shift.id} className="group/shift relative">
              <DraggableShiftCard
                shift={shift}
                employeeName={employeeName}
                date={date}
                onShiftClick={onShiftClick}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteShift(shift.id)
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-full opacity-0 group-hover/shift:opacity-100 flex items-center justify-center shadow-sm transition-all"
                title="Delete shift"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : hasTimeOff ? (
        <div className="h-full flex items-center justify-center">
          <span className="text-gray-400 text-xs font-medium">Time Off</span>
        </div>
      ) : hasAvailability ? (
        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-gray-400 text-center">
            {availability.map((avail, idx) => (
              <div key={idx}>{formatAvailabilityTime(avail.start_time)} - {formatAvailabilityTime(avail.end_time)}</div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300">—</div>
      )}
    </td>
  )
}
