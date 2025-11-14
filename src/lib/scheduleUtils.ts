/**
 * Schedule and shift management utilities
 *
 * Provides helpers for schedule builder, shift formatting,
 * conflict detection, and time-off handling
 */

import { format } from 'date-fns'

/**
 * Shift status types
 */
export type ShiftStatus = 'draft' | 'published' | 'completed'

/**
 * Shift type from database
 */
export interface Shift {
  id: number
  employee_id: string | null
  start_time: string
  end_time: string
  location: string
  role: string
  status: ShiftStatus
}

/**
 * Time-off entry type
 */
export interface TimeOff {
  id: number
  employee_id: string
  start_time: string
  end_time: string
  reason: string | null
  status: string
}

/**
 * Format shift time for compact display
 * Example: "6:30-2:00 PM"
 *
 * @param startTime - ISO timestamp string
 * @param endTime - ISO timestamp string
 * @returns Formatted time range string
 */
export function formatShiftTime(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return `${format(start, 'h:mm')}-${format(end, 'h:mm a')}`
}

/**
 * Format shift time for detailed display with location
 * Example: "6:30 AM - 2:00 PM at Calder"
 *
 * @param startTime - ISO timestamp string
 * @param endTime - ISO timestamp string
 * @param location - Location name
 * @returns Formatted time range with location
 */
export function formatShiftTimeDetailed(
  startTime: string,
  endTime: string,
  location?: string
): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const timeRange = `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
  return location ? `${timeRange} at ${location}` : timeRange
}

/**
 * Check if a time-off entry is all day
 * All-day time-off has specific start/end hours (5am-4am next day UTC)
 *
 * @param timeOff - Time-off entry
 * @returns true if all-day time-off
 */
export function isAllDayTimeOff(timeOff: TimeOff): boolean {
  const start = new Date(timeOff.start_time)
  const end = new Date(timeOff.end_time)
  const startHour = start.getUTCHours()
  const endHour = end.getUTCHours()
  return startHour === 5 && endHour === 4
}

/**
 * Count draft shifts in an array
 *
 * @param shifts - Array of shifts (can be ScheduleShift with status field)
 * @returns Number of draft shifts with assigned employees
 */
export function countDraftShifts(shifts: Array<{ status: string, employee_id: string | null }>): number {
  return shifts.filter(s => s.status === 'draft' && s.employee_id).length
}

/**
 * Count open shifts (no employee assigned)
 *
 * @param shifts - Array of shifts
 * @returns Number of open shifts
 */
export function countOpenShifts(shifts: Shift[]): number {
  return shifts.filter(s => !s.employee_id).length
}

/**
 * Filter shifts by status
 *
 * @param shifts - Array of shifts
 * @param status - Status to filter by
 * @returns Filtered shifts
 */
export function filterShiftsByStatus(shifts: Shift[], status: ShiftStatus): Shift[] {
  return shifts.filter(s => s.status === status)
}

/**
 * Filter shifts for a specific day
 *
 * @param shifts - Array of shifts
 * @param date - Date to filter by
 * @returns Shifts on that date
 */
export function filterShiftsByDate(shifts: Shift[], date: Date): Shift[] {
  return shifts.filter(shift => {
    const shiftDate = new Date(shift.start_time).toDateString()
    return shiftDate === date.toDateString()
  })
}

/**
 * Calculate shift duration in hours
 *
 * @param startTime - ISO timestamp string
 * @param endTime - ISO timestamp string
 * @returns Hours as decimal number
 */
export function calculateShiftDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMs = end.getTime() - start.getTime()
  return durationMs / (1000 * 60 * 60) // Convert to hours
}

/**
 * Check if employee has time-off on a specific day
 *
 * @param timeOffs - Array of time-off entries for employee
 * @param date - Date to check
 * @returns Time-off entry if exists, null otherwise
 */
export function getTimeOffForDate(timeOffs: TimeOff[], date: Date): TimeOff | null {
  return timeOffs.find(timeOff => {
    const timeOffDate = new Date(timeOff.start_time).toDateString()
    return timeOffDate === date.toDateString()
  }) || null
}

/**
 * Check if shift overlaps with another shift
 *
 * @param shift1Start - First shift start time
 * @param shift1End - First shift end time
 * @param shift2Start - Second shift start time
 * @param shift2End - Second shift end time
 * @returns true if shifts overlap
 */
export function doShiftsOverlap(
  shift1Start: string | Date,
  shift1End: string | Date,
  shift2Start: string | Date,
  shift2End: string | Date
): boolean {
  const s1Start = new Date(shift1Start).getTime()
  const s1End = new Date(shift1End).getTime()
  const s2Start = new Date(shift2Start).getTime()
  const s2End = new Date(shift2End).getTime()

  return s1Start < s2End && s2Start < s1End
}

/**
 * Validate shift doesn't conflict with existing shifts or time-off
 *
 * @param newShift - New shift to validate
 * @param existingShifts - Existing shifts for employee
 * @param timeOffs - Time-off entries for employee
 * @returns Validation result
 */
export function validateShiftConflicts(
  newShift: { start_time: string; end_time: string },
  existingShifts: Shift[],
  timeOffs: TimeOff[]
): { isValid: boolean; message?: string } {
  // Check for shift overlaps
  for (const shift of existingShifts) {
    if (doShiftsOverlap(
      newShift.start_time,
      newShift.end_time,
      shift.start_time,
      shift.end_time
    )) {
      return {
        isValid: false,
        message: `Conflicts with existing shift: ${formatShiftTime(shift.start_time, shift.end_time)}`
      }
    }
  }

  // Check for time-off conflicts
  for (const timeOff of timeOffs) {
    if (doShiftsOverlap(
      newShift.start_time,
      newShift.end_time,
      timeOff.start_time,
      timeOff.end_time
    )) {
      return {
        isValid: false,
        message: `Employee has time-off: ${timeOff.reason || 'No reason'}`
      }
    }
  }

  return { isValid: true }
}

/**
 * Group shifts by employee ID
 *
 * @param shifts - Array of shifts
 * @returns Object with employee IDs as keys
 */
export function groupShiftsByEmployee(shifts: Shift[]): Record<string, Shift[]> {
  return shifts.reduce((acc, shift) => {
    if (!shift.employee_id) return acc
    if (!acc[shift.employee_id]) {
      acc[shift.employee_id] = []
    }
    acc[shift.employee_id].push(shift)
    return acc
  }, {} as Record<string, Shift[]>)
}

/**
 * Calculate total hours for shifts
 *
 * @param shifts - Array of shifts
 * @returns Total hours as decimal
 */
export function calculateTotalHours(shifts: Shift[]): number {
  return shifts.reduce((total, shift) => {
    return total + calculateShiftDuration(shift.start_time, shift.end_time)
  }, 0)
}

/**
 * Get shift status badge color
 *
 * @param status - Shift status
 * @returns Tailwind color classes
 */
export function getShiftStatusColor(status: ShiftStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800'
    case 'published':
      return 'bg-green-100 text-green-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * Format hours for display with decimal or hours/minutes
 *
 * @param hours - Hours as decimal
 * @returns Formatted string like "8.5h" or "8h 30m"
 */
export function formatShiftHours(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  if (minutes === 0) {
    return `${wholeHours}h`
  }

  return `${wholeHours}h ${minutes}m`
}

/**
 * Format availability time from database format to display format
 * Converts "09:00:00" to "9:00 AM"
 *
 * @param timeString - Time in HH:MM:SS format
 * @returns Formatted time string like "9:00 AM"
 */
export function formatAvailabilityTime(timeString: string): string {
  // Parse "HH:MM:SS" format
  const [hours, minutes] = timeString.split(':').map(Number)

  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}
