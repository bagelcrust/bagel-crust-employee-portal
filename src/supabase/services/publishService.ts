import { supabase } from '../supabase'
import { conflictService } from './conflictService'
import type { Conflict } from './conflictService'
import type { DraftShift, PublishedShiftInsert } from '../supabase'

export interface PublishResult {
  publishedCount: number
  conflicts: Conflict[]
  success: boolean
  message: string
}

/**
 * Service for publishing weekly schedules (HYBRID ARCHITECTURE)
 *
 * Business Rules:
 * - Drafts live in draft_shifts table (experimental workspace)
 * - Publishing COPIES drafts → published_shifts table (immutable historical record)
 * - Published shifts are visible to employees
 * - Conflict validation runs before publishing
 * - Drafts remain after publish (can be cleared manually or kept for reference)
 * - Published shifts are never deleted/modified (historical record)
 */
export const publishService = {
  /**
   * Publish all draft shifts for a week
   * COPIES draft_shifts → published_shifts table (immutable historical record)
   * Validates no conflicts exist before publishing
   */
  async publishWeek(
    startDate: string,
    endDate: string,
    options: {
      strictMode?: boolean // If true, block publish if ANY conflicts found
      clearDraftsAfterPublish?: boolean // If true, delete drafts after successful publish
    } = {}
  ): Promise<PublishResult> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Step 1: Get all draft shifts in date range
    const { data: draftShifts, error: fetchError } = await supabase
      .from('draft_shifts')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (fetchError) throw fetchError

    if (!draftShifts || draftShifts.length === 0) {
      return {
        publishedCount: 0,
        conflicts: [],
        success: true,
        message: 'No draft shifts to publish'
      }
    }

    // Step 2: Check for conflicts
    const conflicts = await conflictService.findConflicts(startDate, endDate)

    // Step 3: If strict mode and conflicts found, block publish
    if (options.strictMode && conflicts.length > 0) {
      return {
        publishedCount: 0,
        conflicts,
        success: false,
        message: `Cannot publish: ${conflicts.length} conflict(s) found. Resolve conflicts first.`
      }
    }

    // Step 4: Filter out conflicting shifts if not in strict mode
    let shiftsToPublish = draftShifts as DraftShift[]

    if (conflicts.length > 0) {
      const conflictingIds = new Set(conflicts.map(c => c.shiftId))
      shiftsToPublish = shiftsToPublish.filter(s => !conflictingIds.has(s.id))
    }

    if (shiftsToPublish.length === 0) {
      return {
        publishedCount: 0,
        conflicts,
        success: false,
        message: 'All shifts have conflicts, nothing to publish'
      }
    }

    // Step 5: Copy draft shifts to published_shifts table
    const publishedShiftsData: PublishedShiftInsert[] = shiftsToPublish.map(draft => ({
      employee_id: draft.employee_id,
      start_time: draft.start_time,
      end_time: draft.end_time,
      location: draft.location,
      role: draft.role,
      week_start: start.toISOString().split('T')[0], // YYYY-MM-DD format
      week_end: end.toISOString().split('T')[0],
      published_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('published_shifts')
      .insert(publishedShiftsData)

    if (insertError) throw insertError

    // Step 6: Optionally clear drafts after publish
    if (options.clearDraftsAfterPublish) {
      const draftIdsToDelete = shiftsToPublish.map(s => s.id)
      const { error: deleteError } = await supabase
        .from('draft_shifts')
        .delete()
        .in('id', draftIdsToDelete)

      if (deleteError) throw deleteError
    }

    return {
      publishedCount: shiftsToPublish.length,
      conflicts,
      success: true,
      message: conflicts.length > 0
        ? `Published ${shiftsToPublish.length} shifts (${conflicts.length} conflicting shifts skipped)`
        : `Published ${shiftsToPublish.length} shifts successfully`
    }
  },

  /**
   * Clear all draft shifts for a week
   * Useful after publishing to clean up experimental workspace
   */
  async clearDrafts(startDate: string, endDate: string): Promise<number> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Get all draft shifts in range
    const { data: draftShifts, error: fetchError } = await supabase
      .from('draft_shifts')
      .select('id')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (fetchError) throw fetchError

    if (!draftShifts || draftShifts.length === 0) {
      return 0
    }

    // Delete drafts
    const { error: deleteError } = await supabase
      .from('draft_shifts')
      .delete()
      .in('id', draftShifts.map(s => s.id))

    if (deleteError) throw deleteError

    return draftShifts.length
  },

  /**
   * Check if a week is published
   * Returns true if ANY shifts in the week are in published_shifts table
   */
  async isWeekPublished(startDate: string, endDate: string): Promise<boolean> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('published_shifts')
      .select('id')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .limit(1)

    if (error) throw error

    return (data && data.length > 0) || false
  },

  /**
   * Get publish status summary for a week
   */
  async getWeekPublishStatus(startDate: string, endDate: string): Promise<{
    totalShifts: number
    draftShifts: number
    publishedShifts: number
    conflicts: number
    canPublish: boolean
  }> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Get draft shifts
    const { data: drafts, error: draftsError } = await supabase
      .from('draft_shifts')
      .select('id')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (draftsError) throw draftsError

    // Get published shifts
    const { data: published, error: publishedError } = await supabase
      .from('published_shifts')
      .select('id')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (publishedError) throw publishedError

    const draftShifts = drafts?.length || 0
    const publishedShifts = published?.length || 0
    const totalShifts = draftShifts + publishedShifts

    // Check conflicts
    const conflicts = await conflictService.findConflicts(startDate, endDate)

    return {
      totalShifts,
      draftShifts,
      publishedShifts,
      conflicts: conflicts.length,
      canPublish: draftShifts > 0 && conflicts.length === 0
    }
  }
}
