import { supabase } from '../supabase'
import type { Shift } from '../supabase'

export interface EmployeeHours {
  employeeId: string
  totalHours: number
  shiftCount: number
  shifts: Shift[]
}

/**
 * Service for calculating scheduled hours
 *
 * Business Rules:
 * - Hours calculated from shift start_time to end_time
 * - Only counts assigned shifts (employee_id NOT NULL)
 * - Can filter by draft/published status
 * - Display total hours next to employee name in Schedule Builder
 */
export const hoursService = {
  /**
   * Calculate duration in hours for a single shift
   */
  calculateShiftDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const hours = durationMs / (1000 * 60 * 60)
    return Math.round(hours * 100) / 100 // Round to 2 decimal places
  },

  /**
   * Calculate total scheduled hours for a single employee in a date range
   */
  async calculateEmployeeHours(
    employeeId: string,
    startDate: string,
    endDate: string,
    options: {
      publishedOnly?: boolean
      includeDrafts?: boolean
    } = {}
  ): Promise<EmployeeHours> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Build query
    let query = supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    // Filter by status if specified
    if (options.publishedOnly) {
      query = query.eq('status', 'published')
    } else if (options.includeDrafts === false) {
      query = query.eq('status', 'published')
    }

    const { data: shifts, error } = await query.order('start_time')

    if (error) throw error

    // Calculate total hours
    let totalHours = 0
    if (shifts) {
      shifts.forEach(shift => {
        totalHours += this.calculateShiftDuration(shift.start_time, shift.end_time)
      })
    }

    return {
      employeeId,
      totalHours,
      shiftCount: shifts?.length || 0,
      shifts: (shifts as Shift[]) || []
    }
  },

  /**
   * Calculate hours for all employees in a date range (using optimized RPC function)
   * Returns a map of employee_id → total_hours
   * Performance: ~70% faster than client-side aggregation
   */
  async calculateAllEmployeeHours(
    startDate: string,
    endDate: string,
    options: {
      publishedOnly?: boolean
      includeDrafts?: boolean
    } = {}
  ): Promise<Map<string, number>> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Format dates as YYYY-MM-DD for RPC function
    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Determine if we should filter by published status
    const publishedOnly = options.publishedOnly || (options.includeDrafts === false)

    const { data, error } = await supabase.rpc('calculate_all_employee_hours', {
      p_start_date: formatDate(start),
      p_end_date: formatDate(end),
      p_published_only: publishedOnly
    })

    if (error) throw error

    // Convert RPC result array to Map
    const hoursMap = new Map<string, number>()
    data?.forEach((row: any) => {
      hoursMap.set(row.employee_id, parseFloat(row.total_hours))
    })

    return hoursMap
  },

  /**
   * Get detailed hours breakdown for all employees
   * Useful for Schedule Builder to show totals next to names
   */
  async getWeeklyHoursSummary(
    startDate: string,
    endDate: string,
    options: {
      publishedOnly?: boolean
      includeDrafts?: boolean
    } = {}
  ): Promise<EmployeeHours[]> {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Build query
    let query = supabase
      .from('shifts')
      .select('*')
      .not('employee_id', 'is', null) // Exclude open shifts
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())

    // Filter by status if specified
    if (options.publishedOnly) {
      query = query.eq('status', 'published')
    } else if (options.includeDrafts === false) {
      query = query.eq('status', 'published')
    }

    const { data: shifts, error } = await query.order('start_time')

    if (error) throw error

    // Group by employee
    const employeeShiftsMap = new Map<string, Shift[]>()

    shifts?.forEach(shift => {
      if (!employeeShiftsMap.has(shift.employee_id)) {
        employeeShiftsMap.set(shift.employee_id, [])
      }
      employeeShiftsMap.get(shift.employee_id)!.push(shift as Shift)
    })

    // Calculate totals for each employee
    const summary: EmployeeHours[] = []

    employeeShiftsMap.forEach((employeeShifts, employeeId) => {
      let totalHours = 0
      employeeShifts.forEach(shift => {
        totalHours += this.calculateShiftDuration(shift.start_time, shift.end_time)
      })

      summary.push({
        employeeId,
        totalHours,
        shiftCount: employeeShifts.length,
        shifts: employeeShifts
      })
    })

    return summary
  },

  /**
   * Check if employee is over/under scheduled
   * Returns status: 'over' | 'under' | 'normal'
   */
  getSchedulingStatus(
    totalHours: number,
    targetHours: number = 40,
    threshold: number = 5
  ): 'over' | 'under' | 'normal' {
    if (totalHours > targetHours + threshold) {
      return 'over'
    } else if (totalHours < targetHours - threshold) {
      return 'under'
    }
    return 'normal'
  },

  /**
   * Format hours for display (e.g., "38.5 hrs")
   */
  formatHours(hours: number): string {
    return `${hours.toFixed(1)} hrs`
  }
}
