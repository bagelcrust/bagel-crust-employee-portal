/**
 * Shift Card Component
 *
 * Displays a single shift with employee name, time, location, and delete option.
 */

import { X, MapPin } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface ShiftCardProps {
  employeeName: string
  startTime: string
  endTime: string
  location: string
  status: 'draft' | 'published'
  onDelete: () => void
}

export function ShiftCard({
  employeeName,
  startTime,
  endTime,
  location,
  status,
  onDelete
}: ShiftCardProps) {
  // Format time for display
  const formatShiftTime = (timeStr: string) => {
    try {
      const date = parseISO(timeStr)
      return format(date, 'h:mm a')
    } catch {
      return timeStr
    }
  }

  const timeDisplay = `${formatShiftTime(startTime)} - ${formatShiftTime(endTime)}`

  return (
    <div className={`p-3 rounded-lg flex items-center justify-between ${
      status === 'draft'
        ? 'bg-amber-50 border border-amber-200'
        : 'bg-green-50 border border-green-200'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">
          {employeeName}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="text-blue-600 font-medium">{timeDisplay}</span>
          <span className="flex items-center gap-1 text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </span>
        </div>
      </div>

      {/* Only allow deletion of draft shifts */}
      {status === 'draft' && (
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Published indicator */}
      {status === 'published' && (
        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded ml-2 flex-shrink-0">
          Published
        </span>
      )}
    </div>
  )
}
