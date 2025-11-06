import { supabase } from '../supabase'
import type { TimeOff } from '../supabase'

export interface ConflictCheck {
  hasConflict: boolean
  timeOff?: TimeOff
  message?: string
}

export interface Conflict {
  shiftId: number
  employeeId: string
  employeeName: string
  shiftDate: string
  shiftStart: string
  shiftEnd: string
  timeOffReason: string
}

/**
 * Service for validating and detecting shift/time-off conflicts
 *
 * Business Rule: Time-offs take precedence over shifts
 * - If employee has time-off on a day, no shift can be scheduled
 * - Partial-day time-offs block only those specific hours
 * - All-day time-offs block the entire day
 */
export const conflictService = {
  /**
   * Check if employee has time-off on a given date
   * Used BEFORE creating/updating a shift
   */
  async hasTimeOffConflict(
    employeeId: string,
    shiftDate: Date
  ): Promise<ConflictCheck> {
    const startOfDay = new Date(shiftDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(shiftDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('time_off_notices')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking time-off conflict:', error)
      throw error
    }

    if (data) {
      return {
        hasConflict: true,
        timeOff: data as TimeOff,
        message: `Employee has time-off: ${data.reason || 'No reason provided'}`
      }
    }

    return { hasConflict: false }
  },

  /**
   * Validate shift creation/update doesn't conflict with time-off
   * Returns validation result with error message if conflict exists
   */
  async validateShift(
    employeeId: string | null,
    startTime: string,
    _endTime: string // Not used yet - will be used for partial-day conflict checking
  ): Promise<{ valid: boolean; error?: string }> {
    // Open shifts (no employee assigned) are always valid
    if (!employeeId) {
      return { valid: true }
    }

    const shiftDate = new Date(startTime)
    const conflict = await this.hasTimeOffConflict(employeeId, shiftDate)

    if (conflict.hasConflict) {
      return {
        valid: false,
        error: conflict.message || 'Employee has time-off on this date'
      }
    }

    return { valid: true }
  },

  /**
   * Find all existing conflicts in database
   * Used for cleanup/reporting
   */
  async findConflicts(startDate: string, endDate: string): Promise<Conflict[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Raw SQL query to find conflicts
    const { data, error } = await supabase.rpc('find_shift_conflicts', {
      p_start_date: start.toISOString(),
      p_end_date: end.toISOString()
    })

    if (error) {
      // If RPC function doesn't exist, fall back to manual detection
      console.warn('RPC function not found, using manual conflict detection')
      return this.findConflictsManual(startDate, endDate)
    }

    return data || []
  },

  /**
   * Manual conflict detection (fallback if database function doesn't exist)
   */
  async findConflictsManual(startDate: string, endDate: string): Promise<Conflict[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Get all shifts in range
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*, employees(first_name, last_name)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .not('employee_id', 'is', null)

    if (shiftsError) throw shiftsError

    // Get all time-offs in range
    const { data: timeOffs, error: timeOffsError } = await supabase
      .from('time_off_notices')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (timeOffsError) throw timeOffsError

    // Find overlaps
    const conflicts: Conflict[] = []

    shifts?.forEach((shift: any) => {
      const shiftDate = new Date(shift.start_time).toDateString()

      const matchingTimeOff = timeOffs?.find((timeOff: any) => {
        const timeOffDate = new Date(timeOff.start_time).toDateString()
        return timeOff.employee_id === shift.employee_id && timeOffDate === shiftDate
      })

      if (matchingTimeOff) {
        conflicts.push({
          shiftId: shift.id,
          employeeId: shift.employee_id,
          employeeName: `${shift.employees.first_name} ${shift.employees.last_name || ''}`.trim(),
          shiftDate: shiftDate,
          shiftStart: shift.start_time,
          shiftEnd: shift.end_time,
          timeOffReason: matchingTimeOff.reason || 'No reason provided'
        })
      }
    })

    return conflicts
  }
}
