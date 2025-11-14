import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Send, Loader2, Trash2, Repeat } from 'lucide-react'
import { useScheduleBuilder } from '../hooks'
import { useScheduleBuilderActions } from '../hooks/useScheduleBuilderActions'
import { ShiftCell, OpenShiftCell } from '../components/schedule-builder'
import { AddShiftDialog } from '../components/AddShiftDialog'
import { EditShiftDialog } from '../components/EditShiftDialog'
import { Button } from '@/components/ui/button'
import {
  formatShiftHours,
  PAGE_TITLES,
  SCHEDULE_MESSAGES
} from '../lib'

/**
 * SCHEDULE BUILDER V2 - Clean, Component-Based Architecture
 *
 * ✅ REFACTORED (Nov 12, 2025)
 * - Components extracted to /components/schedule-builder/
 * - Event handlers extracted to useScheduleBuilderActions hook
 * - Debug logs wrapped in DEV check
 * - Single responsibility per component
 * - ~400 lines (down from 1,320)
 *
 * Features:
 * - Real employee data from Supabase
 * - Weekly grid with drag & drop
 * - Draft/publish workflow
 * - Conflict validation
 * - Time-off and availability display
 *
 * Following Bryan's Electrical Panel Principle:
 * - Every component in its proper place
 * - Easy to navigate and maintain
 * - Clear separation of concerns
 */

export default function ScheduleBuilderV2() {
  // ═══════════════════════════════════════════════════════════════
  // 📦 SECTION 1: GET DATA FROM DATABASE
  // ═══════════════════════════════════════════════════════════════
  // This hook calls the Edge Function to get all schedule data:
  // - Employees list
  // - Shifts for this week
  // - Time-offs
  // - Availability
  // - Weekly hours calculated
  // Think of it like: "Waiter, bring me everything for this week"

  const {
    dateRangeString,        // "Nov 11, 2025 - Nov 17, 2025"
    isThisWeek,             // true/false (is current week selected?)
    daysOfWeek,             // Array of 7 days (Mon-Sun)
    goToToday,              // Function: jump to current week
    goToPreviousWeek,       // Function: go back one week
    goToNextWeek,           // Function: go forward one week
    currentWeekStart,       // Date object (Monday of week)
    currentWeekEnd,         // Date object (Sunday of week)
    employees,              // Array of all employees
    openShifts,             // Shifts not assigned to anyone
    shiftsByEmployeeAndDay, // Organized: employee → day → shifts
    timeOffsByEmployeeAndDay, // Organized: employee → day → time-offs
    availabilityByEmployeeAndDay, // Organized: employee → day → availability
    timeOffs: _timeOffs,    // Unused - kept for destructuring compatibility
    weeklyHours,            // Total hours per employee this week
    isWeekPublished,        // true/false (is schedule published?)
    isLoading,              // true/false (still loading data?)
    refetchShifts,          // Function: reload shifts from database
    refetchPublishStatus    // Function: reload publish status
  } = useScheduleBuilder()

  // Filter to only show staff_two employees (front-of-house staff)
  const staffEmployees = employees.filter(emp => emp.role === 'staff_two')

  // ═══════════════════════════════════════════════════════════════
  // 📝 SECTION 2: POPUP WINDOWS (MODALS)
  // ═══════════════════════════════════════════════════════════════
  // State containers that control popup windows
  // Like: "Is the 'Add Shift' popup open? What data should it show?"

  // Add Shift Popup State
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
    isOpen: false,           // Popup starts closed
    employeeId: null,
    employeeName: '',
    date: new Date(),
    hasTimeOff: false,
    timeOffReason: '',
    pastShifts: [],
    availabilityWindow: null
  })

  // Edit Shift Popup State
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean
    shift: any | null
    employeeName: string
  }>({
    isOpen: false,           // Popup starts closed
    shift: null,
    employeeName: ''
  })

  // ═══════════════════════════════════════════════════════════════
  // 🎬 SECTION 3: ACTIONS (WHAT HAPPENS WHEN YOU CLICK THINGS)
  // ═══════════════════════════════════════════════════════════════
  // Functions that handle user clicks: add shift, delete shift, drag, etc.
  // Think of it like: "What should happen when Bryan clicks this button?"

  const {
    handleCellClick,        // When you click empty cell → open Add Shift popup
    handleSaveShift,        // When you save new shift → send to database
    handlePublish,          // When you click Publish → copy drafts to published
    handleClearDrafts,      // When you click Clear → delete all drafts
    handleDeleteShift,      // When you click trash icon → delete shift
    handleDuplicateShift,   // When you click duplicate → copy shift
    handleRepeatLastWeek,   // When you click Repeat → copy last week
    handleShiftClick,       // When you click existing shift → open Edit popup
    handleEditShift,        // When you save edited shift → update database
    handleAvailabilityClick,// When you click availability overlay
    draftCount              // Number of draft shifts not published yet
  } = useScheduleBuilderActions({
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

  // ═══════════════════════════════════════════════════════════════
  // ⚙️ SECTION 4: AUTOMATIC TASKS (RUN ON THEIR OWN)
  // ═══════════════════════════════════════════════════════════════
  // Things that happen automatically without user clicking

  // Task 1: Print debug info to console (only on dev server)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 SCHEDULE BUILDER V2 - RENDER')
      console.log('📊 Loading:', isLoading)
      console.log('👥 Staff Employees:', staffEmployees.length)
      console.log('📅 Week:', dateRangeString)
      console.log('🔓 Open Shifts:', openShifts.length)
      console.log('📢 Published:', isWeekPublished)
      console.log('📝 Draft Count:', draftCount)
    }
  }, [isLoading, staffEmployees.length, dateRangeString, openShifts.length, isWeekPublished, draftCount])

  // Task 2: Set browser tab title to "Schedule Builder"
  useEffect(() => {
    document.title = PAGE_TITLES.SCHEDULE_BUILDER
  }, [])

  // ═══════════════════════════════════════════════════════════════
  // 🎨 SECTION 5: DISPLAY THE PAGE (UI)
  // ═══════════════════════════════════════════════════════════════
  // Everything below is what the user SEES on screen
  // Structure:
  //   1. Header (week navigation, publish button)
  //   2. Schedule Grid (7 days × employees)
  //   3. Employee Availability List (bottom section)
  //   4. Hidden Popups (Add Shift, Edit Shift)

  return (
    // ┌─────────────────────────────────────────────────────────────┐
    // │ MAIN CONTAINER (Full Screen) - DARK MODE                   │
    // │ Tailwind: h-screen (height: 100vh)                         │
    // │           flex flex-col (vertical layout)                   │
    // │           bg-black (pure black background)                  │
    // └─────────────────────────────────────────────────────────────┘
    <div className="h-screen flex flex-col bg-black">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER SECTION (Week navigation + Publish buttons)       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="px-3 py-1">  {/* Tailwind: padding around header */}
        <div className="max-w-[1600px] mx-auto">  {/* Tailwind: max width + center */}

          {/* Header Card - DARK MODE */}
          <div className="rounded bg-zinc-900/40 border border-zinc-800/40">
            <div className="flex items-center gap-2 px-2 py-1">

              {/* ─────────────────────────────────────────────── */}
              {/* TODAY BUTTON                                    */}
              {/* Shadcn/UI: Button from /src/components/ui/button.tsx */}
              {/* Props: variant="outline", size="sm"            */}
              {/* ─────────────────────────────────────────────── */}
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
                onClick={goToToday}
                disabled={isThisWeek}
                variant="ghost"
                size="sm"
                className="h-7 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              >
                Today
              </Button>

              <Button
                onClick={handleRepeatLastWeek}
                disabled={isWeekPublished}
                variant="ghost"
                size="sm"
                className="h-7 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              >
                <Repeat className="w-3 h-3 mr-1" />
                Repeat Last Week
              </Button>

              {/* ─────────────────────────────────────────────── */}
              {/* SPACER (pushes remaining items to the right)    */}
              {/* Tailwind: flex-1 (takes all available space)   */}
              {/* ─────────────────────────────────────────────── */}
              <div className="flex-1" />

              {/* ─────────────────────────────────────────────── */}
              {/* PUBLISHED STATUS BADGE                          */}
              {/* Shadcn/UI: Badge from /src/components/ui/badge.tsx */}
              {/* Only shows if isWeekPublished is true          */}
              {/* ─────────────────────────────────────────────── */}
              <div className="flex items-center gap-2">
                {isWeekPublished && (
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">
                    ✓ Published
                  </span>
                )}

                <button
                  onClick={handlePublish}
                  disabled={draftCount === 0}
                  className="h-7 rounded px-2.5 text-sm font-medium bg-white hover:bg-zinc-100 text-black disabled:opacity-30 disabled:pointer-events-none inline-flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  Publish {draftCount > 0 && `(${draftCount})`}
                </button>

                <Button
                  onClick={handleClearDrafts}
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

      {/* Schedule Grid & Availability Container - Scrollable */}
      <div className="flex-1 overflow-auto px-3 pb-2">
        <div className="max-w-[1600px] mx-auto">
          {/* Schedule Grid - DARK MODE */}
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
                <table className="w-full border-collapse">
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
                      {/* Open Shifts Row - DARK MODE */}
                      <tr>
                          <td
                            className="sticky left-0 z-10 border-r border-b px-2 py-1 bg-zinc-900/60 backdrop-blur-[10px] border-zinc-800/50"
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
                              <OpenShiftCell
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

                      {/* Employee Rows */}
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
                            >
                              <td
                                className="sticky left-0 z-10 border-r border-b px-2 py-1 bg-zinc-900/60 backdrop-blur-[10px] border-zinc-800/50"
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
                                  <ShiftCell
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

                      {/* Totals Row */}
                      <tr className="border-t-2 border-zinc-700">
                        <td className="sticky left-0 z-10 border-r border-b px-2 py-1 bg-zinc-900/60 backdrop-blur-[10px] border-zinc-800/50">
                          <div className="text-sm font-medium text-white">
                            Total Staff <span className="text-xs text-zinc-500">({staffEmployees.length} employees)</span>
                          </div>
                        </td>
                        {daysOfWeek.map((day, dayIndex) => {
                          // Calculate how many people have shifts this day
                          const peopleScheduled = staffEmployees.filter(emp => {
                            const shiftsForDay = shiftsByEmployeeAndDay[emp.id]?.[dayIndex] || []
                            return shiftsForDay.length > 0
                          }).length

                          // Calculate total hours for this day
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

      {/* Add Shift Dialog */}
      <AddShiftDialog
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveShift}
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

      {/* Edit Shift Dialog */}
      <EditShiftDialog
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ ...editModalState, isOpen: false })}
        onSave={handleEditShift}
        onDelete={handleDeleteShift}
        shift={editModalState.shift}
        employeeName={editModalState.employeeName}
      />
    </div>
  )
}
