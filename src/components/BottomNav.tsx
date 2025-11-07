/**
 * BottomNav - Fixed bottom navigation bar
 * Mobile-optimized tab navigation with Lucide icons
 *
 * PWA SPACING FIX (Nov 5, 2024):
 * - Reduced pt-2 → pt-1 to move icons closer to bottom
 * - Reduced pb-[calc(8px+...)] → pb-[calc(4px+...)] for tighter spacing
 * - Uses env(safe-area-inset-bottom) to account for iPhone home indicator
 * - Parent container (EmployeePortal) handles content clearance with 96px padding
 *
 * ROLE-BASED TABS (Nov 6, 2025):
 * - Now accepts dynamic tabs array based on employee role
 * - Staff 1 sees only Hours tab
 * - Staff 2, Owner, cashier, Staff see all tabs (Schedule, Time Off, Hours, Profile)
 */

import { Calendar, Clock, User, MapPin, DollarSign } from 'lucide-react'
import type { TabConfig } from '../lib/roleConfig'

interface BottomNavProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (tab: string) => void
}

// Map icon names to Lucide components
const iconMap = {
  calendar: Calendar,
  clock: Clock,
  user: User,
  'map-pin': MapPin,
  'dollar-sign': DollarSign
}

/**
 * Bottom navigation bar with icon tabs
 * Features:
 * - Dynamic tabs based on employee role
 * - Safe area inset padding for mobile devices
 * - Active state highlighting
 * - Glassmorphism design
 * - Touch-optimized
 */
export function BottomNav({ tabs, activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[calc(4px+env(safe-area-inset-bottom,0px))] bg-white/98 backdrop-blur-md border-t border-black/6 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around max-w-[600px] mx-auto pt-1 px-3">
        {tabs.map(({ key, label, iconName }) => {
          const isActive = activeTab === key
          const iconColor = isActive ? '#2563EB' : '#9CA3AF'
          const Icon = iconMap[iconName]

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-2 border-none cursor-pointer transition-all duration-200 flex-1 relative rounded-xl ${
                isActive ? 'bg-blue-600/10' : 'bg-transparent'
              }`}
            >
              <div className="transition-all duration-200 flex items-center justify-center">
                <Icon size={24} color={iconColor} strokeWidth={2} />
              </div>
              <div
                className={`text-[10px] text-center leading-tight transition-all duration-200 ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
                style={{ color: iconColor }}
              >
                {label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
