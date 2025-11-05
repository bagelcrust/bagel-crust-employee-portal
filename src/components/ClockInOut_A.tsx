import { useState, useEffect } from 'react'
import { employeeApi, timeclockApi, getDisplayName } from '../lib/supabase'

/**
 * OPTION A: PROFESSIONAL/ENTERPRISE DESIGN
 *
 * Characteristics:
 * - Minimal border radius (4-6px)
 * - Muted, desaturated colors
 * - Subtle shadows (2-8px max)
 * - No glass effects
 * - Professional typography
 * - Minimal animations (opacity only)
 * - Banking app aesthetic
 */

// Professional Keypad Component
function ProfessionalKeypad({ onComplete, maxLength = 4 }: { onComplete?: (value: string) => void, maxLength?: number }) {
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
      {/* PIN Display - Minimal Design */}
      <div style={{
        height: '60px',
        background: '#FFFFFF',
        border: '1px solid #E0E0E0',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: i < value.length ? '#2C5282' : '#E0E0E0',
              transition: 'background 0.2s ease'
            }}
          />
        ))}
      </div>

      {/* Keypad Grid */}
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
              fontSize: item === '←' ? '20px' : '24px',
              fontWeight: '600',
              background: '#FFFFFF',
              border: '1px solid #D0D0D0',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#2D3748',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              gridColumn: item === 0 ? '2' : 'auto',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F7FAFC'
              e.currentTarget.style.borderColor = '#A0AEC0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.borderColor = '#D0D0D0'
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ClockInOut_A() {
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
      background: '#F5F7FA',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Design Label */}
      <div style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        background: '#2C5282',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        zIndex: 100
      }}>
        OPTION A: PROFESSIONAL/ENTERPRISE
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
              fontSize: '36px',
              fontWeight: '600',
              color: '#1A202C',
              letterSpacing: '-0.5px',
              marginBottom: '8px'
            }}>
              {currentTime || '--:--:--'}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#718096',
              fontWeight: '500'
            }}>
              {currentDate || 'Loading...'}
            </div>
          </div>

          {/* Keypad */}
          <ProfessionalKeypad
            key={keypadKey}
            onComplete={handleClockAction}
            maxLength={4}
          />
        </div>
      </div>

      {/* Recent Activity - Subtle Design */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '280px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        padding: '16px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#718096',
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
                  borderBottom: '1px solid #F0F0F0'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#2D3748',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {event.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#A0AEC0',
                    marginTop: '2px'
                  }}>
                    {event.time}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: event.action === 'Clock In' ? '#E6F4EA' : '#FFF3E0',
                  color: event.action === 'Clock In' ? '#2D7A4F' : '#C05717'
                }}>
                  {event.action === 'Clock In' ? 'IN' : 'OUT'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: '12px',
            color: '#A0AEC0',
            textAlign: 'center',
            padding: '16px',
            fontStyle: 'italic'
          }}>
            No recent activity
          </div>
        )}
      </div>

      {/* Message Display - Professional */}
      {message && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 28px',
          borderRadius: '6px',
          fontSize: '15px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          background: messageType === 'success'
            ? '#E6F4EA'
            : messageType === 'clockout'
            ? '#FFF3E0'
            : '#FEE',
          color: messageType === 'success'
            ? '#2D7A4F'
            : messageType === 'clockout'
            ? '#C05717'
            : '#C53030',
          border: `1px solid ${
            messageType === 'success'
              ? '#A8D5BA'
              : messageType === 'clockout'
              ? '#FFD89B'
              : '#FCA5A5'
          }`
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
