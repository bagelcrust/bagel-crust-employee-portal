/**
 * Mobile Schedule Builder Tab
 *
 * Owner-only tab for creating schedules on mobile.
 * Vertical accordion layout with week navigation.
 * Creates draft shifts using existing backend.
 */

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useGetScheduleBuilderData } from '../../schedule-builder/fetch-schedule-data'
import { DayAccordion } from './day-accordion'
import { EmployeePickerSheet } from './employee-picker-sheet'
import { shiftService } from '../../schedule-builder/shift-operations'
import { format } from 'date-fns'

export function MobileScheduleTab() {
  const {
    daysOfWeek,
    weekOffset,
    setWeekOffset,
    employees,
    shiftsByEmployeeAndDay,
    availabilityByEmployeeAndDay,
    timeOffsByEmployeeAndDay,
    isLoading,
    refetchShifts
  } = useGetScheduleBuilderData()

  // State for employee picker sheet
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Handle opening employee picker for a specific day
  const handleAddShift = (dayIndex: number, date: Date) => {
    setSelectedDayIndex(dayIndex)
    setSelectedDate(date)
    setPickerOpen(true)
  }

  // Handle shift creation from picker
  const handleCreateShift = async (
    employeeId: string,
    startTime: string,
    endTime: string,
    location: string
  ) => {
    if (!selectedDate) return

    // Format: "YYYY-MM-DD HH:MM:SS" in Eastern Time
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const startTimeStr = `${dateStr} ${startTime}:00`
    const endTimeStr = `${dateStr} ${endTime}:00`

    await shiftService.createShift({
      employee_id: employeeId,
      start_time: startTimeStr,
      end_time: endTimeStr,
      location: location
    })

    await refetchShifts()
    setPickerOpen(false)
  }

  // Handle shift deletion
  const handleDeleteShift = async (shiftId: number) => {
    await shiftService.deleteShift(shiftId)
    await refetchShifts()
  }

  // Get available employees for selected day
  const getAvailableEmployees = () => {
    if (selectedDayIndex === null) return []

    return employees.filter(emp => {
      // Check if employee has availability for this day
      const availability = availabilityByEmployeeAndDay[emp.id]?.[selectedDayIndex]
      // Check if employee has time off for this day
      const timeOffs = timeOffsByEmployeeAndDay[emp.id]?.[selectedDayIndex]

      // Available if has availability AND no time off
      return availability && availability.length > 0 && (!timeOffs || timeOffs.length === 0)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-7 h-7 text-blue-600" />
        <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">
          Create Schedule
        </h2>
      </div>

      {/* Week Navigation */}
      <div className="flex gap-2 justify-center">
        {[-1, 0, 1].map((offset) => (
          <button
            key={offset}
            onClick={() => setWeekOffset(offset)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              weekOffset === offset
                ? 'bg-blue-600 text-white'
                : 'bg-white/90 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {offset === -1 ? 'Last Week' : offset === 0 ? 'This Week' : 'Next Week'}
          </button>
        ))}
      </div>

      {/* Day Accordions */}
      <div className="space-y-2">
        {daysOfWeek.map((day, index) => {
          // Count shifts for this day across all employees
          const dayShifts = Object.values(shiftsByEmployeeAndDay)
            .flatMap(empShifts => empShifts[index] || [])

          return (
            <DayAccordion
              key={index}
              date={day.date}
              isToday={day.isToday}
              shifts={dayShifts}
              employees={employees}
              onAddShift={() => handleAddShift(index, day.date)}
              onDeleteShift={handleDeleteShift}
            />
          )
        })}
      </div>

      {/* Employee Picker Bottom Sheet */}
      <EmployeePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        employees={getAvailableEmployees()}
        availabilityByEmployeeAndDay={availabilityByEmployeeAndDay}
        dayIndex={selectedDayIndex}
        onCreateShift={handleCreateShift}
      />
    </div>
  )
}
