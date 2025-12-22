/**
 * ScheduleTab - Weekly schedule view with team schedule
 * Displays employee's personal schedule and full team schedule
 */

import { formatTime } from '../../shared/employeeUtils'
import type { Translations } from '../../shared/translations'
import { assertShape, logCondition, logData } from '../../shared/debug-utils'

interface ScheduleTabProps {
  employee: any
  scheduleData: any
  fullTeamSchedule: any
  t: Translations
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

/**
 * Get current date/time in Eastern timezone
 * CRITICAL: All date calculations must use this, not new Date()
 */
function getEasternNow(): Date {
  const etString = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  return new Date(etString)
}

/**
 * Finds the next upcoming shift from schedule data
 * Searches through current day (future shifts only), rest of this week, and next week
 * Uses EASTERN TIME for all calculations
 */
function getNextShift(scheduleData: any) {
  if (!scheduleData) return null

  // Use Eastern time, not browser local time!
  const now = getEasternNow()
  const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight ET
  const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.

  // Convert to our day order (Monday = 0)
  const currentDayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1

  // Calculate Monday of this week in Eastern time
  const mondayOfThisWeek = new Date(now)
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
  mondayOfThisWeek.setDate(now.getDate() + mondayOffset)
  mondayOfThisWeek.setHours(0, 0, 0, 0)

  // Check this week starting from today
  for (let i = currentDayIndex; i < 7; i++) {
    const day = dayOrder[i]
    const shifts = scheduleData.thisWeek?.[day] || []

    for (const shift of shifts) {
      const [startHour, startMin] = shift.startTime.split(':').map(Number)
      const shiftStartMinutes = startHour * 60 + startMin

      // If today, only consider shifts that haven't started yet
      if (i === currentDayIndex) {
        if (shiftStartMinutes > currentTime) {
          const shiftDate = new Date(mondayOfThisWeek)
          shiftDate.setDate(mondayOfThisWeek.getDate() + i)
          return { day, shift, date: shiftDate, isToday: true }
        }
      } else {
        // Future day this week - return first shift
        const shiftDate = new Date(mondayOfThisWeek)
        shiftDate.setDate(mondayOfThisWeek.getDate() + i)
        return { day, shift, date: shiftDate, isToday: false }
      }
    }
  }

  // Check next week
  const mondayOfNextWeek = new Date(mondayOfThisWeek)
  mondayOfNextWeek.setDate(mondayOfThisWeek.getDate() + 7)

  for (let i = 0; i < 7; i++) {
    const day = dayOrder[i]
    const shifts = scheduleData.nextWeek?.[day] || []

    if (shifts.length > 0) {
      const shiftDate = new Date(mondayOfNextWeek)
      shiftDate.setDate(mondayOfNextWeek.getDate() + i)
      return { day, shift: shifts[0], date: shiftDate, isToday: false }
    }
  }

  return null
}

export function ScheduleTab({ employee, scheduleData, fullTeamSchedule, t }: ScheduleTabProps) {
  // Validate props
  assertShape('ScheduleTab', employee, ['id', 'first_name'], 'employee')
  assertShape('ScheduleTab', scheduleData, ['thisWeek', 'nextWeek'], 'scheduleData')
  logData('ScheduleTab', 'fullTeamSchedule', fullTeamSchedule, ['thisWeek', 'nextWeek'])


  return (
    <div className="space-y-6">
      {/* Greeting + Next Shift */}
      <div>
        {/* Clean Greeting */}
        <h1 className="text-[28px] font-bold text-gray-800 mb-4 tracking-tight">
          Hi {employee?.first_name || 'there'}! 👋
        </h1>

        {/* Orange Gradient Next Shift Card - Connected to Supabase */}
        {(() => {
          const nextShift = getNextShift(scheduleData)
          logCondition('ScheduleTab', 'Has next shift', !!nextShift, nextShift)

          if (!nextShift) {
            return (
              <div className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 rounded-[14px] text-white shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
                <div className="text-sm opacity-90 mb-1 font-semibold tracking-wide">
                  NEXT SHIFT
                </div>
                <div className="text-xl font-bold">
                  No upcoming shifts
                </div>
              </div>
            )
          }

          const { day, shift, date, isToday } = nextShift

          // Format the day label
          let dayLabel: string
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(0, 0, 0, 0)

          const shiftDateOnly = new Date(date)
          shiftDateOnly.setHours(0, 0, 0, 0)

          if (isToday) {
            dayLabel = 'Today'
          } else if (shiftDateOnly.getTime() === tomorrow.getTime()) {
            dayLabel = 'Tomorrow'
          } else {
            // Format as "Monday, Nov 6"
            const dayName = t[day as keyof typeof t] as string
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            dayLabel = `${dayName}, ${monthNames[date.getMonth()]} ${date.getDate()}`
          }

          return (
            <div className="p-4 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] rounded-[14px] text-white shadow-[0_4px_12px_rgba(255,107,107,0.2)]">
              <div className="text-lg opacity-90 font-semibold tracking-wide">
                NEXT SHIFT: {dayLabel}
              </div>
              <div className="text-2xl font-bold">
                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
              </div>
            </div>
          )
        })()}
      </div>

      {/* My Schedule - Shows all published shifts */}
      <div>
        <h2 className="text-[28px] font-bold text-gray-800 mb-4 tracking-tight">
          My Schedule
        </h2>

        {/* All Scheduled Shifts (this week + next week combined) */}
        {(() => {
          // Calculate Monday of this week
          const now = new Date()
          const currentDayOfWeek = now.getDay()
          const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
          const monday = new Date(now)
          monday.setDate(now.getDate() + mondayOffset)
          monday.setHours(0, 0, 0, 0)

          // Build array of all shifts with dates from both weeks
          const allShifts: Array<{ day: string; dayIndex: number; weekOffset: number; shifts: any[]; date: Date }> = []

          // This week
          dayOrder.forEach((day, dayIndex) => {
            const shifts = scheduleData?.thisWeek?.[day] || []
            if (shifts.length > 0) {
              const date = new Date(monday)
              date.setDate(monday.getDate() + dayIndex)
              allShifts.push({ day, dayIndex, weekOffset: 0, shifts, date })
            }
          })

          // Next week
          dayOrder.forEach((day, dayIndex) => {
            const shifts = scheduleData?.nextWeek?.[day] || []
            if (shifts.length > 0) {
              const date = new Date(monday)
              date.setDate(monday.getDate() + dayIndex + 7)
              allShifts.push({ day, dayIndex, weekOffset: 7, shifts, date })
            }
          })

          if (allShifts.length === 0) {
            return (
              <div className="text-center py-8 text-gray-400 text-base">
                No shifts scheduled
              </div>
            )
          }

          // Get today's date for comparison
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          return (
            <div className="flex flex-col gap-2.5">
              {allShifts.map(({ day, shifts, date }, idx) => {
                const dayName = t[day as keyof typeof t] as string
                const isToday = date.getTime() === today.getTime()
                const isPast = date.getTime() < today.getTime()
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

                return (
                  <div
                    key={`${day}-${idx}`}
                    className={`p-3.5 px-4 rounded-[10px] flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.04)] ${
                      isPast
                        ? 'border border-gray-200 bg-gray-50 opacity-60'
                        : isToday
                          ? 'border-2 border-blue-600 bg-blue-600/5'
                          : 'border border-gray-200 bg-white'
                    }`}
                  >
                    {/* Left: Day & Date */}
                    <div className="text-left">
                      <div className={`font-semibold text-base mb-0.5 ${isPast ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {dayName}
                        {isToday && (
                          <span className="text-[10px] text-blue-600 font-bold ml-2 bg-blue-600/15 px-1.5 py-0.5 rounded no-underline">
                            TODAY
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] text-gray-400 font-bold ml-2 bg-gray-200 px-1.5 py-0.5 rounded no-underline">
                            PASSED
                          </span>
                        )}
                      </div>
                      <div className={`text-[13px] ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                        {dateStr}
                      </div>
                    </div>

                    {/* Right: Time */}
                    <div className="text-right">
                      {shifts.map((shift: any, shiftIdx: number) => (
                        <div key={shiftIdx} className={shiftIdx < shifts.length - 1 ? 'mb-1' : ''}>
                          <div className={`font-semibold text-base ${isPast ? 'text-gray-400 line-through' : 'text-blue-600'}`}>
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* Team Schedule - All days with shifts */}
      <div>
        <h2 className="text-[28px] font-bold text-gray-800 mb-4 tracking-tight">
          Team Schedule
        </h2>

        {(() => {
          if (!fullTeamSchedule) return null

          // Calculate Monday of this week
          const now = new Date()
          const currentDayOfWeek = now.getDay()
          const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
          const monday = new Date(now)
          monday.setDate(now.getDate() + mondayOffset)
          monday.setHours(0, 0, 0, 0)

          // Build array of all days with team schedules
          const allTeamDays: Array<{ day: string; schedules: any[]; date: Date }> = []

          // This week
          dayOrder.forEach((day, dayIndex) => {
            const schedules = fullTeamSchedule.thisWeek?.[day] || []
            if (schedules.length > 0) {
              const date = new Date(monday)
              date.setDate(monday.getDate() + dayIndex)
              allTeamDays.push({ day, schedules, date })
            }
          })

          // Next week
          dayOrder.forEach((day, dayIndex) => {
            const schedules = fullTeamSchedule.nextWeek?.[day] || []
            if (schedules.length > 0) {
              const date = new Date(monday)
              date.setDate(monday.getDate() + dayIndex + 7)
              allTeamDays.push({ day, schedules, date })
            }
          })

          // Get today for comparison
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          // Filter to only show today and future days
          const upcomingDays = allTeamDays.filter(({ date }) => date >= today)

          if (upcomingDays.length === 0) {
            return (
              <div className="text-center py-8 text-gray-400 text-base">
                No upcoming team shifts
              </div>
            )
          }

          return (
            <div className="flex flex-col gap-3">
              {upcomingDays.map(({ day, schedules, date }, idx) => {
                const dayName = t[day as keyof typeof t] as string
                const isToday = date.getTime() === today.getTime()
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

                return (
                  <div
                    key={`team-${day}-${idx}`}
                    className={`rounded-[10px] overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.04)] ${
                      isToday
                        ? 'border-2 border-blue-600'
                        : 'border border-gray-200'
                    }`}
                  >
                    {/* Day Header */}
                    <div className={`px-4 py-2.5 ${isToday ? 'bg-blue-600/10' : 'bg-gray-50'}`}>
                      <span className="font-semibold text-gray-800">{dayName}</span>
                      <span className="text-gray-500 ml-2">{dateStr}</span>
                      {isToday && (
                        <span className="text-[10px] text-blue-600 font-bold ml-2 bg-blue-600/15 px-1.5 py-0.5 rounded">
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* Team Members */}
                    <div className="bg-white">
                      {schedules.map((schedule: any, index: number) => (
                        <div
                          key={index}
                          className={`px-4 py-2.5 flex justify-between items-center ${
                            index < schedules.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <span className="font-medium text-gray-800">
                            {schedule.employee?.first_name}
                          </span>
                          <span className="font-semibold text-blue-600 text-sm">
                            {formatTime(schedule.start_time?.split(' ')[1]?.slice(0,5) || '')} - {formatTime(schedule.end_time?.split(' ')[1]?.slice(0,5) || '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
