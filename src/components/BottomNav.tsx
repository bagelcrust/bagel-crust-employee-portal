/**
 * BottomNav - Fixed bottom navigation bar
 * Mobile-optimized tab navigation with Lucide icons
 */

import { Calendar, Clock, User, MapPin } from 'lucide-react'

type TabKey = 'weeklySchedule' | 'teamSchedule' | 'openShifts' | 'timeOff' | 'timesheet' | 'profile'

interface BottomNavProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

const navItems = [
  { key: 'weeklySchedule' as TabKey, label: 'Schedule', Icon: Calendar },
  { key: 'timeOff' as TabKey, label: 'Time Off', Icon: MapPin },
  { key: 'timesheet' as TabKey, label: 'Hours', Icon: Clock },
  { key: 'profile' as TabKey, label: 'Profile', Icon: User }
]

/**
 * Bottom navigation bar with icon tabs
 * Features:
 * - Safe area inset padding for mobile devices
 * - Active state highlighting
 * - Glassmorphism design
 * - Touch-optimized
 */
export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[calc(4px+env(safe-area-inset-bottom,0px))] bg-white/98 backdrop-blur-md border-t border-black/6 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around max-w-[600px] mx-auto pt-1 px-3">
        {navItems.map(({ key, label, Icon }) => {
          const isActive = activeTab === key
          const iconColor = isActive ? '#2563EB' : '#9CA3AF'

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
