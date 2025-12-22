/**
 * AccountantHomeTab - Welcome/intro page for accountant role
 * Shows 2025 Tax Prep branding and overview of available tabs
 */

import { FileText, Banknote, TrendingUp, LogOut } from 'lucide-react'

interface AccountantHomeTabProps {
  onLogout: () => void
}

export function AccountantHomeTab({ onLogout }: AccountantHomeTabProps) {
  return (
    <div className="space-y-6">
      {/* Header with BC Logo */}
      <div className="text-center pt-4">
        <img
          src="/icon-192.png"
          alt="Bagel Crust"
          className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
        />
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight">
          2025 Tax Prep
        </h1>
      </div>

      {/* Welcome Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <h2 className="text-[20px] font-semibold text-gray-800 mb-4">
          Welcome! Here's what you can access:
        </h2>

        <div className="space-y-4">
          {/* Documents */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Documents</div>
              <div className="text-[15px] text-gray-500">Bank statements & tax forms</div>
            </div>
          </div>

          {/* Wages */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Wages</div>
              <div className="text-[15px] text-gray-500">Employee payment history</div>
            </div>
          </div>

          {/* P&L */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">P&L</div>
              <div className="text-[15px] text-gray-500">Revenue, costs & expenses</div>
            </div>
          </div>
        </div>

        <p className="text-[15px] text-gray-500 mt-6 pt-4 border-t border-gray-100">
          Use the tabs below to navigate.
        </p>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 p-3 text-[15px] font-medium text-gray-500 hover:text-red-600 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  )
}
