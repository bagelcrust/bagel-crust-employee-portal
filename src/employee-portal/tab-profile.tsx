/**
 * ProfileTab - Employee profile and account information
 * Displays personal details and logout functionality
 */

import type { Translations } from '../shared/translations'

interface ProfileTabProps {
  employee: any
  onLogout: () => void
  t: Translations
}

export function ProfileTab({ employee, onLogout, t }: ProfileTabProps) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
      <h3 className="text-[28px] font-bold text-gray-800 mb-6 tracking-tight">
        {t.employeeInfo}
      </h3>

      <div className="rounded-lg overflow-hidden mb-5">
        <div className="p-3.5 border-b border-black/5">
          <div className="text-[13px] text-gray-500 mb-1 font-medium">
            {t.name}
          </div>
          <div className="font-semibold text-gray-800 text-[15px]">
            {employee?.first_name} {employee?.last_name || ''}
          </div>
        </div>

        <div className="p-3.5 border-b border-black/5">
          <div className="text-[13px] text-gray-500 mb-1 font-medium">
            {t.role}
          </div>
          <div className="font-semibold text-gray-800 text-[15px]">
            {employee?.role || 'Not set'}
          </div>
        </div>

        <div className="p-3.5 border-b border-black/5">
          <div className="text-[13px] text-gray-500 mb-1 font-medium">
            PIN
          </div>
          <div className="font-semibold text-gray-800 text-[15px]">
            {employee?.pin || '****'}
          </div>
        </div>

        <div className="p-3.5 border-b border-black/5">
          <div className="text-[13px] text-gray-500 mb-1 font-medium">
            {t.phoneNumber}
          </div>
          <a
            href={`tel:${employee?.phone_number}`}
            className="font-semibold text-blue-600 text-[15px] no-underline"
          >
            {employee?.phone_number || 'Not provided'}
          </a>
        </div>

        <div className="p-3.5">
          <div className="text-[13px] text-gray-500 mb-1 font-medium">
            {t.email}
          </div>
          <a
            href={`mailto:${employee?.email}`}
            className="font-semibold text-blue-600 text-[15px] no-underline"
          >
            {employee?.email || 'Not provided'}
          </a>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full p-3.5 text-base font-semibold rounded-lg border border-red-500/30 bg-red-500/8 text-red-600 cursor-pointer transition-all duration-150 font-sans hover:bg-red-500/15"
      >
        {t.logout}
      </button>
    </div>
  )
}
