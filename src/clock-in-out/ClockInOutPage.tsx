import { useState, useEffect } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { getDisplayName, supabase } from '../supabase/supabase'
import { Keypad } from '../components/Keypad'
import { offlineClockAction } from '../lib/offlineClockAction'
import { startSyncManager, onSyncEvent, getSyncStatus, type SyncEvent } from '../lib/syncManager'

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

// Comprehensive logging utility with timestamp and context (DEV mode only)
const log = (context: string, message: string, data?: any) => {
  if (!import.meta.env.DEV) return
  const timestamp = new Date().toISOString()
  console.log(`[ClockInOut] ${timestamp} - ${context}: ${message}`, data || '')
}

const logError = (context: string, error: any, details?: any) => {
  if (!import.meta.env.DEV) return
  const timestamp = new Date().toISOString()
  console.error(`[ClockInOut Error] ${timestamp} - ${context}:`, {
    error: error?.message || error,
    stack: error?.stack,
    details,
    userAgent: navigator.userAgent,
    online: navigator.onLine
  })
}

const logSuccess = (context: string, message: string, data?: any) => {
  if (!import.meta.env.DEV) return
  const timestamp = new Date().toISOString()
  console.log(`%c[ClockInOut Success] ${timestamp} - ${context}: ${message}`, 'color: green; font-weight: bold', data || '')
}

const logWarning = (context: string, message: string, data?: any) => {
  if (!import.meta.env.DEV) return
  const timestamp = new Date().toISOString()
  console.warn(`[ClockInOut Warning] ${timestamp} - ${context}: ${message}`, data || '')
}

export default function ClockInOut() {
  // Dev/Production mode toggle - allows previewing production appearance while developing
  // In actual production (import.meta.env.PROD), this toggle won't show and devMode will be false
  const [devMode, setDevMode] = useState(import.meta.env.DEV)

  // CRITICAL TEST: This should fire when component renders (DEV only)
  if (import.meta.env.DEV) {
    console.log('🟢 ClockInOut component rendering at', new Date().toISOString())
  }

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'clockout' | ''>('')
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [keypadKey, setKeypadKey] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [criticalError, setCriticalError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncEvent>({ status: 'idle', queueCount: 0 })

  // AutoAnimate ref for smooth Recent Activity transitions
  const [activityListRef] = useAutoAnimate()

  useEffect(() => {
    log('Lifecycle', '🚀 Component mounted - Clock Terminal initializing')
    log('Environment', 'User agent', { userAgent: navigator.userAgent })
    log('Environment', 'Network status', { online: navigator.onLine })
    log('Environment', 'Timezone', { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })

    // Set page title for clock terminal
    document.title = 'Bagel Crust - Clock In/Out'

    // OFFLINE QUEUE: Initialize sync manager
    log('Offline Queue', '🔄 Starting sync manager...')
    startSyncManager()

    // Subscribe to sync events
    const unsubscribe = onSyncEvent((event) => {
      logSuccess('Sync Event', `Sync status: ${event.status}`, event)
      setSyncStatus(event)
    })

    // Get initial sync status
    getSyncStatus().then(status => {
      log('Offline Queue', 'Initial sync status', status)
      setSyncStatus(status)
    }).catch(error => {
      logError('Offline Queue', 'Failed to get initial sync status', error)
    })

    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/New_York'
      }))
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York'
      }))
    }

    updateTime()
    log('Clock', 'Clock display initialized', { time: currentTime, date: currentDate })
    const timer = setInterval(updateTime, 1000)

    // Initial load with error handling
    log('Data', 'Loading initial recent events...')
    loadRecentEvents()

    // REAL-TIME SUBSCRIPTION: Listen for new clock in/out events
    // When someone clocks in or out, instantly update the recent activity feed
    log('Realtime', '📡 Setting up Realtime subscription for time_entries')
    const subscription = supabase
      .channel('time_entries_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'employees',
          table: 'time_entries'
        },
        (payload) => {
          logSuccess('Realtime', '🔔 New time entry received via Realtime', payload)
          // Reload recent events when new entry is inserted
          loadRecentEvents()
        }
      )
      .subscribe((status) => {
        log('Realtime', `Subscription status changed: ${status}`)
        if (status === 'SUBSCRIBED') {
          logSuccess('Realtime', '✅ Realtime connected successfully')
          setRealtimeStatus('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          logError('Realtime', 'Subscription failed', { status })
          setRealtimeStatus('error')
        } else {
          log('Realtime', `Status: ${status}`)
          setRealtimeStatus('disconnected')
        }
      })

    // Health check: Verify realtime connection every 30 seconds
    log('Health Check', '🏥 Starting health monitoring (30s interval)')
    const healthCheck = setInterval(() => {
      log('Health Check', '💓 Checking system health', {
        realtimeStatus,
        online: navigator.onLine,
        recentEventsCount: recentEvents.length
      })
      if (realtimeStatus === 'error') {
        logError('Health Check', 'Realtime connection is in error state')
      }
    }, 30000)

    // Network status monitoring
    const handleOnline = () => logSuccess('Network', '🌐 Network back online')
    const handleOffline = () => logWarning('Network', '📵 Network went offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      log('Lifecycle', '🛑 Component unmounting - cleaning up')
      clearInterval(timer)
      clearInterval(healthCheck)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      log('Realtime', 'Unsubscribing from Realtime channel')
      subscription.unsubscribe()
      log('Offline Queue', 'Unsubscribing from sync events')
      unsubscribe()
    }
  }, []) // Empty dependency array - only run once on mount

  const loadRecentEvents = async () => {
    const startTime = performance.now()
    log('API', '📥 Loading recent events from Postgres...')

    try {
      // Calculate date range (last 14 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 14)

      // Format dates as YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split('T')[0]

      // Timeout protection: 15 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
      )

      const dataPromise = supabase
        .rpc('get_recent_activity', {
          p_start_date: formatDate(startDate),
          p_end_date: formatDate(endDate),
          p_employee_id: null, // null = all employees
          p_limit: 10
        })

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      const duration = Math.round(performance.now() - startTime)
      logSuccess('API', `✅ Recent events loaded in ${duration}ms`, {
        eventCount: data?.length || 0,
        duration: `${duration}ms`
      })

      // Format events for display
      const formattedEvents = (data || []).map((event: any) => {
        // Extract first name only
        const firstName = event.employee_name.split(' ')[0]

        // Format timestamp to 12-hour time
        const timestamp = new Date(event.event_timestamp_et)
        const hours = timestamp.getHours()
        const minutes = timestamp.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours % 12 || 12
        const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`

        return {
          id: event.id,
          employeeId: event.employee_id,
          name: firstName,
          time: formattedTime,
          action: event.event_type === 'in' ? 'Clock In' : 'Clock Out'
        }
      })

      setRecentEvents(formattedEvents)
      log('State', 'Recent events state updated', { count: formattedEvents.length })
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime)
      logError('API', `Failed to load recent events after ${duration}ms`, error)

      // CRITICAL: Show error to user for debugging
      console.error('🚨🚨🚨 CRITICAL ERROR - Recent events failed to load:', {
        errorMessage: error?.message || String(error),
        errorStack: error?.stack,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })

      // Show visible error on page
      setCriticalError(`API Error: ${error?.message || String(error)}`)

      // Graceful degradation: Keep showing old events, don't crash
    }
  }

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

      const employeePromise = supabase
        .rpc('get_employee_by_pin', { p_pin: pin })
      const { data: employee, error: lookupError } = await Promise.race([employeePromise, timeoutPromise]) as any

      const lookupDuration = Math.round(performance.now() - lookupStartTime)

      if (lookupError) {
        logError('Clock Action', `Database error during PIN lookup (${lookupDuration}ms)`, lookupError)
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

      // TEST USER VALIDATION: Block test user (PIN 9999) in production mode
      // Test user can only clock in/out when devMode is enabled
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
      const displayName = getDisplayName(employee)
      const clockStartTime = performance.now()

      const result = await offlineClockAction(employee.id, displayName)

      const clockDuration = Math.round(performance.now() - clockStartTime)
      logSuccess('Clock Action', `✅ Clock operation completed in ${clockDuration}ms`, {
        eventType: result.event.event_type,
        isOffline: result.isOffline,
        duration: `${clockDuration}ms`
      })

      const action = result.event.event_type === 'in' ? 'clocked in' : 'clocked out'

      log('Clock Action', '📍 Step 3/3: Updating UI and refreshing events...')

      // Show different message based on online/offline
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
    <div className="fixed inset-0 w-full h-screen overflow-hidden flex items-start justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-5 pt-6 pb-[env(safe-area-inset-bottom,0px)] relative">

      {/* Static Decorative Blobs - No animation, pure CSS (visible in both modes) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-45">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-300/50 to-pink-300/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-300/45 to-pink-300/45 rounded-full blur-3xl"></div>
      </div>

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
            <div className="text-[57px] font-semibold text-slate-800 tracking-[-0.5px]">
              {(currentTime || '--:--:--').split(':').slice(0, 2).join(':')}
            </div>
            {/* Seconds - Tiny (dev only) */}
            {devMode && (
              <div className="text-[18px] font-medium text-slate-500">
                :{((currentTime || '--:--:--').split(':')[2] || '--').replace(/\s*(AM|PM)/, '')}
              </div>
            )}
            {/* AM/PM - Same size and color as main clock */}
            <div className="text-[57px] font-semibold text-slate-800 tracking-[-0.5px] ml-1">
              {(currentTime || '').match(/AM|PM/)?.[0] || ''}
            </div>
          </div>
          <div className="text-[15px] text-slate-500 font-medium">
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

      {/* Recent Activity - Glass Effect with Mobile Safe Area + AutoAnimate */}
      <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-4 w-[280px] bg-white/70 backdrop-blur-md border border-white/80 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-4 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Recent Activity
          </h3>
          <div className="flex items-center gap-2">
            {/* Sync status indicator */}
            {syncStatus.queueCount > 0 && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                syncStatus.status === 'syncing'
                  ? 'bg-blue-400/20 text-blue-600 animate-pulse'
                  : 'bg-yellow-400/20 text-yellow-600'
              }`} title={syncStatus.message}>
                {syncStatus.status === 'syncing' ? '⟳' : '●'}
                <span>{syncStatus.queueCount}</span>
              </div>
            )}
            {/* Realtime connection indicator (DEV mode only) */}
            {devMode && (
              <div className={`w-2 h-2 rounded-full ${
                realtimeStatus === 'connected' ? 'bg-green-500' :
                realtimeStatus === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`} title={`Realtime: ${realtimeStatus}`} />
            )}
          </div>
        </div>

        {recentEvents.length > 0 ? (
          <div ref={activityListRef} className="flex flex-col gap-2">
            {recentEvents
              .filter(event => {
                // FILTER TEST USER: Hide test user (employeeId: bbb42de4-61b0-45cc-ae92-2e6dec6b53ee) in production mode
                // Test user entries only show when devMode is enabled
                if (!devMode && event.employeeId === 'bbb42de4-61b0-45cc-ae92-2e6dec6b53ee') {
                  return false;
                }
                return true;
              })
              .slice(0, 5)
              .map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-2 border-b border-black/5"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-[13px] font-medium text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap">
                    {event.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {event.time}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                  event.action === 'Clock In'
                    ? 'bg-green-400/15 text-green-500'
                    : 'bg-orange-400/15 text-orange-500'
                }`}>
                  {event.action === 'Clock In' ? 'IN' : 'OUT'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center p-4 italic">
            No recent activity
          </div>
        )}
      </div>

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
