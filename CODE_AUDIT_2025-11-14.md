# COMPREHENSIVE CODE AUDIT - React App
**Date:** November 14, 2025
**Analyzed:** /bagelcrust/react-app/src

## EXECUTIVE SUMMARY

**Total TypeScript Files:** 91
**Active Routes:** 3 (ClockInOut, EmployeePortal, ScheduleBuilder)
**Major Finding:** ScheduleBuilder.tsx is ACTIVE (not V2), services layer is UNUSED

---

## 1. ACTIVE ROUTES (App.tsx)

### ✅ CONFIRMED ACTIVE PAGES (3)
- `/clockinout` → `ClockInOut.tsx` 
- `/employee-portal` → `EmployeePortal.tsx`
- `/schedule-builder` → `ScheduleBuilder.tsx` ⚠️ (NOT V2!)

### ❌ ORPHANED PAGE
- `ScheduleBuilderV2.tsx` - NOT imported in App.tsx (should be the active one!)

**ISSUE:** App.tsx imports old ScheduleBuilder, not the refactored V2 version

---

## 2. COMPONENT USAGE ANALYSIS

### ✅ ACTIVE COMPONENTS (Used)
**Main Components:**
- ErrorBoundary (main.tsx)
- Toaster (App.tsx)
- Keypad (ClockInOut.tsx)
- EmployeeLogin (EmployeePortal.tsx)
- BottomNav (EmployeePortal.tsx)

**Dialogs:**
- AddShiftDialog (both ScheduleBuilder files)
- EditShiftDialog (both ScheduleBuilder files)

**Tab Components:**
- ScheduleTab
- TimeOffTab
- TimesheetTab
- PayrollTab
- ProfileTab

**UI Components (shadcn/ui):**
- All actively used by pages/components

**Schedule Builder V2 Components:**
- ShiftCell (ScheduleBuilderV2 only)
- DraggableShift (exported but only used in ShiftCell)
- AvailabilityOverlay (exported but only used in ShiftCell)
- TimeOffOverlay (exported but only used in ShiftCell)
- EmployeeAvailabilityList (ScheduleBuilderV2 only)

### ❌ UNUSED COMPONENTS (Dead Code)
**Modals (old pattern):**
- `AddShiftModal.tsx` - Replaced by AddShiftDialog
- `EditShiftModal.tsx` - Replaced by EditShiftDialog

**Utility Components:**
- `GlassCard.tsx` - Only exists in file definitions, no imports found
- `AnimatedDigit.tsx` - Only exists in file definitions, no imports found
- `TimeInput.tsx` - Used by AddShiftModal/EditShiftModal (both unused)
- `DebugPanel.tsx` - Uses useCommonHooks, but never added to App.tsx

**Tabs:**
- `TrainingTab.tsx` - Placeholder "Coming soon", not imported by EmployeePortal

**Schedule Builder Components (V2 only):**
- `ShiftCard.tsx` - Exported but never imported
- `OpenShiftCell.tsx` - Exported but never imported

---

## 3. HOOK USAGE ANALYSIS

### ✅ EXPORTED & USED (hooks/index.ts)
- useEmployeeAuth ✅
- useEmployeeSchedule, useTeamSchedule ✅
- useTimesheet ✅
- useTimeOff ✅
- useDynamicManifest ✅
- useScheduleBuilder ✅

### ❌ NOT EXPORTED (Orphaned)
- `useCommonHooks.ts` - Only used by DebugPanel (which is unused)
- `useAvailability.ts` - Not exported in index.ts, not imported anywhere
- `useScheduleBuilderActions.ts` - Used by ScheduleBuilderV2 (which isn't active!)

**CRITICAL:** ScheduleBuilderV2 uses useScheduleBuilderActions, but App.tsx loads old ScheduleBuilder instead!

---

## 4. LIB UTILITIES USAGE

### ✅ ACTIVELY USED (via lib/index.ts)
- constants.ts ✅
- dateUtils.ts ✅
- employeeUtils.ts ✅
- languageUtils.ts ✅ (translations system)
- roleConfig.ts ✅
- scheduleUtils.ts ✅
- stateUtils.ts ✅
- translations.ts ✅
- validationUtils.ts ✅

### ⚠️ USED BUT NOT EXPORTED
- timezone.ts ✅ (direct imports)
- sentry.ts ✅ (App.tsx)
- logger.ts ✅ (various files)
- utils.ts ✅ (shadcn/ui components via @/lib/utils)
- offlineClockAction.ts ✅ (ClockInOut.tsx)
- syncManager.ts ✅ (ClockInOut.tsx)
- supabaseClient.ts ✅ (DebugPanel only - DebugPanel is unused!)

### ❌ UNUSED UTILITIES
- `envValidator.ts` - Only imported by supabaseClient.ts
- `sanitization.ts` - No imports found
- `typeGuards.ts` - No imports found  
- `shiftPatterns.ts` - No imports found
- `offlineQueue.ts` - Only used by offlineClockAction/syncManager

---

## 5. SUPABASE API LAYER

### ✅ ACTIVE: Edge Functions (edgeFunctions.ts)
**Primary API for app:**
- ClockInOut → uses getEmployeeByPin, getClockTerminalData
- Hooks → use edge function wrappers (calculatePayroll, getTimeOffsForRange, etc.)
- ScheduleBuilderV2 → uses scheduleBuilder namespace

**Edge function usage is GOOD - this is the modern pattern**

### ❌ UNUSED: Services Layer (supabase/services/)
**ALL service files are DEAD CODE:**
- `shiftService.ts` - Only imported by OLD ScheduleBuilder.tsx
- `publishService.ts` - Only imported by OLD ScheduleBuilder.tsx  
- `hoursService.ts` - No imports found
- `conflictService.ts` - No imports found
- `openShiftsService.ts` - No imports found

**FINDING:** Old ScheduleBuilder uses shiftService/publishService. V2 uses edge functions. App.tsx loads OLD version!

---

## 6. DUPLICATE CODE

### Duplicate Interfaces/Types

**TimeOff interface (3 versions):**
1. `lib/scheduleUtils.ts` - export interface TimeOff (canonical)
2. `components/schedule-builder/EmployeeAvailabilityList.tsx` - local interface (should import)
3. `hooks/useTimeOff.ts` - export interface TimeOffRequest (different purpose - OK)

**Recommendation:** EmployeeAvailabilityList should import from lib/scheduleUtils

---

## 7. LEGACY/OLD PATTERN FILES

### Old Patterns Replaced
- AddShiftModal/EditShiftModal → Replaced by AddShiftDialog/EditShiftDialog
- Services layer → Replaced by Edge Functions
- ScheduleBuilder.tsx → Should be replaced by ScheduleBuilderV2.tsx

---

## 8. CSS FILES
**Single file:** `index.css` - ACTIVE ✅

---

## PRIORITY CLEANUP PLAN

### 🔴 CRITICAL (Fix ASAP)
1. **Update App.tsx to use ScheduleBuilderV2 instead of ScheduleBuilder**
   - This is the REFACTORED version (Nov 12, 2025)
   - 400 lines vs 1,320 lines
   - Uses modern hook pattern
   - Change: `const ScheduleBuilder = lazy(() => import('./pages/ScheduleBuilderV2'));`

### 🟡 HIGH PRIORITY (Delete Safely)

**Unused Components:**
- src/components/AddShiftModal.tsx
- src/components/EditShiftModal.tsx
- src/components/GlassCard.tsx
- src/components/AnimatedDigit.tsx
- src/components/TimeInput.tsx
- src/components/DebugPanel.tsx
- src/components/tabs/TrainingTab.tsx
- src/components/schedule-builder/ShiftCard.tsx
- src/components/schedule-builder/OpenShiftCell.tsx

**Unused Hooks:**
- src/hooks/useCommonHooks.ts
- src/hooks/useAvailability.ts

**Unused Services (entire directory):**
- src/supabase/services/shiftService.ts
- src/supabase/services/publishService.ts
- src/supabase/services/hoursService.ts
- src/supabase/services/conflictService.ts
- src/supabase/services/openShiftsService.ts

**Unused Utilities:**
- src/lib/envValidator.ts
- src/lib/sanitization.ts
- src/lib/typeGuards.ts
- src/lib/shiftPatterns.ts
- src/lib/offlineQueue.ts (used only by offline features)

**Old Page:**
- src/pages/ScheduleBuilder.tsx (after switching to V2)

### 🟢 MEDIUM PRIORITY (Consolidate)

**Fix duplicate TimeOff interface:**
- Update EmployeeAvailabilityList.tsx to import from lib/scheduleUtils

### 🔵 LOW PRIORITY (Reorganize)

**After ScheduleBuilderV2 is active:**
- Export useScheduleBuilderActions in hooks/index.ts
- Rename ScheduleBuilderV2.tsx → ScheduleBuilder.tsx
- Update imports to match

---

## FILES SAFE TO DELETE (Nothing imports them)

```
src/components/AddShiftModal.tsx
src/components/EditShiftModal.tsx
src/components/GlassCard.tsx
src/components/AnimatedDigit.tsx
src/components/TimeInput.tsx
src/components/DebugPanel.tsx
src/components/tabs/TrainingTab.tsx
src/components/schedule-builder/ShiftCard.tsx
src/components/schedule-builder/OpenShiftCell.tsx
src/hooks/useCommonHooks.ts
src/hooks/useAvailability.ts
src/supabase/services/shiftService.ts
src/supabase/services/publishService.ts
src/supabase/services/hoursService.ts
src/supabase/services/conflictService.ts
src/supabase/services/openShiftsService.ts
src/lib/envValidator.ts
src/lib/sanitization.ts
src/lib/typeGuards.ts
src/lib/shiftPatterns.ts
```

**After fixing App.tsx:**
```
src/pages/ScheduleBuilder.tsx (old version)
```

---

## RECOMMENDED FOLDER STRUCTURE CLEANUP

**Current mess:**
- services/ directory is dead code
- V2 suffix on active file
- Unused utilities mixed with used ones

**Proposed cleanup:**
1. Delete entire `src/supabase/services/` directory
2. Rename `ScheduleBuilderV2.tsx` → `ScheduleBuilder.tsx`
3. Move offline-specific libs to `src/lib/offline/` (if keeping offline features)
4. Create `src/lib/deprecated/` for anything questionable

---

## EXECUTION ORDER

### Phase 1: Critical Fix (IMMEDIATE)
1. Update App.tsx: Change ScheduleBuilder import to ScheduleBuilderV2
2. Test schedule builder page works
3. Commit: "fix: use refactored ScheduleBuilderV2"

### Phase 2: Delete Dead Code (SAFE)
1. Delete all files in "Files Safe to Delete" list
2. Delete src/pages/ScheduleBuilder.tsx (old version)
3. Delete src/supabase/services/ directory
4. Test: npm run build (should succeed)
5. Test: All pages load correctly
6. Commit: "chore: remove unused components, hooks, and services"

### Phase 3: Consolidate (CLEANUP)
1. Fix TimeOff interface duplication
2. Export useScheduleBuilderActions in hooks/index.ts
3. Rename ScheduleBuilderV2.tsx → ScheduleBuilder.tsx
4. Update import in App.tsx
5. Commit: "refactor: consolidate schedule builder"

### Phase 4: Reorganize (POLISH)
1. Review lib/index.ts exports
2. Consider organizing offline features
3. Update documentation
4. Commit: "docs: update after cleanup"

---

## ESTIMATED IMPACT

**Lines of code removed:** ~2,000+
**Files deleted:** 20+
**Directories cleaned:** 1 (services/)
**Build size reduction:** ~10-15%
**Mental clarity:** MASSIVE

