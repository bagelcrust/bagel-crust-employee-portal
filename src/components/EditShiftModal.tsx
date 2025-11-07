import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import TimeInput from './TimeInput'

// Minimal shift type for editing - works with both draft and published shifts
type EditableShift = {
  id: number
  start_time: string
  end_time: string
  location: string | null
  status?: string
}

interface EditShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shiftId: number, startTime: string, endTime: string, location: string) => Promise<void>
  shift: EditableShift | null
  employeeName: string
}

/**
 * Modal for editing an existing shift
 * When saved, shift automatically becomes a draft (even if it was published)
 */
export default function EditShiftModal({
  isOpen,
  onClose,
  onSave,
  shift,
  employeeName
}: EditShiftModalProps) {
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('12:00')
  const [location, setLocation] = useState('Calder')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-populate form when shift changes
  useEffect(() => {
    if (shift) {
      // Convert UTC timestamps to Eastern Time
      // Database stores in UTC, but we display in Eastern Time
      const startDate = new Date(shift.start_time)
      const endDate = new Date(shift.end_time)

      // Convert to Eastern Time string (e.g., "11/7/2025, 7:00:00 AM")
      const startET = startDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      const endET = endDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      // Extract HH:mm from the formatted string (e.g., "07:00")
      const startTime24 = startET.split(', ')[0] || startET
      const endTime24 = endET.split(', ')[0] || endET

      setStartTime(startTime24)
      setEndTime(endTime24)
      setLocation(shift.location || 'Calder')
    }
  }, [shift])

  if (!isOpen || !shift) return null

  const shiftDate = new Date(shift.start_time)

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      // Convert Eastern Time back to UTC for database storage
      // Get the shift date in YYYY-MM-DD format
      const dateET = format(shiftDate, 'yyyy-MM-dd')

      // Create Date objects in Eastern Time
      // We'll create a date string and let the browser parse it in ET
      const startETStr = `${dateET} ${startTime}:00 EST`
      const endETStr = `${dateET} ${endTime}:00 EST`

      // Create Date objects - the browser will parse these as Eastern Time
      const startDate = new Date(startETStr)
      const endDate = new Date(endETStr)

      // Convert to UTC ISO strings
      const startISO = startDate.toISOString()
      const endISO = endDate.toISOString()

      await onSave(shift.id, startISO, endISO, location)

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update shift')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  // Determine if shift is published
  const isPublished = shift.status === 'published'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Edit Shift
        </h2>
        <p className="text-gray-600 mb-2">
          {employeeName} • {format(shiftDate, 'EEE, MMM d')}
        </p>

        {/* Published warning */}
        {isPublished && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ This shift is published
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Editing will change it back to draft status. You'll need to republish the week.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Start Time */}
          <TimeInput
            label="Start Time"
            value={startTime}
            onChange={setStartTime}
            disabled={isSaving}
          />

          {/* End Time */}
          <TimeInput
            label="End Time"
            value={endTime}
            onChange={setEndTime}
            disabled={isSaving}
          />

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSaving}
            >
              <option value="Calder">Calder</option>
              <option value="Beaver">Beaver</option>
              <option value="Bagel Crust">Bagel Crust</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
