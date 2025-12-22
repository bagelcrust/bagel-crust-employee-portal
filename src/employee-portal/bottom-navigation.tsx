/**
 * BottomNav - Fixed bottom navigation bar
 * Mobile-optimized tab navigation with Lucide icons
 *
 * PWA BOTTOM GAP FIX (Dec 2024):
 * - Outer container has NO padding - white background extends to true screen edge
 * - Inner wrapper has safe-area padding - keeps icons/text above home indicator
 * - This structure ensures no gap between nav and screen bottom in PWA mode
 * - Parent container (EmployeePortal) handles content clearance with 96px padding
 *
 * ROLE-BASED TABS (Nov 6, 2025):
 * - Now accepts dynamic tabs array based on employee role
 * - Staff 1 sees only Hours tab
 * - Staff 2, Owner, cashier, Staff see all tabs (Schedule, Time Off, Hours, Profile)
 */

import { useEffect, useRef } from 'react'
import { Calendar, CalendarDays, Clock, User, MapPin, DollarSign, FileClock, ClipboardList, Home, FileText, Banknote, Landmark, BookOpen, Compass } from 'lucide-react'
import type { TabConfig, TabKey } from '../shared/roleConfig'
import type { Translations } from '../shared/translations'

interface BottomNavProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (tab: string) => void
  t: Translations
}

// Map icon names to Lucide components
const iconMap = {
  calendar: Calendar,
  'calendar-days': CalendarDays,
  clock: Clock,
  user: User,
  'map-pin': MapPin,
  'dollar-sign': DollarSign,
  'file-clock': FileClock,
  'clipboard-list': ClipboardList,
  'home': Home,
  'file-text': FileText,
  'banknote': Banknote,
  'landmark': Landmark,
  'book-open': BookOpen,
  'compass': Compass
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
export function BottomNav({ tabs, activeTab, onTabChange, t }: BottomNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-peek animation on first load to show tabs are scrollable
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    // Only animate if there's overflow (scrollable content)
    if (el.scrollWidth <= el.clientWidth) return

    // Scroll right then back
    setTimeout(() => {
      el.scrollTo({ left: 60, behavior: 'smooth' })
      setTimeout(() => {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      }, 400)
    }, 500)
  }, [])

  // Map tab keys to translation keys
  const getTabLabel = (tabKey: TabKey): string => {
    const labelMap: Record<TabKey, keyof Translations | string> = {
      weeklySchedule: 'weeklySchedule',
      timeOff: 'timeOff',
      timesheet: 'timesheet',
      payroll: 'payroll',
      profile: 'profile',
      timeLogs: 'timeLogs',
      inventory: 'inventory',
      home: 'home',
      pl: 'P&L',
      wages: 'Wages',
      bank: 'Documents',
      training: 'Training',
      vision: 'Vision',
      schedule: 'Schedule',
      accountantHome: 'Home'
    }
    const label = labelMap[tabKey]
    // If label is a translation key that exists, use it; otherwise use the label directly
    return (t as Record<string, string>)[label] || label || tabKey
  }

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-50 pb-5 bg-white/85 backdrop-blur-md border-t border-black/6 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
    >
      {/* Scroll hint gradient on right edge */}
      <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none z-10" />
      <div ref={scrollRef} className={`flex max-w-[600px] mx-auto pt-1 pb-1 px-2 gap-0 scrollbar-hide ${tabs.length > 5 ? 'overflow-x-auto' : 'justify-center'}`}>
        {tabs.map(({ key, iconName }) => {
          const isActive = activeTab === key
          const iconColor = isActive ? '#2563EB' : '#9CA3AF'
          const Icon = iconMap[iconName]

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-3 border-none cursor-pointer transition-all duration-200 relative rounded-xl ${
                tabs.length > 5 ? 'min-w-[68px]' : 'flex-1 max-w-[90px]'
              } ${isActive ? 'bg-blue-600/10' : 'bg-transparent'}`}
            >
              <div className="transition-all duration-200 flex items-center justify-center">
                <Icon size={26} color={iconColor} strokeWidth={2} />
              </div>
              <div
                className={`text-[11px] text-center leading-tight transition-all duration-200 ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
                style={{ color: iconColor }}
              >
                {getTabLabel(key)}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
