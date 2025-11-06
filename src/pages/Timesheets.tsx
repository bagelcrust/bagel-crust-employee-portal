import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'

/**
 * TIMESHEETS V7 - EXPANDABLE TABLE (LIKE SCREENSHOT)
 *
 * Layout matches the reference screenshot:
 * - Collapsed: Employee summary row with totals
 * - Expanded: Individual day rows beneath employee
 * - Table columns: Date, Role, Wage rate, Time card, Issues, Scheduled hours, Total paid hours, Estimated wages
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
      // Randomly skip some days
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
    setEmployees(generateDummyData())
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
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">Timesheets</h1>
            <p className="text-sm text-slate-600 font-medium">{getDateRangeString()}</p>
          </div>

          {/* Week Selection */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 mb-6">
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

          {/* EXPANDABLE TABLE */}
          {!loading && employees.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">Role</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">Wage rate</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[180px]">Time card</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">Issues</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">Scheduled hours</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">Total paid hours</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">Estimated wages</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((emp, idx) => {
                      const isExpanded = expandedEmployees.has(emp.id)

                      return (
                        <>
                          {/* Employee Summary Row */}
                          <tr
                            key={emp.id}
                            className={`cursor-pointer hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                            onClick={() => toggleEmployee(emp.id)}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                )}
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                                  {emp.avatar}
                                </div>
                                <span className="font-semibold text-gray-900">{emp.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-gray-600 font-medium">{emp.totalTimeCards} Time Cards</span>
                            </td>
                            <td className="py-4 px-4"></td>
                            <td className="py-4 px-4"></td>
                            <td className="py-4 px-4"></td>
                            <td className="py-4 px-4 text-right text-gray-900 font-medium">{emp.totalScheduledHours.toFixed(2)}</td>
                            <td className="py-4 px-4 text-right text-gray-900 font-bold">{emp.totalPaidHours.toFixed(2)}</td>
                            <td className="py-4 px-4 text-right text-gray-900 font-bold">${emp.totalEstimatedWages.toFixed(2)}</td>
                          </tr>

                          {/* Expanded Day Rows */}
                          {isExpanded && emp.days.map((day, dayIdx) => (
                            <tr key={`${emp.id}-${dayIdx}`} className="bg-white border-t border-gray-100">
                              <td className="py-3 px-4 pl-16 text-gray-700">{day.date}</td>
                              <td className="py-3 px-4 text-gray-600">{day.role || '--'}</td>
                              <td className="py-3 px-4 text-gray-700">${day.wageRate.toFixed(2)}/hr</td>
                              <td className="py-3 px-4 text-gray-700">{day.clockIn} - {day.clockOut}</td>
                              <td className="py-3 px-4 text-gray-600">{day.issues || '--'}</td>
                              <td className="py-3 px-4 text-right text-gray-700">{day.scheduledHours.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right text-gray-900 font-semibold">{day.totalPaidHours.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right text-gray-900 font-semibold">${day.estimatedWages.toFixed(2)}</td>
                            </tr>
                          ))}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && employees.length === 0 && (
            <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500 text-base font-medium">No timesheet data available for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
