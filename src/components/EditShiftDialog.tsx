import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EditShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shiftData: {
    id: number
    startTime: string
    endTime: string
    location: string
  }) => void
  shift: {
    id: number
    start_time: string
    end_time: string
    location: string
  } | null
  employeeName?: string
}

export function EditShiftDialog({
  isOpen,
  onClose,
  onSave,
  shift,
  employeeName
}: EditShiftDialogProps) {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('Calder')

  useEffect(() => {
    if (shift && isOpen) {
      // Extract time from ISO timestamp
      const start = new Date(shift.start_time)
      const end = new Date(shift.end_time)

      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`)
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`)
      setLocation(shift.location || 'Calder')
    }
  }, [shift, isOpen])

  const handleSave = () => {
    if (!shift) return

    onSave({
      id: shift.id,
      startTime,
      endTime,
      location
    })
  }

  if (!shift) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Shift{employeeName ? ` - ${employeeName}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
