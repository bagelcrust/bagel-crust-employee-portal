/**
 * InventoryStepper - Compact capsule stepper control
 *
 * Tight grouping: [ - ][ 12 ][ + ]
 * Fixes "four foot thumb" problem with closer buttons
 */

import { useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'

interface InventoryStepperProps {
  value: number
  onChange: (value: number) => void
  label?: string
  color?: 'gray' | 'blue'
  saving?: boolean
  saved?: boolean
}

export function InventoryStepper({
  value,
  onChange,
  label,
  color = 'gray'
}: InventoryStepperProps) {
  const [inputValue, setInputValue] = useState<string>(value.toString())
  const [isEditing, setIsEditing] = useState(false)

  // Sync input value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString())
    }
  }, [value, isEditing])

  const handleDecrement = () => {
    const newValue = Math.max(0, value - 1)
    onChange(newValue)
  }

  const handleIncrement = () => {
    onChange(value + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    const num = parseFloat(inputValue) || 0
    const newValue = Math.max(0, num)
    setInputValue(newValue.toString())
    onChange(newValue)
  }

  const handleInputFocus = () => {
    setIsEditing(true)
    setTimeout(() => {
      const input = document.activeElement as HTMLInputElement
      input?.select()
    }, 0)
  }

  // Color themes
  const containerBg = color === 'blue' ? 'bg-blue-100' : 'bg-slate-100'
  const buttonStyle = color === 'blue'
    ? 'bg-white shadow-sm text-blue-700 hover:bg-blue-50 active:bg-blue-100'
    : 'bg-white shadow-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100'

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Label */}
      {label && (
        <span className={`text-xs font-medium ${color === 'blue' ? 'text-blue-700' : 'text-slate-600'}`}>
          {label}
        </span>
      )}

      {/* Capsule Control */}
      <div className={`inline-flex items-center ${containerBg} rounded-xl p-1 gap-1`}>
        {/* Minus Button */}
        <button
          type="button"
          onClick={handleDecrement}
          className={`h-10 w-12 rounded-lg flex items-center justify-center transition-colors ${buttonStyle}`}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Input */}
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-16 h-10 text-center bg-transparent font-bold text-lg focus:outline-none"
        />

        {/* Plus Button */}
        <button
          type="button"
          onClick={handleIncrement}
          className={`h-10 w-12 rounded-lg flex items-center justify-center transition-colors ${buttonStyle}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
