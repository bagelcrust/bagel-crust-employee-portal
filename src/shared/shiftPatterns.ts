/**
 * Shift Pattern Analysis Utilities
 *
 * Analyzes historical shifts to suggest common patterns to the user.
 */

interface HistoricalShift {
  start_time: string
  end_time: string
  location: string
}

export interface ShiftPattern {
  startTime: string
  endTime: string
  location: string
  count: number
}

/**
 * Analyzes past shifts and returns common patterns sorted by frequency
 */
export function analyzeShiftPatterns(pastShifts?: HistoricalShift[]): ShiftPattern[] {
  if (!pastShifts || pastShifts.length === 0) {
    return []
  }

  // Group shifts by pattern (start_time, end_time, location)
  const patternMap = new Map<string, ShiftPattern>()

  pastShifts.forEach(shift => {
    const key = `${shift.start_time}|${shift.end_time}|${shift.location}`
    const existing = patternMap.get(key)

    if (existing) {
      existing.count++
    } else {
      patternMap.set(key, {
        startTime: shift.start_time,
        endTime: shift.end_time,
        location: shift.location,
        count: 1
      })
    }
  })

  // Convert to array and sort by frequency (most common first)
  return Array.from(patternMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Return top 5 patterns
}

/**
 * Formats a shift pattern for display
 */
export function formatShiftPattern(pattern: ShiftPattern): string {
  return `${pattern.startTime} - ${pattern.endTime} @ ${pattern.location}`
}
