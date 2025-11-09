import { Clock, Calendar } from 'lucide-react'

/**
 * EMPLOYEE AVAILABILITY & TIME-OFF LIST
 *
 * Displays employee availability and time-off information in a list format
 * below the schedule grid. Shows:
 * - Regular weekly availability (e.g., "Mon-Fri: 9am-5pm")
 * - Time-off notices for the selected week
 */

interface Availability {
  id: number
  employee_id: string
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  start_time: string // HH:mm:ss format
  end_time: string // HH:mm:ss format
  effective_start_date: string
}

interface TimeOff {
  id: number
  employee_id: string
  start_time: string // ISO timestamp
  end_time: string // ISO timestamp
  reason: string | null
  status: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  active: boolean
}

interface AvailabilityListProps {
  employees: Employee[]
  availabilities: Availability[]
  timeOffs: TimeOff[]
  weekStart: Date
  weekEnd: Date
}

// Helper to format time from HH:mm:ss to "9:00 AM"
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Helper to group availability by day ranges
function groupAvailability(availabilities: Availability[]): string {
  if (availabilities.length === 0) return 'No availability set'

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayAbbrev: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  }

  // Sort by day of week
  const sorted = [...availabilities].sort((a, b) =>
    dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
  )

  // Group consecutive days with same times
  const groups: { days: string[], times: string }[] = []
  let currentGroup: { days: string[], times: string } | null = null

  for (const avail of sorted) {
    const times = `${formatTime(avail.start_time)} - ${formatTime(avail.end_time)}`

    if (currentGroup && currentGroup.times === times) {
      currentGroup.days.push(dayAbbrev[avail.day_of_week])
    } else {
      if (currentGroup) groups.push(currentGroup)
      currentGroup = { days: [dayAbbrev[avail.day_of_week]], times }
    }
  }
  if (currentGroup) groups.push(currentGroup)

  // Format groups
  return groups.map(group => {
    const dayRange = group.days.length > 2
      ? `${group.days[0]}-${group.days[group.days.length - 1]}`
      : group.days.join(', ')
    return `${dayRange}: ${group.times}`
  }).join(' • ')
}

// Helper to format date range for time-offs
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day}`
  }

  // If same day, just show one date
  if (startDate.toDateString() === endDate.toDateString()) {
    return formatDate(startDate)
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

export default function AvailabilityList({
  employees,
  availabilities,
  timeOffs,
  weekStart,
  weekEnd
}: AvailabilityListProps) {
  return (
    <div className="px-6 pb-6">
      <div className="max-w-[1600px] mx-auto">
        <div
          className="rounded-xl overflow-hidden shadow-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}>
            <h2 className="text-lg font-semibold text-gray-800">
              Employee Availability & Time-Offs
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Regular availability and time-off notices for this week
            </p>
          </div>

          {/* List */}
          <div className="divide-y" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {employees
              .filter(emp => emp.active)
              .map((employee) => {
                const empAvailability = availabilities.filter(
                  a => a.employee_id === employee.id
                )
                const empTimeOffs = timeOffs.filter(
                  t => t.employee_id === employee.id
                )

                const availabilityText = groupAvailability(empAvailability)

                return (
                  <div
                    key={employee.id}
                    className="px-6 py-4 hover:bg-white/40 transition-colors"
                    style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }}
                  >
                    {/* Employee Name */}
                    <div className="font-semibold text-gray-800 mb-2">
                      {employee.first_name} {employee.last_name}
                    </div>

                    {/* Availability */}
                    <div className="flex items-start gap-2 text-sm mb-2">
                      <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-gray-600 font-medium">Available: </span>
                        <span className="text-gray-700">{availabilityText}</span>
                      </div>
                    </div>

                    {/* Time-Offs */}
                    {empTimeOffs.length > 0 ? (
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600 font-medium">Time Off: </span>
                          {empTimeOffs.map((timeOff, idx) => (
                            <div key={timeOff.id} className="inline">
                              {idx > 0 && ', '}
                              <span className="text-orange-700 font-medium">
                                {formatDateRange(timeOff.start_time, timeOff.end_time)}
                              </span>
                              {timeOff.reason && (
                                <span className="text-gray-600"> ({timeOff.reason})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>No time-offs this week</span>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
