import { useState } from 'react'
import { Delete } from 'lucide-react'

interface KeypadProps {
  onComplete: (pin: string) => void
  disabled?: boolean
  maxLength?: number
}

export function Keypad({ onComplete, disabled = false, maxLength = 4 }: KeypadProps) {
  const [pin, setPin] = useState('')

  const handleNumber = (num: number) => {
    if (disabled || pin.length >= maxLength) return

    const newPin = pin + num
    setPin(newPin)

    // Auto-submit when max length reached
    if (newPin.length === maxLength) {
      onComplete(newPin)
      setPin('') // Clear for next entry
    }
  }

  const handleBackspace = () => {
    if (disabled) return
    setPin(prev => prev.slice(0, -1))
  }

  return (
    <div className="w-full max-w-sm">
      {/* PIN Display */}
      <div className="flex justify-center gap-3 mb-8">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors ${
              i < pin.length
                ? 'bg-blue-600'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumber(num)}
            disabled={disabled}
            className="h-16 text-2xl font-semibold rounded-xl bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm border border-gray-200"
          >
            {num}
          </button>
        ))}

        {/* Empty space */}
        <div />

        {/* Zero button */}
        <button
          onClick={() => handleNumber(0)}
          disabled={disabled}
          className="h-16 text-2xl font-semibold rounded-xl bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm border border-gray-200"
        >
          0
        </button>

        {/* Backspace button */}
        <button
          onClick={handleBackspace}
          disabled={disabled || pin.length === 0}
          className="h-16 flex items-center justify-center rounded-xl bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm border border-gray-200"
        >
          <Delete className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
