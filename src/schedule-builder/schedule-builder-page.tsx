import { useEffect, useState } from 'react'
import { Send, Loader2, Calendar } from 'lucide-react'
import { useGetScheduleBuilderData } from './fetch-schedule-data'
import { useScheduleActions } from './schedule-actions'
import { EmployeeDayCell } from './grid-employee-cell'
import { CreateShiftModal } from './create-shift-modal'
import { EditShiftModal } from './edit-shift-modal'
import { Button } from '@/shared/ui/button'
import { formatShiftHours, formatShiftTime } from '../shared/scheduleUtils'
import { PAGE_TITLES, SCHEDULE_MESSAGES } from '../shared/constants'
import { logData } from '../shared/debug-utils'

export default function ScheduleBuilder() {
  const {
    dateRangeString,
    daysOfWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    isThisWeek,
    relativeWeekLabel,
    currentWeekStart,
    currentWeekEnd,
    employees,
    shiftsByEmployeeAndDay,
    timeOffsByEmployeeAndDay,
    availabilityByEmployeeAndDay,
    availabilityByEmployeeAndDate,
    weeklyHours,
    openShifts,
    isLoading,
    refetchShifts,
    refetchPublishStatus
  } = useGetScheduleBuilderData()

  const staffEmployees = employees.filter(emp => emp.role === 'staff_two')

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    employeeId: string | null
    employeeName: string
    date: Date
    hasTimeOff: boolean
    timeOffReason: string
    initialStartTime?: string
    initialEndTime?: string
    initialLocation?: string
    pastShifts?: any[]
    availabilityWindow?: { start: string; end: string } | null
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: '',
    date: new Date(),
    hasTimeOff: false,
    timeOffReason: '',
    pastShifts: [],
    availabilityWindow: null
  })

  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean
    shift: any | null
    employeeName: string
  }>({
    isOpen: false,
    shift: null,
    employeeName: ''
  })

  const {
    handleCellClick,
    handleSaveShift,
    handlePublish,
    handleDeleteShift,
    handleShiftClick,
    handleEditShift,
    handleAvailabilityClick,
    draftCount
  } = useScheduleActions({
    currentWeekStart,
    currentWeekEnd,
    employees,
    daysOfWeek,
    timeOffsByEmployeeAndDay,
    availabilityByEmployeeAndDay,
    availabilityByEmployeeAndDate,
    shiftsByEmployeeAndDay,
    refetchShifts,
    refetchPublishStatus,
    modalState,
    setModalState,
    editModalState,
    setEditModalState
  })

  // Render logging removed - was causing thousands of console lines on every state change

  useEffect(() => {
    document.title = PAGE_TITLES.SCHEDULE_BUILDER
  }, [])

  return (
    <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #4a90d9 0%, #5b9bd5 50%, #7ab8e8 100%)' }}>
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Single card with glass effect */}
          <div className="rounded-3xl bg-white/55 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/30">
            {/* Header section */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
              {/* Left: Calendar icon + Title */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">Employee Weekly Schedule Builder</h1>
                </div>
              </div>

              {/* Right: Week navigation + actions */}
              <div className="flex items-center gap-2">
                {/* Week indicator: relative label + date range + badge */}
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {relativeWeekLabel}
                  </span>
                  <span className="text-xs text-slate-500">
                    {dateRangeString}
                  </span>
                  {isThisWeek && (
                    <span className="text-[10px] font-medium uppercase tracking-wide bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>

                {/* Previous Week */}
                <Button
                  onClick={goToPreviousWeek}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-sm text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
                >
                  ← Prev
                </Button>

                {/* Today button */}
                <Button
                  onClick={goToToday}
                  variant={isThisWeek ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 px-3 text-sm rounded-lg ${
                    isThisWeek
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Today
                </Button>

                {/* Next Week */}
                <Button
                  onClick={goToNextWeek}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-sm text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
                >
                  Next →
                </Button>

                {/* Publish button */}
                <button
                  onClick={() => {
                    logData('SCHEDULE', 'Publish clicked', { draftCount })
                    handlePublish()
                  }}
                  disabled={draftCount === 0}
                  className="h-9 rounded-lg px-4 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Publish {draftCount > 0 && `(${draftCount})`}
                </button>
              </div>
            </div>

            {/* Grid section */}
            <div className="overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full p-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-slate-500">{SCHEDULE_MESSAGES.LOADING_SCHEDULE}</div>
                </div>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th
                          className="sticky top-0 left-0 z-20 border-b border-slate-200/50 px-4 py-2 text-left text-xs font-medium text-slate-500 min-w-[140px] bg-white/80"
                        >
                          Employee Name
                        </th>
                        {daysOfWeek.map((day, index) => {
                          const shortDate = day.date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })

                          return (
                            <th
                              key={index}
                              className={`sticky top-0 z-10 border-b border-slate-200/50 px-2 py-2 text-center min-w-[100px] bg-white/80 ${
                                day.isToday ? 'text-blue-600' : ''
                              }`}
                            >
                              <div className={`text-xs font-medium ${
                                day.isToday ? 'text-blue-600' : 'text-slate-600'
                              }`}>
                                {shortDate}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Open Shifts Row */}
                      <tr className="bg-slate-50/50" style={{ height: '55px' }}>
                        <td className="border border-slate-200/60 px-4 py-1 bg-slate-50/50">
                          <div className="text-sm font-medium text-slate-600">
                            Open Shifts
                          </div>
                        </td>
                        {daysOfWeek.map((day, dayIndex) => {
                          const shiftsForDay = openShifts.filter(shift => {
                            const shiftDate = new Date(shift.start_time).toDateString()
                            return shiftDate === day.date.toDateString()
                          })
                          return (
                            <td
                              key={dayIndex}
                              className="border border-slate-200/60 p-2 align-middle"
                              style={{ background: day.isToday ? 'rgba(239, 246, 255, 0.5)' : 'transparent' }}
                            >
                              {shiftsForDay.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  {shiftsForDay.map((shift) => (
                                    <div
                                      key={shift.id}
                                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all hover:shadow-lg"
                                      style={{
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)'
                                      }}
                                      onClick={() => handleShiftClick(shift, 'Open')}
                                    >
                                      <span className="text-xs font-medium text-slate-600">
                                        {formatShiftTime(shift.start_time, shift.end_time)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-200">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>

                      {staffEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-slate-400">
                            No staff employees found
                          </td>
                        </tr>
                      ) : (
                        staffEmployees.map((employee) => {
                          const hours = weeklyHours[employee.id] || 0
                          const formattedHours = formatShiftHours(hours)

                          return (
                            <tr
                              key={employee.id}
                              className="hover:bg-slate-50/50 transition-colors"
                              style={{ height: '55px' }}
                            >
                              {/* Employee name with hours */}
                              <td
                                className="sticky left-0 z-10 border border-slate-200/60 px-4 py-1 bg-white/80"
                              >
                                <div className="text-sm font-medium text-slate-800">
                                  {employee.first_name} <span className="text-slate-400 font-normal">({formattedHours})</span>
                                </div>
                              </td>
                              {/* Day cells */}
                              {daysOfWeek.map((day, dayIndex) => {
                                const shiftsForDay = shiftsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                                const timeOffsForDay = timeOffsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                                const dateString = day.date.toISOString().split('T')[0]
                                const specificDateAvailability = availabilityByEmployeeAndDate?.[employee.id]?.[dateString] || []
                                const recurringAvailability = availabilityByEmployeeAndDay[employee.id]?.[dayIndex] || []
                                const availabilityForDay = specificDateAvailability.length > 0 ? specificDateAvailability : recurringAvailability

                                return (
                                  <EmployeeDayCell
                                    key={dayIndex}
                                    employeeId={employee.id}
                                    employeeName={employee.first_name}
                                    dayIndex={dayIndex}
                                    shifts={shiftsForDay}
                                    timeOffs={timeOffsForDay}
                                    availability={availabilityForDay}
                                    isToday={day.isToday}
                                    onCellClick={() => handleCellClick(employee.id, employee.first_name, day.date, dayIndex)}
                                    onShiftClick={handleShiftClick}
                                    onDeleteShift={handleDeleteShift}
                                    onAvailabilityClick={(avail) => handleAvailabilityClick(employee.id, employee.first_name, day.date, dayIndex, avail)}
                                  />
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
      </div>

      <CreateShiftModal
        isOpen={modalState.isOpen}
        onClose={() => {
          logData('SCHEDULE', 'Create shift modal closed', { wasOpen: modalState.isOpen })
          setModalState({ ...modalState, isOpen: false })
        }}
        onSave={async (startTime, endTime, location, isOpenShift) => {
          logData('SCHEDULE', 'Save shift from modal', { employeeId: modalState.employeeId, date: modalState.date })
          await handleSaveShift(startTime, endTime, location, isOpenShift)
        }}
        employeeName={modalState.employeeName}
        date={modalState.date}
        hasTimeOff={modalState.hasTimeOff}
        timeOffReason={modalState.timeOffReason}
        initialStartTime={modalState.initialStartTime}
        initialEndTime={modalState.initialEndTime}
        initialLocation={modalState.initialLocation}
        pastShifts={modalState.pastShifts}
        availabilityWindow={modalState.availabilityWindow}
      />

      <EditShiftModal
        isOpen={editModalState.isOpen}
        onClose={() => {
          logData('SCHEDULE', 'Edit shift modal closed', { wasOpen: editModalState.isOpen })
          setEditModalState({ ...editModalState, isOpen: false })
        }}
        onSave={async (shiftId, startTime, endTime, location) => {
          logData('SCHEDULE', 'Update shift from modal', { shiftId: editModalState.shift?.id })
          await handleEditShift(shiftId, startTime, endTime, location)
        }}
        onDelete={(shiftId) => {
          logData('SCHEDULE', 'Delete shift from modal', { shiftId })
          handleDeleteShift(shiftId)
        }}
        shift={editModalState.shift}
        employeeName={editModalState.employeeName}
      />
    </div>
  )
}
