import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Send, Loader2, Trash2, Repeat, Copy } from 'lucide-react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useScheduleBuilder } from '../hooks'
import { useScheduleBuilderActions } from '../hooks/useScheduleBuilderActions'
import { ShiftCell } from '../components/schedule-builder'
import { AddShiftDialog } from '../components/AddShiftDialog'
import { EditShiftDialog } from '../components/EditShiftDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatShiftTime,
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
  }>({
    isOpen: false,           // Popup starts closed
    employeeId: null,
    employeeName: '',
    date: new Date(),
    hasTimeOff: false,
    timeOffReason: ''
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
    handleDragStart,        // When you start dragging shift
    handleDragEnd,          // When you drop shift in new cell
    handleShiftClick,       // When you click existing shift → open Edit popup
    handleEditShift,        // When you save edited shift → update database
    handleAvailabilityClick,// When you click availability overlay
    activeShift,            // Which shift is currently being dragged
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
    // │ MAIN CONTAINER (Full Screen)                               │
    // │ Tailwind: h-screen (height: 100vh)                         │
    // │           flex flex-col (vertical layout)                   │
    // │           bg-gradient-to-br (blue→purple gradient)          │
    // └─────────────────────────────────────────────────────────────┘
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER SECTION (Week navigation + Publish buttons)       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="px-6 py-4">  {/* Tailwind: padding around header */}
        <div className="max-w-[1600px] mx-auto">  {/* Tailwind: max width + center */}

          {/* Shadcn/UI: Card component from /src/components/ui/card.tsx */}
          <Card className="shadow-lg bg-white/90 backdrop-blur-lg border-white/50">

            {/* Shadcn/UI: CardContent (inner container of Card) */}
            <CardContent className="flex items-center gap-3 p-5">

              {/* ─────────────────────────────────────────────── */}
              {/* TODAY BUTTON                                    */}
              {/* Shadcn/UI: Button from /src/components/ui/button.tsx */}
              {/* Props: variant="outline", size="sm"            */}
              {/* ─────────────────────────────────────────────── */}
              <Button
                onClick={goToToday}           // Section 3: Action handler
                disabled={isThisWeek}         // Section 1: Data from hook
                variant="outline"             // Shadcn: button style variant
                size="sm"                     // Shadcn: button size
                className="border-2"          // Tailwind: thicker border
              >
                Today
              </Button>

              {/* ─────────────────────────────────────────────── */}
              {/* DATE RANGE DISPLAY                              */}
              {/* Regular HTML button (not Shadcn)               */}
              {/* Tailwind: px-4 py-2 (padding), rounded-lg      */}
              {/* ─────────────────────────────────────────────── */}
              <button
                className="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 font-medium text-gray-700"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',  // Custom CSS (not Tailwind)
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Lucide Icon: Calendar (from lucide-react package) */}
                <Calendar className="w-4 h-4 text-gray-500" />
                {dateRangeString}  {/* Section 1: Data from hook */}
              </button>

              {/* ─────────────────────────────────────────────── */}
              {/* WEEK NAVIGATION ARROWS                          */}
              {/* ─────────────────────────────────────────────── */}
              <div className="flex gap-1">  {/* Tailwind: flex container with gap */}

                {/* Shadcn/UI: Button (Previous Week) */}
                <Button
                  onClick={goToPreviousWeek}  // Section 3: Action handler
                  variant="ghost"             // Shadcn: transparent background
                  size="icon"                 // Shadcn: icon-only size
                  className="h-9 w-9"         // Tailwind: square button
                >
                  {/* Lucide Icon: ChevronLeft */}
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                {/* Shadcn/UI: Button (Next Week) */}
                <Button
                  onClick={goToNextWeek}      // Section 3: Action handler
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  {/* Lucide Icon: ChevronRight */}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* ─────────────────────────────────────────────── */}
              {/* REPEAT LAST WEEK BUTTON                         */}
              {/* Shadcn/UI: Button with custom Tailwind styling */}
              {/* ─────────────────────────────────────────────── */}
              <Button
                onClick={handleRepeatLastWeek}  // Section 3: Action handler
                variant="outline"
                size="sm"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50"  // Tailwind: custom colors
              >
                {/* Lucide Icon: Repeat */}
                <Repeat className="w-4 h-4 mr-2" />
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
              {isWeekPublished && (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                  ✓ Published
                </Badge>
              )}

              {/* ─────────────────────────────────────────────── */}
              {/* PUBLISH BUTTON                                  */}
              {/* Shadcn/UI: Button (blue, primary action)       */}
              {/* ─────────────────────────────────────────────── */}
              <Button
                onClick={handlePublish}       // Section 3: Action handler
                disabled={draftCount === 0}   // Disabled if no drafts
                size="sm"
                className="shadow-md"         // Tailwind: drop shadow
              >
                {/* Lucide Icon: Send */}
                <Send className="w-4 h-4 mr-2" />
                Publish ({draftCount})  {/* Section 3: Data from hook */}
              </Button>

              {/* ─────────────────────────────────────────────── */}
              {/* CLEAR DRAFTS BUTTON                             */}
              {/* Shadcn/UI: Button (red, destructive action)    */}
              {/* ─────────────────────────────────────────────── */}
              <Button
                onClick={handleClearDrafts}   // Section 3: Action handler
                disabled={draftCount === 0}   // Disabled if no drafts
                variant="destructive"         // Shadcn: red color
                size="sm"
                className="shadow-md"
              >
                {/* Lucide Icon: Trash2 */}
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Grid & Availability Container - Scrollable */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Schedule Grid */}
          <Card className="overflow-hidden shadow-lg bg-white/90 backdrop-blur-lg border-white/50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full p-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-gray-600">{SCHEDULE_MESSAGES.LOADING_SCHEDULE}</div>
                </div>
              </div>
            ) : (
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="overflow-auto">
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
                          Employee ({staffEmployees.length})
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
                                          background: 'rgba(147, 197, 253, 0.5)',
                                          border: '1px solid rgba(147, 197, 253, 0.8)',
                                          backdropFilter: 'blur(5px)'
                                        }}
                                        onClick={() => handleShiftClick({ ...shift, status: 'draft' }, 'Open Shift')}
                                      >
                                        <div className="text-xs font-medium text-blue-900">
                                          {formatShiftTime(shift.start_time, shift.end_time)}
                                        </div>
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDuplicateShift({ ...shift, status: 'draft' }, 'Open Shift')
                                          }}
                                          size="icon"
                                          variant="default"
                                          className="absolute top-0 left-0 -mt-1 -ml-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Duplicate shift"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteShift(shift.id)
                                          }}
                                          size="icon"
                                          variant="destructive"
                                          className="absolute top-0 right-0 -mt-1 -mr-1 rounded-full h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Delete shift"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
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
                      {staffEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-500">
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
                    </tbody>
                  </table>
                </div>
                <DragOverlay>
                  {activeShift ? (
                    <div className="rounded px-2 py-1 shadow-lg" style={{
                      background: activeShift.status === 'published'
                        ? 'rgba(30, 64, 175, 0.85)'
                        : 'rgba(147, 197, 253, 0.5)',
                      border: activeShift.status === 'published'
                        ? '1px solid rgba(30, 64, 175, 1)'
                        : '1px solid rgba(147, 197, 253, 0.8)'
                    }}>
                      <div className={`text-xs font-medium ${
                        activeShift.status === 'published' ? 'text-white' : 'text-blue-900'
                      }`}>
                        {formatShiftTime(activeShift.start_time, activeShift.end_time)}
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </Card>

        </div>
      </div>

      {/* Add Shift Dialog */}
      <AddShiftDialog
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveShift}
        employeeName={modalState.employeeName}
        date={modalState.date.toISOString().split('T')[0]}
        hasTimeOff={modalState.hasTimeOff}
        timeOffReason={modalState.timeOffReason}
        initialStartTime={modalState.initialStartTime}
        initialEndTime={modalState.initialEndTime}
        initialLocation={modalState.initialLocation}
      />

      {/* Edit Shift Dialog */}
      <EditShiftDialog
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ ...editModalState, isOpen: false })}
        onSave={handleEditShift}
        shift={editModalState.shift}
        employeeName={editModalState.employeeName}
      />
    </div>
  )
}
