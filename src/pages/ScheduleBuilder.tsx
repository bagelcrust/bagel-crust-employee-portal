import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Filter, Wrench, Send } from 'lucide-react'

/**
 * MODERN SCHEDULE BUILDER - UI Only
 *
 * A refined, glassmorphism-style weekly schedule builder with:
 * - Clean header with date navigation
 * - Weekly grid view with employee rows
 * - Unavailable/Time-off block visualization
 * - Responsive Tailwind styling
 * - Professional color scheme
 */

// Sample employee data for UI
const employees = [
  { id: 1, name: 'Shani' },
  { id: 2, name: 'Kelly Scherer' },
  { id: 3, name: 'Sophie' },
  { id: 4, name: 'Annie' },
  { id: 5, name: 'Clara' },
  { id: 6, name: 'Fiona' },
  { id: 7, name: 'Maddy' }
]

const daysOfWeek = [
  { short: 'Mon', date: 3 },
  { short: 'Tue', date: 4, isToday: true },
  { short: 'Wed', date: 5 },
  { short: 'Thu', date: 6 },
  { short: 'Fri', date: 7 },
  { short: 'Sat', date: 8 },
  { short: 'Sun', date: 9 }
]

// Sample unavailability data (for UI demonstration)
const unavailabilityData: Record<number, Record<number, { type: 'unavailable' | 'timeoff', time: string }>> = {
  1: { 4: { type: 'unavailable', time: 'All Day' } },
  2: { 1: { type: 'unavailable', time: 'All Day' }, 3: { type: 'unavailable', time: 'All Day' }, 5: { type: 'timeoff', time: 'All Day' } },
  3: { 0: { type: 'unavailable', time: 'All Day' }, 2: { type: 'unavailable', time: 'All Day' }, 4: { type: 'unavailable', time: 'All Day' } },
  4: { 2: { type: 'unavailable', time: 'All Day' } },
  5: { 2: { type: 'unavailable', time: 'All Day' } },
  6: {
    0: { type: 'unavailable', time: '11am-2pm' },
    1: { type: 'unavailable', time: 'All Day' },
    2: { type: 'unavailable', time: '11am-2pm' },
    3: { type: 'unavailable', time: 'All Day' },
    4: { type: 'unavailable', time: '11am-2pm' }
  },
  7: { 3: { type: 'unavailable', time: 'All Day' } }
}

export default function ScheduleBuilder() {
  const [dateRange] = useState('Nov 3, 2025 - Nov 9, 2025')
  const [filterCount] = useState(4)
  const [publishCount] = useState(0)

  // Set page title
  useEffect(() => {
    document.title = 'Bagel Crust - Schedule Builder'
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
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
            <button className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all">
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
              {dateRange}
            </button>

            {/* Navigation Arrows */}
            <div className="flex gap-1">
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/80"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/80"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Week Dropdown */}
            <select
              className="px-3 py-2 rounded-lg text-sm cursor-pointer transition-all font-medium text-gray-700"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <option>Week</option>
              <option>2 Weeks</option>
              <option>Month</option>
            </select>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action Buttons */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md">
              <Filter className="w-4 h-4" />
              Filters ({filterCount})
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
              Publish ({publishCount})
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Grid Container */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="max-w-[1600px] mx-auto h-full">
          <div
            className="rounded-xl overflow-hidden shadow-lg h-full"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            <div className="overflow-auto h-full">
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
                    {daysOfWeek.map((day, index) => (
                      <th
                        key={index}
                        className="sticky top-0 z-10 border-r border-b px-4 py-4 text-center font-semibold text-sm min-w-[140px]"
                        style={{
                          background: day.isToday
                            ? 'rgba(224, 231, 255, 0.5)'
                            : 'rgba(249, 250, 251, 0.95)',
                          backdropFilter: 'blur(10px)',
                          borderColor: 'rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        {day.isToday ? (
                          <span className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                            {day.short}, {day.date}
                          </span>
                        ) : (
                          <span className="text-gray-700">
                            {day.short}, {day.date}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Employee Rows */}
                  {employees.map((employee) => (
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
                        {employee.name}
                      </td>
                      {daysOfWeek.map((day, dayIndex) => {
                        const block = unavailabilityData[employee.id]?.[dayIndex]
                        return (
                          <td
                            key={dayIndex}
                            className="border-r border-b p-2.5 h-[80px] align-top"
                            style={{
                              borderColor: 'rgba(0, 0, 0, 0.04)',
                              background: day.isToday ? 'rgba(224, 231, 255, 0.15)' : 'transparent'
                            }}
                          >
                            {block && (
                              <div
                                className="rounded-lg p-2.5 h-full"
                                style={{
                                  background: block.type === 'unavailable'
                                    ? 'rgba(156, 163, 175, 0.15)'
                                    : 'rgba(251, 191, 36, 0.15)',
                                  border: `1px solid ${
                                    block.type === 'unavailable'
                                      ? 'rgba(156, 163, 175, 0.25)'
                                      : 'rgba(251, 191, 36, 0.3)'
                                  }`,
                                  backdropFilter: 'blur(5px)'
                                }}
                              >
                                <div className="font-semibold text-xs text-gray-700">
                                  {block.type === 'unavailable' ? 'Unavailable' : 'Time-off'}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {block.time}
                                </div>
                              </div>
                            )}
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
                    {daysOfWeek.map((_, dayIndex) => (
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
    </div>
  )
}
