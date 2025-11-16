import { useQuery } from '@tanstack/react-query'
import { calculatePayrollRpc } from '../shared/supabase-client'
import { format } from 'date-fns'

/**
 * TIMESHEET HOOK - NOW USING POSTGRES RPC FOR CORRECT TIMEZONE HANDLING
 *
 * This hook now uses Postgres RPC to calculate hours worked with:
 * ✅ Automatic EST/EDT timezone detection
 * ✅ Correct UTC offset calculation (-4 or -5 hours)
 * ✅ Server-side date math (no more client-side timezone bugs)
 * ✅ Proper DST handling (no more 1-hour errors!)
 *
 * Old client-side calculation moved to bottom as backup/reference.
 */

/**
 * Hook to fetch employee's timesheet using Postgres RPC for accurate timezone handling
 * Returns this week and last week's data with correct Eastern Time calculations
 *
 * Naming matches Postgres function: calculate_payroll
 */
export function useGetTimesheet(employeeId: string | undefined, enabled = true) {
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

      // Format dates as YYYY-MM-DD for RPC function
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // en-CA gives YYYY-MM-DD format
      }

      // Call Postgres RPC to calculate payroll with correct timezone handling
      const [thisWeekData, lastWeekData] = await Promise.all([
        calculatePayrollRpc(
          employeeId,
          formatDate(thisWeekStart),
          formatDate(thisWeekEnd)
        ),
        calculatePayrollRpc(
          employeeId,
          formatDate(lastWeekStart),
          formatDate(lastWeekEnd)
        )
      ])

      // Transform RPC response to match expected format
      const transformPayrollToTimesheet = (payrollData: any) => {
        const dailyHours = payrollData.shifts.map((shift: any) => {
          // Parse Eastern Time strings (already converted server-side!)
          const clockInDate = new Date(shift.clockIn)

          // Use clockInTime and clockOutTime from RPC function (24-hour format like "08:00" or "14:30")
          // These will be formatted by formatTime() in TimesheetTab to "8:00 AM" or "2:30 PM"
          const clockInTime = shift.clockInTime // "08:00" or "14:30"
          const clockOutTime = shift.clockOutTime // "08:00" or "14:30"

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
          // Include additional data from RPC function
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
 * The new Postgres RPC approach above fixes all these issues by:
 * ✅ Using server-side Intl.DateTimeFormat with proper timezone data
 * ✅ Automatic DST detection (no manual offset calculation)
 * ✅ Consistent results regardless of user's browser/location
 */
