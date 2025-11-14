import { supabase } from '../supabase'
import type { DraftShift } from '../supabase'
import { conflictService } from './conflictService'
import { etToUTC } from '../../lib/timezone'

/**
 * Service for managing open/unassigned shifts
 *
 * TIMEZONE RULE FOR THIS FILE:
 * - Database stores UTC (always)
 * - UI works in Eastern Time
 * - Times are auto-converted to UTC using etToUTC() before database writes
 * - See: /src/lib/timezone.ts
 *
 * Business Rules:
 * - Open shifts have employee_id = NULL
 * - Open shifts appear in a special "unassigned" pool at top of Schedule Builder
 * - When assigning open shift, validate employee has no time-off conflict
 * - Can drag/drop shifts between employees and open shifts pool
 */
export const openShiftsService = {
  /**
   * Get all open (unassigned) DRAFT shifts for a date range
   */
  async getOpenShifts(startDate: string, endDate: string): Promise<DraftShift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('draft_shifts')
      .select('*')
      .is('employee_id', null)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')

    if (error) {
      console.error('Error fetching open draft shifts:', error)
      throw error
    }

    return data as DraftShift[]
  },

  /**
   * Create a new open DRAFT shift (unassigned)
   */
  async createOpenShift(
    startTime: string,
    endTime: string,
    location: string,
    role?: string | null
  ): Promise<DraftShift> {
    // Convert times to UTC if they're in ET format
    const { data, error } = await supabase
      .from('draft_shifts')
      .insert({
        employee_id: null, // Open shift has no employee
        start_time: startTime.includes('T') && !startTime.endsWith('Z')
          ? etToUTC(startTime)
          : startTime,
        end_time: endTime.includes('T') && !endTime.endsWith('Z')
          ? etToUTC(endTime)
          : endTime,
        location: location,
        role: role || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating open draft shift:', error)
      throw error
    }

    return data as DraftShift
  },

  /**
   * Assign an open DRAFT shift to an employee
   * Validates no time-off conflict before assigning
   */
  async assignShift(shiftId: number, employeeId: string): Promise<DraftShift> {
    // Get draft shift details
    const { data: shift, error: fetchError } = await supabase
      .from('draft_shifts')
      .select('*')
      .eq('id', shiftId)
      .single()

    if (fetchError) throw fetchError

    // Validate employee doesn't have time-off conflict
    const validation = await conflictService.validateShift(
      employeeId,
      shift.start_time,
      shift.end_time
    )

    if (!validation.valid) {
      throw new Error(validation.error || 'Cannot assign shift: employee has time-off')
    }

    // Assign draft shift
    const { data, error } = await supabase
      .from('draft_shifts')
      .update({ employee_id: employeeId })
      .eq('id', shiftId)
      .select()
      .single()

    if (error) {
      console.error('Error assigning draft shift:', error)
      throw error
    }

    return data as DraftShift
  },

  /**
   * Unassign a DRAFT shift (make it open)
   */
  async unassignShift(shiftId: number): Promise<DraftShift> {
    const { data, error } = await supabase
      .from('draft_shifts')
      .update({ employee_id: null })
      .eq('id', shiftId)
      .select()
      .single()

    if (error) {
      console.error('Error unassigning draft shift:', error)
      throw error
    }

    return data as DraftShift
  },

  /**
   * Reassign DRAFT shift from one employee to another
   * Validates no time-off conflict for target employee
   */
  async reassignShift(
    shiftId: number,
    fromEmployeeId: string | null,
    toEmployeeId: string | null
  ): Promise<DraftShift> {
    // If assigning to null, just unassign
    if (toEmployeeId === null) {
      return this.unassignShift(shiftId)
    }

    // If assigning from null, use assignShift
    if (fromEmployeeId === null) {
      return this.assignShift(shiftId, toEmployeeId)
    }

    // Reassigning between two employees - validate conflict
    const { data: shift, error: fetchError } = await supabase
      .from('draft_shifts')
      .select('*')
      .eq('id', shiftId)
      .single()

    if (fetchError) throw fetchError

    const validation = await conflictService.validateShift(
      toEmployeeId,
      shift.start_time,
      shift.end_time
    )

    if (!validation.valid) {
      throw new Error(validation.error || 'Cannot reassign shift: employee has time-off')
    }

    // Update assignment
    const { data, error } = await supabase
      .from('draft_shifts')
      .update({ employee_id: toEmployeeId })
      .eq('id', shiftId)
      .select()
      .single()

    if (error) {
      console.error('Error reassigning draft shift:', error)
      throw error
    }

    return data as DraftShift
  },

  /**
   * Get count of open DRAFT shifts for a date range
   */
  async getOpenShiftCount(startDate: string, endDate: string): Promise<number> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { count, error } = await supabase
      .from('draft_shifts')
      .select('*', { count: 'exact', head: true })
      .is('employee_id', null)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (error) throw error

    return count || 0
  }
}
