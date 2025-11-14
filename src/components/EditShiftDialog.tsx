import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import type { ScheduleShift } from '../hooks'

interface EditShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shiftId: number, startTime: string, endTime: string, location: string) => Promise<void>
  shift: ScheduleShift | null
  employeeName: string
}

export function EditShiftDialog({
  isOpen,
  onClose,
  onSave,
  shift,
  employeeName,
}: EditShiftDialogProps) {
  const { toast } = useToast()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      toast({
        title: 'Validation Error',
        description: 'Start time and end time are required',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Create ISO string for start and end times
      const originalDate = new Date(shift.start_time)
      const startDate = new Date(originalDate)
      const [startHours, startMins] = startTime.split(':')
      startDate.setHours(parseInt(startHours, 10), parseInt(startMins, 10), 0, 0)

      const endDate = new Date(originalDate)
      const [endHours, endMins] = endTime.split(':')
      endDate.setHours(parseInt(endHours, 10), parseInt(endMins, 10), 0, 0)

      // If end time is before start time, assume next day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1)
      }

      await onSave(shift.id, startDate.toISOString(), endDate.toISOString(), location)

      toast({
        title: 'Shift Updated',
        description: `Updated shift for ${employeeName}`,
      })

      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update shift',
        variant: 'destructive',
      })
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">
              ℹ️ This shift is published
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Editing will convert it to a draft. You'll need to re-publish the week.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="edit-start-time" className="text-sm font-medium">
              Start Time
            </Label>
            <Input
              id="edit-start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-base h-11"
              required
            />
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="edit-end-time" className="text-sm font-medium">
              End Time
            </Label>
            <Input
              id="edit-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full text-base h-11"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="edit-location" className="text-sm font-medium">
              Location
            </Label>
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-base h-11"
              placeholder="Calder"
            />
          </div>

          <DialogFooter className="gap-3 pt-4">
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
