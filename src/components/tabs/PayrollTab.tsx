/**
 * PayrollTab - Full employee payroll view (Owner only)
 * Displays all employees' hours and wages for the selected week
 */

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { ChevronDown, ChevronRight, DollarSign } from 'lucide-react'
import { getDisplayName } from '../../supabase/supabase'
import { getEmployees, getClockEventsInRange, getPayRates } from '../../supabase/edgeFunctions'
import { formatHoursMinutes } from '../../lib/employeeUtils'

interface EmployeePayroll {
  id: string
  name: string
  role: string
  totalHours: number
  hourlyRate: number
  totalPay: number
  hasIncompleteShifts: boolean
}

export function PayrollTab() {
  const [loading, setLoading] = useState(true)
  const [weekSelection, setWeekSelection] = useState<'this' | 'last'>('this')
  const [employees, setEmployees] = useState<EmployeePayroll[]>([])
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPayrollData()
  }, [weekSelection])

  const loadPayrollData = async () => {
    setLoading(true)
    try {
      // Determine date range in Eastern Time
      const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      const todayET = new Date(nowET)
      const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
      const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
      const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
      const startDateET = format(mondayET, 'yyyy-MM-dd')
      const endDateET = format(sundayET, 'yyyy-MM-dd')

      // Fetch data in parallel
      const [employeesData, eventsInRange, payRatesData] = await Promise.all([
        getEmployees(),
        getClockEventsInRange(startDateET, endDateET, undefined, true),
        getPayRates()
      ])

      // Create pay rates map
      const payRatesMap = new Map<string, number>()
      payRatesData.forEach((rate: any) => {
        payRatesMap.set(rate.employee_id, parseFloat(rate.rate.toString()))
      })

      // Process each employee
      const payrollData: EmployeePayroll[] = employeesData
        .map((employee: any) => {
          const employeeEvents = eventsInRange.filter((e: any) => e.employee_id === employee.id)
          const sortedEvents = employeeEvents.sort((a: any, b: any) =>
            new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
          )

          let totalHours = 0
          let hasIncompleteShifts = false
          let clockIn: any | null = null

          // Calculate hours from clock in/out pairs
          sortedEvents.forEach((event: any) => {
            if (event.event_type === 'in') {
              if (clockIn) {
                hasIncompleteShifts = true // Previous clock-in without clock-out
              }
              clockIn = event
            } else if (event.event_type === 'out' && clockIn) {
              const inTime = new Date(clockIn.event_timestamp)
              const outTime = new Date(event.event_timestamp)
              const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)
              totalHours += hours
              clockIn = null
            }
          })

          // If there's an unclosed clock-in, mark as incomplete
          if (clockIn) {
            hasIncompleteShifts = true
          }

          const hourlyRate = payRatesMap.get(employee.id) || 0
          const totalPay = totalHours * hourlyRate

          return {
            id: employee.id,
            name: getDisplayName(employee),
            role: employee.role || 'Staff',
            totalHours,
            hourlyRate,
            totalPay,
            hasIncompleteShifts
          }
        })
        .filter((emp: EmployeePayroll) => emp.totalHours > 0 || emp.hasIncompleteShifts) // Only show employees with hours
        .sort((a: EmployeePayroll, b: EmployeePayroll) => b.totalPay - a.totalPay) // Sort by highest pay first

      setEmployees(payrollData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      setLoading(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees)
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId)
    } else {
      newExpanded.add(employeeId)
    }
    setExpandedEmployees(newExpanded)
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + emp.totalPay, 0)
  const totalHoursAll = employees.reduce((sum, emp) => sum + emp.totalHours, 0)

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-7 h-7 text-green-600" />
        <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">
          Payroll
        </h2>
      </div>

      {/* Week Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-full">
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
      </div>

      {loading ? (
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          Loading payroll data...
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          No hours recorded for {weekSelection === 'this' ? 'this' : 'last'} week
        </div>
      ) : (
        <div>
          {/* Employee List */}
          <div className="rounded-lg overflow-hidden mb-4">
            {employees.map((employee, idx) => (
              <div key={employee.id}>
                <div
                  className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50/50 transition-colors ${
                    idx < employees.length - 1 ? 'border-b border-black/5' : ''
                  }`}
                  onClick={() => toggleEmployee(employee.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {expandedEmployees.has(employee.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <div className="font-semibold text-gray-800 text-[15px]">
                        {employee.name}
                      </div>
                      <div className="text-[13px] text-gray-400 mt-0.5">
                        {formatHoursMinutes(employee.totalHours)} @ ${employee.hourlyRate.toFixed(2)}/hr
                        {employee.hasIncompleteShifts && (
                          <span className="ml-2 text-orange-600">⚠️ Incomplete</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 text-[16px]">
                      ${employee.totalPay.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedEmployees.has(employee.id) && (
                  <div className="bg-gray-50/50 px-4 py-3 border-b border-black/5">
                    <div className="text-[13px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="text-gray-800 font-medium">{employee.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hours Worked:</span>
                        <span className="text-gray-800 font-medium">{formatHoursMinutes(employee.totalHours)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hourly Rate:</span>
                        <span className="text-gray-800 font-medium">${employee.hourlyRate.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                        <span className="text-gray-800 font-semibold">Total Pay:</span>
                        <span className="text-green-600 font-bold">${employee.totalPay.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 bg-green-600/10 rounded-lg border border-green-600/20">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700 text-[15px]">
                {employees.length} Employee{employees.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[14px] text-gray-600">
                {formatHoursMinutes(totalHoursAll)} total
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">
                Total Payroll
              </span>
              <span className="text-2xl font-bold text-green-600">
                ${totalPayroll.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
