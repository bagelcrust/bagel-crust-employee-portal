import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { formatShiftTime } from '../shared/scheduleUtils'
import type { ScheduleShift } from './fetch-schedule-data'

/**
 * DraggableShiftCard - Draggable wrapper for shift cards in the schedule grid
 *
 * Uses @dnd-kit/core to make shifts draggable to different cells.
 * Blue theme to match the glassmorphism design.
 */

interface DraggableShiftCardProps {
  shift: ScheduleShift
  employeeName: string
  date: Date
  onShiftClick: (shift: ScheduleShift, employeeName: string) => void
}

export function DraggableShiftCard({
  shift,
  employeeName,
  onShiftClick
}: DraggableShiftCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: shift.id,
    data: { shift, employeeName }
  })

  const isDraft = shift.status === 'draft'

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="shift-card transition-all hover:shadow-md touch-none"
      onClick={(e) => {
        // Only trigger click if not dragging
        if (!isDragging) {
          e.stopPropagation()
          onShiftClick(shift, employeeName)
        }
      }}
    >
      <div
        className={`rounded-lg px-3 py-1.5 shadow-sm ${
          isDraft
            ? 'bg-blue-500 border-2 border-dashed border-blue-300'
            : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors`}
      >
        {/* Time range */}
        <div className="text-xs font-medium text-white leading-tight">
          {formatShiftTime(shift.start_time, shift.end_time)}
        </div>
        {/* Draft indicator */}
        {isDraft && (
          <div className="text-[10px] text-white/70 uppercase tracking-wide">
            Draft
          </div>
        )}
      </div>
    </div>
  )
}
