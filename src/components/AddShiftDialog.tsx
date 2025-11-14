import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AddShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shiftData: {
    date: string
    startTime: string
    endTime: string
    location: string
    isOpenShift: boolean
  }) => void
  employeeName?: string
  date?: string
  hasTimeOff?: boolean
  timeOffReason?: string
  initialStartTime?: string
  initialEndTime?: string
  initialLocation?: string
}

export function AddShiftDialog({
  isOpen,
  onClose,
  onSave,
  employeeName,
  date = '',
  hasTimeOff = false,
  timeOffReason,
  initialStartTime = '09:00',
  initialEndTime = '17:00',
  initialLocation = 'Calder'
}: AddShiftDialogProps) {
  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)
  const [location, setLocation] = useState(initialLocation)
  const [isOpenShift, setIsOpenShift] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStartTime(initialStartTime)
      setEndTime(initialEndTime)
      setLocation(initialLocation)
      setIsOpenShift(false)
    }
  }, [isOpen, initialStartTime, initialEndTime, initialLocation])

  const handleSave = () => {
    onSave({
      date,
      startTime,
      endTime,
      location,
      isOpenShift
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Shift{employeeName ? ` - ${employeeName}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasTimeOff && timeOffReason && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-900">
              ⚠️ Employee has time-off: {timeOffReason}
            </div>
          )}

          <div>
            <Label>Date</Label>
            <Input value={date} disabled className="bg-gray-50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Calder">Calder</SelectItem>
                <SelectItem value="Downtown">Downtown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="openShift"
              checked={isOpenShift}
              onChange={(e) => setIsOpenShift(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="openShift" className="cursor-pointer">
              Open shift (not assigned to specific employee)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Shift
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
