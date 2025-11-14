import { useMemo } from 'react'

interface TimeInputProps {
  value: string // "HH:mm" format (e.g., "14:30")
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
}

/**
 * Custom time input using dropdowns for better UX
 * Much nicer than the default HTML time input
 */
export default function TimeInput({ value, onChange, disabled, label }: TimeInputProps) {
  // Parse the time value (HH:mm format)
  const [hours24, minutes] = value.split(':').map(Number)

  // Convert to 12-hour format
  const isPM = hours24 >= 12
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24
  const period = isPM ? 'PM' : 'AM'

  // Generate hour options (1-12)
  const hourOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => i + 1),
    []
  )

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = useMemo(() =>
    [0, 15, 30, 45],
    []
  )

  const handleHourChange = (newHour: number) => {
    // Convert back to 24-hour format
    let hours24 = newHour
    if (period === 'PM' && newHour !== 12) {
      hours24 = newHour + 12
    } else if (period === 'AM' && newHour === 12) {
      hours24 = 0
    }

    const newValue = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    onChange(newValue)
  }

  const handleMinuteChange = (newMinute: number) => {
    const newValue = `${String(hours24).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`
    onChange(newValue)
  }

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    let newHours24 = hours24

    if (newPeriod === 'PM' && period === 'AM') {
      // Switching to PM
      newHours24 = hours24 === 0 ? 12 : hours24 + 12
      if (newHours24 >= 24) newHours24 -= 12
    } else if (newPeriod === 'AM' && period === 'PM') {
      // Switching to AM
      newHours24 = hours24 === 12 ? 0 : hours24 - 12
      if (newHours24 < 0) newHours24 += 12
    }

    const newValue = `${String(newHours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    onChange(newValue)
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        {/* Hour dropdown */}
        <select
          value={hours12}
          onChange={(e) => handleHourChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {hourOptions.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>

        <span className="flex items-center text-gray-500 font-bold">:</span>

        {/* Minute dropdown */}
        <select
          value={minutes}
          onChange={(e) => handleMinuteChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {minuteOptions.map((minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, '0')}
            </option>
          ))}
        </select>

        {/* AM/PM toggle */}
        <select
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value as 'AM' | 'PM')}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}
