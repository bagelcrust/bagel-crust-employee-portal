import { useEffect, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { useGetScheduleBuilderData } from './fetch-schedule-data'
import { useScheduleActions } from './schedule-actions'
import { EmployeeDayCell } from './grid-employee-cell'
import { OpenShiftCell } from './open-shift-cell'
import { CreateShiftModal } from './create-shift-modal'
import { EditShiftModal } from './edit-shift-modal'
import { formatShiftHours } from '../shared/scheduleUtils'
import { PAGE_TITLES, SCHEDULE_MESSAGES } from '../shared/constants'
import { logData } from '../shared/debug-utils'

/**
 * Schedule Builder - Glassmorphism theme matching Clock In/Out and Employee Portal
 */

export default function ScheduleBuilder() {
  const {
    daysOfWeek,
    weekOffset,
    setWeekOffset,
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
    handleDragStart,
    handleDragEnd,
    activeShift,
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

  useEffect(() => {
    document.title = PAGE_TITLES.SCHEDULE_BUILDER
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Main card - glassmorphic */}
          <div className="bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden">
            {/* Header - week buttons centered, publish on right */}
            <div className="relative flex items-center justify-center px-5 py-3 bg-white/70 border-b border-gray-200/50">
              <div className="flex items-center gap-2">
                {[
                  { offset: -1, label: 'Last Week' },
                  { offset: 0, label: 'This Week' },
                  { offset: 1, label: 'Next Week' },
                  { offset: 2, label: 'Week After' }
                ].map(({ offset, label }) => (
                  <button
                    key={offset}
                    onClick={() => setWeekOffset(offset)}
                    className={`px-4 py-2 text-base font-semibold rounded-lg transition-all ${
                      weekOffset === offset
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/80 border border-gray-200 text-gray-700 hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  logData('SCHEDULE', 'Publish clicked', { draftCount })
                  handlePublish()
                }}
                disabled={draftCount === 0}
                className="absolute right-5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-40 disabled:hover:bg-blue-600 inline-flex items-center gap-1 transition-all"
              >
                <Send className="w-4 h-4" />
                Publish {draftCount > 0 && `(${draftCount})`}
              </button>
            </div>

            {/* Grid section */}
            <div className="overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full p-20">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <div className="text-sm text-gray-500">{SCHEDULE_MESSAGES.LOADING_SCHEDULE}</div>
                  </div>
                </div>
              ) : (
                <DndContext
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  collisionDetection={pointerWithin}
                >
                <div className="overflow-auto">
                  <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        {/* Employee column header */}
                        <th className="sticky top-0 left-0 z-20 border-b border-gray-200 px-3 py-2 text-left bg-white/95 backdrop-blur-sm" style={{ minWidth: '150px' }}>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Employee</span>
                        </th>
                        {/* Day headers - full date */}
                        {daysOfWeek.map((day, index) => (
                          <th
                            key={index}
                            className={`sticky top-0 z-10 px-2 py-2 text-center backdrop-blur-sm border-b border-gray-200 ${
                              day.isToday ? 'bg-blue-600 rounded-lg' : 'bg-white/95'
                            }`}
                            style={{ minWidth: '120px' }}
                          >
                            <div className={`text-base font-bold ${day.isToday ? 'text-white' : 'text-gray-800'}`}>
                              {format(day.date, 'EEEE')}
                            </div>
                            <div className={`text-sm ${day.isToday ? 'text-white/90' : 'text-gray-500'}`}>
                              {format(day.date, 'MMMM d')}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Open Shifts Row */}
                      <tr style={{ height: '56px' }}>
                        <td className="sticky left-0 z-10 border-b border-gray-200 border-r border-gray-100 px-3 py-2 bg-blue-50/50">
                          <div className="font-semibold text-gray-700">Open Shifts</div>
                        </td>
                        {daysOfWeek.map((day, dayIndex) => {
                          const shiftsForDay = openShifts.filter(shift => {
                            const shiftDate = new Date(shift.start_time).toDateString()
                            return shiftDate === day.date.toDateString()
                          })
                          return (
                            <OpenShiftCell
                              key={dayIndex}
                              dayIndex={dayIndex}
                              date={day.date}
                              isToday={day.isToday}
                              shifts={shiftsForDay}
                              onShiftClick={handleShiftClick}
                            />
                          )
                        })}
                      </tr>

                      {staffEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-400">No staff employees found</td>
                        </tr>
                      ) : (
                        staffEmployees.map((employee) => {
                          const hours = weeklyHours[employee.id] || 0
                          const formattedHours = formatShiftHours(hours)

                          return (
                            <tr key={employee.id} className="hover:bg-blue-50/30 transition-colors" style={{ height: '56px' }}>
                              {/* Employee cell */}
                              <td className="sticky left-0 z-10 border-b border-gray-200 border-r border-gray-100 px-3 py-2 bg-white">
                                <div className="font-semibold text-gray-800">
                                  {employee.first_name} <span className="font-normal text-gray-500">({formattedHours})</span>
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
                                    date={day.date}
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
                {/* Drag overlay - shows the shift being dragged */}
                <DragOverlay>
                  {activeShift ? (
                    <div className="bg-blue-600 rounded-lg px-3 py-2 shadow-lg cursor-grabbing opacity-90">
                      <div className="text-xs font-medium text-white">
                        {format(new Date(activeShift.start_time), 'h:mm')}-{format(new Date(activeShift.end_time), 'h:mm a')}
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
                </DndContext>
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
