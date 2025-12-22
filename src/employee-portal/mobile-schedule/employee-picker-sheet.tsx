/**
 * Employee Picker Modal
 *
 * Centered modal for selecting an employee and creating a shift.
 * Shows available employees, their availability windows, and time/location inputs.
 */

import { useState, useEffect } from 'react'
import { X, Clock, Check, Plus, Minus } from 'lucide-react'
import type { Employee } from '../../shared/supabase-client'

interface EmployeePickerSheetProps {
  open: boolean
  onClose: () => void
  employees: Employee[]
  availabilityByEmployeeAndDay: Record<string, Record<number, any[]>>
  dayIndex: number | null
  onCreateShift: (
    employeeId: string,
    startTime: string,
    endTime: string,
    location: string
  ) => Promise<void>
}

export function EmployeePickerSheet({
  open,
  onClose,
  employees,
  availabilityByEmployeeAndDay,
  dayIndex,
  onCreateShift
}: EmployeePickerSheetProps) {
  // Selected employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  // Time inputs
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedEmployeeId(null)
      setStartTime('09:00')
      setEndTime('17:00')
    }
  }, [open])

  // Adjust time by 30-minute increments
  const adjustTime = (currentTime: string, minutes: number): string => {
    const [hours, mins] = currentTime.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440
    const newHours = Math.floor(adjustedMinutes / 60)
    const newMins = adjustedMinutes % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
  }

  // Get availability for an employee on the selected day
  const getAvailability = (employeeId: string): string => {
    if (dayIndex === null) return ''
    const avail = availabilityByEmployeeAndDay[employeeId]?.[dayIndex]
    if (!avail || avail.length === 0) return 'Not available'

    // Format availability times
    const first = avail[0]
    if (first.start_time && first.end_time) {
      return `${formatTime(first.start_time)} - ${formatTime(first.end_time)}`
    }
    return 'Available'
  }

  // Format time from HH:MM:SS to h:mm AM/PM
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Handle employee selection and pre-fill times from availability
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)

    // Pre-fill times from availability
    if (dayIndex !== null) {
      const avail = availabilityByEmployeeAndDay[employeeId]?.[dayIndex]
      if (avail && avail.length > 0 && avail[0].start_time && avail[0].end_time) {
        // Extract HH:MM from HH:MM:SS
        setStartTime(avail[0].start_time.substring(0, 5))
        setEndTime(avail[0].end_time.substring(0, 5))
      }
    }
  }

  // Handle shift creation
  const handleCreate = async () => {
    if (!selectedEmployeeId) return

    setIsSubmitting(true)
    try {
      await onCreateShift(selectedEmployeeId, startTime, endTime, 'Calder')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-[12px] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Add Shift</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Employee List */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Select Employee</div>
              {employees.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  No employees available for this day
                </div>
              ) : (
                <div className="space-y-2">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedEmployeeId === emp.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {getAvailability(emp.id)}
                          </div>
                        </div>
                        {selectedEmployeeId === emp.id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time Selection - Only show when employee selected */}
            {selectedEmployeeId && (
              <div className="space-y-4">
                {/* Start Time */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 text-center">Start Time</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStartTime(adjustTime(startTime, -30))}
                      className="h-11 w-11 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-28 h-11 text-center text-lg font-medium border border-gray-200 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setStartTime(adjustTime(startTime, 30))}
                      className="h-11 w-11 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2 text-center">End Time</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEndTime(adjustTime(endTime, -30))}
                      className="h-11 w-11 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-28 h-11 text-center text-lg font-medium border border-gray-200 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setEndTime(adjustTime(endTime, 30))}
                      className="h-11 w-11 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Create Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleCreate}
              disabled={!selectedEmployeeId || isSubmitting}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                selectedEmployeeId && !isSubmitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Shift'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
