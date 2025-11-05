import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Filter, Wrench, Send, Loader2 } from 'lucide-react'
import { useScheduleBuilder } from '../hooks'
import { format } from 'date-fns'

/**
 * SCHEDULE BUILDER - Connected to Supabase
 *
 * Features:
 * - Real employee data from Supabase
 * - Real shifts displayed in weekly grid
 * - Week navigation (Today, Previous, Next)
 * - Glassmorphism styling
 * - Responsive design
 */

export default function ScheduleBuilder() {
  const {
    dateRangeString,
    isThisWeek,
    daysOfWeek,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    employees,
    shiftsByEmployeeAndDay,
    isLoading
  } = useScheduleBuilder()

  // Set page title
  useEffect(() => {
    document.title = 'Bagel Crust - Schedule Builder'
  }, [])

  // Format shift time for display
  const formatShiftTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
  }

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
            <button
              onClick={goToToday}
              disabled={isThisWeek}
              className={`px-4 py-2 border-2 rounded-lg font-semibold text-sm transition-all ${
                isThisWeek
                  ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
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
              {dateRangeString}
            </button>

            {/* Navigation Arrows */}
            <div className="flex gap-1">
              <button
                onClick={goToPreviousWeek}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/80"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={goToNextWeek}
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
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Loading schedule...</div>
                </div>
              </div>
            ) : (
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
                        Employee ({employees.length})
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
                              {day.dayName}, {day.dayNumber}
                            </span>
                          ) : (
                            <span className="text-gray-700">
                              {day.dayName}, {day.dayNumber}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Employee Rows */}
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
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
                            {employee.first_name}
                          </td>
                          {daysOfWeek.map((day, dayIndex) => {
                            const shiftsForDay = shiftsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                            return (
                              <td
                                key={dayIndex}
                                className="border-r border-b p-2.5 min-h-[80px] align-top"
                                style={{
                                  borderColor: 'rgba(0, 0, 0, 0.04)',
                                  background: day.isToday ? 'rgba(224, 231, 255, 0.15)' : 'transparent'
                                }}
                              >
                                {shiftsForDay.length > 0 ? (
                                  <div className="space-y-1">
                                    {shiftsForDay.map((shift) => (
                                      <div
                                        key={shift.id}
                                        className="rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-shadow"
                                        style={{
                                          background: 'rgba(37, 99, 235, 0.1)',
                                          border: '1px solid rgba(37, 99, 235, 0.2)',
                                          backdropFilter: 'blur(5px)'
                                        }}
                                      >
                                        <div className="font-semibold text-xs text-blue-900">
                                          {shift.location}
                                        </div>
                                        <div className="text-xs text-blue-800 mt-1">
                                          {formatShiftTime(shift.start_time, shift.end_time)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[60px]" />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    )}

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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
