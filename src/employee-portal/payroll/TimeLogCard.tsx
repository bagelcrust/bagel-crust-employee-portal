/**
 * TimeLogCard Component
 *
 * Individual employee card with accordion functionality for time log editing.
 * Matches EmployeePayrollCard visual style exactly.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, AlertTriangle, Plus } from 'lucide-react'
import { formatHoursMinutes } from '../../shared/employeeUtils'
import type { EmployeePayroll, WorkedShift } from './types'

interface TimeLogCardProps {
  employee: EmployeePayroll
  onEditShift: (shift: WorkedShift, employeeName: string, employeeId: string) => void
  onCreateShift: (employeeName: string, employeeId: string) => void
}

export function TimeLogCard({ employee, onEditShift, onCreateShift }: TimeLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Check for flagged shifts
  const hasFlags = employee.hasIncompleteShifts || employee.workedShifts.some(s => s.isAutoClockOut)

  // Get first name only
  const firstName = employee.name.split(' ')[0]

  return (
    <div className="bg-white/90 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - Clickable for accordion */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-left"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="font-bold text-slate-900 text-[22px]">
            {firstName}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCreateShift(employee.name, employee.id)
            }}
            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Add new shift"
            type="button"
          >
            <Plus size={18} />
          </button>
          {hasFlags && (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[17px] font-bold text-gray-900">
              {formatHoursMinutes(employee.totalHours)}
            </div>
            <div className="text-xs text-gray-500">
              {employee.workedShifts.length} shift{employee.workedShifts.length !== 1 ? 's' : ''}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content - Shifts List */}
      {isExpanded && (
        <div className="px-4 py-3">
          <div className="space-y-1">
            {employee.workedShifts.map((shift, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-[1fr_auto_auto] gap-2 items-center py-2.5 px-3 rounded ${
                  shift.isIncomplete
                    ? 'bg-orange-100 border-2 border-orange-400'
                    : shift.isAutoClockOut
                    ? 'bg-yellow-50 border-2 border-yellow-400'
                    : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                {/* Shift Info */}
                <div className={`text-[15px] ${shift.isIncomplete ? 'text-orange-800 font-semibold' : shift.isAutoClockOut ? 'text-yellow-900 font-semibold' : 'text-gray-800'}`}>
                  <div className="font-bold">{shift.dayName}</div>
                  <div className="text-[14px] text-gray-600 flex items-center gap-2">
                    <span>{shift.clockIn} - {shift.clockOut || '???'}</span>
                    {shift.isAutoClockOut && (
                      <span className="px-1.5 py-0.5 bg-yellow-600 text-white text-[10px] font-bold rounded">AUTO</span>
                    )}
                  </div>
                </div>

                {/* Hours */}
                <div className={`text-[17px] font-bold text-right ${shift.isIncomplete ? 'text-orange-700' : shift.isAutoClockOut ? 'text-yellow-700' : 'text-gray-900'}`}>
                  {shift.isIncomplete ? '' : formatHoursMinutes(shift.hoursWorked)}
                </div>

                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditShift(shift, employee.name, employee.id)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit time entry"
                  type="button"
                >
                  <Pencil size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
