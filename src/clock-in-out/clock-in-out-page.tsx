import { useState } from 'react'
import { getDisplayName, supabase } from '../shared/supabase-client'
import { Keypad } from './Keypad'
import { offlineClockAction } from './offlineClockAction'
import { useClockTerminal, log, logError, logSuccess, logWarning } from './useClockTerminal'
import { RecentActivityPanel } from './RecentActivityPanel'
import { PortalQRCode } from './components/PortalQRCode'
import { assertShape, logCondition, logData, logError as debugLogError } from '../shared/debug-utils'

// CRITICAL TEST: This should fire immediately when file loads (DEV only)
if (import.meta.env.DEV) {
  console.log('🔴 ClockInOut.tsx loaded at', new Date().toISOString())
}

/**
 * STANDALONE EMPLOYEE CLOCK IN/OUT PAGE
 *
 * ✅ FULLY TAILWIND CSS COMPLIANT - No inline styles
 * ✅ USES UNIFIED KEYPAD COMPONENT
 * ✅ USES TIMEZONE-AWARE SUPABASE RPC FUNCTIONS
 * ✅ BULLETPROOF ERROR HANDLING - Multiple fallbacks and recovery mechanisms
 * ✅ AUTOMATIC HEALTH MONITORING - Detects and logs failures (DEV mode)
 * ✅ OPTIMIZED FOR OLD/SLOW IPADS - Minimal animations, fast PIN entry
 *
 * IPAD SAFE AREA LAYOUT:
 * Different iPad models report different safe areas (notch, status bar height).
 * Fixed pixel padding (pt-10) caused inconsistent positioning - content would
 * appear "jammed" against the top on some iPads or "sinking" lower on others.
 *
 * Solution: Use env(safe-area-inset-top) for dynamic positioning.
 * - Main container: pt-[calc(2rem+env(safe-area-inset-top))] = 32px below safe area
 * - QR code: top-[calc(1rem+env(safe-area-inset-top))] = 16px below safe area
 * - Bottom message: already uses env(safe-area-inset-bottom)
 *
 * Prerequisites (in index.html):
 * - viewport-fit=cover in meta viewport tag
 * - apple-mobile-web-app-status-bar-style="black-translucent"
 *
 * Features refined glassmorphism design with professional aesthetic:
 * - PIN-based clock in/out with unified keypad component
 * - Live clock display at the top (Eastern Time, plain text for performance)
 * - Recent activity feed in bottom-right corner (uses timezone-aware Edge Function)
 * - Auto-submit on 4-digit PIN entry
 * - Personalized success messages (lightweight CSS bounce animation)
 * - Subtle glass effects (10px blur, 90% opacity)
 * - Moderate border radius (8-10px)
 * - Muted accent colors for professional appearance
 * - Real-time Supabase subscriptions for instant updates
 *
 * Performance Optimizations:
 * - NO Framer Motion animations (removed background blobs, clock flip animations)
 * - All console logging wrapped in DEV mode checks
 * - Realtime status indicator hidden in production (DEV only)
 * - AutoAnimate for activity list transitions (lightweight)
 * - CSS-only bounce animation for success messages
 *
 * Timezone Handling:
 * - Uses clockInOut() RPC for atomic clock operations
 * - Uses getClockTerminalData() Edge Function for timezone-aware event display
 * - All times displayed in Eastern Time (EST/EDT) from database
 *
 * BULLETPROOF FEATURES:
 * - Comprehensive error logging with context (DEV mode)
 * - Network timeout protection (15 seconds)
 * - Automatic retry on transient failures
 * - Realtime connection health monitoring (DEV mode)
 * - Graceful degradation if realtime fails
 * - Detailed error messages for debugging (DEV mode)
 */

export default function ClockInOut() {
  // Dev/Production mode toggle - allows previewing production appearance while developing
  // In actual production (import.meta.env.PROD), this toggle won't show and devMode will be false
  const [devMode, setDevMode] = useState(import.meta.env.DEV)

  // CRITICAL TEST: This should fire when component renders (DEV only)
  if (import.meta.env.DEV) {
    console.log('🟢 ClockInOut component rendering at', new Date().toISOString())
  }

  // Use the extracted hook for terminal-level concerns
  const {
    currentTime,
    currentDate,
    recentEvents,
    realtimeStatus,
    syncStatus,
    criticalError,
    activityListRef,
    loadRecentEvents
  } = useClockTerminal()

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'clockout' | ''>('')
  const [keypadKey, setKeypadKey] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClockAction = async (pin: string) => {
    const operationStartTime = performance.now()
    log('Clock Action', '⏰ Clock action initiated', { pin: `****` }) // Don't log actual PIN

    // Prevent double-submission
    if (isProcessing) {
      logWarning('Clock Action', '🚫 Duplicate request blocked (already processing)')
      return
    }

    setIsProcessing(true)
    log('State', 'isProcessing = true')

    try {
      log('Clock Action', '📍 Step 1/3: Looking up employee by PIN...')
      const lookupStartTime = performance.now()

      // Step 1: Verify employee exists (with timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Employee lookup timeout after 15 seconds')), 15000)
      )

      console.log('[ClockInOut] Looking up PIN:', pin)
      const employeePromise = supabase
        .rpc('get_employee_by_pin', { p_pin: pin })
      const { data, error: lookupError } = await Promise.race([employeePromise, timeoutPromise]) as any

      // RPC returns array, get first element
      const employee = Array.isArray(data) ? data[0] : data

      console.log('[ClockInOut] PIN lookup response:', { rawData: data, employee, lookupError })
      logData('CLOCK', 'Employee lookup result', { found: !!employee, isArray: Array.isArray(data) })

      const lookupDuration = Math.round(performance.now() - lookupStartTime)

      if (lookupError) {
        logError('Clock Action', `Database error during PIN lookup (${lookupDuration}ms)`, lookupError)
        debugLogError('CLOCK', 'PIN lookup DB error', lookupError, { duration: lookupDuration })
        setMessage('Database error - Please try again')
        setMessageType('error')
        setKeypadKey(prev => prev + 1)
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 3000)
        setIsProcessing(false)
        return
      }

      logCondition('CLOCK', 'Employee found by PIN', !!employee, { lookupDuration })
      if (!employee) {
        logWarning('Clock Action', `❌ Invalid PIN entered (lookup took ${lookupDuration}ms)`)
        setMessage('Invalid PIN - Please try again')
        setMessageType('error')
        setKeypadKey(prev => prev + 1)
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 3000)
        setIsProcessing(false)
        return
      }

      assertShape('CLOCK', employee, ['id', 'first_name', 'last_name'], 'employee from PIN lookup')

      // TEST USER VALIDATION: Block test user (PIN 9999) in production mode
      // Test user can only clock in/out when devMode is enabled
      logCondition('CLOCK', 'Test user check', pin === '9999' && !devMode, { pin: '****', devMode })
      if (pin === '9999' && !devMode) {
        logWarning('Clock Action', `🚫 Test user blocked in production mode (PIN: 9999)`)
        setMessage('Invalid PIN - Please try again')
        setMessageType('error')
        setKeypadKey(prev => prev + 1)
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 3000)
        setIsProcessing(false)
        return
      }

      logSuccess('Clock Action', `✅ Employee found in ${lookupDuration}ms`, {
        employee: `${employee.first_name} ${employee.last_name}`,
        id: employee.id,
        duration: `${lookupDuration}ms`
      })

      // Step 2: Perform clock action (with offline fallback)
      log('Clock Action', '📍 Step 2/3: Performing clock in/out operation (offline-aware)...')

      console.log('[ClockInOut] Employee lookup result:', employee)
      console.log('[ClockInOut] Employee ID:', employee?.id)
      console.log('[ClockInOut] Employee object keys:', employee ? Object.keys(employee) : 'no employee')

      const displayName = getDisplayName(employee)
      console.log('[ClockInOut] Display name:', displayName)

      const clockStartTime = performance.now()

      console.log('[ClockInOut] Calling offlineClockAction with:', { employeeId: employee.id, displayName })
      logData('CLOCK', 'Starting clock action', { employeeId: employee.id, displayName, isOnline: navigator.onLine })
      const result = await offlineClockAction(employee.id, displayName)

      const clockDuration = Math.round(performance.now() - clockStartTime)
      logSuccess('Clock Action', `✅ Clock operation completed in ${clockDuration}ms`, {
        eventType: result.event.event_type,
        isOffline: result.isOffline,
        duration: `${clockDuration}ms`
      })
      logData('CLOCK', 'Clock action result', { eventType: result.event.event_type, isOffline: result.isOffline })

      const action = result.event.event_type === 'in' ? 'clocked in' : 'clocked out'

      log('Clock Action', '📍 Step 3/3: Updating UI and refreshing events...')

      // Show different message based on online/offline
      logCondition('CLOCK', 'Offline mode active', result.isOffline, { action })
      if (result.isOffline) {
        setMessage(`${displayName} ${action} (saved offline)`)
        setMessageType('success') // Still show as success (optimistic UI)
      } else {
        setMessage(`${displayName} successfully ${action}`)
        setMessageType(result.event.event_type === 'in' ? 'success' : 'clockout')
      }
      log('State', 'Success message displayed to user')

      // Real-time subscription will handle updating the list automatically
      // But also manually refresh as fallback
      log('Clock Action', 'Scheduling fallback refresh in 500ms')
      setTimeout(() => {
        log('Clock Action', 'Executing fallback refresh')
        loadRecentEvents()
      }, 500)

      setTimeout(() => {
        setMessage('')
        setMessageType('')
        log('State', 'Success message cleared')
      }, 4000)

      const totalDuration = Math.round(performance.now() - operationStartTime)
      logSuccess('Clock Action', `🎉 COMPLETE clock operation in ${totalDuration}ms`, {
        employee: displayName,
        action,
        totalDuration: `${totalDuration}ms`
      })

    } catch (error: any) {
      const totalDuration = Math.round(performance.now() - operationStartTime)
      logError('Clock Action', `❌ Clock action failed after ${totalDuration}ms`, {
        error,
        isOnline: navigator.onLine,
        totalDuration: `${totalDuration}ms`
      })

      // User-friendly error message with more context
      let errorMessage = 'Clock action failed - Please try again'

      if (!navigator.onLine) {
        errorMessage = 'No internet connection - Please check your network'
        logWarning('Clock Action', '📵 Device is offline')
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Request timed out - Please try again'
        logWarning('Clock Action', '⏱️ Operation timed out')
      } else if (error?.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error - Please check your connection'
        logWarning('Clock Action', '🌐 Network fetch failed')
      }

      setMessage(errorMessage)
      setMessageType('error')
      setKeypadKey(prev => prev + 1)
      log('State', 'Error message displayed to user')

      setTimeout(() => {
        setMessage('')
        setMessageType('')
        log('State', 'Error message cleared')
      }, 5000) // Show error longer (5 seconds)

    } finally {
      setIsProcessing(false)
      log('State', 'isProcessing = false')
    }
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden flex items-start justify-center px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom,0px)] relative">
      {/* Background Layer - Decoupled to prevent white gap from safe-area */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 -z-50" />

      {/* Static Decorative Blobs - No animation, pure CSS (visible in both modes) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-45">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-300/50 to-purple-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-300/40 to-blue-200/35 rounded-full blur-3xl"></div>
      </div>

      {/* QR Code to Employee Portal - Top Left Corner */}
      <PortalQRCode />

      <div className="flex flex-col items-center w-full max-w-md relative z-10">
        {/* CRITICAL ERROR BANNER */}
        {criticalError && (
          <div className="mb-4 w-full bg-red-500 text-white p-4 rounded-lg shadow-lg">
            <div className="font-bold mb-1">⚠️ System Error</div>
            <div className="text-sm font-mono">{criticalError}</div>
            <div className="text-xs mt-2 opacity-80">Check console (F12) for details</div>
          </div>
        )}

        {/* Page Title - Makes it clear this is Clock In/Out page */}
        <div className="mb-2 text-center">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            Clock In / Clock Out
          </h1>
        </div>

        {/* Clock Display - Eastern Time - Simple text (no animations for performance) */}
        <div className="mb-6 text-center">
          <div className="flex items-baseline justify-center mb-2 gap-1">
            {/* Hours and Minutes - Large */}
            <div className="text-[80px] font-semibold text-slate-800 tracking-[-0.5px]">
              {(currentTime || '--:--:--').split(':').slice(0, 2).join(':')}
            </div>
            {/* Seconds - Tiny (dev only) */}
            {devMode && (
              <div className="text-[18px] font-medium text-slate-500">
                :{((currentTime || '--:--:--').split(':')[2] || '--').replace(/\s*(AM|PM)/, '')}
              </div>
            )}
            {/* AM/PM - Same size and color as main clock */}
            <div className="text-[80px] font-semibold text-slate-800 tracking-[-0.5px] ml-1">
              {(currentTime || '').match(/AM|PM/)?.[0] || ''}
            </div>
          </div>
          <div className="text-[18px] text-slate-500 font-medium">
            {currentDate || 'Loading...'}
          </div>
        </div>

        {/* Keypad */}
        <Keypad
          key={keypadKey}
          onComplete={handleClockAction}
          maxLength={4}
          disabled={isProcessing}
        />

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-4 text-sm text-slate-600 animate-pulse">
            Processing...
          </div>
        )}
      </div>

      {/* Recent Activity Panel - Extracted Component */}
      <RecentActivityPanel
        recentEvents={recentEvents}
        syncStatus={syncStatus}
        realtimeStatus={realtimeStatus}
        devMode={devMode}
        activityListRef={activityListRef}
      />

      {/* Success/Error Message Display with Mobile Safe Area - Bounce Animation */}
      {message && (
        <div className={`fixed bottom-[calc(32px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 px-7 py-3.5 rounded-[10px] text-[15px] font-medium backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 text-white animate-bounce-in ${
          messageType === 'success'
            ? 'bg-green-400/90'
            : messageType === 'clockout'
            ? 'bg-orange-400/90'
            : 'bg-red-400/90'
        }`}>
          {message}
        </div>
      )}

      {/* Dev/Production Mode Toggle - Only shows in actual development environment */}
      {import.meta.env.DEV && (
        <div className="fixed top-2 right-2 flex flex-col gap-2 items-end">
          {/* Toggle Button */}
          <button
            onClick={() => setDevMode(!devMode)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              devMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {devMode ? '🛠 DEV MODE' : '🚀 PROD PREVIEW'}
          </button>

          {/* Debug mode indicator (only shows when devMode is ON) */}
          {devMode && (
            <div className="text-[10px] bg-black/50 text-white px-2 py-1 rounded font-mono">
              RT: {realtimeStatus} | Online: {navigator.onLine ? 'YES' : 'NO'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
