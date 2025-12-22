/**
 * TimeOffTab - Time off request form and history
 * Submit new requests and view previous requests
 */

import { MapPin } from 'lucide-react'
import { logCondition, logData } from '../../shared/debug-utils'

interface TimeOffTabProps {
  timeOffStartDate: string
  timeOffEndDate: string
  timeOffReason: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onReasonChange: (reason: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  requests: any[]
}

export function TimeOffTab({
  timeOffStartDate,
  timeOffEndDate,
  timeOffReason,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  onSubmit,
  isSubmitting,
  requests
}: TimeOffTabProps) {
  // Validate props
  logData('TimeOffTab', 'Form state', { timeOffStartDate, timeOffEndDate, timeOffReason, isSubmitting })
  logData('TimeOffTab', 'Requests', requests)
  logCondition('TimeOffTab', 'Has previous requests', requests.length > 0, { count: requests.length })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="w-7 h-7 text-blue-600" />
        <h1 className="text-[28px] font-bold text-gray-800 tracking-tight">
          Time Off
        </h1>
      </div>

      {/* Request Form */}
      <div>
        <h2 className="text-[22px] font-bold text-gray-800 mb-4 tracking-tight">
          Request Time Off
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={timeOffStartDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-3 text-base rounded-lg border border-gray-200 bg-white text-gray-800 font-sans"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={timeOffEndDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={timeOffStartDate || new Date().toISOString().split('T')[0]}
            className="w-full p-3 text-base rounded-lg border border-gray-200 bg-white text-gray-800 font-sans"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Reason (Optional)
          </label>
          <textarea
            value={timeOffReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="E.g., Vacation, doctor's appointment..."
            rows={3}
            className="w-full p-3 text-base rounded-lg border border-gray-200 bg-white text-gray-800 font-sans resize-y"
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || !timeOffStartDate || !timeOffEndDate}
          className={`w-full p-3.5 text-base font-bold rounded-lg border-none transition-all duration-150 font-sans ${
            isSubmitting || !timeOffStartDate || !timeOffEndDate
              ? 'bg-gray-300 cursor-not-allowed text-white'
              : 'bg-blue-600 cursor-pointer text-white'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>

      {/* Previous Requests */}
      {requests.length > 0 && (
        <div>
          <h2 className="text-[22px] font-bold text-gray-800 mb-4 tracking-tight">
            Your Requests
          </h2>
          <div className="flex flex-col gap-2.5">
            {requests
              .filter((request) => {
                // Filter out past time-off (end date is before today)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const [year, month, day] = request.end_date.split('-').map(Number)
                const endDate = new Date(year, month - 1, day)
                const isFuture = endDate >= today
                logCondition('TimeOffTab', `Request ${request.id} is future`, isFuture, { end_date: request.end_date })
                return isFuture
              })
              .map((request) => {
                logData('TimeOffTab', `Rendering request`, request, ['id', 'start_date', 'end_date', 'reason'])
                // Parse date string components directly to avoid timezone bugs
                const parseDate = (dateStr: string) => {
                  const [year, month, day] = dateStr.split('-').map(Number)
                  return new Date(year, month - 1, day)
                }

                const startDate = parseDate(request.start_date)
                const endDate = parseDate(request.end_date)
                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

                return (
                  <div
                    key={request.id}
                    className="p-3.5 px-4 rounded-[10px] flex justify-between items-center border border-gray-200 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
                  >
                    <div className="text-left">
                      <div className="font-semibold text-base text-gray-800 mb-0.5">
                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[13px] text-gray-500">
                        {days} day{days !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {request.reason && (
                      <div className="text-sm text-gray-400 italic text-right max-w-[50%]">
                        {request.reason}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
