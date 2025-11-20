import { supabase } from '../shared/supabase-client'
import type { DraftShift, PublishedShift } from '../shared/supabase-client'

export interface CreateShiftInput {
  employee_id: string | null // null = open shift
  start_time: string // ISO timestamp (UTC) or ET datetime string
  end_time: string // ISO timestamp (UTC) or ET datetime string
  location: string
  role?: string | null
}

export interface UpdateShiftInput {
  employee_id?: string | null
  start_time?: string // ISO timestamp (UTC) or ET datetime string
  end_time?: string // ISO timestamp (UTC) or ET datetime string
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
   * Create new DRAFT shift
   * Calls Postgres function: create_schedule_builder_shift()
   * Includes server-side conflict validation
   */
  async createShift(input: CreateShiftInput): Promise<DraftShift> {
    // Call Postgres function (includes conflict validation)
    const { data, error } = await supabase
      .schema('employees')
      .rpc('create_shift', {
        p_employee_id: input.employee_id,
        p_start_time: input.start_time,
        p_end_time: input.end_time,
        p_location: input.location,
        p_role: input.role || null
      })

    if (error) throw error
    return data as DraftShift
  },

  /**
   * Update existing shift with conflict validation
   * Calls Postgres function: update_schedule_builder_shift()
   */
  async updateShift(shiftId: number, updates: UpdateShiftInput): Promise<DraftShift> {
    // Call Postgres function (includes conflict validation)
    const { data, error } = await supabase
      .schema('employees')
      .rpc('update_shift', {
        p_shift_id: shiftId,
        p_employee_id: updates.employee_id,
        p_start_time: updates.start_time,
        p_end_time: updates.end_time,
        p_location: updates.location,
        p_role: updates.role
      })

    if (error) throw error
    return data as DraftShift
  },

  /**
   * Delete shift by ID
   * Calls Postgres function: delete_schedule_builder_shift()
   */
  async deleteShift(shiftId: number): Promise<void> {
    const { error } = await supabase
      .schema('employees')
      .rpc('delete_shift', {
        p_shift_id: shiftId
      })
    if (error) throw error
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
