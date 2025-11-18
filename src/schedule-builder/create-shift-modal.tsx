import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Loader2, Clock, Plus, Minus } from 'lucide-react'
import { analyzeShiftPatterns, formatShiftPattern } from './analyze-shift-patterns'
import { formatAvailabilityTime } from '../shared/scheduleUtils'

interface HistoricalShift {
  start_time: string
  end_time: string
  location: string
}

interface AddShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (startTime: string, endTime: string, location: string, isOpenShift: boolean) => Promise<void>
  employeeName: string
  date: Date
  hasTimeOff: boolean
  timeOffReason: string
  initialStartTime?: string
  initialEndTime?: string
  initialLocation?: string
  pastShifts?: HistoricalShift[]
  availabilityWindow?: { start: string; end: string } | null
}

export function CreateShiftModal({
  isOpen,
  onClose,
  onSave,
  employeeName,
  date,
  hasTimeOff,
  timeOffReason,
  initialStartTime,
  initialEndTime,
  initialLocation,
  pastShifts = [],
  availabilityWindow,
}: AddShiftDialogProps) {
  const [startTime, setStartTime] = useState(initialStartTime || '09:00')
  const [endTime, setEndTime] = useState(initialEndTime || '17:00')
  const [location, setLocation] = useState(initialLocation || 'Calder')
  const [isOpenShift, setIsOpenShift] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [_showManualEntry, setShowManualEntry] = useState(false)

  // Analyze past shifts for patterns
  const suggestedPatterns = analyzeShiftPatterns(pastShifts)

  useEffect(() => {
    if (isOpen) {
      setStartTime(initialStartTime || '09:00')
      setEndTime(initialEndTime || '17:00')
      setLocation(initialLocation || 'Calder')
      setIsOpenShift(employeeName === 'Open Shift')
      setShowManualEntry(true)
    }
  }, [isOpen, initialStartTime, initialEndTime, initialLocation, employeeName])

  const handlePatternClick = (pattern: { startTime: string; endTime: string; location: string }) => {
    // Normalize time format (remove seconds if present: "11:30:00" -> "11:30")
    const normalizeTime = (time: string) => {
      const parts = time.split(':')
      return `${parts[0]}:${parts[1]}`
    }

    setStartTime(normalizeTime(pattern.startTime))
    setEndTime(normalizeTime(pattern.endTime))
    setLocation(pattern.location)
  }

  // Adjust time by minutes
  const adjustTime = (currentTime: string, minutes: number): string => {
    const [hours, mins] = currentTime.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const adjustedMinutes = ((totalMinutes % 1440) + 1440) % 1440 // Handle wrap-around
    const newHours = Math.floor(adjustedMinutes / 60)
    const newMins = adjustedMinutes % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!startTime || !endTime) {
      console.error('Validation Error: Start time and end time are required')
      return
    }

    setIsLoading(true)

    try {
      // Create Eastern Time timestamp strings (YYYY-MM-DD HH:MM:SS)
      // Postgres will interpret these as Eastern and convert to UTC
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      const [startHours, startMins] = startTime.split(':')
      const startTimestamp = `${dateStr} ${startHours}:${startMins}:00`

      const [endHours, endMins] = endTime.split(':')
      let endTimestamp = `${dateStr} ${endHours}:${endMins}:00`

      // If end time is before start time, assume next day
      if (parseInt(endHours, 10) < parseInt(startHours, 10)) {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)
        const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`
        endTimestamp = `${nextDayStr} ${endHours}:${endMins}:00`
      }

      await onSave(startTimestamp, endTimestamp, location, isOpenShift)
      console.log(`Shift created for ${employeeName}`)
      onClose()
    } catch (error: any) {
      console.error('Error creating shift:', error.message || 'Failed to create shift')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl">Add Shift for {employeeName}</DialogTitle>
          <DialogDescription className="text-sm">
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {availabilityWindow && (
              <span className="block mt-1 text-xs text-zinc-500">
                Available {formatAvailabilityTime(availabilityWindow.start)} - {formatAvailabilityTime(availabilityWindow.end)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasTimeOff && (
          <div className="bg-white/10 border border-white/30 rounded-lg p-4">
            <p className="text-sm font-medium text-white">
              ⚠️ {employeeName} has time-off on this day
            </p>
            <p className="text-xs text-gray-300 mt-1">{timeOffReason}</p>
          </div>
        )}

        {/* Recommended Shifts from Past Month */}
        {suggestedPatterns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-300">Recommended (past month)</p>
            </div>
            <div className="grid gap-2">
              {suggestedPatterns.map((pattern, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePatternClick(pattern)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-white">
                      {formatShiftPattern(pattern)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {pattern.count}x
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time Entry Form - Always Visible */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="start-time" className="text-sm font-medium text-center block">
              Start Time
            </Label>
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setStartTime(adjustTime(startTime, -30))}
                className="h-11 w-11 shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-32 text-base h-11 text-center"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setStartTime(adjustTime(startTime, 30))}
                className="h-11 w-11 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="end-time" className="text-sm font-medium text-center block">
              End Time
            </Label>
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setEndTime(adjustTime(endTime, -30))}
                className="h-11 w-11 shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-32 text-base h-11 text-center"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setEndTime(adjustTime(endTime, 30))}
                className="h-11 w-11 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="min-w-[100px]">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Shift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
