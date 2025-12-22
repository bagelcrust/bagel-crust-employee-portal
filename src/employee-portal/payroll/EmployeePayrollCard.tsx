/**
 * EmployeePayrollCard Component (Expandable View)
 *
 * Shows: Name, Role, Total Hours, Total Pay, Payment Status
 * Expandable: Click to show individual shifts with edit capability
 *
 * Split Pay Logic:
 * - Employees can have multiple pay arrangements (e.g., Carlos: Weekly + Bi-weekly)
 * - Each arrangement is tracked separately in paidArrangements Map
 * - Card shows status of each arrangement when multiple exist
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle, ChevronDown, ChevronUp, Pencil, Plus, AlertTriangle, Clock, MoreHorizontal } from 'lucide-react'
import { formatHoursMinutes } from '../../shared/employeeUtils'
import type { EmployeePayrollCardProps, PayRateArrangement } from './types'

export function EmployeePayrollCard({ employee, weekSelection, onLogPayment, onQuickLogPayment, isFinalizing, onEditShift, onCreateShift }: EmployeePayrollCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format name as "First L."
  const nameParts = employee.name.split(' ')
  const displayName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : nameParts[0]

  // Filter arrangements based on current tab view
  // - This Week → Show ALL arrangements (monitoring view)
  // - Last Week → Weekly arrangements only (paying weekly employees)
  // - Bi-weekly → Bi-weekly arrangements only (paying bi-weekly employees)
  const visibleArrangements = employee.payRateArrangements.filter(arr => {
    if (weekSelection === 'this') {
      // "This Week" is for monitoring - show all arrangements
      return true
    }
    if (weekSelection === 'lastPayPeriod') {
      return arr.pay_schedule === 'Bi-weekly'
    }
    // Last Week → Weekly (or null/undefined for legacy data)
    return arr.pay_schedule === 'Weekly' || !arr.pay_schedule
  })

  // Debug: Log arrangement filtering
  if (employee.name.includes('Carlos') || employee.name.includes('Clara')) {
    console.log(`[PayrollCard] ${employee.name}:`, {
      weekSelection,
      allArrangements: employee.payRateArrangements.map(a => ({ schedule: a.pay_schedule, rate: a.rate })),
      visibleArrangements: visibleArrangements.map(a => ({ schedule: a.pay_schedule, rate: a.rate })),
      totalHours: employee.totalHours
    })
  }

  // Calculate ACTUAL paid amount (sum of all paid arrangements)
  let actualPaidAmount = 0
  employee.paidArrangements.forEach(paidInfo => {
    actualPaidAmount += paidInfo.pay
  })

  // Check if partially paid (some arrangements paid, some not)
  const hasMultipleArrangements = visibleArrangements.length > 1
  const isPartiallyPaid = hasMultipleArrangements &&
    employee.paidArrangements.size > 0 &&
    employee.paidArrangements.size < visibleArrangements.length

  // Select arrangement: if paid, use the one from record; otherwise use first visible arrangement
  const selectedArrangementId = employee.selectedArrangement?.id || visibleArrangements[0]?.id

  // Calculate hours for a specific arrangement (split-pay logic)
  // RULE: Bi-weekly ALWAYS gets first 40h, Weekly gets remainder (OT)
  const calculateDefaultHours = (arrangementId: number): number => {
    const arrangement = employee.payRateArrangements.find(arr => arr.id === arrangementId)
    if (!arrangement) return employee.totalHours

    // For employees with multiple arrangements (Carlos/Mere logic):
    // Priority is hardcoded: Bi-weekly first, Weekly second
    if (employee.payRateArrangements.length > 1) {
      // Bi-weekly gets first 40 hours (or less if total < 40)
      if (arrangement.pay_schedule === 'Bi-weekly') {
        // If already paid, return 0
        if (employee.paidArrangements.has(arrangementId)) return 0
        return Math.min(40, employee.totalHours)
      }
      // Weekly gets everything over 40 (OT hours)
      else if (arrangement.pay_schedule === 'Weekly') {
        // If already paid, return 0
        if (employee.paidArrangements.has(arrangementId)) return 0
        return Math.max(0, employee.totalHours - 40)
      }
    }

    // Single arrangement: return total minus already paid
    let remainingHours = employee.totalHours
    employee.paidArrangements.forEach(paidInfo => {
      remainingHours -= paidInfo.hours
    })
    return remainingHours
  }

  // Get current arrangement based on selection
  const currentArrangement = visibleArrangements.find(arr => arr.id === selectedArrangementId) || visibleArrangements[0]

  // Calculate hours and pay for visible arrangement(s) only
  // For split-pay employees, this shows only the hours that apply to current tab
  const visibleHours = currentArrangement ? calculateDefaultHours(currentArrangement.id) : employee.totalHours
  const hourlyRate = currentArrangement?.rate || 0
  const expectedPay = visibleHours * hourlyRate

  // Check for flagged shifts
  const hasFlags = employee.hasIncompleteShifts || employee.workedShifts.some(s => s.isAutoClockOut)

  // Hours display component (shared) - shows total hours with decimal
  const HoursDisplay = ({ colorClass = 'text-gray-500', decimalColorClass = 'text-gray-400' }: { colorClass?: string, decimalColorClass?: string }) => (
    <div className={`text-sm ${colorClass}`}>
      {formatHoursMinutes(employee.totalHours)} <span className={decimalColorClass}>({employee.totalHours.toFixed(2)})</span>
    </div>
  )

  // Shift list component (shared between paid and unpaid)
  const ShiftsList = () => (
    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50">
      <div className="space-y-1">
        {employee.workedShifts.map((shift, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-[1fr_auto_auto] gap-2 items-center py-2 px-3 rounded ${
              shift.isIncomplete
                ? 'bg-orange-100 border border-orange-300'
                : shift.isAutoClockOut
                ? 'bg-yellow-50 border border-yellow-300'
                : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            {/* Shift Info */}
            <div className="text-sm">
              <div className="font-semibold text-gray-800">{shift.dayName}</div>
              <div className="text-gray-600 flex items-center gap-2">
                <span>{shift.clockIn} - {shift.clockOut || '???'}</span>
                {shift.isAutoClockOut && (
                  <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded">AUTO</span>
                )}
              </div>
            </div>

            {/* Hours + Daily Earnings */}
            <div className={`text-sm font-bold text-right ${shift.isIncomplete ? 'text-orange-600' : 'text-gray-900'}`}>
              {shift.isIncomplete ? '—' : (
                <>
                  {formatHoursMinutes(shift.hoursWorked)}
                  <span className="text-green-600 ml-1">→ ${(shift.hoursWorked * hourlyRate).toFixed(2)}</span>
                </>
              )}
            </div>

            {/* Edit Button */}
            {onEditShift && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditShift(shift, employee.name, employee.id)
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit time entry"
                type="button"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      {/* Add Shift Button */}
      {onCreateShift && (
        <button
          onClick={() => onCreateShift(employee.name, employee.id)}
          className="mt-2 w-full py-2 text-sm text-gray-500 hover:text-green-600 hover:bg-green-50 rounded border border-dashed border-gray-300 hover:border-green-400 transition-colors flex items-center justify-center gap-1"
          type="button"
        >
          <Plus size={16} />
          Add Shift
        </button>
      )}
    </div>
  )

  // Check if same tax_classification appears multiple times (Clara's case: 2 W-2 rates)
  const taxClassCounts = employee.payRateArrangements.reduce((acc, arr) => {
    const key = arr.tax_classification || 'Cash'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Arrangement status row component (for split-pay employees)
  const ArrangementRow = ({ arrangement }: { arrangement: PayRateArrangement }) => {
    const isPaid = employee.paidArrangements.has(arrangement.id)
    const paidInfo = employee.paidArrangements.get(arrangement.id)
    const defaultHours = calculateDefaultHours(arrangement.id)

    // Badge: show tax classification (1099, W-2, Cash)
    const taxClass = arrangement.tax_classification?.toUpperCase() || 'CASH'
    const badgeColor = taxClass === '1099' ? 'bg-orange-100 text-orange-700'
      : taxClass === 'W-2' ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-600'

    // Show rate only if same tax_classification appears multiple times (Clara's case)
    const showRate = taxClassCounts[arrangement.tax_classification || 'Cash'] > 1

    if (isPaid && paidInfo) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${badgeColor}`}>{taxClass}</span>
            <span className="text-sm text-gray-600">
              {(isNaN(paidInfo.hours) ? defaultHours : paidInfo.hours).toFixed(1)}h
              {showRate && <span className="ml-1">@ ${arrangement.rate}</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-green-100 rounded-md py-2 px-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-bold text-sm">${paidInfo.pay.toFixed(0)} Paid</span>
          </div>
        </div>
      )
    }

    // Quick-pay: rounded down to whole dollar, using last payment method
    const quickAmount = Math.floor(defaultHours * arrangement.rate)
    const quickMethod = employee.lastPaymentMethod || 'check'

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${badgeColor}`}>{taxClass}</span>
          <span className="text-sm text-gray-600">
            {defaultHours.toFixed(1)}h
            {showRate && <span className="ml-1">@ ${arrangement.rate}</span>}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onQuickLogPayment(arrangement, defaultHours, quickAmount, quickMethod)
            }}
            disabled={isFinalizing}
            className={`flex-1 py-2.5 text-white font-bold text-sm rounded-md transition-all disabled:bg-gray-300 ${
              quickMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            type="button"
          >
            ${quickAmount} {quickMethod === 'cash' ? 'Cash' : 'Check'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onLogPayment(arrangement, defaultHours)
            }}
            disabled={isFinalizing}
            className="px-3 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-all disabled:opacity-50"
            type="button"
            title="Custom amount"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    )
  }

  // If already FULLY paid, show read-only green card
  if (employee.isPaid) {
    return (
      <div id={`employee-card-${employee.id}`} className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 overflow-hidden">
        {/* Main Content - Clickable Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-4 flex items-center justify-between text-left"
          type="button"
        >
          {/* Left: Name */}
          <div className="flex items-center gap-2">
            <div className="font-bold text-green-800 text-xl">
              {displayName}
            </div>
            {hasFlags && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>

          {/* Right: Hours + Pay + Chevron */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              {/* ACTUAL paid amount, not calculated */}
              <div className="text-2xl font-bold text-green-800">
                ${actualPaidAmount.toFixed(2)}
              </div>
              <div className="text-sm text-green-600">
                ${hourlyRate.toFixed(2)} × {employee.totalHours.toFixed(2)}h
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-green-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-green-600" />
            )}
          </div>
        </button>

        {/* Expanded Shifts */}
        {isExpanded && <ShiftsList />}

        {/* Split arrangements detail (if multiple) */}
        {hasMultipleArrangements && (
          <div className="px-4 py-2 border-t border-green-200 space-y-1">
            {visibleArrangements.map(arr => (
              <ArrangementRow key={arr.id} arrangement={arr} />
            ))}
          </div>
        )}

        {/* Payment Info */}
        <div className="px-4 py-3 bg-green-100 border-t border-green-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold text-sm">PAID</span>
          </div>
          <div className="text-sm text-green-700">
            {currentArrangement?.payment_method?.toUpperCase()}
            {employee.paymentDate && ` · ${format(new Date(employee.paymentDate), 'MMM d')}`}
          </div>
        </div>
      </div>
    )
  }

  // PARTIALLY paid card (yellow) - some arrangements paid, some not
  if (isPartiallyPaid) {
    return (
      <div id={`employee-card-${employee.id}`} className="bg-amber-50 rounded-lg shadow-sm border-2 border-amber-200 overflow-hidden">
        {/* Main Content - Clickable Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-4 flex items-center justify-between text-left"
          type="button"
        >
          {/* Left: Name */}
          <div className="flex items-center gap-2">
            <div className="font-bold text-amber-800 text-xl">
              {displayName}
            </div>
            {hasFlags && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>

          {/* Right: Hours + Paid so far + Chevron */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-800">
                ${actualPaidAmount.toFixed(2)} <span className="text-base font-normal text-amber-600">paid</span>
              </div>
              <HoursDisplay colorClass="text-amber-600" decimalColorClass="text-amber-500" />
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-amber-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-600" />
            )}
          </div>
        </button>

        {/* Expanded Shifts */}
        {isExpanded && <ShiftsList />}

        {/* Split arrangements detail - ALWAYS show for partial */}
        <div className="px-4 py-2 border-t border-amber-200 space-y-1">
          {visibleArrangements.map(arr => (
            <ArrangementRow key={arr.id} arrangement={arr} />
          ))}
        </div>

        {/* Partial Status */}
        <div className="px-4 py-3 bg-amber-100 border-t border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="w-4 h-4" />
            <span className="font-semibold text-sm">PARTIAL</span>
          </div>
          <div className="text-sm text-amber-700">
            {employee.paidArrangements.size} of {visibleArrangements.length} arrangements paid
          </div>
        </div>
      </div>
    )
  }

  // Unpaid card (white) with payment actions
  return (
    <div id={`employee-card-${employee.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Main Content - Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between text-left"
        type="button"
      >
        {/* Left: Name */}
        <div className="flex items-center gap-2">
          <div className="font-bold text-gray-900 text-xl">
            {displayName}
          </div>
          {hasFlags && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        </div>

        {/* Right: Hours + Pay + Chevron */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${expectedPay.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              ${hourlyRate.toFixed(2)} × {visibleHours.toFixed(2)}h
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Shifts */}
      {isExpanded && <ShiftsList />}

      {/* Split arrangements detail (if multiple) */}
      {hasMultipleArrangements && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-3">
          {visibleArrangements.map(arr => (
            <ArrangementRow key={arr.id} arrangement={arr} />
          ))}
        </div>
      )}

      {/* Payment Actions - Single arrangement with quick-pay */}
      {!hasMultipleArrangements && currentArrangement && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {(() => {
            const quickAmount = Math.floor(visibleHours * currentArrangement.rate)
            const quickMethod = employee.lastPaymentMethod || 'check'
            return (
              <div className="flex gap-2">
                {/* Quick-pay button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onQuickLogPayment(currentArrangement, visibleHours, quickAmount, quickMethod)
                  }}
                  disabled={isFinalizing}
                  className={`flex-1 py-2.5 text-white font-bold text-sm rounded-md transition-all disabled:bg-gray-300 disabled:cursor-not-allowed ${
                    quickMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  type="button"
                >
                  {isFinalizing ? 'Processing...' : `$${quickAmount} ${quickMethod === 'cash' ? 'Cash' : 'Check'}`}
                </button>
                {/* Custom/edit button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onLogPayment(currentArrangement, visibleHours)
                  }}
                  disabled={isFinalizing}
                  className="px-3 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-all disabled:opacity-50"
                  type="button"
                  title="Custom amount"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
