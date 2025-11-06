import { useState, useEffect } from 'react'
import { timeclockApi, employeeApi, getDisplayName } from '../supabase/supabase'
import { format, startOfWeek, endOfWeek, subWeeks, parseISO } from 'date-fns'
import { formatHoursMinutes } from '../lib/employeeUtils'
import { formatInEasternTime, getEasternTimeParts } from '../lib/dateUtils'

/**
 * MANAGER/ADMIN TIMESHEETS PAGE
 *
 * ✅ FULLY TAILWIND CSS COMPLIANT - No inline styles
 * ✅ MATCHES UI PATTERNS from ClockInOut and EmployeePortal
 *
 * Features refined glassmorphism design with professional aesthetic:
 * - View all employees' timesheets for selected week
 * - Week selector (This Week, Last Week, custom date range)
 * - Calculates hours worked per employee per day
 * - Shows total hours for the week
 * - Real-time data fetching from Supabase
 * - Eastern Time Zone (EST/EDT)
 *
 * TIMEZONE CRITICAL:
 * All timestamps in database are UTC. Must convert to Eastern Time for display.
 */

interface DailyHours {
  date: string // ISO date string (YYYY-MM-DD)
  day_name: string
  clock_in: string | null
  clock_out: string | null
  hours_worked: number
  incomplete?: boolean // Flag for missing clock-out
}

interface EmployeeTimesheet {
  employee_id: string
  employee_name: string
  daily_hours: DailyHours[]
  total_hours: number
}

export default function Timesheets() {
  const [loading, setLoading] = useState(true)
  const [timesheets, setTimesheets] = useState<EmployeeTimesheet[]>([])
  const [weekSelection, setWeekSelection] = useState<'this' | 'last' | 'custom'>('this')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Set page title
  useEffect(() => {
    document.title = 'Bagel Crust - Timesheets'
  }, [])

  // Load timesheets whenever week selection or custom dates change
  useEffect(() => {
    loadTimesheets()
  }, [weekSelection, startDate, endDate])

  const loadTimesheets = async () => {
    setLoading(true)
    try {
      // Determine date range based on selection
      let rangeStart: Date
      let rangeEnd: Date

      if (weekSelection === 'this') {
        const today = new Date()
        rangeStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
        rangeEnd = endOfWeek(today, { weekStartsOn: 1 }) // Sunday
      } else if (weekSelection === 'last') {
        const lastWeek = subWeeks(new Date(), 1)
        rangeStart = startOfWeek(lastWeek, { weekStartsOn: 1 })
        rangeEnd = endOfWeek(lastWeek, { weekStartsOn: 1 })
      } else {
        // Custom date range
        if (!startDate || !endDate) {
          setLoading(false)
          return
        }
        rangeStart = new Date(startDate)
        rangeEnd = new Date(endDate)
        rangeEnd.setHours(23, 59, 59, 999) // Include full end date
      }

      // Fetch all employees
      const employees = await employeeApi.getAll()

      // Fetch time entries for the date range (enough to cover all employees)
      // We'll fetch more than needed and filter
      const allEvents = await timeclockApi.getRecentEvents(5000)

      // Filter events within date range
      const eventsInRange = allEvents.filter(event => {
        const eventDate = new Date(event.event_timestamp)
        return eventDate >= rangeStart && eventDate <= rangeEnd
      })

      // Process timesheets for each employee
      const employeeTimesheets: EmployeeTimesheet[] = employees.map(employee => {
        // Get events for this employee
        const employeeEvents = eventsInRange.filter(e => e.employee_id === employee.id)

        // Sort events chronologically
        const sortedEvents = employeeEvents.sort((a, b) =>
          new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
        )

        // Calculate daily hours
        const dailyHoursMap = new Map<string, DailyHours>()
        let totalHours = 0
        let clockIn: any = null

        sortedEvents.forEach(event => {
          if (event.event_type === 'in') {
            // If we already have a clock-in without clock-out, save it as incomplete
            if (clockIn) {
              const inTime = new Date(clockIn.event_timestamp)
              const dateKey = formatInEasternTime(inTime, 'date')
              const clockInFormatted = formatInEasternTime(inTime, 'time')
              const dayNameET = formatInEasternTime(inTime, 'weekday')

              // Add incomplete shift to display
              dailyHoursMap.set(dateKey, {
                date: dateKey,
                day_name: dayNameET,
                clock_in: clockInFormatted,
                clock_out: null,
                hours_worked: 0,
                incomplete: true
              })
            }

            // Save this clock-in
            clockIn = event
          } else if (event.event_type === 'out' && clockIn) {
            // Convert UTC to Eastern Time
            const inTime = new Date(clockIn.event_timestamp)
            const outTime = new Date(event.event_timestamp)

            // Calculate hours
            const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)

            // Skip impossible shifts (over 16 hours) - likely data error
            if (hours > 16) {
              clockIn = null
              return
            }

            // Convert to Eastern Time using centralized dateUtils
            const dateKey = formatInEasternTime(inTime, 'date')
            const clockInFormatted = formatInEasternTime(inTime, 'time')
            const clockOutFormatted = formatInEasternTime(outTime, 'time')
            const dayNameET = formatInEasternTime(inTime, 'weekday')

            // Add or update daily hours
            if (dailyHoursMap.has(dateKey)) {
              const existing = dailyHoursMap.get(dateKey)!
              existing.hours_worked += hours
            } else {
              dailyHoursMap.set(dateKey, {
                date: dateKey,
                day_name: dayNameET,
                clock_in: clockInFormatted,
                clock_out: clockOutFormatted,
                hours_worked: hours,
                incomplete: false
              })
            }

            totalHours += hours
            clockIn = null
          } else if (event.event_type === 'out' && !clockIn) {
            // Orphan clock-out (OUT without IN) - silently skip for now
            // Could display these as incomplete shifts in the future
          }
        })

        // Handle final incomplete shift (last event was clock-in)
        if (clockIn) {
          const inTime = new Date(clockIn.event_timestamp)
          const dateKey = formatInEasternTime(inTime, 'date')
          const clockInFormatted = formatInEasternTime(inTime, 'time')
          const dayNameET = formatInEasternTime(inTime, 'weekday')

          // Add incomplete shift to display
          dailyHoursMap.set(dateKey, {
            date: dateKey,
            day_name: dayNameET,
            clock_in: clockInFormatted,
            clock_out: null,
            hours_worked: 0,
            incomplete: true
          })
        }

        // Convert map to sorted array
        const dailyHours = Array.from(dailyHoursMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        )

        return {
          employee_id: employee.id,
          employee_name: getDisplayName(employee),
          daily_hours: dailyHours,
          total_hours: totalHours
        }
      })

      // Sort by employee name
      employeeTimesheets.sort((a, b) => a.employee_name.localeCompare(b.employee_name))

      setTimesheets(employeeTimesheets)
    } catch (error) {
      console.error('Failed to load timesheets:', error)
      alert('Failed to load timesheets')
    } finally {
      setLoading(false)
    }
  }

  // Calculate date range string for display
  const getDateRangeString = () => {
    if (weekSelection === 'this') {
      const today = new Date()
      const start = startOfWeek(today, { weekStartsOn: 1 })
      const end = endOfWeek(today, { weekStartsOn: 1 })
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    } else if (weekSelection === 'last') {
      const lastWeek = subWeeks(new Date(), 1)
      const start = startOfWeek(lastWeek, { weekStartsOn: 1 })
      const end = endOfWeek(lastWeek, { weekStartsOn: 1 })
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    } else {
      if (!startDate || !endDate) return 'Select dates'
      return `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d, yyyy')}`
    }
  }

  return (
    <div className="fixed inset-0 w-full overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex-1 overflow-y-auto pb-8 pt-6 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 text-center">
            <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">
              Timesheets
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              {getDateRangeString()}
            </p>
          </div>

          {/* Week Selector */}
          <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 mb-6">
            <div className="flex flex-col gap-4">
              {/* Week Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 w-full">
                <button
                  onClick={() => setWeekSelection('this')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    weekSelection === 'this'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  This Week
                </button>
                <button
                  onClick={() => setWeekSelection('last')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    weekSelection === 'last'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  Last Week
                </button>
                <button
                  onClick={() => setWeekSelection('custom')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    weekSelection === 'custom'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  Custom Range
                </button>
              </div>

              {/* Custom Date Range Inputs */}
              {weekSelection === 'custom' && (
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-base font-semibold text-gray-600">Loading timesheets...</div>
            </div>
          )}

          {/* Timesheets Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timesheets.map(employeeSheet => (
                <div
                  key={employeeSheet.employee_id}
                  className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50"
                >
                  {/* Employee Name */}
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {employeeSheet.employee_name}
                  </h3>

                  {/* Daily Hours */}
                  {employeeSheet.daily_hours.length > 0 ? (
                    <div className="mb-4">
                      {employeeSheet.daily_hours.map((day, idx) => (
                        <div
                          key={day.date}
                          className={`py-2.5 flex justify-between ${
                            idx < employeeSheet.daily_hours.length - 1 ? 'border-b border-black/5' : ''
                          } ${day.incomplete ? 'bg-red-50 -mx-5 px-5 rounded' : ''}`}
                        >
                          <div>
                            <div className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                              {day.day_name}
                              {day.incomplete && (
                                <span className="text-red-500 text-xs">⚠️</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {format(parseISO(day.date), 'MMM do')}
                            </div>
                          </div>
                          <div className="text-right">
                            {day.incomplete ? (
                              <div>
                                <div className="font-semibold text-red-600 text-sm">
                                  Missing Clock-Out
                                </div>
                                <div className="text-xs text-red-500 mt-0.5">
                                  In: {day.clock_in}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-gray-800 text-sm">
                                  {formatHoursMinutes(day.hours_worked.toFixed(2))}
                                </div>
                                {day.clock_in && day.clock_out && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {day.clock_in} - {day.clock_out}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No hours worked
                    </div>
                  )}

                  {/* Total Hours */}
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-800 text-sm">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatHoursMinutes(employeeSheet.total_hours.toFixed(2))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && timesheets.length === 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-12 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 text-center">
              <p className="text-gray-500 text-base font-medium">
                No timesheet data available for this period
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
