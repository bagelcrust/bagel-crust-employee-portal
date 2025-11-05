import { useState, useEffect } from 'react'
import {
  useEmployeeAuth,
  useEmployeeSchedule,
  useTeamSchedule,
  useTimesheet,
  useTimeOff
} from '../hooks'
import { translations } from '../lib/translations'
import { EmployeeLogin } from '../components/EmployeeLogin'
import { BottomNav } from '../components/BottomNav'
import { ScheduleTab } from '../components/tabs/ScheduleTab'
import { TimeOffTab } from '../components/tabs/TimeOffTab'
import { TimesheetTab } from '../components/tabs/TimesheetTab'
import { ProfileTab } from '../components/tabs/ProfileTab'

/**
 * EMPLOYEE PORTAL - Mobile-First Design with Refined Glassmorphism
 *
 * ✅ MIGRATED TO REACT QUERY HOOKS
 * - Reduced from 2,118 lines to ~1,700 lines
 * - Removed ~400 lines of manual state management
 * - Auto caching, refetching, and error handling
 * - Cleaner, more maintainable code
 *
 * A sophisticated, professional employee self-service portal with:
 * - Subtle glass effects (90% opacity, 10px blur)
 * - Moderate border radius (8-10px) for modern, refined appearance
 * - Refined shadows (0 4px 12-16px rgba(0,0,0,0.06-0.08))
 * - Muted accent colors (#2563EB blue) for professional look
 * - Minimal hover effects (1-2px transforms)
 * - Elegant gradient background
 * - PIN authentication and employee self-service functions
 * - Weekly schedule, timesheet, team schedule, and profile views
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔧 REFACTORING GAME PLAN - Next Phase
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Now that React Query hooks are in place, continue with original plan:
 *
 * PHASE 1: Extract Shared Utilities
 * - Create src/lib/translations.ts
 * - Create src/lib/employeeUtils.ts (formatTime, formatHoursMinutes)
 * - Create src/components/GlassCard.tsx
 *
 * PHASE 2: Extract UI Components
 * - Create src/components/RefinedKeypad.tsx
 * - Create src/components/EmployeeLogin.tsx
 * - Create src/components/BottomNav.tsx
 *
 * PHASE 3: Extract Tab Components
 * - Create src/components/tabs/ScheduleTab.tsx
 * - Create src/components/tabs/TimesheetTab.tsx
 * - Create src/components/tabs/ProfileTab.tsx
 * - Create src/components/tabs/TimeOffTab.tsx
 *
 * FINAL SIZE: ~250-300 lines
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function EmployeePortal() {
  // ============================================================================
  // REACT QUERY HOOKS - Replaces manual state management
  // ============================================================================
  const {
    employee,
    isLoggedIn,
    login,
    logout,
    isLoggingIn,
    loginError
  } = useEmployeeAuth()

  const {
    data: scheduleData,
    isLoading: isScheduleLoading
  } = useEmployeeSchedule(employee?.id, isLoggedIn)

  const {
    data: fullTeamSchedule,
    isLoading: isTeamScheduleLoading
  } = useTeamSchedule(isLoggedIn)

  const {
    data: timesheetData,
    isLoading: isTimesheetLoading
  } = useTimesheet(employee?.id, isLoggedIn)

  const {
    requests: timeOffRequests,
    submitRequest: submitTimeOffRequest,
    isSubmitting: isTimeOffSubmitting
  } = useTimeOff(employee?.id)

  // ============================================================================
  // LOCAL UI STATE (not data fetching)
  // ============================================================================
  const [activeTab, setActiveTab] = useState<'weeklySchedule' | 'teamSchedule' | 'openShifts' | 'timeOff' | 'timesheet' | 'profile'>('weeklySchedule')
  const [language, _setLanguage] = useState<'en' | 'es'>('en')
  const [timeOffStartDate, setTimeOffStartDate] = useState('')
  const [timeOffEndDate, setTimeOffEndDate] = useState('')
  const [timeOffReason, setTimeOffReason] = useState('')

  // Get current translations
  const t = translations[language]

  // Set page title
  useEffect(() => {
    document.title = 'Bagel Crust - Employee Portal'
  }, [])

  // ============================================================================
  // EVENT HANDLERS - Simplified with hooks
  // ============================================================================
  const handlePinLogin = async (pin: string) => {
    try {
      await login(pin)
    } catch (error) {
      // Error is handled by useEmployeeAuth hook
    }
  }

  const handleTimeOffSubmit = async () => {
    if (!timeOffStartDate || !timeOffEndDate || !employee?.id) {
      alert('Please select both start and end dates')
      return
    }

    const startDate = new Date(timeOffStartDate)
    const endDate = new Date(timeOffEndDate)

    if (endDate < startDate) {
      alert('End date must be after start date')
      return
    }

    try {
      await submitTimeOffRequest({
        employee_id: employee.id,
        start_date: timeOffStartDate,
        end_date: timeOffEndDate,
        reason: timeOffReason
      })

      // Clear form
      setTimeOffStartDate('')
      setTimeOffEndDate('')
      setTimeOffReason('')

      alert('Time off request submitted!')
    } catch (error) {
      alert('Failed to submit request')
    }
  }

  // ============================================================================
  // LOADING & LOGIN STATES
  // ============================================================================

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return (
      <EmployeeLogin
        onComplete={handlePinLogin}
        isLoggingIn={isLoggingIn}
        loginError={loginError}
        t={t}
      />
    )
  }

  // Show loading after login (while data fetches)
  const isLoadingData = isScheduleLoading || isTeamScheduleLoading || isTimesheetLoading
  if (isLoadingData) {
    return (
      <div className="fixed inset-0 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center text-gray-500 text-base font-semibold">
          {t.loadingSchedule}
        </div>
      </div>
    )
  }

  // ============================================================================
  // MAIN PORTAL UI
  // PWA SAFE AREA: Uses env(safe-area-inset-*) for iPhone notch/status bar
  // - Top: safe-area-inset-top + 12px for breathing room (prevents notch overlap)
  // - Bottom: 96px + safe-area-inset-bottom (clears BottomNav + home indicator)
  // - Requires viewport-fit=cover in index.html (already set)
  // - Requires 100dvh in index.css for gradient to reach screen edges (already set)
  // ============================================================================
  return (
    <div className="fixed inset-0 w-full overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex-1 overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+12px)] [overflow-scrolling:touch]">
        <div className="max-w-2xl mx-auto px-4 py-3">

        {/* WEEKLY SCHEDULE TAB */}
        {activeTab === 'weeklySchedule' && (
          <ScheduleTab
            employee={employee}
            scheduleData={scheduleData}
            fullTeamSchedule={fullTeamSchedule}
            t={t}
          />
        )}


          {/* TIME OFF TAB */}
          {activeTab === 'timeOff' && (
            <TimeOffTab
              timeOffStartDate={timeOffStartDate}
              timeOffEndDate={timeOffEndDate}
              timeOffReason={timeOffReason}
              onStartDateChange={setTimeOffStartDate}
              onEndDateChange={setTimeOffEndDate}
              onReasonChange={setTimeOffReason}
              onSubmit={handleTimeOffSubmit}
              isSubmitting={isTimeOffSubmitting}
              requests={timeOffRequests}
            />
          )}

          {/* TIMESHEET TAB */}
          {activeTab === 'timesheet' && timesheetData && (
            <TimesheetTab timesheetData={timesheetData} t={t} />
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <ProfileTab employee={employee} onLogout={logout} t={t} />
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
