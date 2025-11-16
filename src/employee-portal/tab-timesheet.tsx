/**
 * TimesheetTab - Hours worked view
 * Displays daily and total hours for the week
 */

import { useState } from 'react'
import { format } from 'date-fns'
import { formatTime, formatHoursMinutes } from '../shared/employeeUtils'
import type { Translations } from '../shared/translations'

interface TimesheetTabProps {
  timesheetData: any
  t: Translations
}

export function TimesheetTab({ timesheetData, t }: TimesheetTabProps) {
  const [timesheetWeek, setTimesheetWeek] = useState<'this' | 'last'>('this')

  const currentWeekData = timesheetWeek === 'this' ? timesheetData.thisWeek : timesheetData.lastWeek
  const hasHours = currentWeekData.days && currentWeekData.days.length > 0

  // Translate day names from English (Edge Function) to current language
  const translateDayName = (englishDayName: string): string => {
    const dayMap: Record<string, keyof Translations> = {
      'Monday': 'monday',
      'Tuesday': 'tuesday',
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday'
    }
    const key = dayMap[englishDayName]
    return key ? t[key] : englishDayName
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[10px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50">
      <h2 className="text-[28px] font-bold text-gray-800 mb-6 tracking-tight">
        {t.timesheet}
      </h2>

      {/* Week Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-full">
        <button
          onClick={() => setTimesheetWeek('this')}
          className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
            timesheetWeek === 'this'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          type="button"
        >
          {t.thisWeek}
        </button>
        <button
          onClick={() => setTimesheetWeek('last')}
          className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
            timesheetWeek === 'last'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          type="button"
        >
          {t.lastWeek}
        </button>
      </div>

      {hasHours ? (
        <div>
          <div className="rounded-lg overflow-hidden mb-3.5">
            {currentWeekData.days.map((day: any, idx: number) => (
              <div
                key={idx}
                className={`p-3.5 flex justify-between ${idx < currentWeekData.days.length - 1 ? 'border-b border-black/5' : ''}`}
              >
                <div>
                  <div className="font-semibold text-gray-800 text-[15px]">
                    {translateDayName(day.day_name)}
                  </div>
                  <div className="text-[13px] text-gray-400 mt-0.5">
                    {format(new Date(day.date), 'MMMM do')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800 text-[15px]">
                    {formatHoursMinutes(day.hours_worked)}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-0.5">
                    {formatTime(day.clock_in)} - {formatTime(day.clock_out)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-blue-600/6 rounded-lg flex justify-between items-center">
            <span className="font-semibold text-gray-800 text-[15px]">
              {t.total}
            </span>
            <span className="text-xl font-bold text-blue-600">
              {formatHoursMinutes(currentWeekData.totalHours)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center pt-12 pb-12 text-gray-400 text-sm font-medium">
          {timesheetWeek === 'this' ? t.noHoursThisWeek : t.noHoursLastWeek}
        </div>
      )}
    </div>
  )
}
