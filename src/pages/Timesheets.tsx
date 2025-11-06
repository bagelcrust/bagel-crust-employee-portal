import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns'

/**
 * TIMESHEETS V6 - DENSE SPREADSHEET
 *
 * Full-width table showing:
 * - Employee name, role, pay rate
 * - 7 days with clock in/out times
 * - Issues/warnings
 * - Total hours & estimated wages
 */

// Dummy data structure
interface DayData {
  date: string
  dayName: string
  clockIn: string | null
  clockOut: string | null
  hours: number
  hasIssue: boolean
  issueText?: string
}

interface EmployeeRow {
  id: string
  name: string
  role: string
  payRate: number
  days: DayData[]
  totalHours: number
  estimatedWages: number
}

// Generate dummy data
const generateDummyData = (): EmployeeRow[] => {
  const employees = [
    { id: '1', name: 'Juan Garcia', role: 'Baker', payRate: 18.50 },
    { id: '2', name: 'Carlos Martinez', role: 'Counter Staff', payRate: 16.00 },
    { id: '3', name: 'Angie Rodriguez', role: 'Manager', payRate: 22.00 },
    { id: '4', name: 'Maria Lopez', role: 'Baker', payRate: 18.00 },
    { id: '5', name: 'Emerson Silva', role: 'Counter Staff', payRate: 15.50 },
    { id: '6', name: 'Sofia Chen', role: 'Baker', payRate: 17.50 },
    { id: '7', name: 'Luis Mendez', role: 'Prep Cook', payRate: 16.50 },
    { id: '8', name: 'Isabella Rossi', role: 'Counter Staff', payRate: 15.00 }
  ]

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return employees.map((emp, idx) => {
    const days = daysInWeek.map((day, dayIdx) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayName = format(day, 'EEE')

      // Randomly skip some days
      if (Math.random() < 0.2) {
        return {
          date: dateStr,
          dayName,
          clockIn: null,
          clockOut: null,
          hours: 0,
          hasIssue: false
        }
      }

      // Some days have missing clock out
      const hasMissingOut = Math.random() < 0.1
      const clockIn = `${6 + Math.floor(Math.random() * 3)}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}am`
      const clockOut = hasMissingOut ? null : `${2 + Math.floor(Math.random() * 3)}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}pm`
      const hours = hasMissingOut ? 0 : 6 + Math.random() * 3

      return {
        date: dateStr,
        dayName,
        clockIn,
        clockOut,
        hours,
        hasIssue: hasMissingOut,
        issueText: hasMissingOut ? 'Missing clock out' : undefined
      }
    })

    const totalHours = days.reduce((sum, day) => sum + day.hours, 0)
    const estimatedWages = totalHours * emp.payRate

    return {
      ...emp,
      days,
      totalHours,
      estimatedWages
    }
  })
}

export default function Timesheets() {
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    setEmployees(generateDummyData())
    setLoading(false)
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

  const daysOfWeek = employees[0]?.days.map(d => d.dayName) || []

  return (
    <div className="fixed inset-0 w-full overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex-1 overflow-y-auto pb-8 pt-6 px-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">Timesheets</h1>
            <p className="text-sm text-slate-600 font-medium">{getDateRangeString()}</p>
          </div>

          {/* Week Selection */}
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

          {/* DENSE SPREADSHEET TABLE */}
          {!loading && employees.length > 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <th className="text-left py-3 px-3 font-bold sticky left-0 bg-blue-600 z-10 min-w-[140px]">Employee</th>
                      <th className="text-left py-3 px-3 font-semibold min-w-[100px]">Role</th>
                      <th className="text-center py-3 px-3 font-semibold min-w-[70px]">Pay Rate</th>
                      {daysOfWeek.map((day, idx) => (
                        <th key={idx} className="text-center py-3 px-3 font-semibold min-w-[110px]">{day}</th>
                      ))}
                      <th className="text-center py-3 px-3 font-semibold min-w-[80px]">Total Hrs</th>
                      <th className="text-center py-3 px-3 font-semibold min-w-[100px]">Est. Wages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, idx) => (
                      <tr key={emp.id} className={`border-b border-gray-200 hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        {/* Employee Name */}
                        <td className="py-3 px-3 font-bold text-gray-900 sticky left-0 bg-inherit z-10">{emp.name}</td>

                        {/* Role */}
                        <td className="py-3 px-3 text-gray-700">{emp.role}</td>

                        {/* Pay Rate */}
                        <td className="py-3 px-3 text-center font-semibold text-green-700">${emp.payRate.toFixed(2)}</td>

                        {/* Days of Week */}
                        {emp.days.map((day, dayIdx) => (
                          <td key={dayIdx} className="py-2 px-2 text-center align-top">
                            {day.clockIn ? (
                              <div className={`rounded-lg p-2 ${day.hasIssue ? 'bg-red-50 border border-red-300' : 'bg-blue-50 border border-blue-200'}`}>
                                <div className="text-[10px] text-gray-600 font-semibold mb-1">IN: {day.clockIn}</div>
                                {day.clockOut ? (
                                  <>
                                    <div className="text-[10px] text-gray-600 font-semibold mb-1">OUT: {day.clockOut}</div>
                                    <div className="text-xs font-bold text-blue-700">{day.hours.toFixed(1)}h</div>
                                  </>
                                ) : (
                                  <div className="text-[10px] text-red-600 font-bold">⚠️ Missing OUT</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-300 text-xs">—</div>
                            )}
                          </td>
                        ))}

                        {/* Total Hours */}
                        <td className="py-3 px-3 text-center font-bold text-blue-700 text-base">
                          {emp.totalHours.toFixed(1)}h
                        </td>

                        {/* Estimated Wages */}
                        <td className="py-3 px-3 text-center font-bold text-green-700 text-base">
                          ${emp.estimatedWages.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && employees.length === 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-12 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 text-center">
              <p className="text-gray-500 text-base font-medium">No timesheet data available for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
