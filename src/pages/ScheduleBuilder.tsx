import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Filter, Wrench, Send, Loader2 } from 'lucide-react'
import { useScheduleData } from '../hooks/useScheduleData'
import AvailabilityList from '../components/AvailabilityList'

/**
 * SCHEDULE BUILDER
 *
 * Weekly schedule builder with:
 * - Date navigation
 * - Employee grid showing unavailability and time-offs
 * - Employee availability & time-off list below grid
 */

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Helper to get week start (Monday) and end (Sunday) for a given date
function getWeekBounds(date: Date): { start: Date; end: Date } {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day // Adjust when day is Sunday
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

// Helper to format date range for display
function formatDateRange(start: Date, end: Date): string {
  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  return `${formatDate(start)} - ${formatDate(end)}`
}

// Helper to get array of dates for the week
function getWeekDates(start: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    dates.push(date)
  }
  return dates
}

// Helper to check if date is today
function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// Helper to get day of week from date
function getDayOfWeek(date: Date): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  return days[date.getDay()]
}

export default function ScheduleBuilder() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const weekBounds = useMemo(() => getWeekBounds(currentDate), [currentDate])
  const weekDates = useMemo(() => getWeekDates(weekBounds.start), [weekBounds.start])

  const { data, isLoading, error } = useScheduleData(weekBounds.start, weekBounds.end)

  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 7)
      return newDate
    })
  }

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 7)
      return newDate
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Create a map of employee availability by employee_id and day_of_week
  const availabilityMap = useMemo(() => {
    if (!data) return new Map()

    const map = new Map<string, Map<string, boolean>>()
    data.availabilities.forEach(avail => {
      if (!map.has(avail.employee_id)) {
        map.set(avail.employee_id, new Map())
      }
      map.get(avail.employee_id)!.set(avail.day_of_week, true)
    })
    return map
  }, [data])

  // Create a map of time-offs by employee_id and date
  const timeOffMap = useMemo(() => {
    if (!data) return new Map()

    const map = new Map<string, Map<string, any>>()
    data.timeOffs.forEach(timeOff => {
      const startDate = new Date(timeOff.start_time)
      const endDate = new Date(timeOff.end_time)

      if (!map.has(timeOff.employee_id)) {
        map.set(timeOff.employee_id, new Map())
      }

      // Mark all dates in the range
      const current = new Date(startDate)
      while (current <= endDate) {
        const dateKey = current.toDateString()
        map.get(timeOff.employee_id)!.set(dateKey, timeOff)
        current.setDate(current.getDate() + 1)
      }
    })
    return map
  }, [data])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading schedule...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-red-600">
          Error loading schedule: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header - Glassmorphism */}
      <div className="px-6 py-4">
        <div className="max-w-[1600px] mx-auto">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            {/* Today Button */}
            <button
              onClick={handleToday}
              className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all"
            >
              Today
            </button>

            {/* Date Range Display */}
            <button
              className="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 font-medium text-gray-700"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              {formatDateRange(weekBounds.start, weekBounds.end)}
            </button>

            {/* Navigation Arrows */}
            <div className="flex gap-1">
              <button
                onClick={handlePrevWeek}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/80"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextWeek}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/80"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action Buttons */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md">
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md">
              <Wrench className="w-4 h-4" />
              Tools
            </button>

            <button
              className="px-4 py-2 rounded-lg font-semibold text-sm cursor-not-allowed flex items-center gap-2"
              style={{
                background: 'rgba(229, 231, 235, 0.5)',
                color: '#9CA3AF'
              }}
              disabled
            >
              <Send className="w-4 h-4" />
              Publish (0)
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Grid Container */}
      <div className="px-6 pb-4">
        <div className="max-w-[1600px] mx-auto">
          <div
            className="rounded-xl overflow-hidden shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      className="sticky top-0 left-0 z-20 border-r border-b px-5 py-4 text-left font-semibold text-sm text-gray-700 min-w-[200px]"
                      style={{
                        background: 'rgba(249, 250, 251, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderColor: 'rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      Employee
                    </th>
                    {weekDates.map((date, index) => (
                      <th
                        key={index}
                        className="sticky top-0 z-10 border-r border-b px-4 py-4 text-center font-semibold text-sm min-w-[140px]"
                        style={{
                          background: isToday(date)
                            ? 'rgba(224, 231, 255, 0.5)'
                            : 'rgba(249, 250, 251, 0.95)',
                          backdropFilter: 'blur(10px)',
                          borderColor: 'rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        {isToday(date) ? (
                          <span className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                            {daysOfWeek[index]}, {date.getDate()}
                          </span>
                        ) : (
                          <span className="text-gray-700">
                            {daysOfWeek[index]}, {date.getDate()}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Employee Rows */}
                  {data?.employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition-colors hover:bg-white/40"
                    >
                      <td
                        className="sticky left-0 z-10 border-r border-b px-5 py-3 font-medium text-sm text-gray-800"
                        style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          borderColor: 'rgba(0, 0, 0, 0.04)'
                        }}
                      >
                        {employee.first_name} {employee.last_name || ''}
                      </td>
                      {weekDates.map((date, dayIndex) => {
                        const dayOfWeek = getDayOfWeek(date)
                        const hasAvailability = availabilityMap.get(employee.id)?.has(dayOfWeek)
                        const timeOff = timeOffMap.get(employee.id)?.get(date.toDateString())

                        return (
                          <td
                            key={dayIndex}
                            className="border-r border-b p-2.5 h-[80px] align-top"
                            style={{
                              borderColor: 'rgba(0, 0, 0, 0.04)',
                              background: isToday(date) ? 'rgba(224, 231, 255, 0.15)' : 'transparent'
                            }}
                          >
                            {timeOff ? (
                              <div
                                className="rounded-lg p-2.5 h-full"
                                style={{
                                  background: 'rgba(251, 191, 36, 0.15)',
                                  border: '1px solid rgba(251, 191, 36, 0.3)',
                                  backdropFilter: 'blur(5px)'
                                }}
                              >
                                <div className="font-semibold text-xs text-gray-700">
                                  Time-off
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {timeOff.reason || 'All Day'}
                                </div>
                              </div>
                            ) : !hasAvailability ? (
                              <div
                                className="rounded-lg p-2.5 h-full"
                                style={{
                                  background: 'rgba(156, 163, 175, 0.15)',
                                  border: '1px solid rgba(156, 163, 175, 0.25)',
                                  backdropFilter: 'blur(5px)'
                                }}
                              >
                                <div className="font-semibold text-xs text-gray-700">
                                  Unavailable
                                </div>
                              </div>
                            ) : null}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* Wages Row */}
                  <tr className="font-semibold">
                    <td
                      className="sticky left-0 z-10 border-r border-t-2 px-5 py-4 text-sm text-gray-700"
                      style={{
                        background: 'rgba(243, 244, 246, 0.9)',
                        backdropFilter: 'blur(10px)',
                        borderColor: 'rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Wages
                    </td>
                    {weekDates.map((_, dayIndex) => (
                      <td
                        key={dayIndex}
                        className="border-r border-t-2 px-4 py-4 text-center text-sm text-gray-600"
                        style={{
                          borderColor: 'rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        $0.00
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Availability & Time-Off List */}
      {data && (
        <AvailabilityList
          employees={data.employees}
          availabilities={data.availabilities}
          timeOffs={data.timeOffs}
          weekStart={weekBounds.start}
          weekEnd={weekBounds.end}
        />
      )}
    </div>
  )
}
