import { useState, useEffect } from 'react'
import { employeeApi, timeclockApi, getDisplayName } from '../lib/supabase'

/**
 * STANDALONE EMPLOYEE CLOCK IN/OUT PAGE
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

// Refined Glass Keypad Component
function RefinedGlassKeypad({ onComplete, maxLength = 4 }: { onComplete?: (value: string) => void, maxLength?: number }) {
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
    <div style={{ width: '330px' }}>
      {/* PIN Display - Refined Glass */}
      <div style={{
        height: '68px',
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        gap: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
      }}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: i < value.length ? '#2563EB' : 'rgba(0, 0, 0, 0.1)',
              transition: 'all 0.25s ease'
            }}
          />
        ))}
      </div>

      {/* Keypad Grid - Refined Glass */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px'
      }}>
        {[1,2,3,4,5,6,7,8,9,'←',0].map(item => (
          <button
            key={item}
            onClick={() => {
              if (item === '←') handleBackspace()
              else if (typeof item === 'number') handleInput(item.toString())
            }}
            style={{
              height: '68px',
              fontSize: item === '←' ? '22px' : '26px',
              fontWeight: '600',
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#1F2937',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              gridColumn: item === 0 ? '2' : 'auto',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ClockInOut_B() {
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
    const timer = setInterval(updateTime, 1000)
    loadRecentEvents()

    return () => clearInterval(timer)
  }, [])

  const loadRecentEvents = async () => {
    try {
      const events = await timeclockApi.getRecentEvents(10)
      const formattedEvents = events.map(event => {
        const time = new Date(event.event_timestamp)

        // Check if event is today in Eastern Time (not server's local timezone)
        const todayEST = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' })
        const eventDateEST = time.toLocaleDateString('en-US', { timeZone: 'America/New_York' })
        const isToday = todayEST === eventDateEST

        const timeStr = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York'
        })

        return {
          id: event.id,
          name: event.employee ? getDisplayName(event.employee) : 'Unknown',
          action: event.event_type === 'in' ? 'Clock In' : 'Clock Out',
          time: isToday ? timeStr : `${eventDateEST} ${timeStr}`
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Main Center Area */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        paddingTop: '96px',
        paddingBottom: '32px',
        paddingLeft: '32px',
        paddingRight: '32px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Clock Display */}
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <div style={{
              fontSize: '38px',
              fontWeight: '600',
              color: '#1E293B',
              letterSpacing: '-0.5px',
              marginBottom: '8px'
            }}>
              {currentTime || '--:--:--'}
            </div>
            <div style={{
              fontSize: '15px',
              color: '#64748B',
              fontWeight: '500'
            }}>
              {currentDate || 'Loading...'}
            </div>
          </div>

          {/* Keypad */}
          <RefinedGlassKeypad
            key={keypadKey}
            onComplete={handleClockAction}
            maxLength={4}
          />
        </div>
      </div>

      {/* Recent Activity - Subtle Glass */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '280px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        padding: '16px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '12px'
        }}>
          Recent Activity
        </h3>

        {recentEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#1E293B',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {event.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#94A3B8',
                    marginTop: '2px'
                  }}>
                    {event.time}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: event.action === 'Clock In'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(251, 146, 60, 0.15)',
                  color: event.action === 'Clock In' ? '#16A34A' : '#EA580C'
                }}>
                  {event.action === 'Clock In' ? 'IN' : 'OUT'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: '12px',
            color: '#94A3B8',
            textAlign: 'center',
            padding: '16px',
            fontStyle: 'italic'
          }}>
            No recent activity
          </div>
        )}
      </div>

      {/* Message Display - Refined Glass */}
      {message && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 28px',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '500',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          zIndex: 50,
          background: messageType === 'success'
            ? 'rgba(34, 197, 94, 0.9)'
            : messageType === 'clockout'
            ? 'rgba(251, 146, 60, 0.9)'
            : 'rgba(239, 68, 68, 0.9)',
          color: 'white'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
