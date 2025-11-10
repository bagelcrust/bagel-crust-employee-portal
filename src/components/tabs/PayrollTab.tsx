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

interface EmployeePayroll {
  id: string
  name: string
  role: string
  totalHours: number
  hourlyRate: number
  totalPay: number
  hasIncompleteShifts: boolean
  workedShifts: WorkedShift[]
  payrollRecordId?: number
  isPaid: boolean
  defaultPaymentMethod: string
  paymentMethod?: string
  checkNumber?: string
  paymentDate?: string
}

export function PayrollTab() {
  const [loading, setLoading] = useState(true)
  const [weekSelection, setWeekSelection] = useState<'this' | 'last'>('last') // Default to last week
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
      const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
      const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
      const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
      const startDateET = format(mondayET, 'yyyy-MM-dd')
      const endDateET = format(sundayET, 'yyyy-MM-dd')

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

      // Create pay rates map with payment method
      const payRatesMap = new Map<string, { rate: number; paymentMethod: string }>()
      payRatesData.forEach((rate: any) => {
        payRatesMap.set(rate.employee_id, {
          rate: parseFloat(rate.rate.toString()),
          paymentMethod: rate.payment_method || 'cash'
        })
      })

      // Create payroll records map (employee_id -> record)
      const payrollRecordsMap = new Map<string, any>()
      if (existingPayrollRecords.data && existingPayrollRecords.data.length > 0) {
        existingPayrollRecords.data.forEach((record: any) => {
          payrollRecordsMap.set(record.employee_id, record)
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

          const payRateInfo = payRatesMap.get(employee.id)
          const hourlyRate = payRateInfo?.rate || 0
          const defaultPaymentMethod = payRateInfo?.paymentMethod || 'cash'
          const totalPay = totalHours * hourlyRate

          // Check if this employee has a payroll record
          const payrollRecord = payrollRecordsMap.get(employee.id)

          return {
            id: employee.id,
            name: getDisplayName(employee),
            role: employee.role || 'Staff',
            totalHours,
            hourlyRate,
            totalPay,
            hasIncompleteShifts,
            workedShifts,
            payrollRecordId: payrollRecord?.id,
            isPaid: payrollRecord?.status === 'paid',
            defaultPaymentMethod,
            paymentMethod: payrollRecord?.payment_method || defaultPaymentMethod,
            checkNumber: payrollRecord?.check_number,
            paymentDate: payrollRecord?.payment_date
          }
        })
        .filter((emp: EmployeePayroll) => emp.totalHours > 0 || emp.hasIncompleteShifts)
        .sort((a: EmployeePayroll, b: EmployeePayroll) => a.name.localeCompare(b.name))

      setEmployees(payrollData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      setLoading(false)
    }
  }

  const handleFinalizeEmployee = async (employeeId: string, paymentMethod: string, checkNumber: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return

    if (employee.hasIncompleteShifts) {
      const confirm = window.confirm(
        `${employee.name} has incomplete shifts. Finalize anyway?`
      )
      if (!confirm) return
    }

    setFinalizingEmployee(employeeId)
    try {
      // Get week dates
      const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      const todayET = new Date(nowET)
      const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
      const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
      const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
      const startDateET = format(mondayET, 'yyyy-MM-dd')
      const endDateET = format(sundayET, 'yyyy-MM-dd')

      // Insert payroll record
      const { error } = await supabase
        .from('payroll_records')
        .insert({
          employee_id: employeeId,
          pay_period_start: startDateET,
          pay_period_end: endDateET,
          total_hours: employee.totalHours,
          hourly_rate: employee.hourlyRate,
          gross_pay: employee.totalPay,
          deductions: 0,
          net_pay: employee.totalPay,
          payment_date: format(new Date(), 'yyyy-MM-dd'),
          payment_method: paymentMethod,
          check_number: checkNumber || null,
          status: 'paid'
        })

      if (error) throw error

      // Reload data
      await loadPayrollData()
    } catch (error) {
      console.error('Failed to finalize employee:', error)
      alert('❌ Failed to finalize payment. Please try again.')
    } finally {
      setFinalizingEmployee(null)
    }
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + emp.totalPay, 0)
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
  onFinalize: (employeeId: string, paymentMethod: string, checkNumber: string) => void
  isFinalizing: boolean
}

function EmployeePayrollCard({ employee, onFinalize, isFinalizing }: EmployeePayrollCardProps) {
  const [paymentMethod, setPaymentMethod] = useState(employee.paymentMethod || employee.defaultPaymentMethod)
  const [checkNumber, setCheckNumber] = useState(employee.checkNumber || '')

  // If already paid, show read-only card
  if (employee.isPaid) {
    return (
      <div className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 overflow-hidden">
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
              {formatHoursMinutes(employee.totalHours)} @ ${employee.hourlyRate.toFixed(2)}/hr
            </div>
            <div className="text-gray-900 font-bold">
              ${employee.totalPay.toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-600">
            <div>
              Paid via {employee.paymentMethod?.toUpperCase()}
              {employee.checkNumber && ` - Check #${employee.checkNumber}`}
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
    <div className="bg-white/90 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
        <div className="flex justify-between items-center text-sm mb-3">
          <div className="text-gray-600">
            {formatHoursMinutes(employee.totalHours)} @ ${employee.hourlyRate.toFixed(2)}/hr
          </div>
          <div className="text-gray-900 font-bold text-lg">
            ${employee.totalPay.toFixed(2)}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="w2">W-2</option>
            <option value="1099">1099</option>
          </select>

          {paymentMethod === 'check' && (
            <input
              type="text"
              placeholder="Check #"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )}
        </div>

        {/* Finalize Button */}
        <button
          onClick={() => onFinalize(employee.id, paymentMethod, checkNumber)}
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
