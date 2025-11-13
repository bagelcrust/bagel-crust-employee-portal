/**
 * EXAMPLE: How to use React Query hooks in EmployeePortal
 *
 * This shows how to convert the manual state management to React Query hooks.
 * Compare this to the current EmployeePortal.tsx implementation.
 */

import { useState } from 'react'
import {
  useEmployeeAuth,
  useEmployeeSchedule,
  useTeamSchedule,
  useTimesheet,
  useTimeOff
} from './hooks'

export default function EmployeePortalWithHooks() {
  // ============================================================================
  // BEFORE: Manual state management (lines 351-368 in EmployeePortal.tsx)
  // ============================================================================
  // const [employee, setEmployee] = useState<any>(null)
  // const [scheduleData, setScheduleData] = useState<any>(null)
  // const [timesheetData, setTimesheetData] = useState<any>(null)
  // const [fullTeamSchedule, setFullTeamSchedule] = useState<any>(null)
  // const [loading, setLoading] = useState(false)
  //
  // const loadEmployeeData = async (employeeId: string) => {
  //   try {
  //     const thisWeekSchedules = await scheduleApi.getWeeklySchedule()
  //     const nextWeekSchedules = await scheduleApi.getNextWeekSchedule()
  //     // ... 50+ lines of manual data fetching and state setting
  //   } catch (error) {
  //     console.error('Failed to load employee data:', error)
  //   }
  // }

  // ============================================================================
  // AFTER: React Query hooks (replaces all the above!)
  // ============================================================================

  // 1. Authentication hook - handles login, logout, loading states
  const {
    employee,
    isLoggedIn,
    login,
    logout,
    isLoggingIn,
    loginError
  } = useEmployeeAuth()

  // 2. Employee's personal schedule - auto-fetches when employee logs in
  const {
    data: scheduleData,
    isLoading: isScheduleLoading,
    error: scheduleError
  } = useEmployeeSchedule(employee?.id, isLoggedIn)

  // 3. Full team schedule - auto-fetches when employee logs in
  const {
    data: teamSchedule,
    isLoading: isTeamScheduleLoading
  } = useTeamSchedule(isLoggedIn)

  // 4. Timesheet data - auto-fetches when employee logs in
  const {
    data: timesheetData,
    isLoading: isTimesheetLoading
  } = useTimesheet(employee?.id, isLoggedIn)

  // 5. Time-off requests - handles fetching and submitting
  const {
    requests: timeOffRequests,
    submitRequest,
    isSubmitting: isTimeOffSubmitting
  } = useTimeOff(employee?.id)

  // ============================================================================
  // UI State (not data fetching)
  // ============================================================================
  const [activeTab, _setActiveTab] = useState<'weeklySchedule' | 'teamSchedule' | 'openShifts' | 'timeOff' | 'timesheet' | 'profile'>('weeklySchedule')
  const [showWeek, _setShowWeek] = useState<'this' | 'next'>('this')
  const [timesheetWeek, _setTimesheetWeek] = useState<'this' | 'last'>('this')
  const [teamScheduleWeek, _setTeamScheduleWeek] = useState<'this' | 'next'>('this')

  // ============================================================================
  // USAGE EXAMPLES
  // ============================================================================

  // Example 1: Login with PIN
  const handleLogin = async (pin: string) => {
    try {
      await login(pin)
      // That's it! All data will auto-load via the hooks
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  // Example 2: Submit time-off request
  const handleTimeOffSubmit = async (startDate: string, endDate: string, reason: string) => {
    if (!employee?.id) return

    try {
      await submitRequest({
        employee_id: employee.id,
        start_date: startDate,
        end_date: endDate,
        reason: reason
      })
      alert('Time off request submitted!')
    } catch (error) {
      alert('Failed to submit request')
    }
  }

  // Example 3: Access schedule data
  const currentSchedule = showWeek === 'this'
    ? scheduleData?.thisWeek
    : scheduleData?.nextWeek

  // Example 4: Access team schedule
  const currentTeamSchedule = teamScheduleWeek === 'this'
    ? teamSchedule?.thisWeek
    : teamSchedule?.nextWeek

  // Example 5: Access timesheet data
  const currentTimesheetData = timesheetWeek === 'this'
    ? timesheetData?.thisWeek
    : timesheetData?.lastWeek

  // ============================================================================
  // BENEFITS
  // ============================================================================
  // ✅ No manual loading states - React Query handles it
  // ✅ Automatic caching - Data persists between tab switches
  // ✅ Auto refetching - Data stays fresh when user returns to app
  // ✅ Error handling - Built-in error states
  // ✅ No manual useEffect - Hooks handle dependencies
  // ✅ Parallel fetching - All data loads at once
  // ✅ Code reduction - ~200 lines of state management replaced with 30 lines

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  // Combined loading state
  const isLoadingData = isScheduleLoading || isTeamScheduleLoading || isTimesheetLoading

  // Show loading screen
  if (!isLoggedIn) {
    return (
      <div>
        {/* Login screen here */}
        <button onClick={() => handleLogin('1234')}>
          Login
        </button>
        {isLoggingIn && <p>Logging in...</p>}
        {loginError && <p>Error: {loginError}</p>}
      </div>
    )
  }

  // Show loading after login (while data fetches)
  if (isLoadingData) {
    return <div>Loading your data...</div>
  }

  // Show error if schedule failed to load
  if (scheduleError) {
    return <div>Failed to load schedule: {scheduleError.message}</div>
  }

  // ============================================================================
  // RENDER YOUR UI
  // ============================================================================
  return (
    <div>
      <h1>Welcome {employee?.first_name}!</h1>

      {/* Schedule Tab */}
      {activeTab === 'weeklySchedule' && currentSchedule && (
        <div>
          <h2>My Schedule</h2>
          {/* Render schedule using currentSchedule */}
        </div>
      )}

      {/* Team Schedule Tab */}
      {activeTab === 'teamSchedule' && currentTeamSchedule && (
        <div>
          <h2>Team Schedule</h2>
          {/* Render team schedule using currentTeamSchedule */}
        </div>
      )}

      {/* Timesheet Tab */}
      {activeTab === 'timesheet' && currentTimesheetData && (
        <div>
          <h2>Hours Worked</h2>
          <p>Total: {currentTimesheetData.totalHours} hours</p>
          {/* Render daily hours using currentTimesheetData.days */}
        </div>
      )}

      {/* Time Off Tab */}
      {activeTab === 'timeOff' && (
        <div>
          <h2>Time Off Requests</h2>
          <button
            onClick={() => handleTimeOffSubmit('2025-12-01', '2025-12-05', 'Vacation')}
            disabled={isTimeOffSubmitting}
          >
            {isTimeOffSubmitting ? 'Submitting...' : 'Request Time Off'}
          </button>

          {/* Show previous requests */}
          {timeOffRequests.map((request: any) => (
            <div key={request.id}>
              {request.start_date} - {request.end_date} ({request.status})
            </div>
          ))}
        </div>
      )}

      {/* Logout */}
      <button onClick={logout}>Logout</button>
    </div>
  )
}

// ============================================================================
// MIGRATION GUIDE
// ============================================================================
//
// Step 1: Replace state declarations
//   ❌ const [employee, setEmployee] = useState(null)
//   ✅ const { employee, isLoggedIn, login } = useEmployeeAuth()
//
// Step 2: Replace data loading functions
//   ❌ const loadEmployeeData = async (employeeId: string) => { ... }
//   ✅ const { data: scheduleData } = useEmployeeSchedule(employee?.id)
//
// Step 3: Remove manual loading states
//   ❌ const [loading, setLoading] = useState(false)
//   ✅ const { isLoading } = useEmployeeSchedule(...)
//
// Step 4: Remove useEffect hooks for data fetching
//   ❌ useEffect(() => { loadEmployeeData() }, [employeeId])
//   ✅ (React Query handles this automatically)
//
// Step 5: Use the data directly
//   ✅ scheduleData?.thisWeek
//   ✅ timesheetData?.thisWeek.totalHours
//   ✅ teamSchedule?.thisWeek.monday
//
