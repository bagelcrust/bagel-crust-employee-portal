/**
 * SchedulePreview - Compare 3 fundamentally different layout approaches
 *
 * 1. Timeline (Gantt) - Horizontal bars showing time
 * 2. Kanban - Day columns with stacking cards
 * 3. List - Minimal text-based view
 */

import { useState } from 'react'

// Employee colors
const COLORS = [
  { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46', name: 'mint' },
  { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', name: 'blue' },
  { bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6', name: 'lavender' },
  { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', name: 'peach' },
  { bg: '#FCE7F3', border: '#F9A8D4', text: '#9D174D', name: 'pink' },
]

// Sample data
const employees = [
  { id: '1', name: 'Maria', colorIndex: 0 },
  { id: '2', name: 'Carlos', colorIndex: 1 },
  { id: '3', name: 'Annie', colorIndex: 2 },
  { id: '4', name: 'Juan', colorIndex: 3 },
]

const days = ['Mon 12/9', 'Tue 12/10', 'Wed 12/11', 'Thu 12/12', 'Fri 12/13', 'Sat 12/14']

// Shifts with actual times for timeline view
const shifts = [
  { employee: 'Maria', day: 0, start: 6.5, end: 14, status: 'published' },
  { employee: 'Maria', day: 1, start: 7, end: 15, status: 'draft' },
  { employee: 'Maria', day: 3, start: 6.5, end: 14, status: 'published' },
  { employee: 'Carlos', day: 1, start: 14, end: 22, status: 'published' },
  { employee: 'Carlos', day: 2, start: 14, end: 22, status: 'published' },
  { employee: 'Carlos', day: 4, start: 10, end: 18, status: 'draft' },
  { employee: 'Annie', day: 0, start: 6.5, end: 14, status: 'published' },
  { employee: 'Annie', day: 2, start: 6.5, end: 14, status: 'published' },
  { employee: 'Annie', day: 5, start: 8, end: 16, status: 'published' },
  { employee: 'Juan', day: 1, start: 6, end: 14, status: 'published' },
  { employee: 'Juan', day: 3, start: 14, end: 22, status: 'draft' },
]

function formatTime(hour: number): string {
  const h = Math.floor(hour)
  const m = (hour % 1) * 60
  const ampm = h >= 12 ? 'p' : 'a'
  const displayH = h > 12 ? h - 12 : h
  return m > 0 ? `${displayH}:${m.toString().padStart(2, '0')}${ampm}` : `${displayH}${ampm}`
}

// ============================================
// LAYOUT 1: TIMELINE (GANTT)
// ============================================
function TimelineLayout() {
  const startHour = 6
  const endHour = 23
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Timeline View</h3>
        <p className="text-xs text-gray-500">Horizontal bars show shift duration</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-1 px-4 py-2 border-b border-gray-100 bg-white">
        {days.map((day, i) => (
          <button
            key={i}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              i === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timeline grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Hour headers */}
          <div className="flex border-b border-gray-100">
            <div className="w-24 flex-shrink-0 px-3 py-2 text-xs font-medium text-gray-400">
              Employee
            </div>
            <div className="flex-1 flex">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 px-1 py-2 text-xs text-gray-400 text-center border-l border-gray-50"
                >
                  {formatTime(hour)}
                </div>
              ))}
            </div>
          </div>

          {/* Employee rows */}
          {employees.map((emp) => {
            const color = COLORS[emp.colorIndex]
            const empShifts = shifts.filter(s => s.employee === emp.name && s.day === 1) // Tuesday

            return (
              <div key={emp.id} className="flex border-b border-gray-50 hover:bg-gray-50/50">
                <div className="w-24 flex-shrink-0 px-3 py-3 flex items-center gap-2">
                  <div className="w-2 h-6 rounded-full" style={{ backgroundColor: color.border }}></div>
                  <span className="text-sm font-medium text-gray-800">{emp.name}</span>
                </div>
                <div className="flex-1 relative h-12">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {hours.map((_, i) => (
                      <div key={i} className="flex-1 border-l border-gray-50"></div>
                    ))}
                  </div>
                  {/* Shift bars */}
                  {empShifts.map((shift, i) => {
                    const left = ((shift.start - startHour) / (endHour - startHour)) * 100
                    const width = ((shift.end - shift.start) / (endHour - startHour)) * 100
                    return (
                      <div
                        key={i}
                        className="absolute top-2 h-8 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer hover:scale-[1.02] transition-transform"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: color.bg,
                          border: `2px ${shift.status === 'draft' ? 'dashed' : 'solid'} ${color.border}`,
                          color: color.text,
                        }}
                      >
                        {formatTime(shift.start)} - {formatTime(shift.end)}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// LAYOUT 2: KANBAN (DAY COLUMNS)
// ============================================
function KanbanLayout() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Kanban View</h3>
        <p className="text-xs text-gray-500">Days as columns, shifts stack as cards</p>
      </div>

      <div className="flex gap-3 p-4 overflow-x-auto">
        {days.map((day, dayIndex) => {
          const dayShifts = shifts.filter(s => s.day === dayIndex)
          const isToday = dayIndex === 1

          return (
            <div
              key={dayIndex}
              className={`flex-shrink-0 w-48 rounded-xl ${
                isToday ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'
              }`}
            >
              {/* Day header */}
              <div className={`px-3 py-2 rounded-t-xl ${
                isToday ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <div className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="text-xs text-gray-500">{dayShifts.length} shifts</div>
              </div>

              {/* Shift cards */}
              <div className="p-2 space-y-2 min-h-[200px]">
                {dayShifts.map((shift, i) => {
                  const emp = employees.find(e => e.name === shift.employee)!
                  const color = COLORS[emp.colorIndex]
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: color.bg,
                        border: `2px ${shift.status === 'draft' ? 'dashed' : 'solid'} ${color.border}`,
                      }}
                    >
                      <div className="text-sm font-bold" style={{ color: color.text }}>
                        {shift.employee}
                      </div>
                      <div className="text-xs mt-1" style={{ color: color.text, opacity: 0.8 }}>
                        {formatTime(shift.start)} - {formatTime(shift.end)}
                      </div>
                    </div>
                  )
                })}
                {dayShifts.length === 0 && (
                  <div className="text-center py-8 text-gray-300 text-sm">No shifts</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// LAYOUT 3: LIST VIEW
// ============================================
function ListLayout() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">List View</h3>
        <p className="text-xs text-gray-500">Minimal, text-focused, ultra-scannable</p>
      </div>

      <div className="divide-y divide-gray-100">
        {days.map((day, dayIndex) => {
          const dayShifts = shifts.filter(s => s.day === dayIndex)
          const isToday = dayIndex === 1

          return (
            <div key={dayIndex} className={isToday ? 'bg-blue-50/50' : ''}>
              {/* Day header */}
              <div className={`px-4 py-2 flex items-center justify-between ${
                isToday ? 'bg-blue-100/50' : 'bg-gray-50'
              }`}>
                <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                  {day}
                </span>
                <span className="text-xs text-gray-400">{dayShifts.length} shifts</span>
              </div>

              {/* Shifts list */}
              <div className="px-4 py-2">
                {dayShifts.length > 0 ? (
                  <div className="space-y-1">
                    {dayShifts.map((shift, i) => {
                      const emp = employees.find(e => e.name === shift.employee)!
                      const color = COLORS[emp.colorIndex]
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color.border }}
                          ></div>
                          <span className="text-sm font-medium text-gray-800 w-20">{shift.employee}</span>
                          <span className="text-sm text-gray-500">
                            {formatTime(shift.start)} - {formatTime(shift.end)}
                          </span>
                          {shift.status === 'draft' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">draft</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-300 py-2">No shifts scheduled</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// MAIN PREVIEW COMPONENT WITH TABS
// ============================================
export function SchedulePreview() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'kanban' | 'list'>('timeline')

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-purple-800">
              3 DIFFERENT LAYOUTS - Pick your favorite
            </span>
            <p className="text-xs text-purple-600 mt-0.5">
              These are fundamentally different approaches, not just color changes
            </p>
          </div>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Timeline (Gantt)
        </button>
        <button
          onClick={() => setActiveTab('kanban')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'kanban'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Kanban (Columns)
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'list'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          List (Minimal)
        </button>
      </div>

      {/* Active layout */}
      {activeTab === 'timeline' && <TimelineLayout />}
      {activeTab === 'kanban' && <KanbanLayout />}
      {activeTab === 'list' && <ListLayout />}
    </div>
  )
}
