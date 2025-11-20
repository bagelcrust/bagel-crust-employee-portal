import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { Loader2, Trash2, Plus, Minus } from 'lucide-react'
import type { ScheduleShift } from './fetch-schedule-data'

interface EditShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shiftId: number, startTime: string, endTime: string, location: string) => Promise<void>
  onDelete: (shiftId: number) => void
  shift: ScheduleShift | null
  employeeName: string
}

export function EditShiftModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  shift,
  employeeName,
}: EditShiftDialogProps) {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Adjust time by minutes
  const adjustTime = (currentTime: string, minutes: number): string => {
    const [hours, mins] = currentTime.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor((totalMinutes + 1440) % 1440 / 60) // Handle wrap-around
    const newMins = (totalMinutes + 1440) % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
  }

  useEffect(() => {
    if (isOpen && shift) {
      // Extract time from UTC timestamp to local HH:mm format
      const startDate = new Date(shift.start_time)
      const endDate = new Date(shift.end_time)

      const startHours = String(startDate.getHours()).padStart(2, '0')
      const startMins = String(startDate.getMinutes()).padStart(2, '0')
      const endHours = String(endDate.getHours()).padStart(2, '0')
      const endMins = String(endDate.getMinutes()).padStart(2, '0')

      setStartTime(`${startHours}:${startMins}`)
      setEndTime(`${endHours}:${endMins}`)
      setLocation(shift.location || 'Calder')
    }
  }, [isOpen, shift])

  if (!shift) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startTime || !endTime) {
      console.error('Validation Error: Start time and end time are required')
      return
    }

    setIsLoading(true)

    try {
      // Create Eastern Time timestamp strings (YYYY-MM-DD HH:MM:SS)
      // Postgres will interpret these as Eastern and convert to UTC
      const originalDate = new Date(shift.start_time)
      const year = originalDate.getFullYear()
      const month = String(originalDate.getMonth() + 1).padStart(2, '0')
      const day = String(originalDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      const [startHours, startMins] = startTime.split(':')
      const startTimestamp = `${dateStr} ${startHours}:${startMins}:00`

      const [endHours, endMins] = endTime.split(':')
      let endTimestamp = `${dateStr} ${endHours}:${endMins}:00`

      // If end time is before start time, assume next day
      if (parseInt(endHours, 10) < parseInt(startHours, 10)) {
        const nextDay = new Date(originalDate)
        nextDay.setDate(nextDay.getDate() + 1)
        const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`
        endTimestamp = `${nextDayStr} ${endHours}:${endMins}:00`
      }

      await onSave(shift.id, startTimestamp, endTimestamp, location)
      console.log(`Shift updated for ${employeeName}`)
      onClose()
    } catch (error: any) {
      console.error('Error updating shift:', error.message || 'Failed to update shift')
    } finally {
      setIsLoading(false)
    }
  }

  const shiftDate = new Date(shift.start_time)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">Edit Shift for {employeeName}</DialogTitle>
            <Badge variant={shift.status === 'published' ? 'default' : 'secondary'} className="shrink-0">
              {shift.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <DialogDescription className="text-base">
            {shiftDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        {shift.status === 'published' && (
          <div className="bg-white/10 border border-white/30 rounded-lg p-4">
            <p className="text-sm font-medium text-white">
              ℹ️ This shift is published
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Editing will convert it to a draft. You'll need to re-publish the week.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="edit-start-time" className="text-sm font-medium text-center block">
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
                id="edit-start-time"
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
            <Label htmlFor="edit-end-time" className="text-sm font-medium text-center block">
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
                id="edit-end-time"
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
            <div className="flex-1">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(shift.id)
                  onClose()
                }}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="min-w-[100px]">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
