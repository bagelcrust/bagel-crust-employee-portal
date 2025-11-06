import { supabase } from '../supabase'
import type { Shift } from '../supabase'
import { conflictService } from './conflictService'

/**
 * Service for managing open/unassigned shifts
 *
 * Business Rules:
 * - Open shifts have employee_id = NULL
 * - Open shifts appear in a special "unassigned" pool at top of Schedule Builder
 * - When assigning open shift, validate employee has no time-off conflict
 * - Can drag/drop shifts between employees and open shifts pool
 */
export const openShiftsService = {
  /**
   * Get all open (unassigned) shifts for a date range
   */
  async getOpenShifts(startDate: string, endDate: string): Promise<Shift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .is('employee_id', null)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')

    if (error) {
      console.error('Error fetching open shifts:', error)
      throw error
    }

    return data as Shift[]
  },

  /**
   * Create a new open shift (unassigned)
   *
   * NOTE: Type assertion needed because database schema should allow NULL for employee_id
   * but auto-generated types show it as required. TODO: Update schema to allow NULL.
   */
  async createOpenShift(
    startTime: string,
    endTime: string,
    location: string,
    role?: string | null,
    status: 'draft' | 'published' = 'draft'
  ): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        employee_id: null as any, // Type assertion: open shift has no employee
        start_time: startTime,
        end_time: endTime,
        location: location,
        role: role || null,
        status: status
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating open shift:', error)
      throw error
    }

    return data as Shift
  },

  /**
   * Assign an open shift to an employee
   * Validates no time-off conflict before assigning
   */
  async assignShift(shiftId: number, employeeId: string): Promise<Shift> {
    // Get shift details
    const { data: shift, error: fetchError } = await supabase
      .from('shifts')
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

    // Assign shift
    const { data, error } = await supabase
      .from('shifts')
      .update({ employee_id: employeeId })
      .eq('id', shiftId)
      .select()
      .single()

    if (error) {
      console.error('Error assigning shift:', error)
      throw error
    }

    return data as Shift
  },

  /**
   * Unassign a shift (make it open)
   *
   * NOTE: Database schema requires employee_id to be non-null in Row type,
   * but we send null in the update to clear it. The response will actually
   * contain null in employee_id even though the Row type doesn't allow it.
   * We use type assertion to handle this discrepancy.
   */
  async unassignShift(shiftId: number): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .update({ employee_id: null as any })
      .eq('id', shiftId)
      .select()
      .single()

    if (error) {
      console.error('Error unassigning shift:', error)
      throw error
    }

    return data as Shift
  },

  /**
   * Reassign shift from one employee to another
   * Validates no time-off conflict for target employee
   */
  async reassignShift(
    shiftId: number,
    fromEmployeeId: string | null,
    toEmployeeId: string | null
  ): Promise<Shift> {
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
      .from('shifts')
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
      .from('shifts')
      .update({ employee_id: toEmployeeId })
      .eq('id', shiftId)
      .select()
      .single()

    if (error) {
      console.error('Error reassigning shift:', error)
      throw error
    }

    return data as Shift
  },

  /**
   * Get count of open shifts for a date range
   */
  async getOpenShiftCount(startDate: string, endDate: string): Promise<number> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { count, error } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .is('employee_id', null)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (error) throw error

    return count || 0
  }
}
