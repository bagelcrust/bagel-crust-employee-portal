import { useState, useEffect } from 'react'
import { employeeApi, timeclockApi, getDisplayName, supabase } from '../supabase/supabase'

/**
 * STANDALONE EMPLOYEE CLOCK IN/OUT PAGE
 *
 * ✅ FULLY TAILWIND CSS COMPLIANT - No inline styles
 *
 * Features refined glassmorphism design with professional aesthetic:
 * - PIN-based clock in/out with glass morphism keypad
 * - Live clock display at the top (Eastern Time)
 * - Recent activity feed in bottom-right corner
 * - Auto-submit on 4-digit PIN entry
 * - Personalized success messages
 * - Subtle glass effects (10px blur, 90% opacity)
 * - Moderate border radius (8-10px)
 * - Muted accent colors for professional appearance
 */

// Clock In/Out Keypad Component (Tailwind CSS)
// NOTE: This keypad is specific to the clock in/out terminal flow with PIN entry
// For other keypad needs:
//   - PortalKeypad.tsx (standalone portal login with built-in state)
//   - ClockInKeypad.tsx (controlled keypad for portal with parent state)
function ClockInOutKeypad({ onComplete, maxLength = 4 }: { onComplete?: (value: string) => void, maxLength?: number }) {
  const [value, setValue] = useState('')

  const handleInput = (digit: string) => {
    if (value.length < maxLength) {
      const newValue = value + digit
      setValue(newValue)

      if (newValue.length === maxLength) {
        onComplete?.(newValue)
        setTimeout(() => setValue(''), 500)
      }
    }
  }

  const handleBackspace = () => {
    setValue(value.slice(0, -1))
  }

  return (
    <div className="w-[330px]">
      {/* PIN Display - Glass Effect */}
      <div className="h-[68px] bg-white/60 backdrop-blur-md border border-white/80 rounded-[10px] flex items-center justify-center mb-5 gap-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`w-[14px] h-[14px] rounded-full transition-all duration-[250ms] ease-in-out ${
              i < value.length ? 'bg-blue-600' : 'bg-black/10'
            }`}
          />
        ))}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-[10px]">
        {[1,2,3,4,5,6,7,8,9,'←',0].map(item => (
          <button
            key={item}
            onClick={() => {
              if (item === '←') handleBackspace()
              else if (typeof item === 'number') handleInput(item.toString())
            }}
            className={`h-[68px] ${
              item === '←' ? 'text-[22px]' : 'text-[26px]'
            } font-semibold bg-white/50 backdrop-blur-md border border-white/60 rounded-[10px] cursor-pointer text-gray-800 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-white/70 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:translate-y-0 ${
              item === 0 ? 'col-start-2' : ''
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ClockInOut() {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'clockout' | ''>('')
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [keypadKey, setKeypadKey] = useState(0)

  useEffect(() => {
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
      const events = await timeclockApi.getRecentEvents(10)
      const formattedEvents = events.map(event => {
        const time = new Date(event.event_timestamp)

        // Get today and yesterday in Eastern Time
        const nowEST = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' })
        const eventDateEST = time.toLocaleDateString('en-US', { timeZone: 'America/New_York' })

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayEST = yesterday.toLocaleDateString('en-US', { timeZone: 'America/New_York' })

        const timeStr = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York'
        })

        let displayTime = timeStr
        if (eventDateEST === nowEST) {
          // Today: just show time
          displayTime = timeStr
        } else if (eventDateEST === yesterdayEST) {
          // Yesterday: show "Yesterday 3:45 PM"
          displayTime = `Yesterday ${timeStr}`
        } else {
          // Older: show date with time (no year)
          const dateStr = time.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'America/New_York'
          })
          displayTime = `${dateStr}, ${timeStr}`
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
    <div className="fixed inset-0 w-full overflow-hidden flex items-start justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-5 pt-12">
      <div className="flex flex-col items-center w-full max-w-md">
        {/* Clock Display - Eastern Time */}
        <div className="mb-8 text-center">
          <div className="text-[38px] font-semibold text-slate-800 tracking-[-0.5px] mb-2">
            {currentTime || '--:--:--'}
          </div>
          <div className="text-[15px] text-slate-500 font-medium">
            {currentDate || 'Loading...'}
          </div>
        </div>

        {/* Keypad */}
        <ClockInOutKeypad
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
