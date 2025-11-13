import { formatAvailabilityTime } from '@/lib'

/**
 * AvailabilityOverlay - Green overlay showing when employee is available
 *
 * Shows on hover over empty cells.
 * Each availability time slot is clickable to preset shift times in the add modal.
 *
 * Used in: ShiftCell component
 */

interface Availability {
  start_time: string
  end_time: string
}

interface AvailabilityOverlayProps {
  availability: Availability[]
  onAvailabilityClick: (avail: Availability) => void
}

export function AvailabilityOverlay({
  availability,
  onAvailabilityClick
}: AvailabilityOverlayProps) {
  if (availability.length === 0) {
    return null
  }

  return (
    <div
      className="absolute inset-0 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col justify-center items-center gap-1"
      style={{
        background: 'rgba(134, 239, 172, 0.3)',
      }}
    >
      {/* Clickable availability blocks */}
      <div className="text-center pointer-events-auto space-y-1">
        {availability.map((avail, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation()
              onAvailabilityClick(avail)
            }}
            className="block w-full text-xs font-medium text-gray-700 hover:text-green-900 hover:bg-green-200/50 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            {formatAvailabilityTime(avail.start_time)} - {formatAvailabilityTime(avail.end_time)}
          </button>
        ))}
      </div>
    </div>
  )
}
