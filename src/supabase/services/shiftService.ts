import { supabase } from '../supabase'
import { scheduleBuilder } from '../edgeFunctions'
import type { DraftShift, PublishedShift } from '../supabase'
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
   * Uses edge function with service_role to bypass RLS issues
   * Includes server-side conflict validation
   */
  async createShift(input: CreateShiftInput): Promise<DraftShift> {
    // Convert Eastern Time to UTC if needed
    const startTime = input.start_time.includes('T') && !input.start_time.endsWith('Z')
      ? etToUTC(input.start_time)
      : input.start_time
    const endTime = input.end_time.includes('T') && !input.end_time.endsWith('Z')
      ? etToUTC(input.end_time)
      : input.end_time

    // Call edge function (includes conflict validation)
    const shift = await scheduleBuilder.createShift({
      employee_id: input.employee_id,
      start_time: startTime,
      end_time: endTime,
      location: input.location,
      role: input.role || null
    })

    return shift as DraftShift
  },

  /**
   * Update existing shift with conflict validation
   * Uses edge function with service_role to bypass RLS issues
   *
   * HYBRID ARCHITECTURE BEHAVIOR:
   * - If shift exists in draft_shifts: Update it
   * - If shift doesn't exist (it's published): Create new draft with updated data
   * - This allows editing published shifts (they become drafts on edit)
   * - Edge function handles all this logic server-side
   */
  async updateShift(shiftId: number, updates: UpdateShiftInput): Promise<DraftShift> {
    // Convert Eastern Time to UTC if needed
    const updatesWithUTC = { ...updates }
    if (updates.start_time && updates.start_time.includes('T') && !updates.start_time.endsWith('Z')) {
      updatesWithUTC.start_time = etToUTC(updates.start_time)
    }
    if (updates.end_time && updates.end_time.includes('T') && !updates.end_time.endsWith('Z')) {
      updatesWithUTC.end_time = etToUTC(updates.end_time)
    }

    // Call edge function (includes conflict validation and hybrid logic)
    const shift = await scheduleBuilder.updateShift(shiftId, updatesWithUTC)

    return shift as DraftShift
  },

  /**
   * Delete shift by ID
   * Uses edge function with service_role to delete from draft_shifts or published_shifts
   */
  async deleteShift(shiftId: number): Promise<void> {
    await scheduleBuilder.deleteShift(shiftId)
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
