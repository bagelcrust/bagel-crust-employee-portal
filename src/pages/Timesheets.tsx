import { useState, useEffect } from 'react'
import { timeclockApi, employeeApi, getDisplayName } from '../supabase/supabase'
import { format, startOfWeek, endOfWeek, subWeeks, parseISO } from 'date-fns'
import { formatHoursMinutes } from '../lib/employeeUtils'
import { formatInEasternTime } from '../lib/dateUtils'
import { ChevronDown, ChevronRight } from 'lucide-react'

/**
 * MANAGER/ADMIN TIMESHEETS PAGE - EXPANDABLE LIST (V5)
 *
 * ✅ Compact collapsed view (name + total)
 * ✅ Click to expand details
 * ✅ Progressive disclosure - clean minimalist
 * ✅ Best for scanning summary, expanding when needed
 */

interface DailyHours {
  date: string
  day_name: string
  clock_in: string | null
  clock_out: string | null
  hours_worked: number
  incomplete?: boolean
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
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())

  useEffect(() => {
    document.title = 'Bagel Crust - Timesheets'
  }, [])

  useEffect(() => {
    loadTimesheets()
  }, [weekSelection, startDate, endDate])

  const loadTimesheets = async () => {
    setLoading(true)
    try {
      let rangeStart: Date
      let rangeEnd: Date

      if (weekSelection === 'this') {
        const today = new Date()
        rangeStart = startOfWeek(today, { weekStartsOn: 1 })
        rangeEnd = endOfWeek(today, { weekStartsOn: 1 })
      } else if (weekSelection === 'last') {
        const lastWeek = subWeeks(new Date(), 1)
        rangeStart = startOfWeek(lastWeek, { weekStartsOn: 1 })
        rangeEnd = endOfWeek(lastWeek, { weekStartsOn: 1 })
      } else {
        if (!startDate || !endDate) {
          setLoading(false)
          return
        }
        rangeStart = new Date(startDate)
        rangeEnd = new Date(endDate)
        rangeEnd.setHours(23, 59, 59, 999)
      }

      const employees = await employeeApi.getAll()
      const allEvents = await timeclockApi.getRecentEvents(5000)

      const eventsInRange = allEvents.filter(event => {
        const eventDate = new Date(event.event_timestamp)
        return eventDate >= rangeStart && eventDate <= rangeEnd
      })

      const employeeTimesheets: EmployeeTimesheet[] = employees.map(employee => {
        const employeeEvents = eventsInRange.filter(e => e.employee_id === employee.id)
        const sortedEvents = employeeEvents.sort((a, b) =>
          new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
        )

        const dailyHoursMap = new Map<string, DailyHours>()
        let totalHours = 0
        let clockIn: any = null

        sortedEvents.forEach(event => {
          if (event.event_type === 'in') {
            if (clockIn) {
              const inTime = new Date(clockIn.event_timestamp)
              const dateKey = formatInEasternTime(inTime, 'date')
              const clockInFormatted = formatInEasternTime(inTime, 'time')
              const dayNameET = formatInEasternTime(inTime, 'weekday')

              dailyHoursMap.set(dateKey, {
                date: dateKey,
                day_name: dayNameET,
                clock_in: clockInFormatted,
                clock_out: null,
                hours_worked: 0,
                incomplete: true
              })
            }
            clockIn = event
          } else if (event.event_type === 'out' && clockIn) {
            const inTime = new Date(clockIn.event_timestamp)
            const outTime = new Date(event.event_timestamp)
            const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)

            if (hours > 16) {
              clockIn = null
              return
            }

            const dateKey = formatInEasternTime(inTime, 'date')
            const clockInFormatted = formatInEasternTime(inTime, 'time')
            const clockOutFormatted = formatInEasternTime(outTime, 'time')
            const dayNameET = formatInEasternTime(inTime, 'weekday')

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
          }
        })

        if (clockIn) {
          const inTime = new Date(clockIn.event_timestamp)
          const dateKey = formatInEasternTime(inTime, 'date')
          const clockInFormatted = formatInEasternTime(inTime, 'time')
          const dayNameET = formatInEasternTime(inTime, 'weekday')

          dailyHoursMap.set(dateKey, {
            date: dateKey,
            day_name: dayNameET,
            clock_in: clockInFormatted,
            clock_out: null,
            hours_worked: 0,
            incomplete: true
          })
        }

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

      employeeTimesheets.sort((a, b) => a.employee_name.localeCompare(b.employee_name))
      setTimesheets(employeeTimesheets)
    } catch (error) {
      console.error('Failed to load timesheets:', error)
      alert('Failed to load timesheets')
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="fixed inset-0 w-full overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex-1 overflow-y-auto pb-8 pt-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">Timesheets</h1>
            <p className="text-sm text-slate-600 font-medium">{getDateRangeString()}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1 w-full">
                <button onClick={() => setWeekSelection('this')} className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${weekSelection === 'this' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`} type="button">This Week</button>
                <button onClick={() => setWeekSelection('last')} className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${weekSelection === 'last' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`} type="button">Last Week</button>
                <button onClick={() => setWeekSelection('custom')} className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${weekSelection === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`} type="button">Custom Range</button>
              </div>

              {weekSelection === 'custom' && (
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-base font-semibold text-gray-600">Loading timesheets...</div>
            </div>
          )}

          {/* EXPANDABLE LIST */}
          {!loading && timesheets.length > 0 && (
            <div className="space-y-2">
              {timesheets.map(employeeSheet => {
                const isExpanded = expandedEmployees.has(employeeSheet.employee_id)
                const hasIncomplete = employeeSheet.daily_hours.some(d => d.incomplete)

                return (
                  <div key={employeeSheet.employee_id} className="bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
                    {/* Collapsed Summary (Always Visible) */}
                    <button
                      onClick={() => toggleEmployee(employeeSheet.employee_id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                        <div className="text-left">
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {employeeSheet.employee_name}
                            {hasIncomplete && (
                              <span className="text-red-500 text-xs">⚠️</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{employeeSheet.daily_hours.length} days worked</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 font-semibold">Total</div>
                        <div className="text-xl font-bold text-blue-600">{formatHoursMinutes(employeeSheet.total_hours.toFixed(2))}</div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        {employeeSheet.daily_hours.length > 0 ? (
                          <div className="space-y-2 mt-3">
                            {employeeSheet.daily_hours.map(day => (
                              <div key={day.date} className={`p-3 rounded-lg flex justify-between items-center ${day.incomplete ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                                <div>
                                  <div className="font-semibold text-gray-800 flex items-center gap-1">
                                    {day.day_name}
                                    {day.incomplete && <span className="text-red-500 text-xs">⚠️</span>}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">{format(parseISO(day.date), 'MMM do')}</div>
                                  {!day.incomplete && day.clock_in && day.clock_out && (
                                    <div className="text-xs text-gray-500 mt-1">{day.clock_in} - {day.clock_out}</div>
                                  )}
                                  {day.incomplete && day.clock_in && (
                                    <div className="text-xs text-red-500 mt-1">In: {day.clock_in} (Missing OUT)</div>
                                  )}
                                </div>
                                <div className={`text-lg font-bold ${day.incomplete ? 'text-red-600' : 'text-blue-600'}`}>
                                  {day.incomplete ? 'Incomplete' : formatHoursMinutes(day.hours_worked.toFixed(2))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-400 text-sm">No hours worked</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!loading && timesheets.length === 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-12 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 text-center">
              <p className="text-gray-500 text-base font-medium">No timesheet data available for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
