import { useEffect, useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Send, Loader2, Plus, Trash2 } from 'lucide-react'
import { useScheduleBuilder } from '../hooks'
import { shiftService, publishService } from '../supabase/supabase'
import AddShiftModal from '../components/AddShiftModal'
import {
  formatShiftTime,
  formatShiftHours,
  isAllDayTimeOff,
  countDraftShifts,
  PAGE_TITLES,
  SCHEDULE_MESSAGES,
  type Shift
} from '../lib'

/**
 * SCHEDULE BUILDER - Full-Featured with Draft/Publish Workflow
 *
 * ✅ REFACTORED WITH UTILITIES (Nov 6, 2025)
 * - Uses scheduleUtils for shift formatting, conflict detection, counting
 * - Uses constants for all messages and page titles
 * - Uses useCallback for event handler optimization
 * - Uses useMemo for computed values
 * - Clean, maintainable, utility-driven code
 *
 * Features:
 * - Real employee data from Supabase
 * - Real shifts displayed in weekly grid
 * - Week navigation (Today, Previous, Next)
 * - Click cell to add shift (with conflict validation)
 * - Open shifts pool at top
 * - Publish button to make schedule visible to employees
 * - Weekly hours displayed next to employee names
 * - Drag & drop to reassign shifts (coming soon)
 */

export default function ScheduleBuilder() {
  const {
    dateRangeString,
    isThisWeek,
    daysOfWeek,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    currentWeekStart,
    currentWeekEnd,
    employees,
    openShifts,
    shiftsByEmployeeAndDay,
    timeOffsByEmployeeAndDay,
    weeklyHours,
    isWeekPublished,
    isLoading,
    refetchShifts,
    refetchOpenShifts,
    refetchPublishStatus
  } = useScheduleBuilder()

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    employeeId: string | null
    employeeName: string
    date: Date
    hasTimeOff: boolean
    timeOffReason: string
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: '',
    date: new Date(),
    hasTimeOff: false,
    timeOffReason: ''
  })

  // Set page title using constant
  useEffect(() => {
    document.title = PAGE_TITLES.SCHEDULE_BUILDER
  }, [])

  // Handle cell click (add shift) - memoized with useCallback
  const handleCellClick = useCallback((
    employeeId: string,
    employeeName: string,
    date: Date,
    dayIndex: number
  ) => {
    // Check if employee has time-off on this day
    const timeOffsForDay = timeOffsByEmployeeAndDay[employeeId]?.[dayIndex] || []
    const hasTimeOff = timeOffsForDay.length > 0
    const timeOffReason = hasTimeOff ? timeOffsForDay[0].reason || 'No reason' : ''

    setModalState({
      isOpen: true,
      employeeId,
      employeeName,
      date,
      hasTimeOff,
      timeOffReason
    })
  }, [timeOffsByEmployeeAndDay])

  // Handle save shift from modal - memoized with useCallback
  const handleSaveShift = useCallback(async (
    startTime: string,
    endTime: string,
    location: string
  ) => {
    if (!modalState.employeeId) return

    try {
      await shiftService.createShift({
        employee_id: modalState.employeeId,
        start_time: startTime,
        end_time: endTime,
        location: location,
        status: 'draft'
      })

      refetchShifts()
    } catch (error: any) {
      throw error // Re-throw to let modal handle error display
    }
  }, [modalState.employeeId, refetchShifts])

  // Handle publish week - memoized with useCallback
  const handlePublish = useCallback(async () => {
    if (!confirm(SCHEDULE_MESSAGES.PUBLISH_CONFIRM)) {
      return
    }

    try {
      const result = await publishService.publishWeek(
        currentWeekStart.toISOString(),
        currentWeekEnd.toISOString(),
        { strictMode: true } // Block if any conflicts
      )

      if (result.success) {
        alert(result.message)
        refetchShifts()
        refetchPublishStatus()
      } else {
        alert(`Cannot publish:\n\n${result.message}\n\nConflicts:\n${
          result.conflicts.map((c: any) => `- ${c.employeeName} on ${c.shiftDate}`).join('\n')
        }`)
      }
    } catch (error: any) {
      alert(`${SCHEDULE_MESSAGES.PUBLISH_ERROR}: ${error.message}`)
    }
  }, [currentWeekStart, currentWeekEnd, refetchShifts, refetchPublishStatus])

  // Handle delete shift - memoized with useCallback
  const handleDeleteShift = useCallback(async (shiftId: number) => {
    if (!confirm(SCHEDULE_MESSAGES.DELETE_SHIFT_CONFIRM)) return

    try {
      await shiftService.deleteShift(shiftId)
      refetchShifts()
      refetchOpenShifts()
    } catch (error: any) {
      alert(`${SCHEDULE_MESSAGES.DELETE_ERROR}: ${error.message}`)
    }
  }, [refetchShifts, refetchOpenShifts])

  // Calculate draft count using utility - memoized for performance
  const draftCount = useMemo(() => {
    const allShifts = Object.values(shiftsByEmployeeAndDay).flatMap(days =>
      Object.values(days).flatMap(shifts => shifts)
    ) as Shift[]
    return countDraftShifts(allShifts)
  }, [shiftsByEmployeeAndDay])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header - Glassmorphism */}
      <div className="px-6 py-4">
        <div className="max-w-[1600px] mx-auto">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            {/* Today Button */}
            <button
              onClick={goToToday}
              disabled={isThisWeek}
              className={`px-4 py-2 border-2 rounded-lg font-semibold text-sm transition-all ${
                isThisWeek
                  ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              Today
            </button>

            {/* Date Range Display */}
            <button
              className="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 font-medium text-gray-700"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              {dateRangeString}
            </button>

            {/* Navigation Arrows */}
            <div className="flex gap-1">
              <button
                onClick={goToPreviousWeek}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/80"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={goToNextWeek}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/80"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Published Status Badge */}
            {isWeekPublished && (
              <div className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-xs font-semibold">
                ✓ Published
              </div>
            )}

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={draftCount === 0}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
                draftCount > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              Publish ({draftCount})
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Grid Container */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="max-w-[1600px] mx-auto h-full">
          <div
            className="rounded-xl overflow-hidden shadow-lg h-full"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-gray-600">{SCHEDULE_MESSAGES.LOADING_SCHEDULE}</div>
                </div>
              </div>
            ) : (
              <div className="overflow-auto h-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th
                        className="sticky top-0 left-0 z-20 border-r border-b px-5 py-4 text-left font-semibold text-sm text-gray-700 min-w-[220px]"
                        style={{
                          background: 'rgba(249, 250, 251, 0.95)',
                          backdropFilter: 'blur(10px)',
                          borderColor: 'rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        Employee ({employees.length})
                      </th>
                      {daysOfWeek.map((day, index) => (
                        <th
                          key={index}
                          className="sticky top-0 z-10 border-r border-b px-3 py-3 text-center font-semibold text-sm min-w-[120px]"
                          style={{
                            background: day.isToday
                              ? 'rgba(224, 231, 255, 0.5)'
                              : 'rgba(249, 250, 251, 0.95)',
                            backdropFilter: 'blur(10px)',
                            borderColor: 'rgba(0, 0, 0, 0.06)'
                          }}
                        >
                          {day.isToday ? (
                            <span className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                              {day.dayName}, {day.dayNumber}
                            </span>
                          ) : (
                            <span className="text-gray-700">
                              {day.dayName}, {day.dayNumber}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Open Shifts Row */}
                    {openShifts.length > 0 && (
                      <tr className="bg-yellow-50/50">
                        <td
                          className="sticky left-0 z-10 border-r border-b px-5 py-3 font-medium text-sm text-gray-800"
                          style={{
                            background: 'rgba(254, 252, 232, 0.9)',
                            backdropFilter: 'blur(10px)',
                            borderColor: 'rgba(0, 0, 0, 0.04)'
                          }}
                        >
                          🔓 Open Shifts ({openShifts.length})
                        </td>
                        {daysOfWeek.map((day, dayIndex) => {
                          const shiftsForDay = openShifts.filter(shift => {
                            const shiftDate = new Date(shift.start_time).toDateString()
                            return shiftDate === day.date.toDateString()
                          })
                          return (
                            <td
                              key={dayIndex}
                              className="border-r border-b p-1.5 min-h-[50px] align-top"
                              style={{
                                borderColor: 'rgba(0, 0, 0, 0.04)',
                                background: 'rgba(254, 243, 199, 0.15)'
                              }}
                            >
                              {shiftsForDay.length > 0 && (
                                <div className="space-y-1">
                                  {shiftsForDay.map((shift) => (
                                    <div
                                      key={shift.id}
                                      className="rounded px-2 py-1 cursor-pointer hover:shadow-md transition-shadow text-center group relative"
                                      style={{
                                        background: 'rgba(234, 179, 8, 0.15)',
                                        border: '1px solid rgba(234, 179, 8, 0.3)',
                                        backdropFilter: 'blur(5px)'
                                      }}
                                    >
                                      <div className="text-xs font-medium text-yellow-900">
                                        {formatShiftTime(shift.start_time, shift.end_time)}
                                      </div>
                                      <button
                                        onClick={() => handleDeleteShift(shift.id)}
                                        className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )}

                    {/* Employee Rows */}
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => {
                        const hours = weeklyHours.get(employee.id) || 0
                        const formattedHours = formatShiftHours(hours)

                        return (
                          <tr
                            key={employee.id}
                            className="transition-colors hover:bg-white/40"
                          >
                            <td
                              className="sticky left-0 z-10 border-r border-b px-5 py-3 font-medium text-sm text-gray-800"
                              style={{
                                background: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                borderColor: 'rgba(0, 0, 0, 0.04)'
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{employee.first_name}</span>
                                <span className="text-xs text-gray-500 font-normal ml-2">
                                  {formattedHours}
                                </span>
                              </div>
                            </td>
                            {daysOfWeek.map((day, dayIndex) => {
                              const shiftsForDay = shiftsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                              const timeOffsForDay = timeOffsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                              const hasTimeOff = timeOffsForDay.length > 0

                              return (
                                <td
                                  key={dayIndex}
                                  onClick={() => !hasTimeOff && handleCellClick(employee.id, employee.first_name, day.date, dayIndex)}
                                  className={`border-r border-b p-1.5 min-h-[50px] align-top ${
                                    !hasTimeOff ? 'cursor-pointer hover:bg-blue-50/30' : ''
                                  }`}
                                  style={{
                                    borderColor: 'rgba(0, 0, 0, 0.04)',
                                    background: day.isToday ? 'rgba(224, 231, 255, 0.15)' : 'transparent'
                                  }}
                                >
                                  {(shiftsForDay.length > 0 || timeOffsForDay.length > 0) ? (
                                    <div className="space-y-1">
                                      {/* Shifts */}
                                      {shiftsForDay.map((shift) => (
                                        <div
                                          key={shift.id}
                                          className="rounded px-2 py-1 cursor-pointer hover:shadow-md transition-shadow text-center group relative"
                                          style={{
                                            background: shift.status === 'published'
                                              ? 'rgba(34, 197, 94, 0.15)'
                                              : 'rgba(37, 99, 235, 0.12)',
                                            border: shift.status === 'published'
                                              ? '1px solid rgba(34, 197, 94, 0.3)'
                                              : '1px solid rgba(37, 99, 235, 0.25)',
                                            backdropFilter: 'blur(5px)'
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className={`text-xs font-medium ${
                                            shift.status === 'published' ? 'text-green-900' : 'text-blue-900'
                                          }`}>
                                            {formatShiftTime(shift.start_time, shift.end_time)}
                                          </div>
                                          <button
                                            onClick={() => handleDeleteShift(shift.id)}
                                            className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                      {/* Time-offs */}
                                      {timeOffsForDay.map((timeOff) => {
                                        const isAllDay = isAllDayTimeOff(timeOff)
                                        return (
                                          <div
                                            key={timeOff.id}
                                            className="rounded px-2 py-1 cursor-not-allowed transition-shadow text-center"
                                            style={{
                                              background: 'rgba(251, 146, 60, 0.15)',
                                              border: '1px solid rgba(251, 146, 60, 0.35)',
                                              backdropFilter: 'blur(5px)'
                                            }}
                                            title={timeOff.reason || 'Time off'}
                                          >
                                            <div className="text-xs font-medium text-orange-900">
                                              {isAllDay ? 'Time Off' : formatShiftTime(timeOff.start_time, timeOff.end_time)}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <div className="h-full min-h-[35px] flex items-center justify-center">
                                      {!hasTimeOff && (
                                        <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                                      )}
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Shift Modal */}
      <AddShiftModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveShift}
        employeeName={modalState.employeeName}
        date={modalState.date}
        hasTimeOff={modalState.hasTimeOff}
        timeOffReason={modalState.timeOffReason}
      />
    </div>
  )
}
