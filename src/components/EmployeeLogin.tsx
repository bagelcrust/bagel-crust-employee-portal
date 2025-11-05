/**
 * EmployeeLogin - PIN-based authentication screen
 * Full-screen login interface with glassmorphism design
 */

import { RefinedKeypad } from './RefinedKeypad'
import type { Translations } from '../lib/translations'

interface EmployeeLoginProps {
  pin: string
  onPinInput: (digit: string) => void
  onPinClear: () => void
  isLoggingIn: boolean
  loginError: string | null
  t: Translations
}

/**
 * Full-screen login component with PIN entry
 * Features:
 * - 4-digit PIN visualization
 * - Numeric keypad
 * - Error display
 * - Loading state
 */
export function EmployeeLogin({
  pin,
  onPinInput,
  onPinClear,
  isLoggingIn,
  loginError,
  t
}: EmployeeLoginProps) {
  return (
    <div className="fixed inset-0 w-full overflow-hidden flex items-start justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-5 pt-8">
      <div className="max-w-[400px] w-full p-5 bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-[28px] font-bold text-gray-800 mb-2 tracking-tight">
            {t.bagelCrust}
          </h1>
          <h2 className="text-[15px] font-medium text-gray-500 tracking-tight">
            {t.employeePortal}
          </h2>
        </div>

        <p className="text-center text-gray-500 mb-5 text-sm font-semibold">
          {t.enterPin}
        </p>

        {/* PIN Display - 4 dots */}
        <div className="h-[60px] bg-white/95 backdrop-blur-md rounded-[10px] flex items-center justify-center mb-5 gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
                  : 'bg-slate-300/40'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {loginError && (
          <div className="bg-red-500/8 text-red-600 px-3.5 py-2.5 rounded-lg mb-4 text-center text-[13px] font-medium border border-red-500/15">
            {loginError}
          </div>
        )}

        {/* Keypad */}
        <RefinedKeypad
          onInput={onPinInput}
          onClear={onPinClear}
          disabled={isLoggingIn}
          t={t}
        />

        {/* Loading State */}
        {isLoggingIn && (
          <div className="text-center mt-4 text-gray-500 text-[13px] font-medium">
            {t.verifying}
          </div>
        )}
      </div>
    </div>
  )
}
