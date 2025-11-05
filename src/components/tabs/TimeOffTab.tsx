/**
 * TimeOffTab - Time off request form and history
 * Submit new requests and view previous requests
 */

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
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
      {/* Request Form */}
      <div className="mb-6">
        <h3 className="text-[28px] font-bold text-gray-800 mb-6 tracking-tight">
          Request Time Off
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={timeOffStartDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-3 text-base rounded-lg border border-black/10 bg-white/95 text-gray-800 font-sans"
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
            className="w-full p-3 text-base rounded-lg border border-black/10 bg-white/95 text-gray-800 font-sans"
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
            className="w-full p-3 text-base rounded-lg border border-black/10 bg-white/95 text-gray-800 font-sans resize-y"
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
          <h3 className="text-[22px] font-bold text-gray-800 mb-4 tracking-tight">
            Your Requests
          </h3>
          <div className="rounded-lg overflow-hidden">
            {requests.map((request, index) => {
              const startDate = new Date(request.start_date)
              const endDate = new Date(request.end_date)
              const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

              return (
                <div
                  key={request.id}
                  className={`p-4 text-center ${index < requests.length - 1 ? 'border-b border-black/5' : ''}`}
                >
                  <div className="text-base font-bold text-gray-800 mb-1">
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[13px] text-gray-500 mb-1.5">
                    {days} day{days !== 1 ? 's' : ''}
                  </div>
                  {request.reason && (
                    <div className="text-sm text-gray-400 italic mb-1.5">
                      {request.reason}
                    </div>
                  )}
                  <div className={`text-xs font-semibold uppercase tracking-wide ${
                    request.status === 'pending' ? 'text-amber-500' :
                    request.status === 'approved' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {request.status}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
