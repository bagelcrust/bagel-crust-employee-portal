import { supabase } from '../supabase'
import type { DraftShift, PublishedShift } from '../supabase'
import { conflictService } from './conflictService'

export interface CreateShiftInput {
  employee_id: string | null // null = open shift
  start_time: string // ISO timestamp
  end_time: string // ISO timestamp
  location: string
  role?: string | null
}

export interface UpdateShiftInput {
  employee_id?: string | null
  start_time?: string
  end_time?: string
  location?: string
  role?: string | null
}

/**
 * Service for managing DRAFT shifts (CRUD operations)
 *
 * Business Rules:
 * - All shifts created here are drafts (experimental workspace)
 * - Drafts are NOT visible to employees
 * - Must publish to make visible to employees
 * - Cannot assign shift to employee with time-off conflict
 * - Open shifts (employee_id = null) bypass conflict validation
 */
export const shiftService = {
  /**
   * Create new DRAFT shift with conflict validation
   */
  async createShift(input: CreateShiftInput): Promise<DraftShift> {
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

    // Insert draft shift (no status field - all drafts by definition)
    const { data, error } = await supabase
      .from('draft_shifts')
      .insert({
        employee_id: input.employee_id,
        start_time: input.start_time,
        end_time: input.end_time,
        location: input.location,
        role: input.role || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating draft shift:', error)
      throw error
    }

    return data as DraftShift
  },

  /**
   * Update existing DRAFT shift with conflict validation
   */
  async updateShift(shiftId: number, updates: UpdateShiftInput): Promise<DraftShift> {
    // If changing employee or times, validate no conflict
    if (updates.employee_id !== undefined || updates.start_time || updates.end_time) {
      // Get current draft shift data to merge with updates
      const { data: currentShift, error: fetchError } = await supabase
        .from('draft_shifts')
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

    // Update draft shift
    const { data, error} = await supabase
      .from('draft_shifts')
      .update(updates)
      .eq('id', shiftId)
      .select()
      .single()

    if (error) {
      console.error('Error updating draft shift:', error)
      throw error
    }

    return data as DraftShift
  },

  /**
   * Delete DRAFT shift by ID
   */
  async deleteShift(shiftId: number): Promise<void> {
    const { error } = await supabase
      .from('draft_shifts')
      .delete()
      .eq('id', shiftId)

    if (error) {
      console.error('Error deleting draft shift:', error)
      throw error
    }
  },

  /**
   * Get ALL DRAFT shifts for a date range (manager experimental workspace)
   */
  async getAllShifts(startDate: string, endDate: string): Promise<DraftShift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('draft_shifts')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')

    if (error) throw error
    return data as DraftShift[]
  },

  /**
   * Get PUBLISHED shifts for a date range (for displaying alongside drafts)
   */
  async getPublishedShifts(startDate: string, endDate: string): Promise<PublishedShift[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('published_shifts')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')

    if (error) throw error
    return data as PublishedShift[]
  }
}
