import { useDroppable } from '@dnd-kit/core'
import { format } from 'date-fns'

/**
 * OpenShiftCell - Droppable cell for the Open Shifts row
 *
 * Allows dragging assigned shifts here to convert them to open shifts.
 */

interface OpenShift {
  id: number
  start_time: string
  end_time: string
}

interface OpenShiftCellProps {
  dayIndex: number
  date: Date
  isToday: boolean
  shifts: OpenShift[]
  onShiftClick: (shift: any, employeeName: string) => void
}

export function OpenShiftCell({
  dayIndex,
  date,
  isToday: _isToday,
  shifts,
  onShiftClick
}: OpenShiftCellProps) {
  // Drop ID format: "cell-open-{dayIndex}" - "open" instead of employeeId
  const { setNodeRef, isOver, active } = useDroppable({
    id: `cell-open-${dayIndex}`,
    data: { employeeId: null, dayIndex, date, isOpenShift: true }
  })

  const isDragging = active !== null

  // Visual feedback - open shifts are always valid drop targets
  let dropFeedback = ''
  if (isDragging && isOver) {
    dropFeedback = 'ring-2 ring-blue-400 bg-blue-50'
  }

  // Background color logic (no special today background)
  let bgColor = 'transparent'
  if (dropFeedback) {
    bgColor = undefined as any
  }

  return (
    <td
      ref={setNodeRef}
      className={`border-b border-gray-200 border-r border-gray-100 p-1.5 align-middle transition-all ${dropFeedback}`}
      style={{
        background: bgColor,
        height: '56px',
        minWidth: '100px'
      }}
    >
      {shifts.length > 0 ? (
        <div className="flex flex-col gap-1">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors shadow-sm"
              onClick={() => onShiftClick(shift as any, 'Open')}
            >
              {format(new Date(shift.start_time), 'h:mm')}-{format(new Date(shift.end_time), 'h:mm a')}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-300">—</div>
      )}
    </td>
  )
}
