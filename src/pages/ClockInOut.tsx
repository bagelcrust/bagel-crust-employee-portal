import { useState, useEffect } from 'react'
import { employeeApi, timeclockApi, getDisplayName, supabase } from '../supabase/supabase'
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
      // Use timezone-aware function that returns pre-formatted Eastern Time strings
      const events = await timeclockApi.getRecentEventsET(10)

      const formattedEvents = events.map(event => {
        // Parse the pre-formatted ET string from database
        // Format: "Nov 06, 2025 08:49 AM EST"
        const eventTimeET = event.event_time_et || ''
        const eventDateET = event.event_date_et || ''

        // Get today's date in YYYY-MM-DD format
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        // Get yesterday's date
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

        // Extract just the time from the formatted string (e.g., "08:49 AM")
        const timeMatch = eventTimeET.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
        const timeStr = timeMatch ? timeMatch[1] : eventTimeET

        // Determine display format based on date
        let displayTime = timeStr
        if (eventDateET === todayStr) {
          // Today: just show time
          displayTime = timeStr
        } else if (eventDateET === yesterdayStr) {
          // Yesterday: show "Yesterday 3:45 PM"
          displayTime = `Yesterday ${timeStr}`
        } else {
          // Older: show abbreviated date with time (e.g., "Nov 5, 3:45 PM")
          const dateObj = new Date(eventDateET)
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const month = monthNames[dateObj.getMonth()]
          const day = dateObj.getDate()
          displayTime = `${month} ${day}, ${timeStr}`
        }

        return {
          id: event.id,
          name: event.employee ? event.employee.first_name : 'Unknown',
          action: event.event_type === 'in' ? 'Clock In' : 'Clock Out',
          time: displayTime
        }
      })
      setRecentEvents(formattedEvents)
    } catch (error) {
      console.error('Failed to load recent events:', error)
    }
  }

  const handleClockAction = async (pin: string) => {
    try {
      const employee = await employeeApi.getByPin(pin)

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

      const event = await timeclockApi.clockInOut(employee.id)

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
    <div className="fixed inset-0 w-full overflow-hidden flex items-start justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-5 pt-6">
      <div className="flex flex-col items-center w-full max-w-md">
        {/* Page Title - Makes it clear this is Clock In/Out page */}
        <div className="mb-2 text-center">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
            Clock In / Clock Out
          </h1>
        </div>

        {/* Clock Display - Eastern Time - Made 1.5x larger for visibility */}
        <div className="mb-6 text-center">
          <div className="text-[57px] font-semibold text-slate-800 tracking-[-0.5px] mb-2">
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

      {/* Recent Activity - Glass Effect with Mobile Safe Area */}
      <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-4 w-[280px] bg-white/70 backdrop-blur-md border border-white/80 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-4 max-h-[400px] overflow-y-auto">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Recent Activity
        </h3>

        {recentEvents.length > 0 ? (
          <div className="flex flex-col gap-2">
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

      {/* Success/Error Message Display with Mobile Safe Area */}
      {message && (
        <div className={`fixed bottom-[calc(32px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 px-7 py-3.5 rounded-[10px] text-[15px] font-medium backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 text-white ${
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
