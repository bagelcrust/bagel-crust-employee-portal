# React Query Hooks for Bagel Crust Employee Portal

Custom hooks that handle all data fetching, caching, and state management using React Query.

## 📦 What's Included

### `useEmployeeAuth()`
Handles employee login/logout with PIN authentication.

```typescript
const {
  employee,        // Current logged-in employee (or null)
  isLoggedIn,      // Boolean - is user logged in?
  login,           // Function to login with PIN
  logout,          // Function to logout
  isLoggingIn,     // Boolean - is login in progress?
  loginError       // String - error message if login failed
} = useEmployeeAuth()
```

**Example:**
```typescript
const handleLogin = async (pin: string) => {
  try {
    await login(pin) // Auto-loads employee data
  } catch (error) {
    // Error handled by hook
  }
}
```

---

### `useEmployeeSchedule(employeeId, enabled)`
Fetches the logged-in employee's personal schedule for this week and next week.

```typescript
const {
  data: scheduleData,  // { thisWeek: {...}, nextWeek: {...} }
  isLoading,           // Boolean - is data loading?
  error                // Error object if fetch failed
} = useEmployeeSchedule(employee?.id, isLoggedIn)
```

**Data structure:**
```typescript
{
  thisWeek: {
    monday: [{ startTime, endTime, hoursScheduled, location }],
    tuesday: [...],
    // ... rest of week
  },
  nextWeek: { ... }
}
```

**Features:**
- Auto-fetches when employeeId changes
- Caches for 5 minutes
- Only fetches if `enabled=true`
- Automatically filters to show only this employee's shifts

---

### `useTeamSchedule(enabled)`
Fetches the full team schedule (all employees) for this week and next week.

```typescript
const {
  data: teamSchedule,  // { thisWeek: {...}, nextWeek: {...} }
  isLoading,
  error
} = useTeamSchedule(isLoggedIn)
```

**Data structure:**
```typescript
{
  thisWeek: {
    monday: [
      {
        start_time: "2025-11-05T09:00:00",
        end_time: "2025-11-05T17:00:00",
        employee: { first_name: "John", ... },
        location: "Main Street"
      }
    ],
    // ... rest of week
  },
  nextWeek: { ... }
}
```

**Features:**
- Includes full shift objects with employee details
- Used for "Team Schedule" view
- Caches for 5 minutes

---

### `useTimesheet(employeeId, enabled)`
Fetches the employee's hours worked for this week and last week.

```typescript
const {
  data: timesheetData,  // { thisWeek: {...}, lastWeek: {...} }
  isLoading,
  error
} = useTimesheet(employee?.id, isLoggedIn)
```

**Data structure:**
```typescript
{
  thisWeek: {
    days: [
      {
        date: "2025-11-05",
        day_name: "Tuesday",
        clock_in: "09:00",
        clock_out: "17:00",
        hours_worked: "8.00"
      }
    ],
    totalHours: "40.00"
  },
  lastWeek: { ... }
}
```

**Features:**
- Calculates hours from time clock events
- Handles overnight shifts
- Filters out impossible shifts (>16 hours)
- Week starts on Monday
- Caches for 2 minutes (more frequent than schedules)

---

### `useTimeOff(employeeId)`
Manages time-off requests (fetch and submit).

```typescript
const {
  requests,         // Array of TimeOffRequest objects
  submitRequest,    // Function to submit new request
  isSubmitting,     // Boolean - is submission in progress?
  submitError       // Error object if submission failed
} = useTimeOff(employee?.id)
```

**Submit a request:**
```typescript
await submitRequest({
  employee_id: employee.id,
  start_date: "2025-12-01",
  end_date: "2025-12-05",
  reason: "Vacation"
})
```

**Note:** Uses time-off API for data fetching and submissions.

---

## 🚀 Quick Start

### 1. Import the hooks
```typescript
import {
  useEmployeeAuth,
  useEmployeeSchedule,
  useTimesheet,
  useTeamSchedule,
  useTimeOff
} from './hooks'
```

### 2. Use in your component
```typescript
function EmployeePortal() {
  // Authentication
  const { employee, login, logout, isLoggedIn } = useEmployeeAuth()

  // Data (only fetches when logged in)
  const { data: schedule } = useEmployeeSchedule(employee?.id, isLoggedIn)
  const { data: timesheet } = useTimesheet(employee?.id, isLoggedIn)
  const { data: teamSchedule } = useTeamSchedule(isLoggedIn)
  const { requests, submitRequest } = useTimeOff(employee?.id)

  // Use the data!
  return (
    <div>
      {schedule?.thisWeek.monday.map(shift => (
        <div>{shift.startTime} - {shift.endTime}</div>
      ))}
    </div>
  )
}
```

---

## ⚙️ Configuration

React Query client is configured in `main.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Retry failed requests once
      refetchOnWindowFocus: true,  // Refresh when user returns
      staleTime: 60 * 1000,        // Cache for 1 minute (default)
    }
  }
})
```

Individual hooks override these defaults:
- **Schedule hooks**: 5 minute cache
- **Timesheet hook**: 2 minute cache (hours change more frequently)

---

## 🔄 Auto-Refetching

Data automatically refetches when:
- User switches back to the app tab (refetchOnWindowFocus)
- Data becomes stale (after staleTime expires)
- You manually invalidate the cache

**Manual refetch example:**
```typescript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

// Refetch schedule after making a change
queryClient.invalidateQueries({ queryKey: ['employee-schedule'] })
```

---

## 🎯 Benefits vs Manual State

| Feature | Manual State | React Query Hooks |
|---------|-------------|-------------------|
| Code size | ~200 lines | ~30 lines |
| Loading states | Manual `useState` | Auto `isLoading` |
| Error handling | Manual try/catch | Auto `error` state |
| Caching | None | 5-minute cache |
| Refetching | Manual | Automatic |
| Parallel fetching | Manual Promise.all | Automatic |
| Data persistence | Lost on unmount | Persists in cache |

---

## 📝 Migration Checklist

Converting EmployeePortal.tsx to use these hooks:

- [ ] Replace `const [employee, setEmployee] = useState(null)` with `useEmployeeAuth()`
- [ ] Replace `const [scheduleData, setScheduleData] = useState(null)` with `useEmployeeSchedule()`
- [ ] Replace `const [timesheetData, setTimesheetData] = useState(null)` with `useTimesheet()`
- [ ] Replace `const [fullTeamSchedule, setFullTeamSchedule] = useState(null)` with `useTeamSchedule()`
- [ ] Replace `const [timeOffRequests, setTimeOffRequests] = useState([])` with `useTimeOff()`
- [ ] Delete `loadEmployeeData()` function (~80 lines)
- [ ] Delete manual loading/error state variables
- [ ] Delete all `useEffect` hooks for data fetching
- [ ] Update UI to use hook data instead of state

**Estimated savings:** ~200 lines of code removed

---

## 🐛 Debugging

Enable React Query DevTools (optional):

```bash
npm install @tanstack/react-query-devtools
```

```typescript
// In main.tsx or App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Shows:
- All active queries
- Cache contents
- Loading/error states
- Refetch triggers

---

## 🔗 Related Files

- `/bagelcrust/react-app/src/hooks/HOOKS_USAGE_EXAMPLE.tsx` - Full example component
- `/bagelcrust/react-app/src/supabase/supabase.ts` - API functions these hooks use
- `/bagelcrust/react-app/src/main.tsx` - React Query provider setup
- `/bagelcrust/react-app/src/pages/EmployeePortal.tsx` - Component to migrate

---

## 📚 Learn More

- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [useQuery Guide](https://tanstack.com/query/latest/docs/react/guides/queries)
- [useMutation Guide](https://tanstack.com/query/latest/docs/react/guides/mutations)
