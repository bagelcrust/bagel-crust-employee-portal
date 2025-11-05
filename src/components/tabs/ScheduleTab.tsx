/**
 * ScheduleTab - Weekly schedule view with team schedule
 * Displays employee's personal schedule and full team schedule
 */

import { useState } from 'react'
import { formatTime } from '../../lib/employeeUtils'
import type { Translations } from '../../lib/translations'

interface ScheduleTabProps {
  employee: any
  scheduleData: any
  fullTeamSchedule: any
  t: Translations
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export function ScheduleTab({ employee, scheduleData, fullTeamSchedule, t }: ScheduleTabProps) {
  const [showWeek, setShowWeek] = useState<'this' | 'next'>('this')
  const [teamScheduleWeek, setTeamScheduleWeek] = useState<'this' | 'next'>('this')
  const [selectedTeamDay, setSelectedTeamDay] = useState<typeof dayOrder[number]>(() => {
    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1
    return dayOrder[todayIndex]
  })

  const currentSchedule = showWeek === 'this' ? scheduleData?.thisWeek : scheduleData?.nextWeek

  return (
    <>
      {/* Card 1: Greeting + Next Shift */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 mb-6">
        {/* Clean Greeting */}
        <h1 className="text-[28px] font-bold text-gray-800 mb-4 tracking-tight">
          Hi {employee?.first_name || 'there'}! 👋
        </h1>

        {/* Orange Gradient Next Shift Card */}
        <div className="p-5 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] rounded-[14px] text-white shadow-[0_6px_16px_rgba(255,107,107,0.3)]">
          <div className="text-xs opacity-90 mb-1.5 font-semibold tracking-wide">
            NEXT SHIFT
          </div>
          <div className="text-[22px] font-bold mb-1">
            Tomorrow
          </div>
          <div className="text-lg font-semibold opacity-95">
            9:00 AM - 5:00 PM
          </div>
        </div>
      </div>

      {/* Card 2: My Schedule */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 mb-6">
        <h2 className="text-[28px] font-bold text-gray-800 mb-6 tracking-tight">
          My Schedule
        </h2>

        {/* Week Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-full">
          <button
            onClick={() => setShowWeek('this')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
              showWeek === 'this'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            {t.thisWeek}
          </button>
          <button
            onClick={() => setShowWeek('next')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
              showWeek === 'next'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            {t.nextWeek}
          </button>
        </div>

        {/* Weekly Schedule */}
        <div className="flex flex-col gap-2.5">
          {dayOrder.map((day, index) => {
            const shifts = currentSchedule?.[day] || []
            const dayName = t[day as keyof typeof t] as string
            const isToday = showWeek === 'this' && new Date().getDay() === (dayOrder.indexOf(day) + 1) % 7

            // Calculate date for this day
            const now = new Date()
            const currentDayOfWeek = now.getDay()
            const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
            const monday = new Date(now)
            monday.setDate(now.getDate() + mondayOffset)

            const weekOffset = showWeek === 'next' ? 7 : 0
            const dayDate = new Date(monday)
            dayDate.setDate(monday.getDate() + index + weekOffset)

            const dateStr = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`

            return (
              <div
                key={day}
                className={`p-3.5 px-4 rounded-[10px] flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.04)] ${
                  isToday
                    ? 'border-2 border-blue-600 bg-blue-600/5'
                    : 'border border-gray-200 bg-white'
                }`}
              >
                {/* Left: Day & Date */}
                <div className="text-left">
                  <div className="font-semibold text-gray-800 text-base mb-0.5">
                    {dayName}
                    {isToday && (
                      <span className="text-[10px] text-blue-600 font-bold ml-2 bg-blue-600/15 px-1.5 py-0.5 rounded">
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-gray-500">
                    {dateStr}
                  </div>
                </div>

                {/* Right: Time */}
                <div className="text-right">
                  {shifts.length === 0 ? (
                    <span className="text-gray-400 text-[15px] font-semibold">
                      OFF
                    </span>
                  ) : (
                    shifts.map((shift: any, idx: number) => (
                      <div key={idx} className={idx < shifts.length - 1 ? 'mb-1' : ''}>
                        <div className="font-semibold text-blue-600 text-base">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Card 3: Open Shifts (Placeholder) */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 mb-6">
        <h2 className="text-[28px] font-bold text-gray-800 mb-8 tracking-tight">
          Open Shifts
        </h2>
        <div className="flex flex-col gap-3">
          {/* Placeholder shifts */}
          {[
            { date: 'Tuesday, November 7', time: '9:00 AM - 5:00 PM', location: 'Main Street' },
            { date: 'Thursday, November 9', time: '2:00 PM - 10:00 PM', location: 'Downtown' },
            { date: 'Saturday, November 11', time: '6:00 AM - 2:00 PM', location: 'Main Street' }
          ].map((shift, idx) => (
            <div key={idx} className="p-5 bg-white border border-gray-200 rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex-1">
                  <div className="text-base font-semibold text-gray-800 mb-2">
                    {shift.date}
                  </div>
                  <div className="text-[15px] text-blue-600 font-medium mb-2">
                    {shift.time}
                  </div>
                  <div className="text-sm text-gray-500">
                    {shift.location}
                  </div>
                </div>
                <button className="bg-blue-600 text-white border-none px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap">
                  Claim
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Team Schedule */}
      <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
        <h2 className="text-[28px] font-bold text-gray-800 mb-6 tracking-tight">
          Team Schedule
        </h2>

        {fullTeamSchedule && (
          <div>
            {/* Week Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-full">
              <button
                onClick={() => setTeamScheduleWeek('this')}
                className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                  teamScheduleWeek === 'this'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                type="button"
              >
                {t.thisWeek}
              </button>
              <button
                onClick={() => setTeamScheduleWeek('next')}
                className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                  teamScheduleWeek === 'next'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                type="button"
              >
                {t.nextWeek}
              </button>
            </div>

            {/* Day Selector */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto [overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none]">
              {dayOrder.map(day => {
                const dayName = t[day as keyof typeof t] as string
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedTeamDay(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border-none cursor-pointer transition-all duration-150 ${
                      selectedTeamDay === day ? 'bg-blue-600 text-white' : 'bg-black/5 text-gray-500'
                    }`}
                  >
                    {dayName.slice(0, 3)}
                  </button>
                )
              })}
            </div>

            {/* Team List for Selected Day */}
            {(() => {
              const currentWeekSchedule = teamScheduleWeek === 'this' ? fullTeamSchedule.thisWeek : fullTeamSchedule.nextWeek
              const daySchedules = currentWeekSchedule?.[selectedTeamDay] || []

              return daySchedules.length === 0 ? (
                <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
                  No one scheduled for this day
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden">
                  {daySchedules.map((schedule: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 text-center ${index < daySchedules.length - 1 ? 'border-b border-black/5' : ''}`}
                    >
                      <div className="font-bold text-gray-800 text-lg mb-1.5">
                        {schedule.employee?.first_name}
                      </div>
                      <div className="font-semibold text-blue-600 text-[17px]">
                        {formatTime(new Date(schedule.start_time).toTimeString().slice(0,5))} - {formatTime(new Date(schedule.end_time).toTimeString().slice(0,5))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </>
  )
}
