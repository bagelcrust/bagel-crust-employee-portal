import { Plus, Copy } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { formatShiftTime } from '../shared/scheduleUtils'
import type { DraftShift } from '@/shared/supabase-client'

/**
 * OpenShiftCell - Cell for Open Shifts row (unassigned shifts)
 *
 * Simpler than ShiftCell - no time-off or availability logic.
 * Just shows/adds/edits open shifts for a specific day.
 */

interface OpenShiftCellProps {
  dayIndex: number
  date: Date
  shifts: DraftShift[]
  onCellClick: (employeeId: null, employeeName: string, date: Date, dayIndex: number) => void
  onShiftClick: (shift: DraftShift & { status: 'draft' }, employeeName: string) => void
  onDuplicateShift: (shift: DraftShift & { status: 'draft' }, employeeName: string) => void
}

export function UnassignedShiftDisplay({
  dayIndex,
  date,
  shifts,
  onCellClick,
  onShiftClick,
  onDuplicateShift
}: OpenShiftCellProps) {

  // ⚠️ CELL HEIGHT: h-[48px] - DO NOT CHANGE
  // This fixed height ensures all cells are uniform regardless of content
  return (
    <td
      className="border-b border-slate-200/50 p-1 group cursor-pointer hover:bg-slate-50/50"
      style={{
        background: 'transparent',
        height: '48px',
        maxHeight: '48px',
        overflow: 'hidden'
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        const isClickingShift = target.closest('.shift-card')
        if (!isClickingShift) {
          onCellClick(null, 'Open Shift', date, dayIndex)
        }
      }}
    >
      {shifts.length > 0 ? (
        <div className="space-y-1 overflow-hidden h-full flex flex-col justify-center">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="shift-card rounded px-1.5 py-0.5 cursor-pointer hover:shadow-md transition-shadow text-center group relative"
              onClick={() => onShiftClick({ ...shift, status: 'draft' }, 'Open Shift')}
            >
              <div
                style={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.375rem 0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="text-[11px] font-bold text-slate-600 tracking-wide">
                  {formatShiftTime(shift.start_time, shift.end_time)}
                </div>
              </div>



              {/* Duplicate Button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicateShift({ ...shift, status: 'draft' }, 'Open Shift')
                }}
                size="icon"
                variant="default"
                className="absolute top-0 left-0 -mt-1 -ml-1 bg-white hover:bg-gray-200 text-black rounded-full h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Duplicate shift"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100" />
        </div>
      )}
    </td>
  )
}
