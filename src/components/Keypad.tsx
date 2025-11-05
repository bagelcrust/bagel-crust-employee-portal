import { useState } from 'react'

/**
 * UNIFIED KEYPAD COMPONENT
 *
 * Single keypad component used throughout the app for PIN entry.
 * Auto-submits when PIN is complete (4 digits).
 *
 * Used in:
 * - Clock In/Out terminal page
 * - Employee Portal login
 *
 * Features:
 * - Auto-submit on complete PIN (4 digits)
 * - Built-in PIN display (dots)
 * - Backspace support
 * - Glass morphism styling
 * - Self-managing state
 * - Automatic reset after submission
 *
 * Why one component?
 * - Single source of truth
 * - Consistent behavior everywhere
 * - Easier maintenance
 * - Less code duplication
 */

interface KeypadProps {
  onComplete: (pin: string) => void
  maxLength?: number
  disabled?: boolean
}

export function Keypad({
  onComplete,
  maxLength = 4,
  disabled = false
}: KeypadProps) {
  const [value, setValue] = useState('')

  const handleInput = (digit: string) => {
    if (disabled || value.length >= maxLength) return

    const newValue = value + digit
    setValue(newValue)

    // Auto-submit when PIN is complete
    if (newValue.length === maxLength) {
      onComplete(newValue)
      // Clear after short delay for visual feedback
      setTimeout(() => setValue(''), 500)
    }
  }

  const handleBackspace = () => {
    if (disabled) return
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '←', 0].map((item) => (
          <button
            key={item}
            onClick={() => {
              if (item === '←') handleBackspace()
              else if (typeof item === 'number') handleInput(item.toString())
            }}
            disabled={disabled}
            className={`h-[68px] ${
              item === '←' ? 'text-[22px]' : 'text-[26px]'
            } font-semibold bg-white/50 backdrop-blur-md border border-white/60 rounded-[10px] cursor-pointer text-gray-800 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-white/70 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/50 disabled:hover:translate-y-0 ${
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
