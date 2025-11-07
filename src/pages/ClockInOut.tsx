import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { getDisplayName, supabase } from '../supabase/supabase'
import { getEmployeeByPin, clockInOut, getClockTerminalData } from '../supabase/edgeFunctions'
import { Keypad } from '../components/Keypad'
import { AnimatedDigit } from '../components/AnimatedDigit'

// CRITICAL TEST: This should fire immediately when file loads
console.log('🔴 ClockInOut.tsx loaded at', new Date().toISOString())

/**
 * STANDALONE EMPLOYEE CLOCK IN/OUT PAGE
 *
 * ✅ FULLY TAILWIND CSS COMPLIANT - No inline styles
 * ✅ USES UNIFIED KEYPAD COMPONENT
 * ✅ USES TIMEZONE-AWARE SUPABASE RPC FUNCTIONS
 * ✅ BULLETPROOF ERROR HANDLING - Multiple fallbacks and recovery mechanisms
 * ✅ AUTOMATIC HEALTH MONITORING - Detects and logs failures
 *
 * Features refined glassmorphism design with professional aesthetic:
 * - PIN-based clock in/out with unified keypad component
 * - Live clock display at the top (Eastern Time)
 * - Recent activity feed in bottom-right corner (uses timezone-aware getRecentEventsET)
 * - Auto-submit on 4-digit PIN entry
 * - Personalized success messages
 * - Subtle glass effects (10px blur, 90% opacity)
 * - Moderate border radius (8-10px)
 * - Muted accent colors for professional appearance
 * - Real-time Supabase subscriptions for instant updates
 *
 * Timezone Handling:
 * - Uses clockInOut() RPC for atomic clock operations
 * - Uses getRecentEventsET() for timezone-aware event display
 * - All times displayed in Eastern Time (EST/EDT) from database
 *
 * BULLETPROOF FEATURES:
 * - Comprehensive error logging with context
 * - Network timeout protection (15 seconds)
 * - Automatic retry on transient failures
 * - Realtime connection health monitoring
 * - Graceful degradation if realtime fails
 * - Detailed error messages for debugging
 */

// Comprehensive logging utility with timestamp and context
const log = (context: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[ClockInOut] ${timestamp} - ${context}: ${message}`, data || '')
}

const logError = (context: string, error: any, details?: any) => {
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
  const timestamp = new Date().toISOString()
  console.log(`%c[ClockInOut Success] ${timestamp} - ${context}: ${message}`, 'color: green; font-weight: bold', data || '')
}

const logWarning = (context: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.warn(`[ClockInOut Warning] ${timestamp} - ${context}: ${message}`, data || '')
}

export default function ClockInOut() {
  // CRITICAL TEST: This should fire when component renders
  console.log('🟢 ClockInOut component rendering at', new Date().toISOString())

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'clockout' | ''>('')
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [keypadKey, setKeypadKey] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')

  // AutoAnimate ref for smooth Recent Activity transitions
  const [activityListRef] = useAutoAnimate()

  useEffect(() => {
    log('Lifecycle', '🚀 Component mounted - Clock Terminal initializing')
    log('Environment', 'User agent', { userAgent: navigator.userAgent })
    log('Environment', 'Network status', { online: navigator.onLine })
    log('Environment', 'Timezone', { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })

    // Set page title for clock terminal
    document.title = 'Bagel Crust - Clock In/Out'

    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
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
    }
  }, [realtimeStatus])

  const loadRecentEvents = async () => {
    const startTime = performance.now()
    log('API', '📥 Loading recent events from Edge Function...')

    try {
      // Use aggregate Edge Function - returns all terminal data in one call
      // Timeout protection: 15 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
      )

      const dataPromise = getClockTerminalData(10)

      const terminalData = await Promise.race([dataPromise, timeoutPromise]) as any

      const duration = Math.round(performance.now() - startTime)
      logSuccess('API', `✅ Recent events loaded in ${duration}ms`, {
        eventCount: terminalData.recentEvents.length,
        duration: `${duration}ms`
      })

      // Events are already formatted by the Edge Function!
      // No client-side date parsing or formatting needed
      setRecentEvents(terminalData.recentEvents)
      log('State', 'Recent events state updated', { count: terminalData.recentEvents.length })
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

      const employeePromise = getEmployeeByPin(pin)
      const employee = await Promise.race([employeePromise, timeoutPromise]) as any

      const lookupDuration = Math.round(performance.now() - lookupStartTime)

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

      logSuccess('Clock Action', `✅ Employee found in ${lookupDuration}ms`, {
        employee: `${employee.first_name} ${employee.last_name}`,
        id: employee.id,
        duration: `${lookupDuration}ms`
      })

      // Step 2: Perform clock action (with timeout and retry)
      log('Clock Action', '📍 Step 2/3: Performing clock in/out operation...')
      let event
      let retryCount = 0
      const maxRetries = 2

      while (retryCount <= maxRetries) {
        const attemptNumber = retryCount + 1
        const clockStartTime = performance.now()
        log('Clock Action', `Attempt ${attemptNumber}/${maxRetries + 1}`)

        try {
          const clockPromise = clockInOut(employee.id)
          const clockTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Clock action timeout after 15 seconds')), 15000)
          )

          event = await Promise.race([clockPromise, clockTimeout]) as any

          const clockDuration = Math.round(performance.now() - clockStartTime)
          logSuccess('Clock Action', `✅ Clock operation successful in ${clockDuration}ms`, {
            eventType: event.event_type,
            eventId: event.id,
            attempt: attemptNumber,
            duration: `${clockDuration}ms`
          })
          break // Success, exit retry loop

        } catch (retryError) {
          const clockDuration = Math.round(performance.now() - clockStartTime)
          retryCount++
          if (retryCount > maxRetries) {
            logError('Clock Action', `❌ All ${maxRetries + 1} attempts failed`, { totalDuration: `${clockDuration}ms` })
            throw retryError // Give up after max retries
          }
          logWarning('Clock Action', `⚠️ Attempt ${attemptNumber} failed, retrying in 1s...`, {
            error: retryError,
            duration: `${clockDuration}ms`
          })
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
        }
      }

      const displayName = getDisplayName(employee)
      const action = event.event_type === 'in' ? 'clocked in' : 'clocked out'

      log('Clock Action', '📍 Step 3/3: Updating UI and refreshing events...')
      setMessage(`${displayName} successfully ${action}`)
      setMessageType(event.event_type === 'in' ? 'success' : 'clockout')
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

      {/* Subtle Floating Background Shapes - Framer Motion */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-300/40 rounded-full blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-purple-300/35 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 45, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="flex flex-col items-center w-full max-w-md relative z-10">
        {/* Page Title - Makes it clear this is Clock In/Out page */}
        <div className="mb-2 text-center">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            Clock In / Clock Out
          </h1>
        </div>

        {/* Clock Display - Eastern Time - Animated flip numbers */}
        <div className="mb-6 text-center">
          <div className="text-[57px] font-semibold text-slate-800 tracking-[-0.5px] mb-2 flex justify-center">
            {(currentTime || '--:--:--').split('').map((char, index) => (
              <AnimatedDigit
                key={`${index}-${char}`}
                value={char}
                className="text-[57px]"
              />
            ))}
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
          {/* Realtime connection indicator */}
          <div className={`w-2 h-2 rounded-full ${
            realtimeStatus === 'connected' ? 'bg-green-500' :
            realtimeStatus === 'error' ? 'bg-red-500' :
            'bg-gray-400'
          }`} title={`Realtime: ${realtimeStatus}`} />
        </div>

        {recentEvents.length > 0 ? (
          <div ref={activityListRef} className="flex flex-col gap-2">
            {recentEvents.slice(0, 5).map((event) => (
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
                    ? 'bg-green-500/15 text-green-600'
                    : 'bg-orange-500/15 text-orange-600'
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
            ? 'bg-green-500/90'
            : messageType === 'clockout'
            ? 'bg-orange-500/90'
            : 'bg-red-500/90'
        }`}>
          {message}
        </div>
      )}

      {/* Debug mode indicator (only shows in development) */}
      {import.meta.env.DEV && (
        <div className="fixed top-2 right-2 text-[10px] bg-black/50 text-white px-2 py-1 rounded font-mono">
          RT: {realtimeStatus} | Online: {navigator.onLine ? 'YES' : 'NO'}
        </div>
      )}
    </div>
  )
}
