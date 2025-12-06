import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGetCalendarEvents, type CalendarEvent } from '../../employee-portal/fetch-calendar-data'

/**
 * Get current date in Eastern timezone
 */
function getEasternToday(): Date {
  const etString = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  return new Date(etString)
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateStr(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calendar Widget for Clock In/Out sidebar
 * Shows a real calendar grid with colored indicators
 */
export function UpcomingDaysPanel() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const today = getEasternToday()

  // Auto-dismiss popup after 10 seconds
  useEffect(() => {
    if (!selectedDay) return
    const timer = setTimeout(() => setSelectedDay(null), 10000)
    return () => clearTimeout(timer)
  }, [selectedDay])
  const todayStr = formatDateStr(today)

  // Get displayed month's start and end (with offset)
  const displayMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const monthStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1)
  const monthEnd = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0)

  // Fetch a wide range to cover navigation
  const fetchStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const fetchEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0)

  const { events, isLoading } = useGetCalendarEvents(
    formatDateStr(fetchStart),
    formatDateStr(fetchEnd)
  )

  // Create lookup map from calendar events
  const eventMap = new Map<string, CalendarEvent>()
  events.forEach(event => {
    eventMap.set(event.event_date, event)
  })

  // Get status for a day (returns color class)
  const getDayStatus = (dateStr: string) => {
    const event = eventMap.get(dateStr)
    if (!event) return { bg: '', dot: '', isBusy: false }

    const isBusy = event.is_busy || false

    switch (event.operation_level) {
      case 'closed':
        return { bg: 'bg-red-200', dot: 'bg-red-500', isBusy }
      case 'limited':
        return { bg: 'bg-amber-100', dot: 'bg-amber-500', isBusy }
      default:
        return { bg: '', dot: '', isBusy }
    }
  }

  // Get note for tooltip
  const getNote = (dateStr: string) => {
    const event = eventMap.get(dateStr)
    if (!event) return null
    return event.holiday_notes || event.game_notes || event.local_event_notes || event.academic_notes || null
  }

  // Generate calendar grid for displayed month
  const generateCalendarDays = () => {
    const days: Array<{ date: Date | null; dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean }> = []

    // Get the day of week the month starts on (0 = Sunday)
    const startDayOfWeek = monthStart.getDay()

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, dateStr: '', dayNum: 0, isToday: false, isCurrentMonth: false })
    }

    // Add all days of the month
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
      const dateStr = formatDateStr(date)
      days.push({
        date,
        dateStr,
        dayNum: day,
        isToday: dateStr === todayStr,
        isCurrentMonth: true
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const monthName = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="flex-1 bg-white/70 backdrop-blur-md border border-white/80 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-4 overflow-hidden flex flex-col relative">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonthOffset(prev => prev - 1)}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <h3 className="text-sm font-semibold text-slate-700">
          {monthName}
        </h3>
        <button
          onClick={() => setMonthOffset(prev => prev + 1)}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
          Loading...
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[10px] font-semibold text-slate-400 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day.date) {
                return <div key={`empty-${idx}`} className="h-11" />
              }

              const status = getDayStatus(day.dateStr)

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDay(day.dateStr)}
                  className={`h-11 flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors cursor-pointer
                    ${day.isToday ? 'bg-blue-400 text-white font-bold' : ''}
                    ${!day.isToday && status.bg ? status.bg : ''}
                    ${!day.isToday && !status.bg ? 'hover:bg-white/50 text-slate-700' : ''}
                    ${selectedDay === day.dateStr ? 'ring-2 ring-blue-600' : ''}
                  `}
                >
                  <span>{day.dayNum}</span>
                  {/* Busy indicator */}
                  {status.isBusy && (
                    <span className="text-[8px] absolute bottom-0.5">🔥</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Floating Popup - appears over calendar */}
          {selectedDay && (() => {
            const event = eventMap.get(selectedDay)
            const status = getDayStatus(selectedDay)
            const note = getNote(selectedDay)
            const dateObj = new Date(selectedDay + 'T12:00:00')
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric'
            })

            return (
              <div
                className="absolute inset-0 flex items-center justify-center z-10 bg-black/10"
                onClick={() => setSelectedDay(null)}
              >
                <div
                  className="bg-white rounded-xl shadow-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-base font-semibold text-slate-700">
                      {formattedDate}
                    </div>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {note && (
                    <div className="text-sm text-slate-600 mb-2">{note}</div>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {event?.operation_level === 'closed' ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">Closed</span>
                    ) : event?.operation_level === 'limited' ? (
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Limited Hours</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">Regular Hours</span>
                    )}
                    {status.isBusy && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">🔥 Busy</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

        </div>
      )}
    </div>
  )
}
