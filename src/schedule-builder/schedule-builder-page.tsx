import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Send, Loader2, Trash2, Repeat } from 'lucide-react'
import { useGetScheduleBuilderData } from './fetch-schedule-data'
import { useScheduleActions } from './schedule-actions'
import { EmployeeDayCell } from './grid-employee-cell'
import { UnassignedShiftDisplay } from './unassigned-shifts-display'
import { CreateShiftModal } from './create-shift-modal'
import { EditShiftModal } from './edit-shift-modal'
import { Button } from './button'
import { formatShiftHours } from '../shared/scheduleUtils'
import { PAGE_TITLES, SCHEDULE_MESSAGES } from '../shared/constants'
import { logData } from '../shared/debug-utils'

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
    availabilityByEmployeeAndDay,
    timeOffs: _timeOffs,
    weeklyHours,
    isWeekPublished,
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
    handleClearDrafts,
    handleDeleteShift,
    handleDuplicateShift,
    handleRepeatLastWeek,
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
    <div className="h-screen flex flex-col bg-black">
      <div className="px-3 py-1">
        <div className="max-w-[1600px] mx-auto">
          <div className="rounded bg-zinc-900/40 border border-zinc-800/40">
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={goToPreviousWeek}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                <div className="px-2.5 py-1 rounded text-sm font-medium text-white">
                  {dateRangeString}
                </div>

                <Button
                  onClick={goToNextWeek}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Button
                onClick={() => {
                  logData('SCHEDULE', 'Go to today clicked', { currentWeek: dateRangeString })
                  goToToday()
                }}
                disabled={isThisWeek}
                variant="ghost"
                size="sm"
                className="h-7 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              >
                Today
              </Button>

              <Button
                onClick={() => {
                  logData('SCHEDULE', 'Repeat last week clicked', { currentWeek: dateRangeString, isPublished: isWeekPublished })
                  handleRepeatLastWeek()
                }}
                disabled={isWeekPublished}
                variant="ghost"
                size="sm"
                className="h-7 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              >
                <Repeat className="w-3 h-3 mr-1" />
                Repeat Last Week
              </Button>

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                {isWeekPublished && (
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">
                    ✓ Published
                  </span>
                )}

                <button
                  onClick={() => {
                    logData('SCHEDULE', 'Publish clicked', { draftCount, isPublished: isWeekPublished })
                    handlePublish()
                  }}
                  disabled={draftCount === 0}
                  className="h-7 rounded px-2.5 text-sm font-medium bg-white hover:bg-zinc-100 text-black disabled:opacity-30 disabled:pointer-events-none inline-flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  Publish {draftCount > 0 && `(${draftCount})`}
                </button>

                <Button
                  onClick={() => {
                    logData('SCHEDULE', 'Clear drafts clicked', { draftCount })
                    handleClearDrafts()
                  }}
                  disabled={draftCount === 0}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-2">
        <div className="max-w-[1600px] mx-auto">
          <div className="rounded-lg overflow-hidden bg-zinc-900/40 border border-zinc-800/40">
            {isLoading ? (
              <div className="flex items-center justify-center h-full p-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-zinc-400">{SCHEDULE_MESSAGES.LOADING_SCHEDULE}</div>
                </div>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th
                          className="sticky top-0 left-0 z-20 border-r border-b px-2 py-1 text-left text-xs font-normal text-zinc-500 uppercase tracking-wide min-w-[140px] bg-zinc-900/70 backdrop-blur-[10px] border-zinc-800/50"
                        >
                          Employee
                        </th>
                        {daysOfWeek.map((day, index) => {
                          const fullDate = day.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })

                          return (
                            <th
                              key={index}
                              className={`sticky top-0 z-10 border-r px-2 py-1 text-center min-w-[100px] ${
                                day.isToday ? 'bg-zinc-900' : 'bg-zinc-900/70 border-b border-zinc-800/50'
                              }`}
                              style={day.isToday ? {
                                borderBottom: '6px solid rgba(255, 255, 255, 0.5)'
                              } : undefined}
                            >
                              <div className="flex flex-col gap-0.5">
                                <div className={`text-xs font-normal uppercase tracking-wide ${
                                  day.isToday ? 'text-white/90' : 'text-zinc-500'
                                }`}>
                                  {day.dayName}
                                </div>
                                <div className={`text-sm ${
                                  day.isToday ? 'font-semibold text-white' : 'font-medium text-white'
                                }`}>
                                  {fullDate}
                                </div>
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ height: '48px', maxHeight: '48px' }}>
                          <td
                            className="sticky left-0 z-10 border-r border-b px-2 py-1 bg-zinc-900/60 backdrop-blur-[10px] border-zinc-800/50"
                            style={{ height: '48px', maxHeight: '48px', overflow: 'hidden' }}
                          >
                            <div className="text-sm font-medium text-white">
                              Open Shifts <span className="text-xs text-zinc-500">({openShifts.length} total)</span>
                            </div>
                          </td>
                          {daysOfWeek.map((day, dayIndex) => {
                            const shiftsForDay = openShifts.filter(shift => {
                              const shiftDate = new Date(shift.start_time).toDateString()
                              return shiftDate === day.date.toDateString()
                            })
                            return (
                              <UnassignedShiftDisplay
                                key={dayIndex}
                                dayIndex={dayIndex}
                                date={day.date}
                                shifts={shiftsForDay}
                                onCellClick={handleCellClick}
                                onShiftClick={handleShiftClick}
                                onDuplicateShift={handleDuplicateShift}
                              />
                            )
                          })}
                        </tr>

                      {staffEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-zinc-400">
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
                              style={{ height: '48px', maxHeight: '48px' }}
                            >
                              <td
                                className="sticky left-0 z-10 border-r border-b px-2 py-1 bg-zinc-900/60 backdrop-blur-[10px] border-zinc-800/50"
                                style={{ height: '48px', maxHeight: '48px', overflow: 'hidden' }}
                              >
                                <div className="text-sm font-medium text-white">
                                  {employee.first_name} <span className="text-xs text-zinc-500">({formattedHours})</span>
                                </div>
                              </td>
                              {daysOfWeek.map((day, dayIndex) => {
                                const shiftsForDay = shiftsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                                const timeOffsForDay = timeOffsByEmployeeAndDay[employee.id]?.[dayIndex] || []
                                const availabilityForDay = availabilityByEmployeeAndDay[employee.id]?.[dayIndex] || []

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

                      <tr className="border-t-2 border-zinc-700">
                        <td className="sticky left-0 z-10 border-r border-b px-2 py-1 bg-zinc-900/60 backdrop-blur-[10px] border-zinc-800/50">
                          <div className="text-sm font-medium text-white">
                            Total Staff <span className="text-xs text-zinc-500">({staffEmployees.length} employees)</span>
                          </div>
                        </td>
                        {daysOfWeek.map((day, dayIndex) => {
                          const peopleScheduled = staffEmployees.filter(emp => {
                            const shiftsForDay = shiftsByEmployeeAndDay[emp.id]?.[dayIndex] || []
                            return shiftsForDay.length > 0
                          }).length

                          const totalHours = staffEmployees.reduce((sum, emp) => {
                            const shiftsForDay = shiftsByEmployeeAndDay[emp.id]?.[dayIndex] || []
                            const dayHours = shiftsForDay.reduce((shiftSum, shift) => {
                              const start = new Date(shift.start_time)
                              const end = new Date(shift.end_time)
                              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                              return shiftSum + hours
                            }, 0)
                            return sum + dayHours
                          }, 0)

                          return (
                            <td
                              key={dayIndex}
                              className="border-r border-b p-1.5 text-center"
                              style={{
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                background: day.isToday ? 'rgba(255, 255, 255, 0.03)' : 'rgba(24, 24, 27, 0.4)'
                              }}
                            >
                              <div className="text-xs text-white">
                                <span className="font-semibold">{peopleScheduled}</span>
                                <span className="text-zinc-500 ml-1">({formatShiftHours(totalHours)})</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
            )}
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
