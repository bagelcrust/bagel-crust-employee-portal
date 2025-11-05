/**
 * EmployeeLogin - PIN-based authentication screen
 * Full-screen login interface with glassmorphism design
 * ✅ USES UNIFIED KEYPAD COMPONENT with auto-submit
 */

import { Keypad } from './Keypad'
import type { Translations } from '../lib/translations'

interface EmployeeLoginProps {
  onComplete: (pin: string) => void
  isLoggingIn: boolean
  loginError: string | null
  t: Translations
}

/**
 * Full-screen login component with PIN entry
 * Features:
 * - Auto-submit keypad (submits on 4 digits)
 * - Error display
 * - Loading state
 */
export function EmployeeLogin({
  onComplete,
  isLoggingIn,
  loginError,
  t
}: EmployeeLoginProps) {
  return (
    <div className="fixed inset-0 w-full overflow-hidden flex items-end justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-5 pb-12 pt-[calc(env(safe-area-inset-top)+80px)]">
      <div className="max-w-[400px] w-full p-6 bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 mb-8">
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

        {/* Error Message */}
        {loginError && (
          <div className="bg-red-500/8 text-red-600 px-3.5 py-2.5 rounded-lg mb-4 text-center text-[13px] font-medium border border-red-500/15">
            {loginError}
          </div>
        )}

        {/* Unified Keypad with auto-submit */}
        <div className="flex justify-center">
          <Keypad
            onComplete={onComplete}
            disabled={isLoggingIn}
            maxLength={4}
          />
        </div>

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
