import { useDraggable } from '@dnd-kit/core'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatShiftTime } from '@/lib'
import type { ScheduleShift } from '@/hooks'

/**
 * DraggableShift - A single shift card with drag-and-drop functionality
 *
 * Features:
 * - Drag handle on hover (left edge)
 * - Delete button on hover (top right)
 * - Click to edit
 * - Visual styling based on status (published vs draft)
 *
 * Used in: ShiftCell component for rendering shifts in the schedule grid
 */

interface DraggableShiftProps {
  shift: ScheduleShift
  employeeName: string
  onShiftClick: (shift: ScheduleShift, employeeName: string) => void
  onDeleteShift: (shiftId: number) => void
}

export function DraggableShift({
  shift,
  employeeName,
  onShiftClick,
  onDeleteShift
}: DraggableShiftProps) {
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
      className="shift-card rounded px-2 py-1 hover:shadow-md transition-shadow text-center group relative z-10"
      onClick={(e) => {
        e.stopPropagation()
        if (!isDragging) {
          onShiftClick(shift, employeeName)
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
        className="cursor-pointer"
      >
        {/* Drag handle - only this part is draggable */}
        <div
          {...listeners}
          {...attributes}
          className="absolute left-0 top-0 bottom-0 w-3 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{
            background: shift.status === 'published'
              ? 'rgba(30, 64, 175, 0.5)'
              : 'rgba(147, 197, 253, 0.7)',
            borderRadius: '0.375rem 0 0 0.375rem'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[8px] leading-none">⋮⋮</div>
        </div>

        <div className={`text-xs font-medium ${
          shift.status === 'published' ? 'text-white' : 'text-blue-900'
        }`}>
          {formatShiftTime(shift.start_time, shift.end_time)}
        </div>

        {/* Delete button - visible on hover */}
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onDeleteShift(shift.id)
          }}
          size="icon"
          variant="destructive"
          className="absolute top-0 right-0 -mt-1 -mr-1 rounded-full h-6 w-6 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title="Delete shift"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
