# Schedule Builder V2 - Documentation

## Table of Contents
- [Overview](#overview)
- [Header Bar](#header-bar)
  - [Today Button](#today-button)
  - [Week Arrows](#week-arrows)
  - [Repeat Last Week](#repeat-last-week)
  - [Published Badge](#published-badge)
  - [Publish Button](#publish-button)
  - [Clear Button](#clear-button)
- [Schedule Grid](#schedule-grid)
  - [Open Shifts Row](#open-shifts-row)
  - [Employee Rows](#employee-rows)
  - [Cell States](#cell-states)
  - [Grid Interactions](#grid-interactions)
- [Modals](#modals)
  - [Add Shift Modal](#add-shift-modal)
  - [Edit Shift Modal](#edit-shift-modal)
- [Where to Find Things](#where-to-find-things)
- [Technical Details](#technical-details)
- [Edge Cases & Notes](#edge-cases--notes)

---

## Overview

Schedule Builder V2 is a weekly shift scheduler that lets you create, edit, and publish employee shifts through a visual grid interface. It displays one row per employee and seven columns for each day of the week. You can click cells to add shifts, click existing shifts to edit them, and navigate between weeks. The system respects employee availability and time-off, preventing you from scheduling people when they're unavailable.

**Database Architecture:** The system uses a hybrid two-table architecture:

- `draft_shifts` table - Experimental workspace where all new shifts are created. Not visible to employees.
- `published_shifts` table - Immutable historical record of published schedules. Visible to employees.

Shifts are created as drafts, then COPIED to published when you publish the week. Drafts remain after publishing and can be cleared manually. All database access uses Postgres RPC functions for server-side validation and conflict checking.

**Main pieces:**

- Header Bar - Week navigation, publishing controls, bulk actions
- Schedule Grid - The actual schedule table with cells for each employee × day
- Modals - Popup forms for adding and editing shifts

---

## Header Bar

### Today Button

Jumps you to the current week when clicked. Useful when you've navigated far from today's date and need to quickly return. The button uses the system's current date to determine which week to display.

**Technical details:**

- Component: Button from UI library
- Action: Calls `goToToday()` from `useScheduleBuilder.ts`
- Visual: Standard button styling with "Today" text

### Week Arrows

Two arrow buttons (< and >) that let you move backward and forward one week at a time. Left arrow goes to previous week, right arrow goes to next week. The displayed week updates immediately when clicked.

**Technical details:**

- Components: Two Button elements with ChevronLeft and ChevronRight icons
- Actions: `goToPreviousWeek()` and `goToNextWeek()` from `useScheduleBuilder.ts`
- Visual: Icon-only buttons, no text labels

### Repeat Last Week

Copies all PUBLISHED shifts from the previous week to the current week you're viewing. Only copies shift assignments themselves, not time-off or availability. Useful for recurring weekly schedules. Shifts are created as drafts (not published) in the current week. If any shifts conflict with time-off or availability, they are automatically skipped with a count shown in the success message.

**Technical details:**

- Component: Button with Repeat icon
- Action: Calls `handleRepeatLastWeek()` from `useScheduleBuilderActions.ts`
- Behavior:
  1. Fetches published shifts from previous week via `shiftService.getPublishedShifts()`
  2. For each shift, shifts dates forward by 7 days
  3. Creates as draft via `shiftService.createShift()` (skips if conflicts)
  4. Reports count of created vs skipped shifts
- Source: Only published shifts (from `published_shifts` table)
- Destination: Creates drafts (in `draft_shifts` table)
- Disabled if: Current week is already published

### Published Badge

Shows a green badge with "Published" text when the currently displayed week has ANY published shifts. Disappears when viewing a week with only drafts or no shifts. Provides quick visual confirmation of week status. Note: A week can have both published shifts AND draft shifts simultaneously (drafts remain after publishing until manually cleared).

**Technical details:**

- Component: Badge from UI library
- Visibility: Shows when `isWeekPublished === true`
- Logic: `isWeekPublished = (scheduleData.publishedShifts.length > 0)`
- Visual: Green background (`bg-green-100`), green text (`text-green-800`)

### Publish Button

Copies all draft shifts for the current week to the `published_shifts` table. Once published, shifts become visible to employees and are considered "locked in." The drafts remain in the `draft_shifts` table and can be cleared manually using the Clear button. Publishing includes server-side conflict validation - if any conflicts exist, publishing is blocked. The button triggers a confirmation dialog to prevent accidental publishing.

**Technical details:**

- Component: Button (primary variant)
- Action: Calls `handlePublish()` from `useScheduleBuilderActions.ts`
- Behavior: Calls Postgres RPC `publish_schedule_builder_week` which COPIES drafts → published_shifts, then optionally clears drafts
- Validation: Checks for scheduling conflicts before publishing (strict mode)
- Disabled if: Week is already published or has no draft shifts

### Clear Button

Deletes all draft shifts for the current week from the `draft_shifts` table. Only affects unpublished drafts - published shifts in `published_shifts` table remain untouched (immutable historical record). Useful for starting over when you've made mistakes or want to rebuild the week from scratch.

**Technical details:**

- Component: Button (destructive variant)
- Action: Calls `handleClearDrafts()` from `useScheduleBuilderActions.ts`
- Behavior: Calls Postgres RPC `clear_schedule_builder_drafts` which deletes all drafts for the week
- Returns: Count of deleted shifts
- Disabled if: No draft shifts exist in current week

---

## Schedule Grid

### Open Shifts Row

The top row of the grid, separate from employee rows, displays unassigned shifts. These are shifts that need coverage but aren't assigned to a specific person yet. You can click any open shift to edit or delete it.

**Technical details:**

- Component: `OpenShiftCell.tsx`
- Data source: Filtered from shifts where `employee_id === null`
- Interactions: Click shift card to open edit modal
- Visual: Same shift card styling as regular employee shifts

### Employee Rows

One row for each employee in your system, showing seven cells for Monday through Sunday. Each cell represents the intersection of that employee and that day. Rows display the employee's name on the left side.

**Technical details:**

- Component: `<tr>` element containing employee name cell + 7 `ShiftCell` components
- Data source: Employee list from `useScheduleBuilder.ts`
- Visual: Fixed height, alternating subtle backgrounds for readability
- Hover: Individual cells lighten, not the entire row

### Cell States

Each cell can be in one of five states depending on what data exists for that employee on that day. The state determines what displays in the cell and whether you can click it.

**HAS_CONTENT** - The cell contains one or more shifts (published or draft) and/or time-off notices. Shows shift cards with time ranges and/or time-off cards. Clicking a shift card opens the edit modal. Multiple items stack vertically.

**AVAILABLE** - The employee has availability windows set for this day. Shows time ranges in dark gray text with green overlay on hover (e.g., "9:00 AM - 5:00 PM"). Cell is clickable and opens add shift modal. If multiple availability windows exist, they stack vertically. If partial time-off overlaps availability, only non-overlapping windows display.

**TIME_OFF** - The employee has all-day time-off for this day. Shows "TIME OFF" text in dark gray, uppercase. Cell is blocked (not clickable, no hover effect).

**UNAVAILABLE** - The employee has no availability set for this day (they haven't specified when they can work). Shows a single dash "-" in dark gray. Cell is blocked (not clickable, no hover effect).

**EMPTY** - Fallback state when none of the above apply (rare). Shows blank cell, clickable.

**Detection logic (in order):**

1. If `shifts.length > 0 || timeOffs.length > 0` → HAS_CONTENT
2. If all-day time-off exists → TIME_OFF
3. Filter availability to remove partial time-off overlaps
4. If filtered availability is empty → UNAVAILABLE
5. If filtered availability has items → AVAILABLE
6. Otherwise → EMPTY

**Technical details:**

- Component: `ShiftCell.tsx`
- Logic: `determineCellState()` function (lines ~92-150)
- Height: `h-[48px]` (fixed, always the same)
- Text styling for TIME_OFF/UNAVAILABLE: `text-xs text-zinc-600 uppercase tracking-wide`
- Availability text: `text-xs text-zinc-600`
- Shift styling: `text-sm`, published = dark background, draft = lighter background
- Background: Today column uses `rgba(255, 255, 255, 0.03)`, others use `rgba(24, 24, 27, 0.4)`
- Hover (AVAILABLE state): Green overlay using `AvailabilityOverlay.tsx` component
- Hover (general): `linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))` overlay

### Grid Interactions

Clicking different parts of the grid triggers different actions. Shifts are clickable and open the edit modal where you can modify times or delete the shift. Available cells (showing time ranges) are clickable and open the add shift modal, pre-filling with the availability times. Time-off and unavailable cells block all interactions - clicking them does nothing.

**Technical details:**

- Click detection: `onClick` handler in `ShiftCell.tsx` (lines 206-212)
- Shift click: Uses `.closest('.shift-card')` to detect clicks on shift cards
- Cell click: Only fires if cell is clickable (`isClickable && !isClickingShift`)
- Blocked states: `TIME_OFF` and `UNAVAILABLE` set `isBlocked = true`

---

## Modals

### Add Shift Modal

A popup form that appears when you click an available cell. Contains fields for start time, end time, and location. If you clicked a cell showing availability times, those times pre-fill the start/end fields. Submitting the form creates a new draft shift.

**Technical details:**

- Component: `AddShiftDialog.tsx`
- Props: `isOpen`, `onClose`, `onSave`, `employeeId`, `employeeName`, `date`, `defaultStartTime`, `defaultEndTime`
- Pre-fill behavior: `defaultStartTime` and `defaultEndTime` props populate when clicking availability
- Submit action: Calls `handleAddShift()` from `useScheduleBuilderActions.ts`
- Validation: Ensures start time is before end time, both fields required

### Edit Shift Modal

A popup form that appears when you click an existing shift card. Shows the shift's current start time, end time, and location in editable fields. Also contains a delete button (red, left side of footer) that removes the shift entirely. This is the only place where you can delete shifts.

**Technical details:**

- Component: `EditShiftDialog.tsx`
- Props: `isOpen`, `onClose`, `onSave`, `onDelete`, `shift`, `employeeName`
- Delete button: Red destructive variant with Trash2 icon, positioned on left side of footer
- Submit action: Calls `handleEditShift()` from `useScheduleBuilderActions.ts`
- Delete action: Calls `handleDeleteShift()` from `useScheduleBuilderActions.ts`
- Validation: Same as add modal (start before end, both required)

---

## Where to Find Things

| Need to change... | File |
|-------------------|------|
| Main page layout | `ScheduleBuilderV2.tsx` |
| Header bar buttons | `ScheduleBuilderV2.tsx` |
| Grid cells | `ShiftCell.tsx` |
| Cell state logic | `ShiftCell.tsx` (lines ~92-150) |
| Shift cards | `ShiftCard.tsx` |
| Open shifts row | `OpenShiftCell.tsx` |
| Availability hover overlay | `AvailabilityOverlay.tsx` |
| Time-off hover overlay | `TimeOffOverlay.tsx` |
| Employee availability list | `EmployeeAvailabilityList.tsx` |
| Add shift popup | `AddShiftDialog.tsx` |
| Edit shift popup | `EditShiftDialog.tsx` |
| All actions (click/delete/publish) | `useScheduleBuilderActions.ts` |
| Data fetching, week navigation | `useScheduleBuilder.ts` |
| Draft shift CRUD operations | `supabase/services/shiftService.ts` |
| Publish/clear operations | `supabase/services/publishService.ts` |

**File structure:**

```
/pages/
  ScheduleBuilderV2.tsx        Main page with header bar and grid

/components/schedule-builder/
  ShiftCell.tsx                 Individual grid cells, state detection
  ShiftCard.tsx                 Shift display cards (used in cells)
  OpenShiftCell.tsx             Open shifts row at top of grid
  AvailabilityOverlay.tsx       Green hover overlay for available cells
  TimeOffOverlay.tsx            Time-off hover overlay
  EmployeeAvailabilityList.tsx  Employee availability display component

/components/
  AddShiftDialog.tsx            Add shift modal form
  EditShiftDialog.tsx           Edit shift modal form (has delete button)

/hooks/
  useScheduleBuilder.ts         Data fetching via Postgres RPC, week navigation
  useScheduleBuilderActions.ts  All actions: add, edit, delete, publish, clear

/supabase/services/
  shiftService.ts               CRUD operations for draft_shifts table
  publishService.ts             Publish/clear operations for published_shifts
  conflictService.ts            Conflict detection and validation
```

---

## Technical Details

**Database Tables (PostgreSQL via Supabase):**

- `employees.draft_shifts` - Experimental workspace for schedule building
  - Columns: id, employee_id (nullable), start_time, end_time, location, role, created_at, updated_at
  - employee_id = null creates an "open shift"
  - Not visible to employees
- `employees.published_shifts` - Immutable historical record of published schedules
  - Columns: id, employee_id (nullable), start_time, end_time, location, role, published_at, week_start, week_end, shift_status
  - Visible to employees in their schedules
  - Never modified after creation (historical integrity)
- `employees.time_off_notices` - Time-off requests and approvals
  - Columns: id, employee_id, start_time, end_time, reason, status, all_day, start_date, end_date
- `employees.availability` - Employee availability windows by day of week
  - Columns: id, employee_id, day_of_week, start_time, end_time, effective_start_date

**Postgres RPC Functions:**

- `get_schedule_builder_data(p_start_date, p_end_date)` - Single query that returns all data for a week (employees, drafts, published shifts, time-offs, availability, weekly hours, publish status)
- `create_schedule_builder_shift()` - Creates draft shift with server-side conflict validation
- `update_schedule_builder_shift()` - Updates shift (or creates draft if published)
- `publish_schedule_builder_week()` - COPIES drafts → published_shifts with conflict validation
- `clear_schedule_builder_drafts()` - Deletes draft shifts for a week

**Global borders:**

- All cells: `1px` border with `rgba(255, 255, 255, 0.08)` color
- Consistent across entire grid

**Global backgrounds:**

- Today column: `rgba(255, 255, 255, 0.03)` (slight white tint)
- Other columns: `rgba(24, 24, 27, 0.4)` (zinc-900 at 40% opacity)
- Maintains consistency across all cell states

**Global cursors:**

- Clickable cells: `cursor-pointer`
- Blocked cells: default cursor (no special cursor, no `cursor-not-allowed`)

**Grid structure:**

- Fixed cell height: `h-[48px]` (48 pixels, never changes)
- 7 columns (days) + 1 column (employee name)
- Variable number of rows (one per employee + open shifts row)

**Data Flow:**

1. User navigates to week → Fetches all data via `get_schedule_builder_data` RPC
2. User adds shift → Calls `create_schedule_builder_shift` RPC → Inserts into `draft_shifts`
3. User edits shift → Calls `update_schedule_builder_shift` RPC → Updates in `draft_shifts` (or creates draft if published)
4. User publishes week → Calls `publish_schedule_builder_week` RPC → COPIES drafts to `published_shifts`
5. User clears drafts → Calls `clear_schedule_builder_drafts` RPC → Deletes from `draft_shifts`

---

## Edge Cases & Notes

**Partial time-off + availability:**

When an employee has partial time-off (e.g., 1:00 PM - 5:00 PM off) and availability windows (e.g., 9:00 AM - 3:00 PM available), the system filters out any availability that overlaps with the time-off. Only non-overlapping availability windows display. If all availability gets filtered out, the cell shows UNAVAILABLE state.

**Multiple shifts in same cell:**

When an employee has multiple shifts on the same day, they stack vertically with `space-y-1` spacing between cards. Each shift is independently clickable and opens its own edit modal. Common in scenarios where someone works a split shift (morning and evening).

**Multiple availability windows:**

When an employee has multiple availability windows on the same day (e.g., 9:00 AM - 12:00 PM and 2:00 PM - 5:00 PM), they stack vertically with `space-y-0.5` spacing. The entire cell is clickable and opens the add shift modal with the first availability window pre-filled.

**Publishing behavior:**

Publishing is week-level, not shift-level. When you click Publish, ALL draft shifts for that week are COPIED from `draft_shifts` to `published_shifts`. You cannot selectively publish individual shifts. Drafts remain in `draft_shifts` table after publishing and can be cleared manually or kept for reference. Published shifts in `published_shifts` are immutable (historical record) - they're never modified or deleted. There's no "unpublish" action. If you edit a published shift, it creates a new draft with the updated data.

**Time-off precedence:**

All-day time-off takes precedence over everything. Even if an employee has availability set, all-day time-off blocks the cell completely. Partial time-off filters availability but doesn't block the entire cell.

**Important to remember:**

- Cell height is always `h-[48px]` - changing this breaks grid alignment
- Hover effects apply only to the hovered cell, never the entire row
- Delete functionality only exists in edit modal, not on grid cells directly
- Two-table architecture: `draft_shifts` (workspace) and `published_shifts` (historical record)
- Publishing COPIES drafts → published (doesn't move or convert them)
- Drafts remain after publishing - use Clear button to remove them
- Draft shifts are not visible to employees - only published shifts appear in their view
- Published shifts are immutable - editing them creates new drafts
- All database operations use Postgres RPC functions (not direct Supabase queries)
- Conflict validation happens server-side before any shift creation/update/publish
- Time-off, availability, and shift data all respect Eastern Time timezone (converted to/from UTC in database)
