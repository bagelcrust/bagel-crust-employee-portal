/**
 * LogPaymentModal - Manual payment logging for payroll
 *
 * Simplified modal:
 * - Shows hours from timesheet (read-only)
 * - Editable amount field (pre-calculated, can override for raises)
 * - Big Cash/Check toggle buttons
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
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check'>('check')
  const [isLoading, setIsLoading] = useState(false)

  const hourlyRate = arrangement.rate
  const expectedAmount = defaultHours * hourlyRate

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(expectedAmount.toFixed(2))
      setPaymentMethod('check')
    }
  }, [isOpen, expectedAmount])

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

  const finalAmount = parseFloat(amount) || 0
  const amountDiffers = Math.abs(finalAmount - expectedAmount) > 0.01

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || finalAmount <= 0) {
      alert('Please enter valid amount')
      return
    }

    setIsLoading(true)

    try {
      const dates = getPayPeriodDates()

      await onSave({
        employeeId,
        arrangementId: arrangement.id,
        totalHours: defaultHours,
        hourlyRate,
        grossPay: finalAmount,
        paymentMethod,
        checkNumber: '',
        notes: '',
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

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Hours display (read-only) - compact */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Hours</div>
              <div className="text-lg font-semibold">{defaultHours.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Rate</div>
              <div className="text-lg font-semibold">${hourlyRate.toFixed(2)}/hr</div>
            </div>
          </div>

          {/* Amount Entry - compact */}
          <div className="space-y-1">
            <Label htmlFor="amount" className="text-xs">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-lg h-10"
            />
            {amountDiffers && (
              <div className="text-xs text-amber-600">
                Calculated: ${expectedAmount.toFixed(2)}
              </div>
            )}
          </div>

          {/* Payment Method Toggle - inline */}
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Method:</Label>
            <div className="flex gap-1 flex-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('check')}
                className={`flex-1 py-1.5 rounded-md font-medium text-sm transition-all ${
                  paymentMethod === 'check'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Check
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-1.5 rounded-md font-medium text-sm transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-9">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 h-9">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
