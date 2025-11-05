import { useState } from 'react'

/**
 * PORTAL KEYPAD COMPONENT
 *
 * Purpose: Self-contained PIN entry keypad for Employee Portal login
 * Used in: Employee Portal login flow
 *
 * Features:
 * - Built-in PIN display (dots)
 * - Auto-submit on complete PIN
 * - Backspace support
 * - Glass morphism styling
 * - Self-managing state
 *
 * IMPORTANT: This is different from ClockInKeypad:
 * - ClockInKeypad (components/ClockInKeypad.tsx) - Controlled keypad for employee portal
 * - ClockInOutKeypad (pages/ClockInOut.tsx) - Inline keypad for clock terminal
 *
 * Use this when: You need a standalone keypad with its own state for portal login
 */

interface PortalKeypadProps {
  onComplete?: (value: string) => void
  onChange?: (value: string) => void
  maxLength?: number
  showDisplay?: boolean
}

export function PortalKeypad({
  onComplete,
  onChange,
  maxLength = 4,
  showDisplay = true
}: PortalKeypadProps) {
  const [value, setValue] = useState('')

  const handleInput = (digit: string) => {
    if (value.length < maxLength) {
      const newValue = value + digit
      setValue(newValue)
      onChange?.(newValue)

      // Auto-submit when PIN is complete
      if (newValue.length === maxLength) {
        onComplete?.(newValue)
        // Clear after short delay for visual feedback
        setTimeout(() => {
          setValue('')
          onChange?.('')
        }, 500)
      }
    }
  }

  const handleBackspace = () => {
    const newValue = value.slice(0, -1)
    setValue(newValue)
    onChange?.(newValue)
  }

  return (
    <div style={{ width: '340px' }}>
      {showDisplay && (
        <div style={{
          height: '80px',
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}>
          {Array.from({ length: maxLength }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: i < value.length
                  ? 'rgba(59, 130, 246, 0.8)'
                  : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      )}

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
              height: '75px',
              fontSize: item === '←' ? '24px' : '28px',
              fontWeight: '700',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              color: '#1F2937',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
              gridColumn: item === 0 ? '2' : 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)'
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}