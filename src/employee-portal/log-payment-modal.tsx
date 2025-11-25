/**
 * LogPaymentModal - Manual payment logging for payroll
 *
 * Allows owner to record cash/check payments with:
 * - Direct amount entry OR calculated from hours
 * - Payment method selection (cash/check)
 * - Check number tracking
 */

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks, addDays } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Loader2 } from 'lucide-react'

interface PayRateArrangement {
  id: number
  rate: number
  payment_method: string
  pay_schedule: string | null
  tax_classification: string | null
}

interface LogPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
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
  }) => Promise<void>
  employeeName: string
  employeeId: string
  arrangement: PayRateArrangement
  defaultHours: number
  weekSelection: 'this' | 'last' | 'lastPayPeriod'
}

export function LogPaymentModal({
  isOpen,
  onClose,
  onSave,
  employeeName,
  employeeId,
  arrangement,
  defaultHours,
  weekSelection,
}: LogPaymentModalProps) {
  const [entryMode, setEntryMode] = useState<'direct' | 'calculate'>('calculate')
  const [hours, setHours] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check'>('cash')
  const [checkNumber, setCheckNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEntryMode('direct')
      setHours(defaultHours.toFixed(2))
      // Pre-fill amount with calculated value
      setAmount((defaultHours * arrangement.rate).toFixed(2))
      setPaymentMethod('cash')
      setCheckNumber('')
      setNotes('')
    }
  }, [isOpen, defaultHours, arrangement.rate])

  // Calculate pay period dates
  const getPayPeriodDates = () => {
    const nowET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    const todayET = new Date(nowET)

    if (weekSelection === 'lastPayPeriod') {
      const twoWeeksAgo = subWeeks(todayET, 2)
      const oneWeekAgo = subWeeks(todayET, 1)
      const mondayET = startOfWeek(twoWeeksAgo, { weekStartsOn: 1 })
      const sundayET = endOfWeek(oneWeekAgo, { weekStartsOn: 1 })
      return {
        start: format(mondayET, 'yyyy-MM-dd'),
        end: format(addDays(sundayET, 1), 'yyyy-MM-dd')
      }
    } else {
      const referenceDate = weekSelection === 'this' ? todayET : subWeeks(todayET, 1)
      const mondayET = startOfWeek(referenceDate, { weekStartsOn: 1 })
      const sundayET = endOfWeek(referenceDate, { weekStartsOn: 1 })
      return {
        start: format(mondayET, 'yyyy-MM-dd'),
        end: format(addDays(sundayET, 1), 'yyyy-MM-dd')
      }
    }
  }

  // Calculate values based on entry mode
  const hourlyRate = arrangement.rate
  // In direct mode: use actual hours worked (defaultHours), not back-calculated
  const finalHours = entryMode === 'calculate' ? (parseFloat(hours) || 0) : defaultHours
  // Fix $0 bug: if amount field is empty/invalid in direct mode, fall back to calculated amount
  const finalAmount = entryMode === 'calculate' ? finalHours * hourlyRate : (parseFloat(amount) || (defaultHours * hourlyRate))
  // For warning: what the pay SHOULD be based on hours
  const expectedAmount = defaultHours * hourlyRate
  const amountDiffers = entryMode === 'direct' && Math.abs(finalAmount - expectedAmount) > 0.01

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (entryMode === 'calculate' && (!hours || parseFloat(hours) <= 0)) {
      alert('Please enter valid hours')
      return
    }
    if (entryMode === 'direct' && (!amount || parseFloat(amount) <= 0)) {
      alert('Please enter valid amount')
      return
    }
    // Check number is optional - database accepts null

    setIsLoading(true)

    try {
      const dates = getPayPeriodDates()

      await onSave({
        employeeId,
        arrangementId: arrangement.id,
        totalHours: finalHours,
        hourlyRate,
        grossPay: finalAmount,
        paymentMethod,
        checkNumber: paymentMethod === 'check' ? checkNumber.trim() : '',
        notes: notes.trim(),
        payPeriodStart: dates.start,
        payPeriodEnd: dates.end,
      })

      onClose()
    } catch (error) {
      console.error('Failed to save payment:', error)
      alert('Failed to save payment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const dates = getPayPeriodDates()
  const periodDisplay = `${format(new Date(dates.start), 'MMM d')} - ${format(new Date(dates.end), 'MMM d')}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Log Payment</DialogTitle>
          <DialogDescription>
            {employeeName} • {periodDisplay}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Entry Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setEntryMode('direct')}
              className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${
                entryMode === 'direct'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Direct Amount
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('calculate')}
              className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${
                entryMode === 'calculate'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              From Hours
            </button>
          </div>

          {/* Hours or Amount Entry */}
          {entryMode === 'calculate' ? (
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                step="0.01"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0.00"
                className="text-lg"
              />
              <div className="text-sm text-gray-600">
                @ ${hourlyRate.toFixed(2)}/hr = <span className="font-semibold">${finalAmount.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-lg"
              />
              <div className="text-sm text-gray-600">
                {defaultHours.toFixed(2)} hrs @ ${hourlyRate.toFixed(2)}/hr = ${expectedAmount.toFixed(2)}
              </div>
              {amountDiffers && (
                <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                  ⚠️ Amount differs from calculated (${expectedAmount.toFixed(2)})
                </div>
              )}
            </div>
          )}

          {/* Notes (optional, shows when amount differs or always in direct mode) */}
          {entryMode === 'direct' && (
            <div className="space-y-2">
              <Label htmlFor="notes">Note (optional)</Label>
              <Input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Rounded up, bonus, etc."
              />
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium">Cash</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'check'}
                  onChange={() => setPaymentMethod('check')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium">Check</span>
              </label>
            </div>
          </div>

          {/* Check Number (conditional) */}
          {paymentMethod === 'check' && (
            <div className="space-y-2">
              <Label htmlFor="checkNumber">Check Number</Label>
              <Input
                id="checkNumber"
                type="text"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="Check # (optional)"
              />
            </div>
          )}

          <DialogFooter className="gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
