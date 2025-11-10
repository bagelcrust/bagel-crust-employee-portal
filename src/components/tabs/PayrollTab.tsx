/**
 * PayrollTab - Simplified payroll management (Owner only)
 *
 * Workflow:
 * 1. Review employee hours throughout the week (This Week view)
 * 2. On Monday, review Last Week and finalize each employee after paying them
 * 3. Once finalized, employee card shows PAID badge and becomes read-only
 */

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { DollarSign, CheckCircle } from 'lucide-react'
import { getDisplayName, supabase } from '../../supabase/supabase'
import { getEmployees, getClockEventsInRange, getPayRates } from '../../supabase/edgeFunctions'
import { formatHoursMinutes } from '../../lib/employeeUtils'

interface WorkedShift {
  date: string
  dayName: string
  clockIn: string
  clockOut: string | null
  hoursWorked: number
  isIncomplete?: boolean
}

interface PayRateArrangement {
  id: number
  rate: number
  payment_method: string
  pay_schedule: string | null
  tax_classification: string | null
}

interface EmployeePayroll {
  id: string
  name: string
  role: string
  totalHours: number
  hasIncompleteShifts: boolean
  workedShifts: WorkedShift[]
  payrollRecordId?: number
  isPaid: boolean
  payRateArrangements: PayRateArrangement[]
  selectedArrangement?: PayRateArrangement
  paidArrangements: Map<number, { hours: number; pay: number }> // Track paid arrangements
  paymentMethod?: string
  paymentDate?: string
  // Computed from selectedArrangement
  hourlyRate?: number
  totalPay?: number
}

export function PayrollTab() {
  const [loading, setLoading] = useState(true)
  const [weekSelection, setWeekSelection] = useState<'this' | 'last' | 'lastPayPeriod'>('last') // Default to last week
  const [employees, setEmployees] = useState<EmployeePayroll[]>([])
  const [finalizingEmployee, setFinalizingEmployee] = useState<string | null>(null)

  useEffect(() => {
    loadPayrollData()
  }, [weekSelection])

  const loadPayrollData = async () => {
    setLoading(true)
    try {
      // Determine date range in Eastern Time
      const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      const todayET = new Date(nowET)

      // Calculate date range based on selection
      let startDateET: string
      let endDateET: string

      if (weekSelection === 'lastPayPeriod') {
        // Last Pay Period = Last 2 weeks combined (for bi-weekly W-2 employees)
        // From Monday of 2 weeks ago through Sunday of last week
        const twoWeeksAgo = subWeeks(todayET, 2)
        const oneWeekAgo = subWeeks(todayET, 1)
        const mondayET = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 })
        const sundayET = endOfWeek(oneWeekAgo, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(sundayET, 'yyyy-MM-dd')
      } else {
        // This Week or Last Week = Single week
        const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
        const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
        const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(sundayET, 'yyyy-MM-dd')
      }

      // Fetch data in parallel
      const [employeesData, eventsInRange, payRatesData, existingPayrollRecords] = await Promise.all([
        getEmployees(),
        getClockEventsInRange(startDateET, endDateET, undefined, true),
        getPayRates(),
        // Check if payroll records exist for this week
        supabase
          .from('payroll_records')
          .select('*')
          .gte('pay_period_start', startDateET)
          .lte('pay_period_end', endDateET)
      ])

      // Create pay rates map - employees can have MULTIPLE active pay arrangements
      // (e.g., Carlos has both 1099/Weekly and W-2/Bi-weekly)
      const payRatesMap = new Map<string, PayRateArrangement[]>()
      payRatesData.forEach((rate: any) => {
        const arrangement: PayRateArrangement = {
          id: rate.id,
          rate: parseFloat(rate.rate.toString()),
          payment_method: rate.payment_method || 'cash',
          pay_schedule: rate.pay_schedule,
          tax_classification: rate.tax_classification
        }

        const existing = payRatesMap.get(rate.employee_id) || []
        existing.push(arrangement)
        payRatesMap.set(rate.employee_id, existing)
      })

      // Create payroll records map (employee_id -> array of records)
      // Multiple records possible for employees like Carlos/Mere with split arrangements
      const payrollRecordsMap = new Map<string, any[]>()
      if (existingPayrollRecords.data && existingPayrollRecords.data.length > 0) {
        existingPayrollRecords.data.forEach((record: any) => {
          const existing = payrollRecordsMap.get(record.employee_id) || []
          existing.push(record)
          payrollRecordsMap.set(record.employee_id, existing)
        })
      }

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
          const workedShifts: WorkedShift[] = []

          // Calculate hours from clock in/out pairs
          sortedEvents.forEach((event: any) => {
            if (event.event_type === 'in') {
              if (clockIn) {
                hasIncompleteShifts = true
              }
              clockIn = event
            } else if (event.event_type === 'out' && clockIn) {
              const inTime = new Date(clockIn.event_timestamp)
              const outTime = new Date(event.event_timestamp)
              const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)
              totalHours += hours

              workedShifts.push({
                date: format(inTime, 'yyyy-MM-dd'),
                dayName: format(inTime, 'EEEE'),
                clockIn: format(inTime, 'h:mm a'),
                clockOut: format(outTime, 'h:mm a'),
                hoursWorked: hours
              })

              clockIn = null
            }
          })

          // If there's an unclosed clock-in
          if (clockIn) {
            hasIncompleteShifts = true
            const inTime = new Date(clockIn.event_timestamp)
            workedShifts.push({
              date: format(inTime, 'yyyy-MM-dd'),
              dayName: format(inTime, 'EEEE'),
              clockIn: format(inTime, 'h:mm a'),
              clockOut: null,
              hoursWorked: 0,
              isIncomplete: true
            })
          }

          // Get all pay rate arrangements for this employee
          const arrangements = payRatesMap.get(employee.id) || []

          // Check if this employee has payroll records
          const payrollRecords = payrollRecordsMap.get(employee.id) || []

          // Build map of paid arrangements: arrangement_id -> { hours, pay }
          const paidArrangements = new Map<number, { hours: number; pay: number }>()
          payrollRecords.forEach((record: any) => {
            if (record.status === 'paid') {
              // If pay_rate_id exists, use it to track specific arrangement
              if (record.pay_rate_id) {
                paidArrangements.set(record.pay_rate_id, {
                  hours: parseFloat(record.total_hours),
                  pay: parseFloat(record.gross_pay)
                })
              } else {
                // Legacy record without pay_rate_id - mark first arrangement as paid
                if (arrangements.length > 0) {
                  paidArrangements.set(arrangements[0].id, {
                    hours: parseFloat(record.total_hours),
                    pay: parseFloat(record.gross_pay)
                  })
                }
              }
            }
          })

          // Find first unpaid arrangement (or first arrangement if all paid)
          const unpaidArrangements = arrangements.filter(arr => !paidArrangements.has(arr.id))
          const selectedArrangement = unpaidArrangements[0] || arrangements[0]

          // Employee is fully paid if all arrangements are paid AND they have worked hours
          const isFullyPaid = arrangements.length > 0 && arrangements.every(arr => paidArrangements.has(arr.id))

          const hourlyRate = selectedArrangement?.rate || 0
          const totalPay = totalHours * hourlyRate

          return {
            id: employee.id,
            name: getDisplayName(employee),
            role: employee.role || 'Staff',
            totalHours,
            hasIncompleteShifts,
            workedShifts,
            payRateArrangements: arrangements,
            selectedArrangement,
            paidArrangements,
            hourlyRate,
            totalPay,
            payrollRecordId: payrollRecords[0]?.id,
            isPaid: isFullyPaid,
            paymentMethod: payrollRecords[0]?.payment_method,
            paymentDate: payrollRecords[0]?.payment_date
          }
        })
        .filter((emp: EmployeePayroll) => {
          // Filter out test users (role "test" or name starting with "Test")
          const isTestUser = emp.role === 'test' || emp.name.startsWith('Test')

          // For "Last Pay Period" view, only show bi-weekly employees
          if (weekSelection === 'lastPayPeriod') {
            const hasBiweeklyArrangement = emp.payRateArrangements.some(arr => arr.pay_schedule === 'Bi-weekly')
            return (emp.totalHours > 0 || emp.hasIncompleteShifts) && !isTestUser && hasBiweeklyArrangement
          }

          // For other views, show all non-test employees with hours
          return (emp.totalHours > 0 || emp.hasIncompleteShifts) && !isTestUser
        })
        .sort((a: EmployeePayroll, b: EmployeePayroll) => a.name.localeCompare(b.name))

      setEmployees(payrollData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      setLoading(false)
    }
  }

  const handleFinalizeEmployee = async (employeeId: string, arrangementId: number, manualHours: number) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return

    const arrangement = employee.payRateArrangements.find(arr => arr.id === arrangementId)
    if (!arrangement) return

    if (employee.hasIncompleteShifts) {
      const confirm = window.confirm(
        `${employee.name} has incomplete shifts. Finalize anyway?`
      )
      if (!confirm) return
    }

    setFinalizingEmployee(employeeId)
    try {
      // Get week dates (must match loadPayrollData logic)
      const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      const todayET = new Date(nowET)

      // Calculate date range based on selection
      let startDateET: string
      let endDateET: string

      if (weekSelection === 'lastPayPeriod') {
        // Last Pay Period = Last 2 weeks combined (for bi-weekly W-2 employees)
        // From Monday of 2 weeks ago through Sunday of last week
        const twoWeeksAgo = subWeeks(todayET, 2)
        const oneWeekAgo = subWeeks(todayET, 1)
        const mondayET = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 })
        const sundayET = endOfWeek(oneWeekAgo, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(sundayET, 'yyyy-MM-dd')
      } else {
        // This Week or Last Week = Single week
        const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
        const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
        const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(sundayET, 'yyyy-MM-dd')
      }

      // Calculate pay based on selected arrangement and manual hours
      const hourlyRate = arrangement.rate
      const hoursToUse = manualHours || employee.totalHours
      const totalPay = hoursToUse * hourlyRate

      // Insert payroll record with pay_rate_id to track which arrangement was used
      const { error } = await supabase
        .from('payroll_records')
        .insert({
          employee_id: employeeId,
          pay_rate_id: arrangementId,
          pay_period_start: startDateET,
          pay_period_end: endDateET,
          total_hours: hoursToUse,
          hourly_rate: hourlyRate,
          gross_pay: totalPay,
          deductions: 0,
          net_pay: totalPay,
          payment_date: format(new Date(), 'yyyy-MM-dd'),
          payment_method: arrangement.payment_method,
          status: 'paid'
        })

      if (error) throw error

      // Reload data
      await loadPayrollData()

      // Scroll to the employee card that was just finalized
      // This works because the scroll container is the parent div, not window
      requestAnimationFrame(() => {
        const employeeCard = document.getElementById(`employee-card-${employeeId}`)
        if (employeeCard) {
          employeeCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    } catch (error) {
      console.error('Failed to finalize employee:', error)
      alert('❌ Failed to finalize payment. Please try again.')
    } finally {
      setFinalizingEmployee(null)
    }
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + (emp.totalPay || 0), 0)
  const totalHoursAll = employees.reduce((sum, emp) => sum + emp.totalHours, 0)
  const paidCount = employees.filter(e => e.isPaid).length

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-green-600" />
          <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">
            Payroll
          </h2>
        </div>
        {/* Progress indicator */}
        {employees.length > 0 && (
          <div className="text-sm font-semibold text-gray-600">
            {paidCount} / {employees.length} paid
          </div>
        )}
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
        <button
          onClick={() => setWeekSelection('lastPayPeriod')}
          className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
            weekSelection === 'lastPayPeriod'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          type="button"
        >
          Last Pay Period
        </button>
      </div>

      {loading ? (
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          Loading payroll data...
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          {weekSelection === 'lastPayPeriod'
            ? 'No W-2 employees with hours for last pay period'
            : `No hours recorded for ${weekSelection === 'this' ? 'this' : 'last'} week`
          }
        </div>
      ) : (
        <div>
          {/* Employee List */}
          <div className="space-y-4 mb-4">
            {employees.map((employee) => (
              <EmployeePayrollCard
                key={employee.id}
                employee={employee}
                onFinalize={handleFinalizeEmployee}
                isFinalizing={finalizingEmployee === employee.id}
              />
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

/**
 * Individual Employee Payroll Card Component
 */
interface EmployeePayrollCardProps {
  employee: EmployeePayroll
  onFinalize: (employeeId: string, arrangementId: number, manualHours: number) => void
  isFinalizing: boolean
}

function EmployeePayrollCard({ employee, onFinalize, isFinalizing }: EmployeePayrollCardProps) {
  // Select arrangement: if paid, use the one from record; otherwise use selectedArrangement
  const [selectedArrangementId, setSelectedArrangementId] = useState(
    employee.selectedArrangement?.id || employee.payRateArrangements[0]?.id
  )

  // Calculate smart default hours based on arrangement and already-paid hours
  const calculateDefaultHours = (arrangementId: number): number => {
    const arrangement = employee.payRateArrangements.find(arr => arr.id === arrangementId)
    if (!arrangement) return employee.totalHours

    // Calculate remaining hours (total - already paid)
    let remainingHours = employee.totalHours
    employee.paidArrangements.forEach(paidInfo => {
      remainingHours -= paidInfo.hours
    })

    // For employees with multiple arrangements (Carlos/Mere logic):
    // - Bi-weekly gets min(40, remainingHours)
    // - Weekly gets the remainder after bi-weekly
    if (employee.payRateArrangements.length > 1) {
      if (arrangement.pay_schedule === 'Bi-weekly') {
        return Math.min(40, remainingHours)
      } else if (arrangement.pay_schedule === 'Weekly') {
        return Math.max(0, remainingHours - 40)
      }
    }

    return remainingHours
  }

  const [manualHours, setManualHours] = useState<string>(() => {
    // Initialize with smart default for multi-arrangement employees
    if (employee.payRateArrangements.length > 1) {
      return calculateDefaultHours(selectedArrangementId).toFixed(2)
    }
    return ''
  })

  // Get current arrangement based on selection
  const currentArrangement = employee.payRateArrangements.find(arr => arr.id === selectedArrangementId) || employee.payRateArrangements[0]

  // Recalculate pay based on selected arrangement and manual hours
  const hourlyRate = currentArrangement?.rate || 0
  const hoursForCalc = manualHours ? parseFloat(manualHours) : employee.totalHours
  const totalPay = hoursForCalc * hourlyRate

  // Update manual hours when arrangement changes
  const handleArrangementChange = (newArrangementId: number) => {
    setSelectedArrangementId(newArrangementId)
    if (employee.payRateArrangements.length > 1) {
      setManualHours(calculateDefaultHours(newArrangementId).toFixed(2))
    }
  }

  // If already paid, show read-only card
  if (employee.isPaid) {
    return (
      <div id={`employee-card-${employee.id}`} className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-green-100 border-b border-green-200 flex items-center justify-between">
          <div className="font-bold text-green-800 text-[22px]">
            {employee.name}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">PAID</span>
          </div>
        </div>

        {/* Shifts */}
        <div className="px-4 py-3">
          <div className="space-y-1">
            {employee.workedShifts.map((shift, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_auto] gap-2 items-center py-2.5 px-3 rounded bg-white"
              >
                <div className="text-[15px] text-gray-800">
                  <div className="font-bold">{shift.dayName}</div>
                  <div className="text-[14px] text-gray-600">{shift.clockIn} - {shift.clockOut || '???'}</div>
                </div>
                <div className="text-[17px] font-bold text-gray-900 text-right">
                  {shift.isIncomplete ? '' : formatHoursMinutes(shift.hoursWorked)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-green-50 border-t border-green-200">
          <div className="flex justify-between items-center text-sm mb-2">
            <div className="text-gray-700">
              {formatHoursMinutes(employee.totalHours)} @ ${hourlyRate.toFixed(2)}/hr
            </div>
            <div className="text-gray-900 font-bold">
              ${totalPay.toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <div>
              {currentArrangement?.payment_method?.toUpperCase()}
              {currentArrangement?.tax_classification && ` (${currentArrangement.tax_classification})`}
              {currentArrangement?.pay_schedule && ` - ${currentArrangement.pay_schedule}`}
            </div>
            <div>
              {employee.paymentDate && format(new Date(employee.paymentDate), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Unpaid card with finalize option
  return (
    <div id={`employee-card-${employee.id}`} className="bg-white/90 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="font-bold text-green-600 text-[22px]">
          {employee.name}
        </div>
      </div>

      {/* Shifts */}
      <div className="px-4 py-3">
        <div className="space-y-1">
          {employee.workedShifts.map((shift, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-[1fr_auto] gap-2 items-center py-2.5 px-3 rounded ${
                shift.isIncomplete
                  ? 'bg-orange-100 border-2 border-orange-400'
                  : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className={`text-[15px] ${shift.isIncomplete ? 'text-orange-800 font-semibold' : 'text-gray-800'}`}>
                <div className="font-bold">{shift.dayName}</div>
                <div className="text-[14px] text-gray-600">{shift.clockIn} - {shift.clockOut || '???'}</div>
              </div>
              <div className={`text-[17px] font-bold text-right ${shift.isIncomplete ? 'text-orange-700' : 'text-gray-900'}`}>
                {shift.isIncomplete ? '' : formatHoursMinutes(shift.hoursWorked)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Section */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        {/* Pay Arrangement Selector (if employee has multiple) */}
        {employee.payRateArrangements.length > 1 && (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pay Arrangement
            </label>
            <select
              value={selectedArrangementId}
              onChange={(e) => handleArrangementChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {employee.payRateArrangements.map((arr) => (
                <option key={arr.id} value={arr.id}>
                  {arr.payment_method?.toUpperCase()}
                  {arr.tax_classification && ` (${arr.tax_classification})`}
                  {arr.pay_schedule && ` - ${arr.pay_schedule}`}
                  {' @ $'}{arr.rate.toFixed(2)}/hr
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Display selected arrangement details */}
        {employee.payRateArrangements.length === 1 && currentArrangement && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700">
            <strong>{currentArrangement.payment_method?.toUpperCase()}</strong>
            {currentArrangement.tax_classification && ` (${currentArrangement.tax_classification})`}
            {currentArrangement.pay_schedule && ` - ${currentArrangement.pay_schedule}`}
          </div>
        )}

        {/* Show paid arrangements (if any) */}
        {employee.paidArrangements.size > 0 && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
            <div className="font-semibold text-green-800 mb-1">Already Paid:</div>
            {Array.from(employee.paidArrangements.entries()).map(([arrId, paidInfo]) => {
              const arr = employee.payRateArrangements.find(a => a.id === arrId)
              return (
                <div key={arrId} className="text-gray-700">
                  {arr?.payment_method?.toUpperCase()} {arr?.tax_classification && `(${arr.tax_classification})`}: {formatHoursMinutes(paidInfo.hours)} = ${paidInfo.pay.toFixed(2)}
                </div>
              )
            })}
          </div>
        )}

        {/* Manual Hours Input (for Carlos/Mere who split hours between arrangements) */}
        {employee.payRateArrangements.length > 1 && (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Hours for this arrangement (Total: {formatHoursMinutes(employee.totalHours)})
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter hours (e.g., 7.5 for 7h 30m)"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              Tip: 7.5 = 7h 30m, 8.25 = 8h 15m, 40 = 40h
            </div>
          </div>
        )}

        {/* Total calculation */}
        <div className="flex justify-between items-center text-sm mb-3">
          <div className="text-gray-600">
            {formatHoursMinutes(hoursForCalc)} @ ${hourlyRate.toFixed(2)}/hr
          </div>
          <div className="text-gray-900 font-bold text-lg">
            ${totalPay.toFixed(2)}
          </div>
        </div>

        {/* Finalize Button */}
        <button
          onClick={() => onFinalize(employee.id, selectedArrangementId, parseFloat(manualHours) || 0)}
          disabled={isFinalizing}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-md transition-all"
          type="button"
        >
          {isFinalizing ? 'Finalizing...' : '✓ Finalize Payment'}
        </button>
      </div>
    </div>
  )
}
