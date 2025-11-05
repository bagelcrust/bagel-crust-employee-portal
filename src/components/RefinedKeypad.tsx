/**
 * REFINED KEYPAD COMPONENT - Controlled PIN Entry
 *
 * Purpose: Controlled keypad component for parent-managed PIN state
 * Used in: Employee Portal login with external state management
 *
 * Features:
 * - Controlled component (parent manages state)
 * - 1-9 grid layout with 0 at bottom center
 * - Clear button styled in red
 * - Touch-optimized with hover effects
 * - Disabled state support
 * - Internationalization support (translations)
 *
 * IMPORTANT: This is different from:
 * - ClockInOutKeypad (in pages/ClockInOut.tsx) - Standalone clock terminal with auto-submit
 * - NumericKeypad (in components/NumericKeypad.tsx) - Self-contained with built-in state
 *
 * Use this when: Parent component needs full control over PIN input state
 */

import type { Translations } from '../lib/translations'

interface RefinedKeypadProps {
  onInput: (digit: string) => void
  onClear: () => void
  disabled?: boolean
  t: Translations
}

export function RefinedKeypad({ onInput, onClear, disabled, t }: RefinedKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5 max-w-[320px] mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <button
          key={num}
          onClick={() => onInput(num.toString())}
          disabled={disabled}
          className="p-4 text-xl font-semibold font-sans bg-white/95 backdrop-blur-md border border-black/5 rounded-[10px] cursor-pointer text-gray-800 transition-all duration-150 shadow-[0_2px_8px_rgba(0,0,0,0.04)] touch-manipulation select-none min-h-[56px] hover:[-webkit-tap-highlight-color:rgba(0,0,0,0.05)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          {num}
        </button>
      ))}

      {/* Empty space - bottom left */}
      <div className="min-h-[56px]"></div>

      <button
        onClick={() => onInput('0')}
        disabled={disabled}
        className="p-4 text-xl font-semibold font-sans bg-white/95 backdrop-blur-md border border-black/5 rounded-[10px] cursor-pointer text-gray-800 transition-all duration-150 shadow-[0_2px_8px_rgba(0,0,0,0.04)] touch-manipulation select-none min-h-[56px] hover:[-webkit-tap-highlight-color:rgba(0,0,0,0.05)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        0
      </button>

      <button
        onClick={onClear}
        disabled={disabled}
        className="p-4 text-sm font-semibold font-sans bg-red-500/8 backdrop-blur-md border border-red-500/15 rounded-[10px] cursor-pointer text-red-600 transition-all duration-150 shadow-[0_2px_8px_rgba(239,68,68,0.04)] touch-manipulation select-none min-h-[56px] hover:[-webkit-tap-highlight-color:rgba(0,0,0,0.05)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(239,68,68,0.08)] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_8px_rgba(239,68,68,0.04)]"
      >
        {t.clear}
      </button>
    </div>
  )
}
