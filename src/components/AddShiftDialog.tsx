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
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

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
}

export function AddShiftDialog({
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
}: AddShiftDialogProps) {
  const { toast } = useToast()
  const [startTime, setStartTime] = useState(initialStartTime || '09:00')
  const [endTime, setEndTime] = useState(initialEndTime || '17:00')
  const [location, setLocation] = useState(initialLocation || 'Calder')
  const [isOpenShift, setIsOpenShift] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStartTime(initialStartTime || '09:00')
      setEndTime(initialEndTime || '17:00')
      setLocation(initialLocation || 'Calder')
      setIsOpenShift(false)
    }
  }, [isOpen, initialStartTime, initialEndTime, initialLocation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
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
      const startDate = new Date(date)
      const [startHours, startMins] = startTime.split(':')
      startDate.setHours(parseInt(startHours, 10), parseInt(startMins, 10), 0, 0)

      const endDate = new Date(date)
      const [endHours, endMins] = endTime.split(':')
      endDate.setHours(parseInt(endHours, 10), parseInt(endMins, 10), 0, 0)

      // If end time is before start time, assume next day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1)
      }

      await onSave(startDate.toISOString(), endDate.toISOString(), location, isOpenShift)

      // Toast notification removed per user request - green background is enough feedback
      // toast({
      //   title: 'Shift Created',
      //   description: `Added shift for ${employeeName}`,
      // })

      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create shift',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Shift for {employeeName}</DialogTitle>
          <DialogDescription>
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        {hasTimeOff && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-orange-900">
              ⚠️ {employeeName} has time-off on this day
            </p>
            <p className="text-xs text-orange-700 mt-1">{timeOffReason}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-time" className="text-right">
                Start Time
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-time" className="text-right">
                End Time
              </Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="col-span-3"
                placeholder="Calder"
              />
            </div>
            <div className="flex items-center space-x-2 col-span-4 ml-auto">
              <input
                type="checkbox"
                id="open-shift"
                checked={isOpenShift}
                onChange={(e) => setIsOpenShift(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="open-shift" className="text-sm font-normal cursor-pointer">
                Create as Open Shift (unassigned, anyone can take it)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Shift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
