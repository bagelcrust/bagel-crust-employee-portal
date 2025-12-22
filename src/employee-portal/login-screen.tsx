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
    <div className="fixed inset-0 w-full overflow-hidden flex items-center justify-center px-5 py-20 bg-slate-100">
      {/* Bag pattern as subtle tiled background */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'url(/bag-pattern.jpg)',
          backgroundSize: '300px',
          backgroundRepeat: 'repeat'
        }}
      ></div>

      {/* Organic floating blobs - subtle, balanced colors */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="absolute w-32 h-32 bg-blue-400/15 rounded-full blur-3xl animate-[blob-1_8s_ease-in-out_infinite]" style={{ top: '35%', left: '20%' }}></div>
        <div className="absolute w-40 h-40 bg-purple-400/15 rounded-full blur-3xl animate-[blob-2_10s_ease-in-out_infinite]" style={{ top: '45%', right: '15%' }}></div>
        <div className="absolute w-28 h-28 bg-pink-400/15 rounded-full blur-3xl animate-[blob-3_12s_ease-in-out_infinite]" style={{ bottom: '30%', left: '30%' }}></div>
        <div className="absolute w-36 h-36 bg-amber-400/12 rounded-full blur-3xl animate-[blob-4_7s_ease-in-out_infinite]" style={{ top: '30%', right: '25%' }}></div>
      </div>

      <div className="relative z-10 max-w-[400px] w-full pt-6 px-6 pb-4 bg-white/90 backdrop-blur-md rounded-[10px] border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/SubmarkLogo_NoNYStyle.svg"
            alt="Bagel Crust"
            className="h-24 mx-auto mb-3"
          />
          <h2 className="text-[24px] font-medium text-gray-500 tracking-tight">
            {t.employeePortal}
          </h2>
        </div>

        <p className="text-center text-gray-500 mb-5 text-base font-semibold">
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
