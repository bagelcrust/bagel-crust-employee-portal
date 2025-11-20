/**
 * CalendarTab - Week view showing all days with operation status
 * Matches My Schedule tab UI pattern with This Week / Next Week toggle
 *
 * VIEW ONLY - staff_one employees see this to understand what's coming up
 */

import { useState } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Translations } from '../shared/translations'
import { useGetCalendarEvents, type CalendarEvent } from './fetch-calendar-data'

interface CalendarTabProps {
  language: 'en' | 'es'
  t: Translations
}

interface DayData {
  date: Date
  dateStr: string
  dayName: string
  dateLabel: string
  operation_level: 'closed' | 'limited' | 'full'
  events: string[]
  isToday: boolean
  isBusy: boolean
}

export function CalendarTab({ language, t }: CalendarTabProps) {
  const [showWeek, setShowWeek] = useState<'this' | 'next' | 'two'>('this')

  // Get events for the next 21 days (3 weeks)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const endDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { events, isLoading, error } = useGetCalendarEvents(todayStr, endDate)

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="text-center text-gray-500 py-8">
          {language === 'es' ? 'Cargando...' : 'Loading...'}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <div className="text-center text-red-500 py-8">
          {language === 'es' ? 'Error al cargar' : 'Error loading'}
        </div>
      </div>
    )
  }

  // Generate days for this week, next week, and 2 weeks out (Mon-Sun)
  const locale = language === 'es' ? es : undefined
  const monday = startOfWeek(today, { weekStartsOn: 1 })
  const nextMonday = addDays(monday, 7)
  const twoWeeksMonday = addDays(monday, 14)

  // Create event lookup map
  const eventMap = new Map<string, CalendarEvent>()
  events.forEach(event => {
    eventMap.set(event.event_date, event)
  })

  // Generate week days
  const generateWeekDays = (weekStart: Date): DayData[] => {
    const days: DayData[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      const dateStr = date.toISOString().split('T')[0]
      const event = eventMap.get(dateStr)

      // Collect event notes
      const eventNotes: string[] = []
      if (event) {
        if (event.holiday_notes) eventNotes.push(event.holiday_notes)
        if (event.academic_notes) eventNotes.push(event.academic_notes)
        if (event.game_notes) eventNotes.push(event.game_notes)
        if (event.local_event_notes) eventNotes.push(event.local_event_notes)
      }

      days.push({
        date,
        dateStr,
        dayName: format(date, 'EEEE', { locale }),
        dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        operation_level: event?.operation_level || 'full',
        events: eventNotes,
        isToday: dateStr === todayStr,
        isBusy: event?.is_busy || false
      })
    }
    return days
  }

  const thisWeekDays = generateWeekDays(monday)
  const nextWeekDays = generateWeekDays(nextMonday)
  const twoWeeksDays = generateWeekDays(twoWeeksMonday)
  const currentDays = showWeek === 'this' ? thisWeekDays : showWeek === 'next' ? nextWeekDays : twoWeeksDays

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
      {/* Header */}
      <h2 className="text-[28px] font-bold text-gray-800 mb-6 tracking-tight">
        {t.calendar}
      </h2>

      {/* Week Toggle */}
      <div className="mb-4">
        <div className="text-center text-sm font-medium text-gray-500 mb-2">
          {t.weekLabel}
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 w-full">
          <button
            onClick={() => setShowWeek('this')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
              showWeek === 'this'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            {t.thisShort}
          </button>
          <button
            onClick={() => setShowWeek('next')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
              showWeek === 'next'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            {t.nextShort}
          </button>
          <button
            onClick={() => setShowWeek('two')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
              showWeek === 'two'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            {t.inTwoShort}
          </button>
        </div>
      </div>

      {/* Day Cards */}
      <div className="flex flex-col gap-2.5">
        {currentDays.map((day) => (
          <DayCard
            key={day.dateStr}
            day={day}
            language={language}
          />
        ))}
      </div>
    </div>
  )
}

function DayCard({
  day,
  language
}: {
  day: DayData
  language: 'en' | 'es'
}) {
  // Status badge colors and labels
  const getStatusStyles = () => {
    switch (day.operation_level) {
      case 'closed':
        return {
          badge: 'bg-red-500',
          label: language === 'es' ? 'Cerrado' : 'Closed'
        }
      case 'limited':
        return {
          badge: 'bg-amber-500',
          label: language === 'es' ? 'Horas Limitadas' : 'Limited Hours'
        }
      case 'full':
      default:
        return {
          badge: 'bg-emerald-500',
          label: language === 'es' ? 'Horas Normales' : 'Full Hours'
        }
    }
  }
  const status = getStatusStyles()

  return (
    <div
      className={`p-3.5 px-4 rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] ${
        day.isToday
          ? 'border-2 border-blue-600 bg-blue-600/5'
          : 'border border-gray-200 bg-white'
      }`}
    >
      {/* Row 1: Day/Date + Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-gray-800 text-base capitalize">
            {day.dayName}
          </span>
          <span className="text-[13px] text-gray-500">
            {day.dateLabel}
          </span>
          {day.isBusy && <span>🔥</span>}
          {day.isToday && (
            <span className="text-[10px] text-blue-600 font-bold bg-blue-600/15 px-1.5 py-0.5 rounded">
              {language === 'es' ? 'HOY' : 'TODAY'}
            </span>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap ${status.badge}`}>
          {status.label}
        </span>
      </div>

      {/* Row 2: Event Notes (always render for consistent height) */}
      <div className="mt-1.5 text-sm text-gray-600 min-h-[20px]">
        {day.events.length > 0 ? day.events[0] : ''}
      </div>
    </div>
  )
}
