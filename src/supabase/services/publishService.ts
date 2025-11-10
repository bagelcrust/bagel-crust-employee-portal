import { supabase } from '../supabase'
import { scheduleBuilder } from '../edgeFunctions'
import { conflictService } from './conflictService'
import type { Conflict } from './conflictService'

export interface PublishResult {
  publishedCount: number
  conflicts: Conflict[]
  success: boolean
  message: string
}

/**
 * Service for publishing weekly schedules (HYBRID ARCHITECTURE)
 *
 * TIMEZONE RULE FOR THIS FILE:
 * - Timestamps are already in UTC from draft_shifts table
 * - No conversion needed when copying to published_shifts
 * - See: /src/lib/timezone.ts
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
   * Uses comprehensive edge function with service_role key to bypass RLS
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
    const { strictMode = true } = options

    // Use comprehensive edge function with service_role key
    const result = await scheduleBuilder.publishWeek(startDate, endDate, strictMode)

    return {
      success: result.success,
      message: result.message,
      publishedCount: result.publishedCount,
      conflicts: result.conflicts || []
    }
  },

  /**
   * Clear all draft shifts for a week
   * Uses comprehensive edge function with service_role key
   * Useful after publishing to clean up experimental workspace
   */
  async clearDrafts(startDate: string, endDate: string): Promise<number> {
    // Use comprehensive edge function with service_role key
    const clearedCount = await scheduleBuilder.clearDrafts(startDate, endDate)
    return clearedCount
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
