/**
 * Time Logs Tab - Owner "Triage" view for editing employee time entries
 *
 * Pure exception list. RED FLAGS:
 * - Excessive Duration: > 13 hours (forgot to clock out)
 * - Short Duration: < 0.5 hours (30 mins)
 * - Auto Clock Out: System closed the shift
 *
 * NOTE: Being currently clocked in is NOT a red flag.
 * Only shows This Week - no toggle needed.
 */

import { useState, useMemo } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { usePayrollData } from './payroll/usePayrollData'
import { TimeLogCard } from './payroll/TimeLogCard'
import { EditTimeLogModal } from './payroll/EditTimeLogModal'
import type { WorkedShift, EmployeePayroll } from './payroll/types'

// Red flag detection for a single shift
// NOTE: isIncomplete (currently clocked in) is NOT a red flag
const isRedFlagShift = (shift: WorkedShift): boolean => {
  // Auto-clocked out by system
  if (shift.isAutoClockOut) return true
  // Excessive duration (> 13 hours) - likely forgot to clock out
  if (shift.hoursWorked > 13) return true
  // Short duration (< 30 minutes, but not 0 which means still clocked in)
  if (shift.hoursWorked > 0 && shift.hoursWorked < 0.5) return true
  return false
}

export function TimeLogsTab() {
  const {
    loading,
    employees,
    handleUpdateTimeEntry,
    handleCreateTimeEntry,
    refreshData
  } = usePayrollData()

  // Modal state
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

    // Get completed shifts (with clock out)
    const completedShifts = employee.workedShifts.filter(s => s.clockOut && s.hoursWorked > 0)
    if (completedShifts.length === 0) return 8

    // Calculate average
    const totalHours = completedShifts.reduce((sum, s) => sum + s.hoursWorked, 0)
    return totalHours / completedShifts.length
  }

  // Filter logic: get employees with flagged shifts only
  const { filteredEmployees, totalFlaggedShifts } = useMemo(() => {
    const filtered: EmployeePayroll[] = []
    let flagCount = 0

    for (const emp of employees) {
      const flaggedShifts = emp.workedShifts.filter(isRedFlagShift)
      if (flaggedShifts.length > 0) {
        // Only include flagged shifts in the employee object
        filtered.push({
          ...emp,
          workedShifts: flaggedShifts,
          totalHours: flaggedShifts.reduce((sum, s) => sum + s.hoursWorked, 0)
        })
        flagCount += flaggedShifts.length
      }
    }

    return { filteredEmployees: filtered, totalFlaggedShifts: flagCount }
  }, [employees])

  if (loading) {
    return (
      <div className="text-center text-gray-500 text-base font-semibold py-8">
        Loading time logs...
      </div>
    )
  }

  // All Clear state - no flagged shifts
  const isAllClear = totalFlaggedShifts === 0

  return (
    <div className="space-y-4">
      {/* Title */}
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Time Logs</h1>

      {/* Action Required Header OR All Clear */}
      {isAllClear ? (
        <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-green-800">All Clear</div>
          <div className="text-sm text-green-600 mt-1">No problematic shifts this week</div>
        </div>
      ) : (
        <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-lg font-bold text-orange-800">
              Action Required: {totalFlaggedShifts} Shift{totalFlaggedShifts !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm text-orange-600 mt-1">
            Long shifts (&gt;13h), short shifts (&lt;30m), or auto-clockouts
          </div>
        </div>
      )}

      {/* Employee Cards - only shown when there are flagged shifts */}
      {!isAllClear && (
        <div className="space-y-3">
          {filteredEmployees.map((employee) => (
            <TimeLogCard
              key={employee.id}
              employee={employee}
              onEditShift={(shift, employeeName, employeeId) => {
                setEditModal({
                  isOpen: true,
                  shift,
                  employeeName,
                  employeeId,
                  averageDuration: calculateAverageDuration(employeeId)
                })
              }}
              onCreateShift={(employeeName, employeeId) => {
                setEditModal({
                  isOpen: true,
                  shift: null,
                  employeeName,
                  employeeId,
                  averageDuration: calculateAverageDuration(employeeId)
                })
              }}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
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
            // Create new clock-out entry
            const result = await handleCreateTimeEntry(editModal.employeeId, 'out', clockOutTime)
            if (!result) success = false
          } else if (clockOutId && clockOutTime) {
            // Update existing clock-out
            const result = await handleUpdateTimeEntry(clockOutId, clockOutTime)
            if (!result) success = false
          }

          if (success) {
            // Refresh data to show updated times
            await refreshData()
          } else {
            throw new Error('Failed to update time entry')
          }
        }}
        shift={editModal.shift}
        employeeName={editModal.employeeName}
      />
    </div>
  )
}
