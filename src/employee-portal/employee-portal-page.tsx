import { useState, useEffect, useMemo, useCallback } from 'react'
import { useGetEmployeeByPin } from './fetch-login-data'
import { useGetMySchedule, useGetTeamSchedule } from './fetch-schedule-data'
import { useGetTimesheet } from './fetch-timesheet-data'
import { useGetTimeOff } from './fetch-time-off-data'
import {
  getTabsForRole,
  getDefaultTabForRole,
  validateTabForRole,
  type TabKey
} from '../shared/roleConfig'
import { getEmployeeTranslations } from '../shared/languageUtils'
import { validateTimeOffRequest } from '../shared/validationUtils'
import { createTimeOffResetHandler } from '../shared/stateUtils'
import { PAGE_TITLES, ALERTS } from '../shared/constants'
import { assertShape, logCondition, logData, logError, logStateChange } from '../shared/debug-utils'
import { LoginScreen } from './login-screen'
import { BottomNav } from './bottom-navigation'
import { ScheduleTab } from './tab-schedule'
import { TimeOffTab } from './tab-time-off'
import { TimesheetTab } from './tab-timesheet'
import { PayrollTab } from './tab-payroll'
import { ProfileTab } from './tab-profile'
import { CalendarTab } from './tab-calendar'

/**
 * EMPLOYEE PORTAL - Mobile-First Design with Refined Glassmorphism
 *
 * ✅ MIGRATED TO REACT QUERY HOOKS
 * - Reduced from 2,118 lines to ~1,700 lines
 * - Removed ~400 lines of manual state management
 * - Auto caching, refetching, and error handling
 * - Cleaner, more maintainable code
 *
 * ✅ ROLE-BASED TABS & AUTOMATIC LANGUAGE (Nov 6, 2025)
 * - Tabs dynamically filtered based on employee role
 * - staff_one: Only Hours tab (typically Spanish-speaking)
 * - staff_two, Staff, Owner, cashier: All tabs (Schedule, Time Off, Hours, Profile)
 * - Language automatically set from employee.preferred_language (database field)
 * - No manual language toggle needed
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
  } = useGetEmployeeByPin()

  // ============================================================================
  // OPTIMIZED DATA LOADING - Only fetch data for tabs user can access
  // ============================================================================
  // Check which tabs this role has access to (avoid loading unnecessary data)
  const hasTimesheetTab = employee?.role ? getTabsForRole(employee.role).some(tab => tab.key === 'timesheet') : false
  const hasTimeOffTab = employee?.role ? getTabsForRole(employee.role).some(tab => tab.key === 'timeOff') : false

  // Validate employee data when logged in
  if (isLoggedIn && employee) {
    assertShape('PORTAL', employee, ['id', 'first_name', 'role'], 'employee')
  }

  logCondition('PORTAL', 'Has timesheet tab', hasTimesheetTab, { role: employee?.role, isLoggedIn })

  const {
    data: scheduleData,
    isLoading: isScheduleLoading
  } = useGetMySchedule(employee?.id, isLoggedIn)

  const {
    data: fullTeamSchedule,
    isLoading: isTeamScheduleLoading
  } = useGetTeamSchedule(isLoggedIn)

  // Only load timesheet data if user has access to Hours tab (saves 2 Edge Function calls for owners!)
  const {
    data: timesheetData
  } = useGetTimesheet(employee?.id, isLoggedIn && hasTimesheetTab)

  // Only load time-off data if user has access to Time Off tab
  const {
    requests: timeOffRequests,
    submitRequest: submitTimeOffRequest,
    isSubmitting: isTimeOffSubmitting
  } = useGetTimeOff(hasTimeOffTab ? employee?.id : undefined)

  // ============================================================================
  // ROLE-BASED TAB CONFIGURATION
  // ============================================================================
  // Get tabs that this employee's role can access
  // NOTE: employee.role is guaranteed non-null for logged-in employees
  const availableTabs = useMemo(() => {
    if (!employee || !employee.role) return []
    return getTabsForRole(employee.role)
  }, [employee?.role])

  // Get default tab for this role (first available tab)
  const defaultTab = useMemo(() => {
    if (!employee || !employee.role) return 'timesheet' as TabKey
    return getDefaultTabForRole(employee.role)
  }, [employee?.role])

  // ============================================================================
  // LOCAL UI STATE (not data fetching)
  // ============================================================================
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)
  const [timeOffStartDate, setTimeOffStartDate] = useState('')
  const [timeOffEndDate, setTimeOffEndDate] = useState('')
  const [timeOffReason, setTimeOffReason] = useState('')

  // Get translations automatically based on employee's preferred language
  const t = useMemo(() => getEmployeeTranslations(employee), [employee])

  // Create form reset handler using utility
  const resetTimeOffForm = useMemo(
    () => createTimeOffResetHandler({
      setStartDate: setTimeOffStartDate,
      setEndDate: setTimeOffEndDate,
      setReason: setTimeOffReason
    }),
    []
  )

  // Set default tab when employee logs in
  useEffect(() => {
    if (isLoggedIn && employee && employee.role) {
      // Always set to default tab when logged in
      const defaultTabForRole = getDefaultTabForRole(employee.role)
      logStateChange('PORTAL', 'activeTab (on login)', activeTab, defaultTabForRole)
      setActiveTab(defaultTabForRole)
    }
  }, [isLoggedIn, employee?.role]) // Trigger on login state change

  // Validate active tab if it changes manually
  useEffect(() => {
    if (employee && employee.role) {
      const validTab = validateTabForRole(employee.role, activeTab)
      logCondition('PORTAL', 'Tab validation', validTab === activeTab, { currentTab: activeTab, validTab, role: employee.role })
      if (validTab !== activeTab) {
        logStateChange('PORTAL', 'activeTab (validation)', activeTab, validTab)
        setActiveTab(validTab)
      }
    }
  }, [employee?.role, activeTab])

  // Set page title using constant
  useEffect(() => {
    document.title = PAGE_TITLES.EMPLOYEE_PORTAL
  }, [])

  // ============================================================================
  // EVENT HANDLERS - Using utilities for clean, maintainable code
  // ============================================================================
  const handlePinLogin = useCallback(async (pin: string) => {
    logData('PORTAL', 'Login attempt', { pinLength: pin.length })
    try {
      await login(pin)
      logData('PORTAL', 'Login success', { employeeId: employee?.id })
    } catch (error) {
      logError('PORTAL', 'Login failed', error)
    }
  }, [login, employee?.id])

  const handleTimeOffSubmit = useCallback(async () => {
    logData('PORTAL', 'Time-off submit', { startDate: timeOffStartDate, endDate: timeOffEndDate, hasReason: !!timeOffReason })

    // Ensure employee exists and has an ID before proceeding
    if (!employee || !employee.id) {
      logError('PORTAL', 'Time-off submit failed - no employee', { employee })
      alert('Error: Employee information not available')
      return
    }

    // Validate form using validation utility
    const validation = validateTimeOffRequest(
      timeOffStartDate,
      timeOffEndDate,
      employee.id
    )

    logCondition('PORTAL', 'Time-off validation', validation.isValid, validation)
    if (!validation.isValid) {
      alert(validation.errorMessage)
      return
    }

    try {
      await submitTimeOffRequest({
        employee_id: employee.id,
        start_date: timeOffStartDate,
        end_date: timeOffEndDate,
        reason: timeOffReason
      })

      // Clear form using state utility
      resetTimeOffForm()
      logData('PORTAL', 'Time-off submit success', { employee_id: employee.id })

      alert(ALERTS.TIME_OFF.SUCCESS)
    } catch (error) {
      logError('PORTAL', 'Time-off submit failed', error)
      alert(ALERTS.TIME_OFF.FAILED)
    }
  }, [timeOffStartDate, timeOffEndDate, timeOffReason, employee, submitTimeOffRequest, resetTimeOffForm])

  // ============================================================================
  // LOADING & LOGIN STATES
  // ============================================================================

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onComplete={handlePinLogin}
        isLoggingIn={isLoggingIn}
        loginError={loginError}
        t={t}
      />
    )
  }

  // Show loading after login - wait for both personal and team schedules to load
  const isLoadingData = isScheduleLoading || isTeamScheduleLoading
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
  // MAIN PORTAL UI - PWA LAYOUT (Nov 5, 2024)
  // ============================================================================
  //
  // CRITICAL PWA SAFE AREA HANDLING:
  // This component requires careful spacing to work properly in iOS PWA mode.
  //
  // TOP SPACING (prevents content under notch/status bar):
  // - Uses env(safe-area-inset-top) to detect iPhone notch height automatically
  // - Adds 12px breathing room beyond the safe area
  // - iPhone X/11/12/13: ~44px + 12px = 56px
  // - iPhone 14/15 Pro: ~47px + 12px = 59px
  // - Older iPhones: 0px + 12px = 12px
  //
  // BOTTOM SPACING (prevents content under navigation):
  // - Uses 96px base to clear BottomNav component height
  // - Adds env(safe-area-inset-bottom) for iPhone home indicator
  // - Without this, gradient won't reach bottom edge in PWA mode
  //
  // GRADIENT BACKGROUND FIX:
  // - Removed duplicate "Employee Portal" header that was blocking gradient
  // - Background gradient now extends from top notch to bottom home indicator
  // - Requires index.css to use 100dvh (not 100%) - see index.css for details
  // - Requires viewport-fit=cover in index.html (already set)
  //
  // DO NOT REMOVE SAFE AREA INSETS - PWA will break on iPhone!
  // ============================================================================
  return (
    <div className="fixed inset-0 w-full overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex-1 overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+12px)] [overflow-scrolling:touch]">
        <div className="max-w-2xl mx-auto px-4 py-3">

        {/* WEEKLY SCHEDULE TAB */}
        {activeTab === 'weeklySchedule' && (
          <>
            {logCondition('PORTAL', 'Rendering ScheduleTab', true, { employeeId: employee?.id, hasScheduleData: !!scheduleData })}
            {assertShape('PORTAL', employee, ['id', 'first_name', 'role'], 'employee prop to ScheduleTab')}
            <ScheduleTab
              employee={employee}
              scheduleData={scheduleData}
              fullTeamSchedule={fullTeamSchedule}
              t={t}
            />
          </>
        )}


          {/* TIME OFF TAB */}
          {activeTab === 'timeOff' && (
            <>
              {logCondition('PORTAL', 'Rendering TimeOffTab', true, { requestsCount: timeOffRequests?.length, isSubmitting: isTimeOffSubmitting })}
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
            </>
          )}

          {/* TIMESHEET TAB */}
          {activeTab === 'timesheet' && (
            <>
              {logCondition('PORTAL', 'Rendering TimesheetTab', true, { hasTimesheetData: !!timesheetData })}
              <TimesheetTab timesheetData={timesheetData} t={t} />
            </>
          )}

          {/* PAYROLL TAB (Owner Only) */}
          {activeTab === 'payroll' && (
            <>
              {logCondition('PORTAL', 'Rendering PayrollTab', true, { role: employee?.role })}
              <PayrollTab />
            </>
          )}

          {/* CALENDAR TAB (Staff One) */}
          {activeTab === 'calendar' && (
            <>
              {logCondition('PORTAL', 'Rendering CalendarTab', true, { role: employee?.role })}
              <CalendarTab language={(employee?.preferred_language === 'en' ? 'en' : 'es') as 'en' | 'es'} t={t} />
            </>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              {logCondition('PORTAL', 'Rendering ProfileTab', true, { employeeId: employee?.id })}
              {assertShape('PORTAL', employee, ['id', 'first_name', 'last_name'], 'employee prop to ProfileTab')}
              <ProfileTab employee={employee} onLogout={logout} t={t} />
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Dynamic tabs based on role */}
      <BottomNav tabs={availableTabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabKey)} t={t} />
    </div>
  )
}
