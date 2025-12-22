/**
 * Day Accordion Component
 *
 * Collapsible day section showing shifts and add button.
 * Tap to expand/collapse.
 */

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { ShiftCard } from './shift-card'
import type { Employee } from '../../shared/supabase-client'
import type { ScheduleShift } from '../../schedule-builder/fetch-schedule-data'

interface DayAccordionProps {
  date: Date
  isToday: boolean
  shifts: ScheduleShift[]
  employees: Employee[]
  onAddShift: () => void
  onDeleteShift: (shiftId: number) => void
}

export function DayAccordion({
  date,
  isToday,
  shifts,
  employees,
  onAddShift,
  onDeleteShift
}: DayAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Get employee name by ID
  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return 'Open Shift'
    const emp = employees.find(e => e.id === employeeId)
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'
  }

  // Format as "Monday, Dec 15"
  const fullDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex items-center justify-between"
      >
        <div className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
          {fullDate}
          {isToday && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Today</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Shift count badge */}
          {shifts.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {shifts.length}
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
          {/* Existing shifts */}
          {shifts.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No shifts scheduled
            </div>
          ) : (
            shifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                employeeName={getEmployeeName(shift.employee_id)}
                startTime={shift.start_time}
                endTime={shift.end_time}
                location={shift.location || 'Calder'}
                status={shift.status}
                onDelete={() => onDeleteShift(shift.id)}
              />
            ))
          )}

          {/* Add shift button */}
          <button
            onClick={onAddShift}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Shift</span>
          </button>
        </div>
      )}
    </div>
  )
}
