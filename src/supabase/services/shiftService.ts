import { supabase } from '../supabase'
import type { Shift } from '../supabase'
import { conflictService } from './conflictService'

export interface CreateShiftInput {
  employee_id: string | null // null = open shift
  start_time: string // ISO timestamp
  end_time: string // ISO timestamp
  location: string
  role?: string | null
  status?: 'draft' | 'published' // Default: draft
}

export interface UpdateShiftInput {
  employee_id?: string | null
  start_time?: string
  end_time?: string
  location?: string
  role?: string | null
  status?: 'draft' | 'published'
}

/**
 * Service for managing shifts (CRUD operations)
 *
 * Business Rules:
 * - New shifts default to 'draft' status
 * - Only 'published' shifts are visible to employees
 * - Cannot assign shift to employee with time-off conflict
 * - Open shifts (employee_id = null) bypass conflict validation
 */
export const shiftService = {
  /**
   * Create new shift with conflict validation
   */
  async createShift(input: CreateShiftInput): Promise<Shift> {
    // Validate no conflict if assigning to employee
    if (input.employee_id) {
      const validation = await conflictService.validateShift(
        input.employee_id,
        input.start_time,
        input.end_time
      )

      if (!validation.valid) {
        throw new Error(validation.error || 'Shift conflicts with time-off')
      }
    }

    // Insert shift with default status = 'draft'
    // NOTE: Using `as any` for employee_id to allow NULL values for open shifts
    // This is a temporary workaround until the database schema is updated to allow NULL employee_id
    // Currently, the shifts table requires employee_id as NOT NULL, but we need to support open shifts (employee_id = null)
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        employee_id: input.employee_id as any,
        start_time: input.start_time,
        end_time: input.end_time,
        location: input.location,
        role: input.role || null,
        status: input.status || 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating shift:', error)
      throw error
    }

    return data as Shift
  },

  /**
   * Update existing shift with conflict validation
   */
  async updateShift(shiftId: number, updates: UpdateShiftInput): Promise<Shift> {
    // If changing employee or times, validate no conflict
    if (updates.employee_id !== undefined || updates.start_time || updates.end_time) {
      // Get current shift data to merge with updates
      const { data: currentShift, error: fetchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single()

      if (fetchError) throw fetchError

      const employeeId = updates.employee_id !== undefined
        ? updates.employee_id
        : currentShift.employee_id
      const startTime = updates.start_time || currentShift.start_time
      const endTime = updates.end_time || currentShift.end_time

      if (employeeId) {
        const validation = await conflictService.validateShift(
          employeeId,
          startTime,
          endTime
        )

        if (!validation.valid) {
          throw new Error(validation.error || 'Shift update conflicts with time-off')
        }
      }
    }

    // Update shift
    // NOTE: Using `as any` for updates object to allow NULL employee_id for open shifts
    // This is a temporary workaround until the database schema is updated to allow NULL employee_id
    const { data, error } = await supabase
      .from('shifts')
      .update(updates as any)
      .eq('id', shiftId)
      .select()
      .single()

    if (error) {
      console.error('Error updating shift:', error)
      throw error
    }

    return data as Shift
  },

  /**
   * Delete shift by ID
   */
  async deleteShift(shiftId: number): Promise<void> {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId)

    if (error) {
      console.error('Error deleting shift:', error)
      throw error
    }
  },

  /**
   * Get draft shifts for a date range (manager view)
   */
  async getDraftShifts(startDate: string, endDate: string): Promise<Shift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'draft')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')

    if (error) throw error
    return data as Shift[]
  },

  /**
   * Get published shifts for a date range (employee view)
   */
  async getPublishedShifts(startDate: string, endDate: string): Promise<Shift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'published')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')

    if (error) throw error
    return data as Shift[]
  },

  /**
   * Get ALL shifts for a date range (manager view - both draft and published)
   */
  async getAllShifts(startDate: string, endDate: string): Promise<Shift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')

    if (error) throw error
    return data as Shift[]
  },

  /**
   * Get shifts for specific employee
   */
  async getEmployeeShifts(
    employeeId: string,
    startDate: string,
    endDate: string,
    publishedOnly: boolean = false
  ): Promise<Shift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    let query = supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (publishedOnly) {
      query = query.eq('status', 'published')
    }

    const { data, error } = await query.order('start_time')

    if (error) throw error
    return data as Shift[]
  }
}
