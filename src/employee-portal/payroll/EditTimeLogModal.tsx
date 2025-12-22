/**
 * EditTimeLogModal - Quick fix for time entry edits
 *
 * Mobile-optimized modal with +/- 15 minute buttons for fast adjustments.
 * Updates individual time entries via update_time_entry RPC.
 * Can create missing clock-out entries with smart 8-hour default.
 */

import { useState, useEffect } from 'react'
import { format, parse, addMinutes, subMinutes, startOfWeek, addDays, isSameDay } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import type { WorkedShift } from './types'

interface EditTimeLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    clockInId: number | null,
    clockOutId: number | null,
    clockInTime: Date | null,
    clockOutTime: Date | null,
    needsClockOutCreate: boolean,
    needsClockInCreate: boolean
  ) => Promise<void>
  onDelete?: (clockInId: number | null, clockOutId: number | null) => Promise<void>
  shift: WorkedShift | null
  employeeName: string
  averageDuration?: number // Average shift duration in hours for smart defaults
}

export function EditTimeLogModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  shift,
  employeeName,
  averageDuration = 8, // Default to 8 hours if no history
}: EditTimeLogModalProps) {
  const [clockInTime, setClockInTime] = useState<Date | null>(null)
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null)
  const [noClockOut, setNoClockOut] = useState(false) // "Still working" toggle
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Generate week days for date selector (Mon-Sun of current week)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Initialize times when modal opens
  useEffect(() => {
    if (isOpen && shift) {
      // EDIT MODE: Parse the formatted time strings back to Date objects
      const baseDate = shift.date

      // Parse clock in time
      const clockInParsed = parse(
        `${baseDate} ${shift.clockIn}`,
        'yyyy-MM-dd h:mm a',
        new Date()
      )
      setClockInTime(clockInParsed)

      // Parse clock out time or set smart default based on average duration
      if (shift.clockOut) {
        const clockOutParsed = parse(
          `${baseDate} ${shift.clockOut}`,
          'yyyy-MM-dd h:mm a',
          new Date()
        )
        setClockOutTime(clockOutParsed)
        setNoClockOut(false)
      } else {
        // Shift has no clock-out - keep it that way by default
        setClockOutTime(null)
        setNoClockOut(true)
      }
    } else if (isOpen && !shift) {
      // CREATE MODE: Set default times for new entry
      const today = new Date()
      setSelectedDate(today)
      setNoClockOut(false) // Default to having a clock-out

      // Default clock-in: 8:00 AM
      const defaultClockIn = new Date(today)
      defaultClockIn.setHours(8, 0, 0, 0)
      setClockInTime(defaultClockIn)

      // Default clock-out: based on average duration or 8 hours
      const durationMinutes = Math.round(averageDuration * 60)
      setClockOutTime(addMinutes(defaultClockIn, durationMinutes))
    }
  }, [isOpen, shift, averageDuration])

  // Update times when date changes in create mode
  useEffect(() => {
    if (isOpen && !shift && clockInTime) {
      // Update clock in/out to new date while preserving times
      const newClockIn = new Date(selectedDate)
      newClockIn.setHours(clockInTime.getHours(), clockInTime.getMinutes(), 0, 0)
      setClockInTime(newClockIn)

      if (clockOutTime) {
        const newClockOut = new Date(selectedDate)
        newClockOut.setHours(clockOutTime.getHours(), clockOutTime.getMinutes(), 0, 0)
        setClockOutTime(newClockOut)
      }
    }
  }, [selectedDate])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // If "no clock-out" is checked, pass null for clock-out
      const effectiveClockOut = noClockOut ? null : clockOutTime

      if (shift) {
        // EDIT MODE: Determine if we need to create a new clock-out entry
        const needsClockOutCreate = !shift.clockOutId && effectiveClockOut !== null

        await onSave(
          shift.clockInId || null,
          shift.clockOutId || null,
          clockInTime,
          effectiveClockOut,
          needsClockOutCreate,
          false // not creating clock-in
        )
      } else {
        // CREATE MODE: Create clock-in, optionally clock-out
        await onSave(
          null,
          null,
          clockInTime,
          effectiveClockOut,
          !noClockOut, // only create clock-out if toggle is off
          true  // create clock-in
        )
      }
      onClose()
    } catch (error) {
      console.error('Failed to save time entry:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!shift || !onDelete) return

    // Confirmation
    const confirmed = window.confirm(
      `Delete this shift?\n\n${shift.dayName}: ${shift.clockIn} - ${shift.clockOut || '???'}\n\nThis cannot be undone.`
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await onDelete(shift.clockInId || null, shift.clockOutId || null)
      onClose()
    } catch (error) {
      console.error('Failed to delete time entry:', error)
      alert('Failed to delete. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Smart snap to nearest 15-minute mark
  // If pressing -, snap down to nearest 15m (7:07 -> 7:00 -> 6:45)
  // If pressing +, snap up to nearest 15m (7:07 -> 7:15 -> 7:30)
  const adjustTime = (
    setter: React.Dispatch<React.SetStateAction<Date | null>>,
    currentTime: Date | null,
    direction: 'up' | 'down'
  ) => {
    if (!currentTime) return

    const currentMinutes = currentTime.getMinutes()
    let newMinutes: number

    if (direction === 'down') {
      // Snap down to nearest 15-minute mark
      if (currentMinutes % 15 === 0) {
        // Already on a mark, go to previous
        newMinutes = currentMinutes - 15
      } else {
        // Snap down to nearest
        newMinutes = Math.floor(currentMinutes / 15) * 15
      }
    } else {
      // Snap up to nearest 15-minute mark
      if (currentMinutes % 15 === 0) {
        // Already on a mark, go to next
        newMinutes = currentMinutes + 15
      } else {
        // Snap up to nearest
        newMinutes = Math.ceil(currentMinutes / 15) * 15
      }
    }

    // Calculate the difference and apply
    const diff = newMinutes - currentMinutes
    const newTime = diff >= 0
      ? addMinutes(currentTime, diff)
      : subMinutes(currentTime, Math.abs(diff))

    setter(newTime)
  }

  // Get first name for display
  const firstName = employeeName.split(' ')[0]

  // Determine if we're in create mode
  const isCreateMode = !shift

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[340px] bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-xl">
            {isCreateMode ? 'New Shift' : 'Edit Time Entry'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isCreateMode
              ? `${firstName} · Select date and times`
              : `${firstName} · ${shift.dayName}, ${shift.date}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Date Selector - Only in Create Mode */}
          {isCreateMode && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Day</label>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`py-2 rounded text-xs font-semibold transition-all ${
                      isSameDay(selectedDate, day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    type="button"
                  >
                    {format(day, 'EEE')}
                    <br />
                    {format(day, 'd')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clock In Time */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 mb-2">Clock In</label>
            <div className="flex items-center justify-between w-full px-4">
              <button
                onClick={() => adjustTime(setClockInTime, clockInTime, 'down')}
                className="h-16 w-16 flex-shrink-0 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all rounded-2xl flex items-center justify-center"
                type="button"
              >
                <Minus size={28} className="text-slate-700" />
              </button>
              <div className="text-3xl font-bold text-slate-900 whitespace-nowrap">
                {clockInTime ? format(clockInTime, 'h:mm a') : '--:--'}
              </div>
              <button
                onClick={() => adjustTime(setClockInTime, clockInTime, 'up')}
                className="h-16 w-16 flex-shrink-0 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all rounded-2xl flex items-center justify-center"
                type="button"
              >
                <Plus size={28} className="text-slate-700" />
              </button>
            </div>
          </div>

          {/* Clock Out Time */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Clock Out
                {!isCreateMode && !shift?.clockOut && !noClockOut && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">(will create new entry)</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => {
                  setNoClockOut(!noClockOut)
                  // If turning off "no clock-out", set a default time
                  if (noClockOut && !clockOutTime && clockInTime) {
                    const durationMinutes = Math.round(averageDuration * 60)
                    setClockOutTime(addMinutes(clockInTime, durationMinutes))
                  }
                }}
                className={`text-sm px-3 py-1.5 rounded-full transition-all ${
                  noClockOut
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {noClockOut ? 'Add Clock-Out' : 'Remove'}
              </button>
            </div>
            {!noClockOut && (
              <div className="flex items-center justify-between w-full px-4">
                <button
                  onClick={() => adjustTime(setClockOutTime, clockOutTime, 'down')}
                  className="h-16 w-16 flex-shrink-0 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all rounded-2xl flex items-center justify-center"
                  type="button"
                >
                  <Minus size={28} className="text-slate-700" />
                </button>
                <div className="text-3xl font-bold text-slate-900 whitespace-nowrap">
                  {clockOutTime ? format(clockOutTime, 'h:mm a') : '--:--'}
                </div>
                <button
                  onClick={() => adjustTime(setClockOutTime, clockOutTime, 'up')}
                  className="h-16 w-16 flex-shrink-0 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all rounded-2xl flex items-center justify-center"
                  type="button"
                >
                  <Plus size={28} className="text-slate-700" />
                </button>
              </div>
            )}
            {noClockOut && (
              <div className="text-center py-6 text-slate-400 text-sm">
                —
              </div>
            )}
          </div>

          {/* Hours Preview */}
          {clockInTime && clockOutTime && !noClockOut && (
            <div className="text-center pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Total: </span>
              <span className="text-lg font-bold text-slate-900">
                {((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)).toFixed(2)} hours
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          {/* Delete button - only in edit mode, not create mode */}
          {!isCreateMode && onDelete && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={isLoading || isDeleting}
              className="w-full h-10 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Shift
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isLoading || isDeleting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading || isDeleting}
            className="w-full text-slate-500"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
