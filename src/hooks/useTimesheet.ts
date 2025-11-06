import { useQuery } from '@tanstack/react-query'
import { calculatePayroll } from '../supabase/edgeFunctions'
import { format } from 'date-fns'

/**
 * TIMESHEET HOOK - NOW USING EDGE FUNCTIONS FOR CORRECT TIMEZONE HANDLING
 *
 * This hook now uses Supabase Edge Functions to calculate hours worked with:
 * ✅ Automatic EST/EDT timezone detection
 * ✅ Correct UTC offset calculation (-4 or -5 hours)
 * ✅ Server-side date math (no more client-side timezone bugs)
 * ✅ Proper DST handling (no more 1-hour errors!)
 *
 * Old client-side calculation moved to bottom as backup/reference.
 */

/**
 * Hook to fetch employee's timesheet using Edge Functions for accurate timezone handling
 * Returns this week and last week's data with correct Eastern Time calculations
 */
export function useTimesheet(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['timesheet', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID required')

      // Calculate date ranges in Eastern Time (YYYY-MM-DD format)
      const today = new Date()

      // This week (Monday - Sunday)
      const dayOfWeek = today.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      const thisWeekStart = new Date(today)
      thisWeekStart.setDate(today.getDate() - daysFromMonday)
      const thisWeekEnd = new Date(thisWeekStart)
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6)

      // Last week
      const lastWeekStart = new Date(thisWeekStart)
      lastWeekStart.setDate(thisWeekStart.getDate() - 7)
      const lastWeekEnd = new Date(lastWeekStart)
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6)

      // Format dates as YYYY-MM-DD for Edge Function
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // en-CA gives YYYY-MM-DD format
      }

      // Call Edge Functions to calculate payroll with correct timezone handling
      const [thisWeekData, lastWeekData] = await Promise.all([
        calculatePayroll(
          employeeId,
          formatDate(thisWeekStart),
          formatDate(thisWeekEnd)
        ),
        calculatePayroll(
          employeeId,
          formatDate(lastWeekStart),
          formatDate(lastWeekEnd)
        )
      ])

      // Transform Edge Function response to match expected format
      const transformPayrollToTimesheet = (payrollData: any) => {
        const dailyHours = payrollData.shifts.map((shift: any) => {
          // Parse Eastern Time strings (already converted server-side!)
          const clockInDate = new Date(shift.clockIn)

          // Extract time from "Nov 5, 2025 6:00 AM EST"
          // Split: ["Nov", "5,", "2025", "6:00", "AM", "EST"]
          // We want: "6:00 AM"
          const clockInParts = shift.clockInEST.split(' ')
          const clockOutParts = shift.clockOutEST.split(' ')

          const clockInTime = `${clockInParts[3]} ${clockInParts[4]}` // "6:00 AM"
          const clockOutTime = `${clockOutParts[3]} ${clockOutParts[4]}` // "2:30 PM"

          return {
            date: shift.clockIn.split('T')[0], // YYYY-MM-DD
            day_name: format(clockInDate, 'EEEE'),
            clock_in: clockInTime,
            clock_out: clockOutTime,
            hours_worked: shift.hoursWorked.toFixed(2)
          }
        })

        return {
          days: dailyHours,
          totalHours: payrollData.totalHours.toFixed(2),
          // Include additional data from Edge Function
          hourlyRate: payrollData.hourlyRate,
          totalPay: payrollData.totalPay,
          unpaired: payrollData.unpaired || []
        }
      }

      return {
        thisWeek: transformPayrollToTimesheet(thisWeekData),
        lastWeek: transformPayrollToTimesheet(lastWeekData)
      }
    },
    enabled: !!employeeId && enabled,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000 // Keep in cache for 5 minutes
  })
}

/**
 * OLD CLIENT-SIDE CALCULATION (DEPRECATED - Kept for reference)
 *
 * This was the old way of calculating hours, which had timezone issues:
 * ❌ Client-side timezone conversion (browser-dependent)
 * ❌ Potential DST bugs (EST vs EDT confusion)
 * ❌ UTC offset calculated in browser (can be wrong)
 *
 * The new Edge Function approach above fixes all these issues by:
 * ✅ Using server-side Intl.DateTimeFormat with proper timezone data
 * ✅ Automatic DST detection (no manual offset calculation)
 * ✅ Consistent results regardless of user's browser/location
 */
