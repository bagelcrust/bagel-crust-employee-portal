import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { employeeApi, timeclockApi, payRatesApi, getDisplayName, type TimeEntry } from '../supabase/supabase'
import { formatInEasternTime } from '../lib/dateUtils'
import { formatHoursMinutes } from '../lib/employeeUtils'

/**
 * TIMESHEETS V10 - MINIMALIST CLEAN (WITH REAL DATA)
 *
 * Connected to Supabase:
 * - Fetches real employees, time entries, and pay rates
 * - Calculates hours worked from clock in/out events
 * - Detects incomplete shifts (missing clock out)
 * - Displays in Eastern Time
 * - Shadow cards, clean aesthetic
 */

interface DayRecord {
  date: string
  dayName: string
  role: string
  wageRate: number
  clockIn: string | null
  clockOut: string | null
  scheduledHours: number
  totalPaidHours: number
  estimatedWages: number
  issues: string | null
}

interface EmployeeTimesheet {
  id: string
  name: string
  avatar: string
  days: DayRecord[]
  totalTimeCards: number
  totalScheduledHours: number
  totalPaidHours: number
  totalEstimatedWages: number
}

// Get emoji avatar based on role
const getAvatarForRole = (role: string): string => {
  const roleLower = role.toLowerCase()
  if (roleLower.includes('owner')) return '👑'
  if (roleLower.includes('manager')) return '👨‍💼'
  if (roleLower.includes('staff')) return '👨‍🍳'
  if (roleLower.includes('cashier')) return '💰'
  return '👤'
}

export default function Timesheets() {
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeTimesheet[]>([])
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())
  const [weekSelection, setWeekSelection] = useState<'this' | 'last' | 'custom'>('this')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    document.title = 'Bagel Crust - Timesheets'
  }, [])

  useEffect(() => {
    loadTimesheets()
  }, [weekSelection, startDate, endDate])

  const loadTimesheets = async () => {
    setLoading(true)
    try {
      // Determine date range (using Eastern Time dates - YYYY-MM-DD format)
      let startDateET: string
      let endDateET: string

      if (weekSelection === 'this') {
        // Get current week in Eastern Time
        // IMPORTANT: We need to get today's date in ET first, not UTC
        const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
        const todayET = new Date(nowET)
        const mondayET = startOfWeek(todayET, { weekStartsOn: 1 })
        const sundayET = endOfWeek(todayET, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(sundayET, 'yyyy-MM-dd')
      } else if (weekSelection === 'last') {
        // Get last week in Eastern Time
        const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
        const todayET = new Date(nowET)
        const lastWeek = subWeeks(todayET, 1)
        const mondayET = startOfWeek(lastWeek, { weekStartsOn: 1 })
        const sundayET = endOfWeek(lastWeek, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(sundayET, 'yyyy-MM-dd')
      } else {
        if (!startDate || !endDate) {
          setLoading(false)
          return
        }
        startDateET = startDate
        endDateET = endDate
      }

      // Fetch all data in parallel using timezone-aware API
      const [employeesData, eventsInRange, payRatesData] = await Promise.all([
        employeeApi.getAll(),
        timeclockApi.getEventsInRangeET(startDateET, endDateET),
        payRatesApi.getAll()
      ])

      // Create pay rates map
      const payRatesMap = new Map<string, number>()
      payRatesData.forEach(rate => {
        payRatesMap.set(rate.employee_id, parseFloat(rate.rate.toString()))
      })

      // Process each employee
      const employeeTimesheets: EmployeeTimesheet[] = employeesData.map(employee => {
        const employeeEvents = eventsInRange.filter(e => e.employee_id === employee.id)
        const sortedEvents: TimeEntry[] = employeeEvents.sort((a, b) =>
          new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
        ) as TimeEntry[]

        const dailyHoursMap = new Map<string, DayRecord>()
        let totalHours = 0
        let clockIn: TimeEntry | null = null
        // NOTE: wageRate defaults to 0 if no rate found; employee.role is guaranteed non-null
        const wageRate = payRatesMap.get(employee.id) || 0
        const employeeRole = employee.role || 'Unknown'

        // Process events to calculate hours
        sortedEvents.forEach((event: TimeEntry) => {
          if (event.event_type === 'in') {
            // If there's already a clock in without a clock out, record it as incomplete
            if (clockIn) {
              const inTime = new Date(clockIn.event_timestamp)
              const dateKey = formatInEasternTime(inTime, 'date')
              const clockInFormatted = formatInEasternTime(inTime, 'time')
              const dayNameET = formatInEasternTime(inTime, 'weekday')

              // Ensure dateKey and clockInFormatted are non-null before using
              if (dateKey && clockInFormatted && dayNameET) {
                dailyHoursMap.set(dateKey, {
                  date: dateKey,
                  dayName: dayNameET,
                  role: employeeRole,
                  wageRate,
                  clockIn: clockInFormatted,
                  clockOut: null,
                  scheduledHours: 0,
                  totalPaidHours: 0,
                  estimatedWages: 0,
                  issues: 'Missing clock out'
                })
              }
            }
            clockIn = event
          } else if (event.event_type === 'out' && clockIn) {
            const inTime = new Date(clockIn.event_timestamp)
            const outTime = new Date(event.event_timestamp)
            const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)

            // Skip if hours > 16 (likely error)
            if (hours > 16) {
              clockIn = null
              return
            }

            const dateKey = formatInEasternTime(inTime, 'date')
            const clockInFormatted = formatInEasternTime(inTime, 'time')
            const clockOutFormatted = formatInEasternTime(outTime, 'time')
            const dayNameET = formatInEasternTime(inTime, 'weekday')

            // Ensure all formatted values are valid before using
            if (!dateKey || !clockInFormatted || !clockOutFormatted || !dayNameET) {
              clockIn = null
              return
            }

            if (dailyHoursMap.has(dateKey)) {
              const existing = dailyHoursMap.get(dateKey)
              if (existing) {
                existing.totalPaidHours += hours
                existing.estimatedWages = existing.totalPaidHours * wageRate
              }
            } else {
              dailyHoursMap.set(dateKey, {
                date: dateKey,
                dayName: dayNameET,
                role: employeeRole,
                wageRate,
                clockIn: clockInFormatted,
                clockOut: clockOutFormatted,
                scheduledHours: 0,
                totalPaidHours: hours,
                estimatedWages: hours * wageRate,
                issues: null
              })
            }

            totalHours += hours
            clockIn = null
          }
        })

        // Handle final unclosed clock in
        if (clockIn) {
          const finalClockIn: TimeEntry = clockIn
          const inTime = new Date(finalClockIn.event_timestamp)
          const dateKey = formatInEasternTime(inTime, 'date')
          const clockInFormatted = formatInEasternTime(inTime, 'time')
          const dayNameET = formatInEasternTime(inTime, 'weekday')

          // Only set if all values are valid
          if (dateKey && clockInFormatted && dayNameET) {
            dailyHoursMap.set(dateKey, {
              date: dateKey,
              dayName: dayNameET,
              role: employeeRole,
              wageRate,
              clockIn: clockInFormatted,
              clockOut: null,
              scheduledHours: 0,
              totalPaidHours: 0,
              estimatedWages: 0,
              issues: 'Missing clock out'
            })
          }
        }

        const dailyHours = Array.from(dailyHoursMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        )

        return {
          id: employee.id,
          name: getDisplayName(employee),
          avatar: getAvatarForRole(employeeRole),
          days: dailyHours,
          totalTimeCards: dailyHours.length,
          totalScheduledHours: 0,
          totalPaidHours: totalHours,
          totalEstimatedWages: totalHours * wageRate
        }
      })

      // Sort by name
      employeeTimesheets.sort((a, b) => a.name.localeCompare(b.name))

      // Auto-expand all
      setEmployees(employeeTimesheets)
      setExpandedEmployees(new Set(employeeTimesheets.map(emp => emp.id)))
    } catch (error) {
      console.error('Failed to load timesheets:', error)
      alert('Failed to load timesheets')
    } finally {
      setLoading(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId)
      } else {
        newSet.add(employeeId)
      }
      return newSet
    })
  }

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
    <div className="fixed inset-0 w-full overflow-hidden flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto pb-8 pt-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Timesheets</h1>
            <p className="text-sm text-slate-600 font-medium">{getDateRangeString()}</p>
          </div>

          {/* Week Selection */}
          <div className="bg-white rounded-xl p-4 shadow-md mb-6">
            <div className="flex flex-col gap-3">
              <div className="flex bg-gray-50 rounded-lg p-1 w-full">
                <button onClick={() => setWeekSelection('this')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${weekSelection === 'this' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`} type="button">This Week</button>
                <button onClick={() => setWeekSelection('last')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${weekSelection === 'last' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`} type="button">Last Week</button>
                <button onClick={() => setWeekSelection('custom')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${weekSelection === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`} type="button">Custom</button>
              </div>

              {weekSelection === 'custom' && (
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">Start</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block mb-1">End</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <div className="text-sm font-semibold text-gray-600">Loading...</div>
            </div>
          )}

          {/* MINIMALIST EXPANDABLE LIST */}
          {!loading && employees.length > 0 && (
            <div className="space-y-4">
              {employees.map((emp) => {
                const isExpanded = expandedEmployees.has(emp.id)
                const hasIssues = emp.days.some(d => d.issues)

                return (
                  <div key={emp.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                    {/* Employee Summary Row */}
                    <div
                      onClick={() => toggleEmployee(emp.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                          {emp.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base text-gray-900 truncate flex items-center gap-2">
                            {emp.name}
                            {hasIssues && <span className="text-red-500 text-xs">⚠️</span>}
                          </div>
                          <div className="text-xs text-gray-400">{emp.totalTimeCards} time cards</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-xs text-gray-400 mb-0.5">Total</div>
                        <div className="font-bold text-lg text-blue-600">{formatHoursMinutes(emp.totalPaidHours.toFixed(2))}</div>
                        <div className="font-bold text-sm text-green-600">${emp.totalEstimatedWages.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Expanded Day Details */}
                    {isExpanded && (
                      <div className="bg-gray-50 px-4 pb-4 pt-2">
                        {emp.days.map((day, idx) => (
                          <div
                            key={idx}
                            className={`bg-white rounded-xl p-3 mb-2 shadow-sm hover:shadow-md transition-shadow ${
                              day.issues ? 'border-2 border-red-300' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="font-bold text-sm text-gray-900 mb-1 flex items-center gap-2">
                                  {day.dayName}
                                  {day.issues && <span className="text-red-500 text-xs">⚠️</span>}
                                </div>
                                <div className="text-xs text-gray-500 mb-1">{day.date}</div>
                                <div className="text-xs text-gray-400">
                                  {day.clockIn && (
                                    <>
                                      {day.clockIn}
                                      {day.clockOut ? ` - ${day.clockOut}` : ' (Missing OUT)'}
                                    </>
                                  )}
                                </div>
                                {day.issues && (
                                  <div className="text-xs text-red-600 font-semibold mt-1">{day.issues}</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className={`font-bold text-base mb-0.5 ${day.issues ? 'text-red-600' : 'text-gray-900'}`}>
                                  {day.issues ? 'Incomplete' : formatHoursMinutes(day.totalPaidHours.toFixed(2))}
                                </div>
                                {!day.issues && (
                                  <div className="text-sm font-semibold text-green-600">${day.estimatedWages.toFixed(2)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Clean Footer */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm text-gray-600">Week Total</span>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-base text-blue-600">{formatHoursMinutes(emp.totalPaidHours.toFixed(2))}</span>
                              <span className="font-bold text-base text-green-600">${emp.totalEstimatedWages.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!loading && employees.length === 0 && (
            <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
              <p className="text-gray-500 text-sm font-medium">No timesheet data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
