/**
 * TimesheetTab - Hours worked view
 * Displays daily and total hours for the week
 */

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { formatTime, formatHoursMinutes } from '../../shared/employeeUtils'
import type { Translations } from '../../shared/translations'
import { assertShape, logCondition } from '../../shared/debug-utils'

interface TimesheetTabProps {
  timesheetData: any
  t: Translations
  language: 'en' | 'es'
}

export function TimesheetTab({ timesheetData, t, language }: TimesheetTabProps) {
  const [timesheetWeek, setTimesheetWeek] = useState<'this' | 'last'>('this')

  // Validate props
  logCondition('TimesheetTab', 'Timesheet data loaded', !!timesheetData, timesheetData)

  // Loading state - data not yet loaded
  if (!timesheetData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="w-7 h-7 text-blue-600" />
          <h1 className="text-[28px] font-bold text-gray-800 tracking-tight">
            {t.timesheet}
          </h1>
        </div>
        <div className="text-center text-gray-500 text-base font-semibold py-8">
          Loading timesheet...
        </div>
      </div>
    )
  }

  const currentWeekData = timesheetWeek === 'this' ? timesheetData.thisWeek : timesheetData.lastWeek
  const hasHours = currentWeekData.days && currentWeekData.days.length > 0

  // Debug current week data
  assertShape('TimesheetTab', currentWeekData, ['days', 'totalHours'], 'currentWeekData')
  logCondition('TimesheetTab', `Has hours for ${timesheetWeek} week`, hasHours, { dayCount: currentWeekData.days?.length, totalHours: currentWeekData.totalHours })

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="w-7 h-7 text-blue-600" />
        <h1 className="text-[28px] font-bold text-gray-800 tracking-tight">
          {t.timesheet}
        </h1>
      </div>

      {/* Week Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-full">
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
          {/* Hours List */}
          <div className="flex flex-col gap-2.5">
            {currentWeekData.days.map((day: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 px-4 rounded-[10px] flex justify-between items-center border border-gray-200 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-800 text-[15px]">
                    {translateDayName(day.day_name)}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-0.5">
                    {format(new Date(day.date), language === 'en' ? 'MMMM d' : "d 'de' MMMM", { locale: language === 'en' ? enUS : es })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600 text-[15px]">
                    {formatHoursMinutes(day.hours_worked)}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-0.5">
                    {formatTime(day.clock_in)} - {formatTime(day.clock_out)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 p-3.5 bg-blue-600/6 rounded-lg flex justify-between items-center">
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
