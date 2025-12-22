/**
 * ProfileTab - Employee profile and account information
 * Displays personal details and logout functionality
 */

import { useState } from 'react'
import { User } from 'lucide-react'
import type { Translations } from '../../shared/translations'
import { assertShape } from '../../shared/debug-utils'

interface ProfileTabProps {
  employee: any
  onLogout: () => void
  t: Translations
}

export function ProfileTab({ employee, onLogout, t }: ProfileTabProps) {
  // Validate props
  assertShape('ProfileTab', employee, ['id', 'first_name', 'role', 'pin'], 'employee')

  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="w-7 h-7 text-blue-600" />
        <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">{t.profile}</h2>
      </div>

      {/* Employee Info Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[22px] font-bold text-gray-800">
              {employee?.first_name} {employee?.last_name || ''}
            </div>
            <div className="text-[15px] text-gray-500">{employee?.role || 'Staff'}</div>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-gray-500 font-medium">PIN</div>
            <div className="text-[17px] font-bold text-gray-800">{employee?.pin || '****'}</div>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[15px] text-blue-600 font-semibold"
        >
          {showDetails ? 'Hide contact info' : 'Show contact info'}
        </button>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-black/5 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[13px] text-gray-500 font-medium mb-1">{t.phoneNumber}</div>
              <a href={`tel:${employee?.phone_number}`} className="font-semibold text-blue-600 text-[15px] no-underline">
                {employee?.phone_number || 'Not provided'}
              </a>
            </div>
            <div>
              <div className="text-[13px] text-gray-500 font-medium mb-1">{t.email}</div>
              <a href={`mailto:${employee?.email}`} className="font-semibold text-blue-600 text-[15px] no-underline truncate block">
                {employee?.email || 'Not provided'}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Install App Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-blue-100">
        <h3 className="text-[22px] font-bold text-gray-800 mb-2">{t.installApp}</h3>
        <p className="text-[15px] text-gray-600 mb-4">{t.installInstructions}</p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white/60 rounded-lg p-4">
            <span className="text-2xl">📱</span>
            <div>
              <div className="font-bold text-gray-800 text-[17px]">iPhone</div>
              <div className="text-[15px] text-gray-600">{t.iphoneInstructions}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white/60 rounded-lg p-4">
            <span className="text-2xl">🤖</span>
            <div>
              <div className="font-bold text-gray-800 text-[17px]">Android</div>
              <div className="text-[15px] text-gray-600">{t.androidInstructions}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full p-3.5 text-base font-semibold rounded-lg border border-red-500/30 bg-red-500/15 text-red-600 cursor-pointer transition-all duration-150 font-sans hover:bg-red-500/25"
      >
        {t.logout}
      </button>
    </div>
  )
}
