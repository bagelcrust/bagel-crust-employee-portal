import { formatShiftTime } from '@/lib'
import type { ScheduleShift } from '@/hooks'

/**
 * ShiftCard - A simple shift card for the schedule grid
 *
 * Features:
 * - Click to edit (delete available in edit modal)
 * - Visual styling based on status (published vs draft)
 *
 * Used in: ShiftCell component for rendering shifts in the schedule grid
 */

interface ShiftCardProps {
  shift: ScheduleShift
  employeeName: string
  onShiftClick: (shift: ScheduleShift, employeeName: string) => void
}

export function ShiftCard({
  shift,
  employeeName,
  onShiftClick
}: ShiftCardProps) {
  return (
    <div
      className="shift-card rounded px-1.5 py-0.5 hover:shadow-md transition-shadow text-center cursor-pointer"
      onClick={(e) => {
        e.stopPropagation()
        onShiftClick(shift, employeeName)
      }}
    >
      <div
        style={{
          background: shift.status === 'published'
            ? 'rgba(255, 255, 255, 0.95)' // Solid white for published
            : 'rgba(255, 255, 255, 0.20)', // Slightly more visible draft
          border: shift.status === 'published'
            ? '1px solid rgba(255, 255, 255, 1)' // Solid border
            : '1px dashed rgba(255, 255, 255, 0.5)', // DASHED border for draft
          backdropFilter: 'blur(5px)',
          borderRadius: '0.25rem',
          padding: '0.25rem 0.5rem'
        }}
      >
        <div className={`text-sm font-medium ${
          shift.status === 'published' ? 'text-black' : 'text-white'
        }`}>
          {formatShiftTime(shift.start_time, shift.end_time)}
        </div>
      </div>
    </div>
  )
}
