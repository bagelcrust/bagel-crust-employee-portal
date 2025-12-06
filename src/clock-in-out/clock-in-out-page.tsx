import { useState } from 'react'
import { getDisplayName, supabase } from '../shared/supabase-client'
import { Keypad } from './Keypad'
import { offlineClockAction } from './offlineClockAction'
import { useClockTerminal, log, logError, logSuccess, logWarning } from './useClockTerminal'
import { RecentActivityPanel } from './RecentActivityPanel'
import { PortalQRCode } from './components/PortalQRCode'
import { UpcomingDaysPanel } from './components/UpcomingDaysPanel'
import { assertShape, logCondition, logData, logError as debugLogError } from '../shared/debug-utils'

// CRITICAL TEST: This should fire immediately when file loads (DEV only)
if (import.meta.env.DEV) {
  console.log('🔴 ClockInOut.tsx loaded at', new Date().toISOString())
}

/**
 * STANDALONE EMPLOYEE CLOCK IN/OUT PAGE
 *
 * SPLIT LAYOUT DESIGN (v2):
 * - LEFT COLUMN: Widget sidebar (QR, Calendar, Recent Activity)
 * - RIGHT COLUMN: Main keypad area (clock, PIN entry)
 *
 * The Calendar widget is the STAR of the left column - takes up most space.
 * All widgets share unified glassmorphism styling.
 */

export default function ClockInOut() {
  const [devMode, setDevMode] = useState(import.meta.env.DEV)

  if (import.meta.env.DEV) {
    console.log('🟢 ClockInOut component rendering at', new Date().toISOString())
  }

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
    log('Clock Action', '⏰ Clock action initiated', { pin: `****` })

    if (isProcessing) {
      logWarning('Clock Action', '🚫 Duplicate request blocked (already processing)')
      return
    }

    setIsProcessing(true)
    log('State', 'isProcessing = true')

    try {
      log('Clock Action', '📍 Step 1/3: Looking up employee by PIN...')
      const lookupStartTime = performance.now()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Employee lookup timeout after 15 seconds')), 15000)
      )

      console.log('[ClockInOut] Looking up PIN:', pin)
      const employeePromise = supabase
        .rpc('get_employee_by_pin', { p_pin: pin })
      const { data, error: lookupError } = await Promise.race([employeePromise, timeoutPromise]) as any

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

      logCondition('CLOCK', 'Offline mode active', result.isOffline, { action })
      if (result.isOffline) {
        setMessage(`${displayName} ${action} (saved offline)`)
        setMessageType('success')
      } else {
        setMessage(`${displayName} successfully ${action}`)
        setMessageType(result.event.event_type === 'in' ? 'success' : 'clockout')
      }
      log('State', 'Success message displayed to user')

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
      }, 5000)

    } finally {
      setIsProcessing(false)
      log('State', 'isProcessing = false')
    }
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden">
      {/* Background Layer */}
      <div className="absolute -inset-[50px] bg-gradient-to-br from-blue-50 to-purple-50 -z-50" />


      {/* COMMAND CENTER: Sidebar & Stage Layout */}
      <div className="relative z-10 h-full w-full flex flex-row overflow-hidden">
        {/* LEFT PANEL: Dashboard Sidebar */}
        <div
          className="w-[440px] h-full flex flex-col gap-6 overflow-y-auto border-r border-gray-200 bg-white/50 backdrop-blur-sm"
          style={{
            paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'calc(1.5rem + env(safe-area-inset-left, 0px))',
            paddingRight: '1.5rem'
          }}
        >
          {/* QR Code Widget */}
          <PortalQRCode />

          {/* Calendar Widget - THE STAR */}
          <UpcomingDaysPanel />

          {/* Recent Activity Widget */}
          <RecentActivityPanel
            recentEvents={recentEvents}
            syncStatus={syncStatus}
            realtimeStatus={realtimeStatus}
            devMode={devMode}
            activityListRef={activityListRef}
          />
        </div>

        {/* RIGHT PANEL: The Stage (Clock + Keypad) */}
        <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden">
          {/* Ambient Blobs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-200/25 blur-3xl rounded-full z-0 pointer-events-none"></div>
          <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-blue-200/20 blur-3xl rounded-full z-0 pointer-events-none"></div>

          {/* CRITICAL ERROR BANNER */}
          {criticalError && (
            <div className="mb-4 w-full max-w-md bg-red-500 text-white p-4 rounded-lg shadow-lg">
              <div className="font-bold mb-1">⚠️ System Error</div>
              <div className="text-sm font-mono">{criticalError}</div>
              <div className="text-xs mt-2 opacity-80">Check console (F12) for details</div>
            </div>
          )}

          {/* Kiosk Card */}
          <div className="bg-white/80 rounded-3xl shadow-xl p-12 w-full max-w-lg text-center z-10">
            {/* Brand Logo */}
            <img src="/PrimaryLogo_9.svg" alt="Bagel Crust" className="h-12 mx-auto mb-3 opacity-[0.97]" />

            {/* Label */}
            <div className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">
              Clock In/Out
            </div>

            {/* Clock Display */}
            <div className="mb-6">
              <div className="flex items-baseline justify-center mb-2 gap-1">
                <div className="text-[80px] font-semibold text-slate-800 tracking-[-0.5px] leading-none">
                  {(currentTime || '--:--:--').split(':').slice(0, 2).join(':')}
                </div>
                {devMode && (
                  <div className="text-[18px] font-medium text-slate-500">
                    :{((currentTime || '--:--:--').split(':')[2] || '--').replace(/\s*(AM|PM)/, '')}
                  </div>
                )}
                <div className="text-[80px] font-semibold text-slate-800 tracking-[-0.5px] ml-1 leading-none">
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

                  </div>
      </div>

      {/* Success/Error Message Display */}
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

      {/* Dev/Production Mode Toggle */}
      {import.meta.env.DEV && (
        <div className="fixed top-2 right-2 flex flex-col gap-2 items-end z-50">
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
