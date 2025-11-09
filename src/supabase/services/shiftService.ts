import { supabase } from '../supabase'
import type { DraftShift, PublishedShift } from '../supabase'
import { conflictService } from './conflictService'
import { etToUTC } from '../../lib/timezone'

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
 * TIMEZONE RULE FOR THIS FILE:
 * - Database stores UTC (always)
 * - UI works in Eastern Time
 * - Times are auto-converted to UTC using etToUTC() before database writes
 * - See: /src/lib/timezone.ts
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
   * RLS allows anon users to manage draft shifts
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

    // Direct database insert (RLS policy allows ALL operations for anon users)
    const { data, error } = await supabase
      .from('draft_shifts')
      .insert({
        employee_id: input.employee_id,
        start_time: input.start_time.includes('T') && !input.start_time.endsWith('Z')
          ? etToUTC(input.start_time)
          : input.start_time,
        end_time: input.end_time.includes('T') && !input.end_time.endsWith('Z')
          ? etToUTC(input.end_time)
          : input.end_time,
        location: input.location,
        role: input.role || null
      })
      .select()
      .single()

    if (error) throw error
    return data as DraftShift
  },

  /**
   * Update existing shift with conflict validation
   *
   * HYBRID ARCHITECTURE BEHAVIOR:
   * - If shift exists in draft_shifts: Update it
   * - If shift doesn't exist (it's published): Create new draft with updated data
   * - This allows editing published shifts (they become drafts on edit)
   */
  async updateShift(shiftId: number, updates: UpdateShiftInput): Promise<DraftShift> {
    // Try to get current draft shift data
    const { data: currentShift, error: fetchError } = await supabase
      .from('draft_shifts')
      .select('*')
      .eq('id', shiftId)
      .single()

    // If shift doesn't exist in drafts, it's a published shift
    // Get it from published_shifts and create a new draft
    if (fetchError?.code === 'PGRST116') {
      const { data: publishedShift, error: pubError } = await supabase
        .from('published_shifts')
        .select('*')
        .eq('id', shiftId)
        .single()

      if (pubError) throw new Error('Shift not found in drafts or published shifts')

      // Create new draft with published shift data + updates
      return this.createShift({
        employee_id: updates.employee_id !== undefined ? updates.employee_id : publishedShift.employee_id,
        start_time: updates.start_time || publishedShift.start_time,
        end_time: updates.end_time || publishedShift.end_time,
        location: updates.location || publishedShift.location || 'Calder',
        role: updates.role !== undefined ? updates.role : publishedShift.role
      })
    }

    if (fetchError) throw fetchError

    // If changing employee or times, validate no conflict
    if (updates.employee_id !== undefined || updates.start_time || updates.end_time) {

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

    // Update draft shift directly - convert times to UTC if needed
    const updatesWithUTC = { ...updates }
    if (updates.start_time && updates.start_time.includes('T') && !updates.start_time.endsWith('Z')) {
      updatesWithUTC.start_time = etToUTC(updates.start_time)
    }
    if (updates.end_time && updates.end_time.includes('T') && !updates.end_time.endsWith('Z')) {
      updatesWithUTC.end_time = etToUTC(updates.end_time)
    }

    const { data, error } = await supabase
      .from('draft_shifts')
      .update(updatesWithUTC)
      .eq('id', shiftId)
      .select()
      .single()

    if (error) throw error
    return data as DraftShift
  },

  /**
   * Delete shift by ID
   * Only works for draft shifts (RLS blocks published shifts)
   */
  async deleteShift(shiftId: number): Promise<void> {
    const { error } = await supabase
      .from('draft_shifts')
      .delete()
      .eq('id', shiftId)

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
