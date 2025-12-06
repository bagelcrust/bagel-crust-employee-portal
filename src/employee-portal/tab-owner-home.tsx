/**
 * Owner Home Tab - Combined Time Logs + Team Schedule
 *
 * Owner-only tab that shows:
 * 1. Time Logs (exception/triage view) at the top
 * 2. Team Schedule (EXACT copy from ScheduleTab)
 */

import { TimeLogsTab } from './tab-time-logs'
import { useGetTeamSchedule } from './fetch-schedule-data'
import { formatTime } from '../shared/employeeUtils'
import { translations } from '../shared/translations'

// Day order for iteration
const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

// Use English translations (owner is always Bryan)
const t = translations.en

export function OwnerHomeTab() {
  const { data: fullTeamSchedule } = useGetTeamSchedule(true)

  return (
    <div className="space-y-6">
      {/* Time Logs Section */}
      <TimeLogsTab />

      {/* Team Schedule - EXACT COPY from ScheduleTab lines 262-368 */}
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

      {/* Version indicator for cache debugging */}
      <div className="text-center text-[10px] text-gray-300 pt-4">
        v1.0.1
      </div>
    </div>
  )
}
