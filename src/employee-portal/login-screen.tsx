/**
 * EmployeeLogin - PIN-based authentication screen
 * Full-screen login interface with glassmorphism design
 * ✅ USES UNIFIED KEYPAD COMPONENT with auto-submit
 *
 * LAYOUT FIX (Nov 5, 2024):
 * - Uses items-center with py-20 for equal gradient spacing top/bottom
 * - Requires index.css to use 100dvh (not 100%) for PWA mode to work
 * - Without dvh, PWA mode prevents container from reaching bottom edge
 */

import { Keypad } from '../shared/keypad'
import type { Translations } from '../shared/translations'

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
export function LoginScreen({
  onComplete,
  isLoggingIn,
  loginError,
  t
}: EmployeeLoginProps) {
  return (
    <div className="fixed inset-0 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-5 py-20">
      <div className="max-w-[400px] w-full pt-6 px-6 pb-4 bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-[36px] font-bold text-gray-800 mb-3 tracking-tight">
            {t.bagelCrust}
          </h1>
          <h2 className="text-[20px] font-medium text-gray-500 tracking-tight">
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
