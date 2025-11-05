import { useState, useEffect } from 'react'
import { employeeApi, timeclockApi } from '../lib/supabase'

/**
 * OPTION C: FLAT MINIMAL DESIGN
 *
 * Characteristics:
 * - No glass effects or blur
 * - Clean, sharp edges (0px border radius or very minimal)
 * - Flat colors with no gradients
 * - Ultra-minimal shadows
 * - Material Design inspired
 * - High contrast, maximum clarity
 */

// Flat Minimal Keypad Component
function FlatKeypad({ onComplete, maxLength = 4 }: { onComplete?: (value: string) => void, maxLength?: number }) {
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
    <div style={{ width: '320px' }}>
      {/* PIN Display - Flat */}
      <div style={{
        height: '56px',
        background: '#FFFFFF',
        border: '2px solid #E0E0E0',
        borderRadius: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        gap: '12px'
      }}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '0',
              background: i < value.length ? '#000000' : '#E0E0E0',
              transition: 'background 0.15s ease'
            }}
          />
        ))}
      </div>

      {/* Keypad Grid - Flat */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px'
      }}>
        {[1,2,3,4,5,6,7,8,9,'←',0].map(item => (
          <button
            key={item}
            onClick={() => {
              if (item === '←') handleBackspace()
              else if (typeof item === 'number') handleInput(item.toString())
            }}
            style={{
              height: '64px',
              fontSize: item === '←' ? '20px' : '26px',
              fontWeight: '500',
              background: '#FFFFFF',
              border: '2px solid #E0E0E0',
              borderRadius: '0',
              cursor: 'pointer',
              color: '#212121',
              transition: 'all 0.1s ease',
              gridColumn: item === 0 ? '2' : 'auto',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F5F5F5'
              e.currentTarget.style.borderColor = '#BDBDBD'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.borderColor = '#E0E0E0'
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ClockInOut_C() {
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
        const time = new Date(event.event_time_est)
        const isToday = time.toDateString() === new Date().toDateString()
        const timeStr = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York'
        })

        return {
          id: event.id,
          name: event.core_employees?.display_name || event.core_employees?.name || 'Unknown',
          action: event.event_type === 'in' ? 'Clock In' : 'Clock Out',
          time: isToday ? timeStr : `${time.toLocaleDateString()} ${timeStr}`
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

      const displayName = employee.display_name || employee.name
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
      background: '#FAFAFA',
      position: 'relative',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Design Label */}
      <div style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        background: '#000000',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '0',
        fontSize: '12px',
        fontWeight: '600',
        zIndex: 100,
        border: '2px solid #000000'
      }}>
        OPTION C: FLAT MINIMAL
      </div>

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
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div style={{
              fontSize: '42px',
              fontWeight: '400',
              color: '#212121',
              letterSpacing: '-1px',
              marginBottom: '8px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {currentTime || '--:--:--'}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#757575',
              fontWeight: '400',
              letterSpacing: '0.5px'
            }}>
              {currentDate || 'Loading...'}
            </div>
          </div>

          {/* Keypad */}
          <FlatKeypad
            key={keypadKey}
            onComplete={handleClockAction}
            maxLength={4}
          />
        </div>
      </div>

      {/* Recent Activity - Flat */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '280px',
        background: '#FFFFFF',
        border: '2px solid #E0E0E0',
        borderRadius: '0',
        padding: '16px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#757575',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '12px'
        }}>
          Recent Activity
        </h3>

        {recentEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {recentEvents.slice(0, 5).map((event, index) => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  borderBottom: index < 4 ? '1px solid #F0F0F0' : 'none'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#212121',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {event.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#9E9E9E',
                    marginTop: '2px'
                  }}>
                    {event.time}
                  </div>
                </div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '0',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: event.action === 'Clock In' ? '#000000' : '#757575',
                  color: '#FFFFFF'
                }}>
                  {event.action === 'Clock In' ? 'IN' : 'OUT'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: '12px',
            color: '#9E9E9E',
            textAlign: 'center',
            padding: '16px'
          }}>
            No recent activity
          </div>
        )}
      </div>

      {/* Message Display - Flat */}
      {message && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 32px',
          borderRadius: '0',
          fontSize: '15px',
          fontWeight: '500',
          zIndex: 50,
          background: messageType === 'success'
            ? '#4CAF50'
            : messageType === 'clockout'
            ? '#FF9800'
            : '#F44336',
          color: '#FFFFFF',
          border: `3px solid ${
            messageType === 'success'
              ? '#388E3C'
              : messageType === 'clockout'
              ? '#F57C00'
              : '#D32F2F'
          }`
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
