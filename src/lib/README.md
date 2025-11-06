# Utility Library Documentation

This directory contains all utility functions for the Bagel Crust Employee Portal. All utilities can be imported from a single entry point for convenience.

## 📦 Usage

```typescript
// Import everything you need from one place
import {
  validateTimeOffRequest,
  PAGE_TITLES,
  formatTime,
  getEmployeeLanguage,
  getTabsForRole
} from '../lib'
```

---

## 📚 Available Utilities

### 🔧 `constants.ts`
Application-wide constants to eliminate magic strings and numbers.

**Exports:**
- `PAGE_TITLES` - Page title constants
- `ROLES` - Employee role constants
- `LANGUAGES` - Language code constants
- `DEFAULTS` - Default values
- `TIME_OFF_STATUS` - Time off request statuses
- `ALERTS` - Alert message constants
- `LOADING_MESSAGES` - Loading state messages
- `SAFE_AREA` - PWA safe area CSS values
- `API_ENDPOINTS` - API endpoint paths

**Example:**
```typescript
document.title = PAGE_TITLES.EMPLOYEE_PORTAL
alert(ALERTS.TIME_OFF.SUCCESS)
if (employee.role === ROLES.STAFF_ONE) { /* ... */ }
```

---

### 📅 `dateUtils.ts`
Date and timezone utilities with automatic DST handling.

**Key Functions:**
- `formatInEasternTime(date, format)` - Convert UTC to Eastern Time
- `getEasternTimeParts(date)` - Get date/time parts in ET
- `easternTimeToUTC(easternTimeString)` - Convert ET string to UTC Date
- `isDST(date)` - Check if date is in Daylight Saving Time
- `getEasternOffset(date)` - Get current UTC offset for ET

**Example:**
```typescript
const clockInTime = formatInEasternTime(utcDate, 'time') // "6:30am"
const fullDate = formatInEasternTime(utcDate, 'datetime') // "November 4, 2025 at 6:30am"
```

---

### 👤 `employeeUtils.ts`
Employee data formatting utilities.

**Key Functions:**
- `formatTime(time)` - Convert 24-hour to 12-hour format
- `formatHoursMinutes(decimal)` - Format decimal hours to "Xh Ym"

**Example:**
```typescript
formatTime("14:30") // "2:30 PM"
formatHoursMinutes(8.5) // "8h 30m"
```

---

### 🌐 `languageUtils.ts`
Language detection and translation helpers.

**Key Functions:**
- `getEmployeeLanguage(employee)` - Get employee's preferred language
- `getEmployeeTranslations(employee)` - Get translation object for employee
- `prefersSpanish(employee)` - Check if employee prefers Spanish
- `prefersEnglish(employee)` - Check if employee prefers English

**Example:**
```typescript
const t = getEmployeeTranslations(employee)
console.log(t.weeklySchedule) // "My Schedule" or "Mi Horario"

if (prefersSpanish(employee)) {
  // Show Spanish-specific UI
}
```

---

### 🔐 `roleConfig.ts`
Role-based permissions and tab configuration.

**Key Functions:**
- `getTabsForRole(role)` - Get available tabs for a role
- `getDefaultTabForRole(role)` - Get default tab for a role
- `isTabAvailableForRole(role, tabKey)` - Check tab availability
- `validateTabForRole(role, currentTab)` - Validate and fix active tab

**Example:**
```typescript
const tabs = getTabsForRole(employee.role)
// staff_one: [{ key: 'timesheet', label: 'Hours', ... }]
// staff_two: [{ key: 'weeklySchedule', ... }, { key: 'timeOff', ... }, ...]

const defaultTab = getDefaultTabForRole('staff_one') // 'timesheet'
const validTab = validateTabForRole('staff_one', 'profile') // 'timesheet' (corrects invalid)
```

---

### 📋 `stateUtils.ts`
State management and form helpers.

**Key Functions:**
- `createFormResetHandler(...setters)` - Create reset function for multiple states
- `createTimeOffResetHandler(setState)` - Reset time off form
- `hasFormData(...values)` - Check if any field is filled
- `isFormComplete(...values)` - Check if all fields are filled
- `getFormCompletionPercentage(...values)` - Get % of fields filled
- `debounce(func, delay)` - Debounce function calls

**Example:**
```typescript
const resetForm = createTimeOffResetHandler({
  setStartDate,
  setEndDate,
  setReason
})

// Later...
resetForm() // Clears all form fields

const isComplete = isFormComplete(startDate, endDate, reason)
```

---

### 🌍 `translations.ts`
Multi-language translation strings.

**Exports:**
- `translations` - Object with 'en' and 'es' translation keys
- `TranslationKey` - TypeScript type for translation keys
- `Translations` - TypeScript type for translation object

**Example:**
```typescript
const language = 'es'
const t = translations[language]
console.log(t.enterPin) // "Ingrese PIN"
```

---

### ✅ `validationUtils.ts`
Form validation with consistent error messages.

**Key Functions:**
- `validateTimeOffDates(startDate, endDate)` - Validate date range
- `validateEmployeeId(employeeId)` - Validate employee ID exists
- `validateTimeOffRequest(start, end, empId)` - Validate complete request
- `validatePinFormat(pin)` - Validate PIN format
- `isValidDateRange(startDate, endDate)` - Check date range validity
- `isFutureDate(date)` - Check if date is in future
- `isPastDate(date)` - Check if date is in past

**Example:**
```typescript
const validation = validateTimeOffRequest(startDate, endDate, employee?.id)

if (!validation.isValid) {
  alert(validation.errorMessage) // "Please select both start and end dates"
  return
}

// Proceed with submission
```

---

## 🎯 Design Principles

### 1. **Single Import Point**
All utilities export through `index.ts` for convenience:
```typescript
import { validateTimeOffRequest, PAGE_TITLES } from '../lib'
```

### 2. **Pure Functions**
Most utilities are pure functions (same input = same output, no side effects).

### 3. **Type Safety**
All utilities are fully typed with TypeScript for IDE autocomplete and compile-time safety.

### 4. **Consistent Return Types**
Validation functions return `ValidationResult` with `isValid` and optional `errorMessage`.

### 5. **Documentation**
Every function includes JSDoc comments explaining parameters and return values.

### 6. **Testability**
Pure functions make unit testing straightforward (future improvement).

---

## 🚀 Adding New Utilities

1. Create or update a utility file in `/src/lib/`
2. Export functions/constants
3. Add exports to `/src/lib/index.ts`
4. Document in this README

---

## 📊 Utility Usage in Codebase

### EmployeePortal.tsx
- ✅ Uses `getEmployeeTranslations` for automatic language
- ✅ Uses `getTabsForRole`, `getDefaultTabForRole`, `validateTabForRole` for role-based tabs
- ✅ Uses `validateTimeOffRequest` for form validation
- ✅ Uses `createTimeOffResetHandler` for form reset
- ✅ Uses `PAGE_TITLES` and `ALERTS` constants
- ✅ Uses `useCallback` and `useMemo` for performance

### Result: Clean, Maintainable, Utility-Driven Code! 🎉
