import { supabase } from '../supabase'
import { conflictService } from './conflictService'
import type { Conflict } from './conflictService'

export interface PublishResult {
  publishedCount: number
  conflicts: Conflict[]
  success: boolean
  message: string
}

/**
 * Service for publishing/unpublishing weekly schedules
 *
 * Business Rules:
 * - Only 'draft' shifts can be published
 * - Publishing runs conflict check before making shifts visible to employees
 * - If conflicts found, publish can either: block entirely or publish non-conflicting shifts
 * - Unpublishing reverts shifts back to draft (useful for making changes after publish)
 */
export const publishService = {
  /**
   * Publish all draft shifts for a week
   * Changes status from 'draft' to 'published'
   * Validates no conflicts exist before publishing
   */
  async publishWeek(
    startDate: string,
    endDate: string,
    options: {
      strictMode?: boolean // If true, block publish if ANY conflicts found
    } = {}
  ): Promise<PublishResult> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Step 1: Get all draft shifts in date range
    const { data: draftShifts, error: fetchError } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'draft')
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

    // Step 4: Publish all draft shifts (or only non-conflicting ones)
    let shiftIdsToPublish = draftShifts.map(s => s.id)

    // If conflicts exist but not strict mode, skip conflicting shifts
    if (conflicts.length > 0) {
      const conflictingIds = new Set(conflicts.map(c => c.shiftId))
      shiftIdsToPublish = shiftIdsToPublish.filter(id => !conflictingIds.has(id))
    }

    if (shiftIdsToPublish.length === 0) {
      return {
        publishedCount: 0,
        conflicts,
        success: false,
        message: 'All shifts have conflicts, nothing to publish'
      }
    }

    // Update shifts to published
    const { error: updateError } = await supabase
      .from('shifts')
      .update({ status: 'published' })
      .in('id', shiftIdsToPublish)

    if (updateError) throw updateError

    return {
      publishedCount: shiftIdsToPublish.length,
      conflicts,
      success: true,
      message: conflicts.length > 0
        ? `Published ${shiftIdsToPublish.length} shifts (${conflicts.length} conflicting shifts skipped)`
        : `Published ${shiftIdsToPublish.length} shifts successfully`
    }
  },

  /**
   * Unpublish a week's schedule (revert to draft)
   * Useful if manager needs to make changes after publishing
   */
  async unpublishWeek(startDate: string, endDate: string): Promise<number> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Get all published shifts in range
    const { data: publishedShifts, error: fetchError } = await supabase
      .from('shifts')
      .select('id')
      .eq('status', 'published')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (fetchError) throw fetchError

    if (!publishedShifts || publishedShifts.length === 0) {
      return 0
    }

    // Update to draft
    const { error: updateError } = await supabase
      .from('shifts')
      .update({ status: 'draft' })
      .in('id', publishedShifts.map(s => s.id))

    if (updateError) throw updateError

    return publishedShifts.length
  },

  /**
   * Check if a week is published
   * Returns true if ANY shifts in the week are published
   */
  async isWeekPublished(startDate: string, endDate: string): Promise<boolean> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('shifts')
      .select('id')
      .eq('status', 'published')
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

    // Get all shifts
    const { data: allShifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id, status')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    if (shiftsError) throw shiftsError

    const totalShifts = allShifts?.length || 0
    const draftShifts = allShifts?.filter(s => s.status === 'draft').length || 0
    const publishedShifts = allShifts?.filter(s => s.status === 'published').length || 0

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
