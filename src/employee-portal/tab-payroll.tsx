/**
 * PayrollTab - Simplified payroll management (Owner only)
 *
 * Workflow:
 * 1. Review employee hours throughout the week (This Week view)
 * 2. On Monday, review Last Week and finalize each employee after paying them
 * 3. Once finalized, employee card shows PAID badge and becomes read-only
 * 4. Click any employee card to expand and edit their shifts
 */

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { DollarSign } from 'lucide-react'
import { formatHoursMinutes } from '../shared/employeeUtils'
import { supabase } from '../shared/supabase-client'
import { LogPaymentModal } from './log-payment-modal'
import { EditTimeLogModal } from './payroll/EditTimeLogModal'
import { usePayrollData } from './payroll/usePayrollData'
import { EmployeePayrollCard } from './payroll/EmployeePayrollCard'
import type { WorkedShift } from './payroll/types'

export function PayrollTab() {
  const {
    loading,
    weekSelection,
    setWeekSelection,
    employees,
    finalizingEmployee,
    logPaymentModal,
    setLogPaymentModal,
    handleFinalizeEmployee,
    handleLogPayment,
    handleUpdateTimeEntry,
    handleCreateTimeEntry,
    refreshData,
    totalPayroll,
    totalHoursAll,
    paidCount,
    dateRange
  } = usePayrollData()

  // Edit shift modal state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    shift: WorkedShift | null
    employeeName: string
    employeeId: string
    averageDuration: number
  }>({ isOpen: false, shift: null, employeeName: '', employeeId: '', averageDuration: 8 })

  // Calculate average shift duration for an employee
  const calculateAverageDuration = (employeeId: string): number => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return 8
    const completedShifts = employee.workedShifts.filter(s => s.clockOut && s.hoursWorked > 0)
    if (completedShifts.length === 0) return 8
    const totalHours = completedShifts.reduce((sum, s) => sum + s.hoursWorked, 0)
    return totalHours / completedShifts.length
  }

  // Handlers for shift editing
  const handleEditShift = (shift: WorkedShift, employeeName: string, employeeId: string) => {
    setEditModal({
      isOpen: true,
      shift,
      employeeName,
      employeeId,
      averageDuration: calculateAverageDuration(employeeId)
    })
  }

  const handleCreateShift = (employeeName: string, employeeId: string) => {
    setEditModal({
      isOpen: true,
      shift: null,
      employeeName,
      employeeId,
      averageDuration: calculateAverageDuration(employeeId)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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

      {/* Week Toggle - 3-option Segmented Control */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-full">
        <button
          onClick={() => setWeekSelection('this')}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
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
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
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
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
            weekSelection === 'lastPayPeriod'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          type="button"
        >
          Bi-weekly
        </button>
      </div>
      {/* Date Range Display */}
      {dateRange.start && dateRange.end && (
        <div className="text-center text-sm text-gray-500 mb-4">
          {format(parseISO(dateRange.start), 'MMM d')} – {format(parseISO(dateRange.end), 'MMM d, yyyy')}
        </div>
      )}

      {loading ? (
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          Loading payroll data...
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          {weekSelection === 'lastPayPeriod'
            ? 'No bi-weekly employees with hours for this period'
            : 'No weekly employees with hours for last week'
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
                weekSelection={weekSelection}
                onFinalize={handleFinalizeEmployee}
                onLogPayment={(arrangement) => setLogPaymentModal({
                  isOpen: true,
                  employee,
                  arrangement
                })}
                isFinalizing={finalizingEmployee === employee.id}
                onEditShift={handleEditShift}
                onCreateShift={handleCreateShift}
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

      {/* Log Payment Modal */}
      {logPaymentModal.employee && logPaymentModal.arrangement && (
        <LogPaymentModal
          isOpen={logPaymentModal.isOpen}
          onClose={() => setLogPaymentModal({ isOpen: false, employee: null, arrangement: null })}
          onSave={handleLogPayment}
          employeeName={logPaymentModal.employee.name}
          employeeId={logPaymentModal.employee.id}
          arrangement={logPaymentModal.arrangement}
          defaultHours={logPaymentModal.employee.totalHours}
          weekSelection={weekSelection}
        />
      )}

      {/* Edit Time Log Modal */}
      <EditTimeLogModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, shift: null, employeeName: '', employeeId: '', averageDuration: 8 })}
        averageDuration={editModal.averageDuration}
        onSave={async (clockInId, clockOutId, clockInTime, clockOutTime, needsClockOutCreate, needsClockInCreate) => {
          let success = true

          // Handle CREATE MODE: Create both clock-in and clock-out entries
          if (needsClockInCreate && clockInTime) {
            const result = await handleCreateTimeEntry(editModal.employeeId, 'in', clockInTime)
            if (!result) success = false
          } else if (clockInId && clockInTime) {
            // EDIT MODE: Update clock in if changed
            const result = await handleUpdateTimeEntry(clockInId, clockInTime)
            if (!result) success = false
          }

          // Create or update clock out
          if (needsClockOutCreate && clockOutTime) {
            const result = await handleCreateTimeEntry(editModal.employeeId, 'out', clockOutTime)
            if (!result) success = false
          } else if (clockOutId && clockOutTime) {
            const result = await handleUpdateTimeEntry(clockOutId, clockOutTime)
            if (!result) success = false
          }

          if (success) {
            await refreshData()
          } else {
            throw new Error('Failed to update time entry')
          }
        }}
        onDelete={async (clockInId, clockOutId) => {
          // Delete both clock-in and clock-out entries for this shift via RPC
          const { error: error1 } = clockInId
            ? await supabase.schema('employees').rpc('delete_time_entry', { p_entry_id: clockInId })
            : { error: null }

          const { error: error2 } = clockOutId
            ? await supabase.schema('employees').rpc('delete_time_entry', { p_entry_id: clockOutId })
            : { error: null }

          if (error1 || error2) {
            console.error('Delete errors:', { error1, error2 })
            throw new Error('Failed to delete time entries')
          }

          await refreshData()
        }}
        shift={editModal.shift}
        employeeName={editModal.employeeName}
      />
    </div>
  )
}
