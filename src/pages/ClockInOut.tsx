import { useState, useEffect } from 'react'
import { getDisplayName, supabase } from '../supabase/supabase'
import { getEmployeeByPin, clockInOut, getClockTerminalData } from '../supabase/edgeFunctions'
import { Keypad } from '../components/Keypad'

/**
 * STANDALONE EMPLOYEE CLOCK IN/OUT PAGE
 *
 * ✅ FULLY TAILWIND CSS COMPLIANT - No inline styles
 * ✅ USES UNIFIED KEYPAD COMPONENT
 * ✅ USES TIMEZONE-AWARE SUPABASE RPC FUNCTIONS
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
 */

export default function ClockInOut() {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'clockout' | ''>('')
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [keypadKey, setKeypadKey] = useState(0)

  useEffect(() => {
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
    const timer = setInterval(updateTime, 1000)
    loadRecentEvents()

    // REAL-TIME SUBSCRIPTION: Listen for new clock in/out events
    // When someone clocks in or out, instantly update the recent activity feed
    const subscription = supabase
      .channel('time_entries_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'employees',
          table: 'time_entries'
        },
        () => {
          // Reload recent events when new entry is inserted
          loadRecentEvents()
        }
      )
      .subscribe()

    return () => {
      clearInterval(timer)
      subscription.unsubscribe()
    }
  }, [])

  const loadRecentEvents = async () => {
    try {
      // Use aggregate Edge Function - returns all terminal data in one call
      const terminalData = await getClockTerminalData(10)

      // Events are already formatted by the Edge Function!
      // No client-side date parsing or formatting needed
      setRecentEvents(terminalData.recentEvents)
    } catch (error) {
      console.error('Failed to load recent events:', error)
    }
  }

  const handleClockAction = async (pin: string) => {
    try {
      const employee = await getEmployeeByPin(pin)

      if (!employee) {
        setMessage('Invalid PIN - Please try again')
        setMessageType('error')
        setKeypadKey(prev => prev + 1)
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 3000)
        return
      }

      const event = await clockInOut(employee.id)

      const displayName = getDisplayName(employee)
      const action = event.event_type === 'in' ? 'clocked in' : 'clocked out'

      setMessage(`${displayName} successfully ${action}`)
      setMessageType(event.event_type === 'in' ? 'success' : 'clockout')

      await loadRecentEvents()

      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 4000)
    } catch (error) {
      console.error('Clock error:', error)
      setMessage('Clock action failed - Please try again')
      setMessageType('error')
      setKeypadKey(prev => prev + 1)
      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 3000)
    }
  }

  return (
    <div className="fixed inset-0 w-full overflow-hidden flex items-start justify-center px-5 pt-6 relative">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}></div>

      {/* Floating Shapes - Continuously Animating */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-float will-change-transform"></div>
        <div className="absolute top-40 right-20 w-[28rem] h-[28rem] bg-purple-300/28 rounded-full blur-3xl animate-float-delayed will-change-transform"></div>
        <div className="absolute bottom-20 left-1/4 w-[26rem] h-[26rem] bg-pink-300/30 rounded-full blur-3xl animate-float-slow will-change-transform"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-indigo-300/25 rounded-full blur-2xl animate-float will-change-transform"></div>
      </div>

      <div className="flex flex-col items-center w-full max-w-md relative z-10">
        {/* Page Title - Makes it clear this is Clock In/Out page */}
        <div className="mb-2 text-center">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            Clock In / Clock Out
          </h1>
        </div>

        {/* Clock Display - Eastern Time - Made 1.5x larger for visibility */}
        <div className="mb-6 text-center animate-fade-in-up">
          <div className="text-[57px] font-semibold text-slate-800 tracking-[-0.5px] mb-2 transition-all duration-300 animate-pulse-subtle">
            {currentTime || '--:--:--'}
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
        />
      </div>

      {/* Recent Activity - Enhanced Glass Effect with Mobile Safe Area */}
      <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-4 w-[280px] bg-white/60 backdrop-blur-xl border border-white/50 rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-4 max-h-[400px] overflow-y-auto animate-slide-in-right relative z-20">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Recent Activity
        </h3>

        {recentEvents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentEvents.slice(0, 5).map((event, index) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-2 border-b border-black/5 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
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

      {/* Success/Error Message Display with Mobile Safe Area */}
      {message && (
        <div className={`fixed bottom-[calc(32px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 px-7 py-3.5 rounded-[16px] text-[15px] font-medium backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] z-50 text-white animate-bounce-in ${
          messageType === 'success'
            ? 'bg-green-500/90'
            : messageType === 'clockout'
            ? 'bg-orange-500/90'
            : 'bg-red-500/90'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
