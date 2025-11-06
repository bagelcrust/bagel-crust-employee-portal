import { useState } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'

interface AddShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (startTime: string, endTime: string, location: string) => Promise<void>
  employeeName: string
  date: Date
  hasTimeOff?: boolean
  timeOffReason?: string
}

/**
 * Modal for adding a new shift
 * Allows manager to select start time, end time, and location
 */
export default function AddShiftModal({
  isOpen,
  onClose,
  onSave,
  employeeName,
  date,
  hasTimeOff,
  timeOffReason
}: AddShiftModalProps) {
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('12:00')
  const [location, setLocation] = useState('Bagel Crust')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      // Create ISO timestamps
      const dateStr = format(date, 'yyyy-MM-dd')
      const startISO = `${dateStr}T${startTime}:00.000Z`
      const endISO = `${dateStr}T${endTime}:00.000Z`

      await onSave(startISO, endISO, location)

      // Reset form
      setStartTime('08:00')
      setEndTime('12:00')
      setLocation('Bagel Crust')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create shift')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setStartTime('08:00')
    setEndTime('12:00')
    setLocation('Bagel Crust')
    onClose()
  }

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
          Add Shift
        </h2>
        <p className="text-gray-600 mb-6">
          {employeeName} • {format(date, 'EEE, MMM d')}
        </p>

        {/* Time-off warning */}
        {hasTimeOff && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800 font-medium">
              ⚠️ {employeeName} has time-off: {timeOffReason || 'No reason'}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              You cannot create a shift on this day.
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={hasTimeOff || isSaving}
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={hasTimeOff || isSaving}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={hasTimeOff || isSaving}
            >
              <option value="Bagel Crust">Bagel Crust</option>
              <option value="Other Location">Other Location</option>
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
            disabled={hasTimeOff || isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Add Shift'}
          </button>
        </div>
      </div>
    </div>
  )
}
