import { Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAvailabilityTime } from '@/lib'

/**
 * EmployeeAvailabilityList - Bottom section showing employee availability and time-offs
 *
 * Displays:
 * - Regular weekly availability for each employee
 * - Time-off requests/notices for the current week
 *
 * Used in: ScheduleBuilderV2 page (below the schedule grid)
 */

interface Employee {
  id: string
  first_name: string
  last_name?: string
}

interface TimeOff {
  id: number
  employee_id: string
  start_time: string
  end_time: string
  reason: string
}

interface Availability {
  start_time: string
  end_time: string
}

interface EmployeeAvailabilityListProps {
  employees: Employee[]
  timeOffs: TimeOff[]
  availabilityByEmployeeAndDay: Record<string, Record<number, Availability[]>>
}

export function EmployeeAvailabilityList({
  employees,
  timeOffs,
  availabilityByEmployeeAndDay
}: EmployeeAvailabilityListProps) {
  return (
    <Card className="overflow-hidden shadow-lg bg-white/90 backdrop-blur-lg border-white/50">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg">Employee Availability & Time-Offs</CardTitle>
        <CardDescription>Regular availability and time-off notices for this week</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {employees.map((employee) => {
            // Get time-offs for this employee this week
            const employeeTimeOffs = timeOffs.filter(t => t.employee_id === employee.id)

            // Get availability for this employee (grouped by day)
            const employeeAvailability = availabilityByEmployeeAndDay[employee.id] || {}
            // Index 0 = Monday, 1 = Tuesday, ... 6 = Sunday (matches edge function mapping)
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            const availabilityText = Object.entries(employeeAvailability)
              .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
              .map(([dayIndex, availabilities]) => {
                const dayName = dayNames[Number(dayIndex)]
                const times = availabilities.map(avail =>
                  `${formatAvailabilityTime(avail.start_time)}-${formatAvailabilityTime(avail.end_time)}`
                ).join(', ')
                return `${dayName}: ${times}`
              }).join(' | ')

            return (
              <div
                key={employee.id}
                className="px-6 py-4 hover:bg-white/40 transition-colors"
                style={{ borderColor: 'rgba(0, 0, 0, 0.04)' }}
              >
                {/* Employee Name */}
                <div className="font-semibold text-gray-800 mb-2">
                  {employee.first_name} {employee.last_name || ''}
                </div>

                {/* Availability */}
                <div className="flex items-start gap-2 text-sm mb-2">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-600 font-medium">Available: </span>
                    <span className="text-gray-700">
                      {availabilityText || 'No availability set'}
                    </span>
                  </div>
                </div>

                {/* Time-Offs */}
                {employeeTimeOffs.length > 0 ? (
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-600 font-medium">Time Off: </span>
                      {employeeTimeOffs.map((timeOff, idx) => (
                        <div key={timeOff.id} className="inline">
                          {idx > 0 && ', '}
                          <span className="text-orange-700 font-medium">
                            {format(new Date(timeOff.start_time), 'MMM d')}
                            {format(new Date(timeOff.start_time), 'yyyy-MM-dd') !== format(new Date(timeOff.end_time), 'yyyy-MM-dd') &&
                              ` - ${format(new Date(timeOff.end_time), 'MMM d')}`
                            }
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
      </CardContent>
    </Card>
  )
}
