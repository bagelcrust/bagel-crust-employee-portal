import { Trash2 } from 'lucide-react'
import { Button } from '../ui/UIButton'
import { formatShiftTime, formatAvailabilityTime } from '@/lib'
import type { ScheduleShift } from '@/hooks'
import type { TimeOff } from '@/supabase/supabase'

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

export function EmployeeDayCell({
  employeeName,
  shifts,
  timeOffs,
  availability,
  isToday,
  onCellClick,
  onShiftClick,
  onDeleteShift
}: ShiftCellProps) {
  /**
   * Display logic (6 states):
   * 1. scheduled + not published → grey dashed border
   * 2. scheduled + published → white solid border
   * 3. not scheduled + no availability + no time-off → "-"
   * 4. not scheduled + no availability + HAS time-off → "TIME OFF"
   * 5. not scheduled + has availability + is available → show availability times
   * 6. not scheduled + has availability + time-off → "TIME OFF"
   *
   * Simplified:
   * - Shifts exist → show shifts
   * - No shifts + ANY time-off → "TIME OFF"
   * - No shifts + no time-off + availability → show availability
   * - No shifts + no time-off + no availability → "-"
   */

  const hasTimeOff = timeOffs.length > 0
  const hasAvailability = availability.length > 0
  const isClickable = shifts.length === 0 && !hasTimeOff && hasAvailability

  return (
    <td
      className={`
        border-r border-b p-1.5 align-top group relative
        ${isClickable ? 'cursor-pointer hover:bg-zinc-800/20' : 'cursor-not-allowed'}
      `}
      style={{
        borderColor: 'rgba(255, 255, 255, 0.08)',
        background: isToday ? 'rgba(255, 255, 255, 0.03)' : 'rgba(24, 24, 27, 0.4)',
        height: '48px',
        maxHeight: '48px',
        overflow: 'hidden'
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
        /* State 1 & 2: Show shifts (published: white/solid, draft: grey/dashed) */
        <div className="overflow-hidden h-full flex flex-col justify-center gap-1">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="shift-card rounded px-2 py-0.5 hover:shadow-md transition-shadow text-center group relative"
              onClick={(e) => {
                e.stopPropagation()
                onShiftClick(shift, employeeName)
              }}
            >
              <div
                style={{
                  background: shift.status === 'published' ? 'white' : 'rgb(156, 163, 175)',
                  border: shift.status === 'published' ? '1px solid black' : '1px dashed rgb(75, 85, 99)',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.5rem'
                }}
                className="cursor-pointer"
              >
                <div className="text-xs font-medium text-black">
                  {formatShiftTime(shift.start_time, shift.end_time)}
                </div>

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
          ))}
        </div>
      ) : hasTimeOff ? (
        /* State 4 & 6: Show "TIME OFF" (grey cell, regular border) */
        <div className="h-full flex items-center justify-center">
          <span className="text-zinc-500 text-sm uppercase">Time Off</span>
        </div>
      ) : hasAvailability ? (
        /* State 5: Show availability times */
        <div className="h-full flex items-center justify-center">
          <div className="text-xs text-zinc-400 text-center space-y-0.5">
            {availability.map((avail, idx) => (
              <div key={idx}>
                {formatAvailabilityTime(avail.start_time)} - {formatAvailabilityTime(avail.end_time)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* State 3: Show "-" (no availability, no time-off) */
        <div className="h-full flex items-center justify-center">
          <span className="text-zinc-500 text-sm">-</span>
        </div>
      )}
    </td>
  )
}
