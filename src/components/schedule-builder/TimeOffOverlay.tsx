/**
 * TimeOffOverlay - Orange/gray overlay for unavailable times
 *
 * Shows on hover over cells with time-off or no availability.
 * - All-day time-off: Orange "Unavailable" message
 * - No availability data: Gray "Not Available" message
 *
 * Used in: ShiftCell component
 */

interface TimeOffOverlayProps {
  hasAllDayTimeOff: boolean
  hasNoAvailability: boolean
  timeOffReason?: string
}

export function TimeOffOverlay({
  hasAllDayTimeOff,
  hasNoAvailability,
  timeOffReason
}: TimeOffOverlayProps) {
  if (hasAllDayTimeOff) {
    return (
      <div
        className="absolute inset-0 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col justify-center items-center"
        style={{
          background: 'rgba(251, 146, 60, 0.25)',
        }}
      >
        <p className="text-xs font-bold text-orange-900">
          Unavailable
        </p>
        {timeOffReason && (
          <p className="text-xs text-orange-800 mt-1 text-center">
            {timeOffReason}
          </p>
        )}
      </div>
    )
  }

  if (hasNoAvailability) {
    return (
      <div
        className="absolute inset-0 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col justify-center items-center"
        style={{
          background: 'rgba(156, 163, 175, 0.2)',
        }}
      >
        <p className="text-xs font-bold text-gray-600">
          Not Available
        </p>
      </div>
    )
  }

  return null
}
