/**
 * usePayrollData Hook
 *
 * Manages all payroll data fetching, state, and actions.
 * Extracted from tab-payroll.tsx for better separation of concerns.
 */

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks, addDays } from 'date-fns'
import { getDisplayName, supabase, fetchPayrollDataRpc, fetchLastPaymentMethods } from '../../shared/supabase-client'
import { logCondition, logData } from '../../shared/debug-utils'
import type { EmployeePayroll, FlaggedActivity, PayRateArrangement, WorkedShift, WeekSelection } from './types'

export function usePayrollData() {
  const [loading, setLoading] = useState(true)
  const [weekSelection, setWeekSelection] = useState<WeekSelection>('this')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [employees, setEmployees] = useState<EmployeePayroll[]>([])
  const [flaggedActivities, setFlaggedActivities] = useState<FlaggedActivity[]>([])
  const [finalizingEmployee, setFinalizingEmployee] = useState<string | null>(null)
  const [logPaymentModal, setLogPaymentModal] = useState<{
    isOpen: boolean
    employee: EmployeePayroll | null
    arrangement: PayRateArrangement | null
    hours: number
  }>({ isOpen: false, employee: null, arrangement: null, hours: 0 })

  useEffect(() => {
    loadPayrollData()
  }, [weekSelection])

  const loadPayrollData = async () => {
    setLoading(true)
    logCondition('PayrollTab', `Loading payroll for ${weekSelection} week`, true)
    try {
      // Determine date range in Eastern Time
      const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      const todayET = new Date(nowET)

      // Calculate date range based on selection
      let startDateET: string
      let endDateET: string

      let displayEnd: Date // For UI display (actual end date, not +1)

      if (weekSelection === 'lastPayPeriod') {
        // Last Pay Period = Last 2 weeks combined (for bi-weekly W-2 employees)
        // From Monday of 2 weeks ago through Sunday of last week
        const twoWeeksAgo = subWeeks(todayET, 2)
        const oneWeekAgo = subWeeks(todayET, 1)
        const mondayET = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 })
        const sundayET = endOfWeek(oneWeekAgo, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(addDays(sundayET, 1), 'yyyy-MM-dd') // Add 1 day to include Sunday
        displayEnd = sundayET // Keep actual Sunday for display
      } else {
        // This Week or Last Week = Single week
        const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
        const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
        const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(addDays(sundayET, 1), 'yyyy-MM-dd') // Add 1 day to include Sunday
        displayEnd = sundayET // Keep actual Sunday for display
      }

      logData('PayrollTab', 'Date range', { startDateET, endDateET, weekSelection })

      // Store date range for display
      setDateRange({ start: startDateET, end: format(displayEnd, 'yyyy-MM-dd') })

      // Fetch payroll data and last payment methods in parallel
      const [rpcResult, lastPaymentMethodMap] = await Promise.all([
        fetchPayrollDataRpc(startDateET, endDateET),
        fetchLastPaymentMethods()
      ])

      const employeesData = rpcResult.employees || []
      const timeEntriesData = rpcResult.time_entries || []
      const payRatesData = rpcResult.pay_rates || []
      let existingPayrollRecords = rpcResult.payroll_records || []

      // Create pay rates map - employees can have MULTIPLE active pay arrangements
      // (e.g., Carlos has both 1099/Weekly and W-2/Bi-weekly)
      // BUT: Only keep the most recent rate per (pay_schedule + tax_classification)
      // This handles rate history (e.g., Clara's $12→$14 raise)
      const payRatesMap = new Map<string, PayRateArrangement[]>()

      // First, group by employee_id and find most recent rate per arrangement type
      const tempMap = new Map<string, Map<string, { arrangement: PayRateArrangement; effectiveDate: string }>>()

      payRatesData.forEach((rate: any) => {
        const arrangement: PayRateArrangement = {
          id: rate.id,
          rate: parseFloat(rate.rate.toString()),
          payment_method: rate.payment_method || 'cash',
          pay_schedule: rate.pay_schedule,
          tax_classification: rate.tax_classification
        }

        // Unique key for arrangement type (not including rate)
        const arrangementKey = `${rate.pay_schedule || 'Standard'}|${rate.tax_classification || 'Cash'}`
        const effectiveDate = rate.effective_date || '1900-01-01'

        if (!tempMap.has(rate.employee_id)) {
          tempMap.set(rate.employee_id, new Map())
        }
        const employeeArrangements = tempMap.get(rate.employee_id)!

        // Keep only the most recent effective_date for each arrangement type
        const existing = employeeArrangements.get(arrangementKey)
        if (!existing || effectiveDate > existing.effectiveDate) {
          employeeArrangements.set(arrangementKey, { arrangement, effectiveDate })
        }
      })

      // Convert to final map format
      tempMap.forEach((arrangements, employeeId) => {
        const ratesList: PayRateArrangement[] = []
        arrangements.forEach(({ arrangement }) => {
          ratesList.push(arrangement)
        })
        payRatesMap.set(employeeId, ratesList)
      })

      // Create payroll records map (employee_id -> array of records)
      // Multiple records possible for employees like Carlos/Mere with split arrangements
      const payrollRecordsMap = new Map<string, any[]>()
      if (existingPayrollRecords && existingPayrollRecords.length > 0) {
        existingPayrollRecords.forEach((record: any) => {
          const existing = payrollRecordsMap.get(record.employee_id) || []
          existing.push(record)
          payrollRecordsMap.set(record.employee_id, existing)
        })
      }

      // Process each employee
      const payrollData: EmployeePayroll[] = employeesData
        .map((employee: any) => {
          const employeeEvents = timeEntriesData.filter((e: any) => e.employee_id === employee.id)
          const sortedEvents = employeeEvents.sort((a: any, b: any) =>
            new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
          )

          let totalHours = 0
          let hasIncompleteShifts = false
          let clockIn: any | null = null
          const workedShifts: WorkedShift[] = []

          // Calculate hours from clock in/out pairs
          // IMPORTANT: When we see IN→IN, push the first IN as incomplete shift
          // so it's visible in the UI (not silently dropped)
          sortedEvents.forEach((event: any) => {
            if (event.event_type === 'in') {
              if (clockIn) {
                // Previous clock-in was never closed - push it as incomplete
                hasIncompleteShifts = true
                const inTime = new Date(clockIn.event_timestamp)
                workedShifts.push({
                  date: format(inTime, 'yyyy-MM-dd'),
                  dayName: format(inTime, 'EEEE') + ' (' + format(inTime, 'M/d') + ')',
                  clockIn: format(inTime, 'h:mm a'),
                  clockOut: null,
                  hoursWorked: 0,
                  isIncomplete: true,
                  clockInId: clockIn.id
                })
              }
              clockIn = event
            } else if (event.event_type === 'out' && clockIn) {
              const inTime = new Date(clockIn.event_timestamp)
              const outTime = new Date(event.event_timestamp)
              const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)
              totalHours += hours

              // Detect auto clock-out: ONLY flag the 6:30 PM auto clock-out feature
              // Convert to Eastern Time and check if it's 6:30 PM
              const isManuallyEdited = event.manually_edited === true
              const outHourET = parseInt(outTime.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }))
              const outMinuteET = parseInt(outTime.toLocaleString('en-US', { timeZone: 'America/New_York', minute: '2-digit' }))
              const is630PM = outHourET === 18 && outMinuteET === 30
              const isAutoClockOut = !isManuallyEdited && is630PM

              // Detect suspicious activity: shifts under 5 minutes (0.083 hours)
              const isSuspicious = hours < 0.083 && hours > 0

              workedShifts.push({
                date: format(inTime, 'yyyy-MM-dd'),
                dayName: format(inTime, 'EEEE') + ' (' + format(inTime, 'M/d') + ')',
                clockIn: format(inTime, 'h:mm a'),
                clockOut: format(outTime, 'h:mm a'),
                hoursWorked: hours,
                isAutoClockOut,
                isSuspicious,
                clockInId: clockIn.id,
                clockOutId: event.id
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
              dayName: format(inTime, 'EEEE') + ' (' + format(inTime, 'M/d') + ')',
              clockIn: format(inTime, 'h:mm a'),
              clockOut: null,
              hoursWorked: 0,
              isIncomplete: true,
              clockInId: clockIn.id
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
                  hours: parseFloat(record.hours_worked),
                  pay: parseFloat(record.gross_amount)
                })
              } else {
                // Legacy record without pay_rate_id - mark first arrangement as paid
                if (arrangements.length > 0) {
                  paidArrangements.set(arrangements[0].id, {
                    hours: parseFloat(record.hours_worked),
                    pay: parseFloat(record.gross_amount)
                  })
                }
              }
            }
          })

          // Find first unpaid arrangement (or first arrangement if all paid)
          const unpaidArrangements = arrangements.filter(arr => !paidArrangements.has(arr.id))
          const selectedArrangement = unpaidArrangements[0] || arrangements[0]

          // Employee is fully paid if all arrangements are paid
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
            paymentDate: payrollRecords[0]?.prepared_date,
            lastPaymentMethod: lastPaymentMethodMap.get(employee.id) || 'check'
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

          // For "Last Week" view, only show weekly employees
          if (weekSelection === 'last') {
            const hasWeeklyArrangement = emp.payRateArrangements.some(arr => arr.pay_schedule === 'Weekly')
            return (emp.totalHours > 0 || emp.hasIncompleteShifts) && !isTestUser && hasWeeklyArrangement
          }

          // For other views, show all non-test employees with hours
          return (emp.totalHours > 0 || emp.hasIncompleteShifts) && !isTestUser
        })
        .sort((a: EmployeePayroll, b: EmployeePayroll) => a.name.localeCompare(b.name))

      logCondition('PayrollTab', 'Employees with hours', payrollData.length > 0, { count: payrollData.length })
      logData('PayrollTab', 'First employee (sample)', payrollData[0], ['id', 'name', 'totalHours', 'isPaid'])

      // Collect all flagged activities (suspicious shifts < 5 minutes)
      const flagged: FlaggedActivity[] = []
      payrollData.forEach((emp: EmployeePayroll) => {
        emp.workedShifts.forEach((shift: WorkedShift) => {
          if (shift.isSuspicious && shift.clockOut) {
            flagged.push({
              employeeId: emp.id,
              employeeName: emp.name,
              date: shift.date,
              dayName: shift.dayName,
              clockIn: shift.clockIn,
              clockOut: shift.clockOut,
              hoursWorked: shift.hoursWorked,
              reason: 'Shift under 5 minutes'
            })
          }
        })
      })

      logCondition('PayrollTab', 'Flagged activities found', flagged.length > 0, { count: flagged.length })

      setFlaggedActivities(flagged)
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

    logData('PayrollTab', 'Finalizing employee', { employeeId, employeeName: employee.name, arrangementId, manualHours, totalHours: employee.totalHours })

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
        endDateET = format(addDays(sundayET, 1), 'yyyy-MM-dd') // Add 1 day to include Sunday
      } else {
        // This Week or Last Week = Single week
        const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
        const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
        const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
        startDateET = format(mondayET, 'yyyy-MM-dd')
        endDateET = format(addDays(sundayET, 1), 'yyyy-MM-dd') // Add 1 day to include Sunday
      }

      // Calculate pay based on selected arrangement and manual hours
      const hourlyRate = arrangement.rate
      const hoursToUse = manualHours || employee.totalHours
      const estimatedPay = employee.totalHours * hourlyRate  // What system calculated
      const preparedPay = hoursToUse * hourlyRate            // What manager is logging

      // Insert pay record
      const { error } = await supabase
        .schema('accounting')
        .from('portal_pay_records')
        .insert({
          employee_id: employeeId,
          pay_period_start: startDateET,
          pay_period_end: endDateET,
          hours_worked: hoursToUse,
          hourly_rate: hourlyRate,
          estimated_amount: estimatedPay,
          gross_amount: preparedPay,
          net_amount: preparedPay,
          prepared_date: format(new Date(), 'yyyy-MM-dd'),
          payment_method: arrangement.payment_method
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
      alert('Failed to finalize payment. Please try again.')
    } finally {
      setFinalizingEmployee(null)
    }
  }

  const handleLogPayment = async (data: {
    employeeId: string
    arrangementId: number
    totalHours: number
    hourlyRate: number
    grossPay: number
    paymentMethod: 'cash' | 'check'
    checkNumber: string
    notes: string
    payPeriodStart: string
    payPeriodEnd: string
  }) => {
    logData('PayrollTab', 'Logging manual payment', data)

    // estimated = hours × rate (what system calculated)
    // gross = what manager actually logged (might be different)
    const estimatedAmount = data.totalHours * data.hourlyRate

    const { error } = await supabase
      .schema('accounting')
      .from('portal_pay_records')
      .insert({
        employee_id: data.employeeId,
        pay_period_start: data.payPeriodStart,
        pay_period_end: data.payPeriodEnd,
        hours_worked: data.totalHours,
        hourly_rate: data.hourlyRate,
        estimated_amount: estimatedAmount,
        gross_amount: data.grossPay,
        net_amount: data.grossPay,
        prepared_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: data.paymentMethod,
        check_number: data.checkNumber || null,
        notes: data.notes || null
      })

    if (error) throw error

    // Reload data
    await loadPayrollData()

    // Scroll to the employee card
    requestAnimationFrame(() => {
      const employeeCard = document.getElementById(`employee-card-${data.employeeId}`)
      if (employeeCard) {
        employeeCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }

  // Quick log payment - one-tap with preset amount and method
  const handleQuickLogPayment = async (
    employeeId: string,
    arrangement: PayRateArrangement,
    hours: number,
    amount: number,
    method: 'cash' | 'check'
  ) => {
    // Calculate pay period dates based on current weekSelection
    const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    const todayET = new Date(nowET)

    let payPeriodStart: string
    let payPeriodEnd: string

    if (weekSelection === 'lastPayPeriod') {
      const twoWeeksAgo = subWeeks(todayET, 2)
      const oneWeekAgo = subWeeks(todayET, 1)
      const mondayET = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 })
      const sundayET = endOfWeek(oneWeekAgo, { weekStartsOn: 1 })
      payPeriodStart = format(mondayET, 'yyyy-MM-dd')
      payPeriodEnd = format(addDays(sundayET, 1), 'yyyy-MM-dd')
    } else {
      const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
      const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
      const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
      payPeriodStart = format(mondayET, 'yyyy-MM-dd')
      payPeriodEnd = format(addDays(sundayET, 1), 'yyyy-MM-dd')
    }

    await handleLogPayment({
      employeeId,
      arrangementId: arrangement.id,
      totalHours: hours,
      hourlyRate: arrangement.rate,
      grossPay: amount,
      paymentMethod: method,
      checkNumber: '',
      notes: '',
      payPeriodStart,
      payPeriodEnd
    })
  }

  // Computed values
  const totalPayroll = employees.reduce((sum, emp) => sum + (emp.totalPay || 0), 0)
  const totalHoursAll = employees.reduce((sum, emp) => sum + emp.totalHours, 0)
  const paidCount = employees.filter(e => e.isPaid).length

  // Update a single time entry
  const handleUpdateTimeEntry = async (
    entryId: number,
    newTimestamp: Date
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .schema('employees')
        .rpc('update_time_entry', {
          p_entry_id: entryId,
          p_new_timestamp: newTimestamp.toISOString()
        })

      if (error) {
        console.error('Failed to update time entry:', error)
        return false
      }

      if (!data?.success) {
        console.error('Update failed:', data?.error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating time entry:', error)
      return false
    }
  }

  // Create a new time entry (for missing clock-outs)
  const handleCreateTimeEntry = async (
    employeeId: string,
    eventType: 'in' | 'out',
    timestamp: Date
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .schema('employees')
        .rpc('create_time_entry', {
          p_employee_id: employeeId,
          p_event_type: eventType,
          p_timestamp: timestamp.toISOString()
        })

      if (error) {
        console.error('Failed to create time entry:', error)
        return false
      }

      if (!data?.success) {
        console.error('Create failed:', data)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating time entry:', error)
      return false
    }
  }

  return {
    // State
    loading,
    weekSelection,
    setWeekSelection,
    employees,
    flaggedActivities,
    finalizingEmployee,
    logPaymentModal,
    setLogPaymentModal,
    dateRange,

    // Actions
    handleFinalizeEmployee,
    handleLogPayment,
    handleQuickLogPayment,
    handleUpdateTimeEntry,
    handleCreateTimeEntry,
    refreshData: loadPayrollData,

    // Computed
    totalPayroll,
    totalHoursAll,
    paidCount
  }
}
