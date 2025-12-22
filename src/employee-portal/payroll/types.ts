/**
 * Payroll Types
 *
 * Shared type definitions for the payroll feature.
 */

export interface WorkedShift {
  date: string
  dayName: string
  clockIn: string
  clockOut: string | null
  hoursWorked: number
  isIncomplete?: boolean
  isAutoClockOut?: boolean
  isSuspicious?: boolean
  // Database row IDs for editing time entries
  clockInId?: number
  clockOutId?: number
}

export interface FlaggedActivity {
  employeeId: string
  employeeName: string
  date: string
  dayName: string
  clockIn: string
  clockOut: string
  hoursWorked: number
  reason: string
}

export interface PayRateArrangement {
  id: number
  rate: number
  payment_method: string
  pay_schedule: string | null
  tax_classification: string | null
}

export interface EmployeePayroll {
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
  lastPaymentMethod?: 'cash' | 'check' // From most recent payment in archive.payroll_records
  // Computed from selectedArrangement
  hourlyRate?: number
  totalPay?: number
}

export interface EmployeePayrollCardProps {
  employee: EmployeePayroll
  weekSelection: 'this' | 'last' | 'lastPayPeriod'
  onFinalize: (employeeId: string, arrangementId: number, manualHours: number) => void
  onLogPayment: (arrangement: PayRateArrangement, hours: number) => void
  onQuickLogPayment: (arrangement: PayRateArrangement, hours: number, amount: number, method: 'cash' | 'check') => void
  isFinalizing: boolean
  // Optional shift editing callbacks
  onEditShift?: (shift: WorkedShift, employeeName: string, employeeId: string) => void
  onCreateShift?: (employeeName: string, employeeId: string) => void
}

export type WeekSelection = 'this' | 'last' | 'lastPayPeriod'
