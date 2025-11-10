/**
 * PayrollTab - Full employee payroll view (Owner only)
 *
 * Features:
 * - View current/past week hours and calculated pay
 * - Finalize week to save payroll session
 * - Mark individual employees as paid
 * - View payroll history
 */

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { DollarSign, History, CheckCircle, Circle } from 'lucide-react'
import { getDisplayName, supabase } from '../../supabase/supabase'
import { getEmployees, getClockEventsInRange, getPayRates } from '../../supabase/edgeFunctions'
import { formatHoursMinutes } from '../../lib/employeeUtils'

interface WorkedShift {
  date: string
  dayName: string
  clockIn: string
  clockOut: string | null  // null if still clocked in
  hoursWorked: number
  isIncomplete?: boolean  // true if missing clock-out
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
  payrollRecordId?: number  // If employee has a payroll record for this week
  isPaid?: boolean  // Payment status from payroll_records
}

interface PayrollSession {
  id: number
  pay_period_start: string
  pay_period_end: string
  total_hours: number
  gross_pay: number
  net_pay: number
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  employeeCount: number
}

export function PayrollTab() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current')
  const [weekSelection, setWeekSelection] = useState<'this' | 'last'>('this')
  const [employees, setEmployees] = useState<EmployeePayroll[]>([])
  const [payrollSessions, setPayrollSessions] = useState<PayrollSession[]>([])
  const [weekStatus, setWeekStatus] = useState<'draft' | 'finalized'>('draft')
  const [finalizing, setFinalizing] = useState(false)

  useEffect(() => {
    if (viewMode === 'current') {
      loadPayrollData()
    } else {
      loadPayrollHistory()
    }
  }, [weekSelection, viewMode])

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

      // Create pay rates map
      const payRatesMap = new Map<string, number>()
      payRatesData.forEach((rate: any) => {
        payRatesMap.set(rate.employee_id, parseFloat(rate.rate.toString()))
      })

      // Create payroll records map (employee_id -> record)
      const payrollRecordsMap = new Map<string, any>()
      let hasAnyPayrollRecords = false
      if (existingPayrollRecords.data && existingPayrollRecords.data.length > 0) {
        hasAnyPayrollRecords = true
        existingPayrollRecords.data.forEach((record: any) => {
          payrollRecordsMap.set(record.employee_id, record)
        })
      }

      // Update week status
      setWeekStatus(hasAnyPayrollRecords ? 'finalized' : 'draft')

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

          // Calculate hours from clock in/out pairs and build shift list
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

              // Add to worked shifts list
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

          // If there's an unclosed clock-in, mark as incomplete and add to shifts list
          if (clockIn) {
            hasIncompleteShifts = true
            const inTime = new Date(clockIn.event_timestamp)
            workedShifts.push({
              date: format(inTime, 'yyyy-MM-dd'),
              dayName: format(inTime, 'EEEE'),
              clockIn: format(inTime, 'h:mm a'),
              clockOut: null,  // Still clocked in
              hoursWorked: 0,
              isIncomplete: true
            })
          }

          const hourlyRate = payRatesMap.get(employee.id) || 0
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
            isPaid: payrollRecord?.status === 'paid'
          }
        })
        .filter((emp: EmployeePayroll) => emp.totalHours > 0 || emp.hasIncompleteShifts) // Show employees with hours
        .sort((a: EmployeePayroll, b: EmployeePayroll) => a.name.localeCompare(b.name)) // Sort alphabetically by name

      setEmployees(payrollData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      setLoading(false)
    }
  }

  const loadPayrollHistory = async () => {
    setLoading(true)
    try {
      // Get all past payroll sessions grouped by week
      const { data, error } = await supabase
        .from('payroll_records')
        .select('pay_period_start, pay_period_end, status, created_at')
        .order('pay_period_start', { ascending: false })

      if (error) throw error

      // Group by pay period and aggregate
      const sessionsMap = new Map<string, PayrollSession>()
      data?.forEach((record: any) => {
        const key = `${record.pay_period_start}_${record.pay_period_end}`
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, {
            id: 0, // Not used for grouping
            pay_period_start: record.pay_period_start,
            pay_period_end: record.pay_period_end,
            total_hours: 0,
            gross_pay: 0,
            net_pay: 0,
            status: record.status,
            created_at: record.created_at,
            employeeCount: 0
          })
        }
      })

      setPayrollSessions(Array.from(sessionsMap.values()))
      setLoading(false)
    } catch (error) {
      console.error('Failed to load payroll history:', error)
      setLoading(false)
    }
  }

  const handleFinalizeWeek = async () => {
    if (weekStatus === 'finalized') {
      alert('This week has already been finalized')
      return
    }

    if (employees.some(emp => emp.hasIncompleteShifts)) {
      const confirm = window.confirm(
        'Some employees have incomplete shifts (missing clock-outs). Do you want to finalize anyway?'
      )
      if (!confirm) return
    }

    setFinalizing(true)
    try {
      // Get week dates
      const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      const todayET = new Date(nowET)
      const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
      const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
      const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
      const startDateET = format(mondayET, 'yyyy-MM-dd')
      const endDateET = format(sundayET, 'yyyy-MM-dd')

      // Insert payroll records for each employee
      const payrollRecords = employees.map(emp => ({
        employee_id: emp.id,
        pay_period_start: startDateET,
        pay_period_end: endDateET,
        total_hours: emp.totalHours,
        hourly_rate: emp.hourlyRate,
        gross_pay: emp.totalPay,
        deductions: 0,
        net_pay: emp.totalPay,
        status: 'pending'
      }))

      const { error } = await supabase
        .from('payroll_records')
        .insert(payrollRecords)

      if (error) throw error

      alert(`✅ Week finalized! ${employees.length} employees saved to payroll.`)

      // Reload data to show finalized status
      await loadPayrollData()
    } catch (error) {
      console.error('Failed to finalize week:', error)
      alert('❌ Failed to finalize week. Please try again.')
    } finally {
      setFinalizing(false)
    }
  }

  const handleTogglePaidStatus = async (employeeId: string, currentStatus: boolean) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee || !employee.payrollRecordId) {
      alert('No payroll record found for this employee')
      return
    }

    try {
      const newStatus = currentStatus ? 'pending' : 'paid'
      const { error } = await supabase
        .from('payroll_records')
        .update({
          status: newStatus,
          payment_date: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null
        })
        .eq('id', employee.payrollRecordId)

      if (error) throw error

      // Update local state
      setEmployees(employees.map(e =>
        e.id === employeeId ? { ...e, isPaid: !currentStatus } : e
      ))
    } catch (error) {
      console.error('Failed to update payment status:', error)
      alert('Failed to update payment status')
    }
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + emp.totalPay, 0)
  const totalHoursAll = employees.reduce((sum, emp) => sum + emp.totalHours, 0)

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-green-600" />
          <h2 className="text-[28px] font-bold text-gray-800 tracking-tight">
            Payroll
          </h2>
        </div>
        {/* Status badge (only show in current view) */}
        {viewMode === 'current' && (
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            weekStatus === 'finalized'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {weekStatus === 'finalized' ? 'Finalized' : 'Draft'}
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-full">
        <button
          onClick={() => setViewMode('current')}
          className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            viewMode === 'current'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          type="button"
        >
          <DollarSign className="w-4 h-4" />
          Current Week
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            viewMode === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          type="button"
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Week Toggle (only in current view) */}
      {viewMode === 'current' && (
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
      )}

      {loading ? (
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          Loading payroll data...
        </div>
      ) : viewMode === 'history' ? (
        /* HISTORY VIEW */
        payrollSessions.length === 0 ? (
          <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
            No payroll history yet
          </div>
        ) : (
          <div className="space-y-3">
            {payrollSessions.map((session, idx) => (
              <div key={idx} className="bg-white/90 rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-800 text-lg">
                      {format(new Date(session.pay_period_start), 'MMM d')} - {format(new Date(session.pay_period_end), 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Created {format(new Date(session.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    session.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {session.status === 'paid' ? 'Paid' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : employees.length === 0 ? (
        /* CURRENT VIEW - NO DATA */
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          No hours recorded for {weekSelection === 'this' ? 'this' : 'last'} week
        </div>
      ) : (
        /* CURRENT VIEW - WITH DATA */
        <div>
          {/* Employee List */}
          <div className="space-y-4 mb-4">
            {employees.map((employee) => (
              <div key={employee.id} className="bg-white/90 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Employee Header - Name and Payment Status */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="font-bold text-green-600 text-[22px]">
                    {employee.name}
                  </div>
                  {/* Payment checkbox (only if week is finalized) */}
                  {weekStatus === 'finalized' && (
                    <button
                      onClick={() => handleTogglePaidStatus(employee.id, employee.isPaid || false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all hover:bg-gray-100"
                      type="button"
                    >
                      {employee.isPaid ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">Paid</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-500">Mark Paid</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Shifts Worked */}
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

                {/* Employee Summary Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-600">
                      {formatHoursMinutes(employee.totalHours)} @ ${employee.hourlyRate.toFixed(2)}/hr
                    </div>
                    <div className="text-gray-900">
                      ${employee.totalPay.toFixed(2)}
                    </div>
                  </div>
                </div>
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

          {/* Finalize Week Button (only show if not finalized) */}
          {weekStatus === 'draft' && (
            <button
              onClick={handleFinalizeWeek}
              disabled={finalizing || employees.length === 0}
              className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-all shadow-md hover:shadow-lg"
              type="button"
            >
              {finalizing ? 'Finalizing...' : '✓ Finalize Week'}
            </button>
          )}

          {/* Finalized Message */}
          {weekStatus === 'finalized' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="text-green-700 font-semibold text-sm">
                ✓ This week has been finalized
              </div>
              <div className="text-green-600 text-xs mt-1">
                Mark employees as paid using the checkboxes above
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
