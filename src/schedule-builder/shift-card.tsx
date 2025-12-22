import { formatShiftTime, getShiftVisualType, getShiftLabel, getShiftColor } from '../shared/scheduleUtils'
import type { ScheduleShift } from './fetch-schedule-data'

/**
 * ShiftCard - Artisan-styled shift card for the schedule grid
 *
 * Features:
 * - Color-coded by shift type (terracotta/sage/mustard)
 * - Two-line display: time range + shift label
 * - Draft vs published visual distinction
 * - Click to edit
 *
 * Used in: EmployeeDayCell for rendering shifts
 */

interface ShiftCardProps {
  shift: ScheduleShift
  employeeName: string
  date: Date  // Needed to determine weekend for brunch coloring
  onShiftClick: (shift: ScheduleShift, employeeName: string) => void
}

export function ShiftCard({
  shift,
  employeeName,
  date,
  onShiftClick
}: ShiftCardProps) {
  const visualType = getShiftVisualType(shift.start_time, date)
  const label = getShiftLabel(visualType)
  const bgColor = getShiftColor(visualType)
  const isDraft = shift.status === 'draft'

  return (
    <div
      className="shift-card cursor-pointer transition-shadow hover:shadow-md"
      onClick={(e) => {
        e.stopPropagation()
        onShiftClick(shift, employeeName)
      }}
    >
      <div
        className="rounded-md px-2 py-1 mx-0.5"
        style={{
          backgroundColor: bgColor,
          opacity: isDraft ? 0.75 : 1,
          border: isDraft
            ? '2px dashed rgba(0,0,0,0.2)'
            : '2px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Time range */}
        <div className="text-xs font-medium text-white leading-tight">
          {formatShiftTime(shift.start_time, shift.end_time)}
        </div>
        {/* Shift type label */}
        <div className="text-xs text-white/80 uppercase tracking-wide">
          {label}
        </div>
      </div>
    </div>
  )
}
