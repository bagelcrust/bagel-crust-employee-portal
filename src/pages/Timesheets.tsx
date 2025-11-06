import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'

/**
 * TIMESHEETS V10 - MINIMALIST CLEAN
 *
 * Same foundational structure as V8, but with:
 * - Shadow cards instead of borders
 * - More white space and breathing room
 * - Softer, cleaner aesthetic
 * - No heavy borders, lighter dividers
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

// Generate dummy data
const generateDummyData = (): EmployeeTimesheet[] => {
  const employees = [
    { id: '1', name: 'Angie Martinez', avatar: '👩‍🍳', role: 'Manager', wageRate: 22.00 },
    { id: '2', name: 'Juan Garcia', avatar: '👨‍🍳', role: 'Baker', wageRate: 18.50 },
    { id: '3', name: 'Carlos Martinez', avatar: '👨', role: 'Counter Staff', wageRate: 16.00 },
    { id: '4', name: 'Maria Lopez', avatar: '👩', role: 'Baker', wageRate: 18.00 },
    { id: '5', name: 'Emerson Silva', avatar: '👨', role: 'Counter Staff', wageRate: 15.50 },
    { id: '6', name: 'Sofia Chen', avatar: '👩', role: 'Baker', wageRate: 17.50 }
  ]

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return employees.map((emp) => {
    const days: DayRecord[] = []

    daysInWeek.forEach((day) => {
      if (Math.random() < 0.3) return

      const clockInHour = 6 + Math.floor(Math.random() * 2)
      const clockInMinute = Math.floor(Math.random() * 60)
      const clockOutHour = 14 + Math.floor(Math.random() * 4)
      const clockOutMinute = Math.floor(Math.random() * 60)

      const clockIn = `${clockInHour}:${clockInMinute.toString().padStart(2, '0')}am`
      const clockOut = `${clockOutHour > 12 ? clockOutHour - 12 : clockOutHour}:${clockOutMinute.toString().padStart(2, '0')}pm`

      const hoursWorked = (clockOutHour + clockOutMinute / 60) - (clockInHour + clockInMinute / 60)
      const estimatedWages = hoursWorked * emp.wageRate

      days.push({
        date: format(day, 'EEE MMM d'),
        dayName: format(day, 'EEEE'),
        role: emp.role,
        wageRate: emp.wageRate,
        clockIn,
        clockOut,
        scheduledHours: 0,
        totalPaidHours: parseFloat(hoursWorked.toFixed(2)),
        estimatedWages: parseFloat(estimatedWages.toFixed(2)),
        issues: null
      })
    })

    const totalPaidHours = days.reduce((sum, day) => sum + day.totalPaidHours, 0)
    const totalEstimatedWages = days.reduce((sum, day) => sum + day.estimatedWages, 0)

    return {
      id: emp.id,
      name: emp.name,
      avatar: emp.avatar,
      days,
      totalTimeCards: days.length,
      totalScheduledHours: 0,
      totalPaidHours: parseFloat(totalPaidHours.toFixed(2)),
      totalEstimatedWages: parseFloat(totalEstimatedWages.toFixed(2))
    }
  })
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
    await new Promise(resolve => setTimeout(resolve, 500))
    const data = generateDummyData()
    setEmployees(data)
    setExpandedEmployees(new Set(data.map(emp => emp.id)))
    setLoading(false)
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
                          <div className="font-bold text-base text-gray-900 truncate">{emp.name}</div>
                          <div className="text-xs text-gray-400">{emp.totalTimeCards} time cards</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-xs text-gray-400 mb-0.5">Total</div>
                        <div className="font-bold text-lg text-blue-600">{emp.totalPaidHours.toFixed(1)}h</div>
                        <div className="font-bold text-sm text-green-600">${emp.totalEstimatedWages.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Expanded Day Details */}
                    {isExpanded && (
                      <div className="bg-gray-50 px-4 pb-4 pt-2">
                        {emp.days.map((day, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-3 mb-2 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="font-bold text-sm text-gray-900 mb-1">{day.date}</div>
                                <div className="text-xs text-gray-500 mb-1">{day.role}</div>
                                <div className="text-xs text-gray-400">{day.clockIn} - {day.clockOut}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-base text-gray-900 mb-0.5">{day.totalPaidHours.toFixed(1)}h</div>
                                <div className="text-sm font-semibold text-green-600">${day.estimatedWages.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Clean Footer */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm text-gray-600">Week Total</span>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-base text-blue-600">{emp.totalPaidHours.toFixed(1)}h</span>
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
