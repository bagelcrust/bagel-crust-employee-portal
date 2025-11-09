# Dev/Production Mode Toggle - Testing Guide

## Overview

The Clock In/Out page (http://134.209.45.231:3010) has a **development mode toggle** that allows you to test clock-in/out functionality without affecting production data visibility.

This feature is **only available on the development server (port 3010)** and will not appear in actual production builds.

---

## Accessing the Development Server

**URL**: http://134.209.45.231:3010

The dev server runs on PM2 as `react-dev-server` and is used for testing changes before deploying to production.

---

## The Dev/Production Toggle

### Location
Top-right corner of the Clock In/Out page

### Toggle States

#### 🛠 DEV MODE (Development Mode)
- **Button shows**: `🛠 DEV MODE` (blue background)
- **Test user enabled**: PIN `9999` works
- **Test user visible**: Appears in Recent Activity feed
- **Debug info shown**: Realtime status and network indicators visible
- **Use case**: Testing clock-in/out functionality, verifying database writes, debugging

#### 🚀 PROD PREVIEW (Production Preview Mode)
- **Button shows**: `🚀 PROD PREVIEW` (gray background)
- **Test user blocked**: PIN `9999` shows "Invalid PIN"
- **Test user hidden**: Entries filtered from Recent Activity feed
- **Debug info hidden**: Clean production appearance
- **Use case**: Preview exactly how the page will look/behave in production

---

## Test User Details

A dedicated test user exists in the database for development testing:

| Field | Value |
|-------|-------|
| **Name** | Test User |
| **PIN** | `9999` |
| **Employee ID** | `bbb42de4-61b0-45cc-ae92-2e6dec6b53ee` |
| **Employee Code** | `TEST_DEV` |
| **Location** | Development |
| **Pay Rate** | $15.00/hour |

### Important Notes
- PIN `9999` will **never conflict** with real employee PINs
- Test user creates **real database entries** in `employees.time_entries`
- These entries are only **visible in dev mode**
- Test user is **completely blocked** in production preview mode

---

## Testing Workflow

### Step 1: Test Clock In/Out (Dev Mode)
1. Ensure toggle shows **🛠 DEV MODE**
2. Enter PIN `9999` on keypad
3. ✅ Should see: "Test User successfully clocked in"
4. ✅ Recent Activity shows: "Test IN" entry
5. Enter PIN `9999` again to clock out
6. ✅ Should see: "Test User successfully clocked out"
7. ✅ Recent Activity shows: "Test OUT" entry

### Step 2: Verify Production Behavior (Prod Preview)
1. Click toggle to switch to **🚀 PROD PREVIEW**
2. ✅ Test User entries disappear from Recent Activity
3. ✅ Debug indicators hidden
4. Enter PIN `9999`
5. ✅ Should see: "Invalid PIN - Please try again"
6. This confirms test user is properly blocked in production

### Step 3: Test Real Employee PIN (Both Modes)
1. In either mode, enter a real employee PIN (e.g., `1234`)
2. ✅ Should work in both dev and production preview modes
3. ✅ Real employees are never blocked

---

## Database Behavior

### What Gets Written
When test user clocks in/out in **dev mode**:
- Real entry created in `employees.time_entries` table
- Includes: `employee_id`, `event_type` (in/out), `event_timestamp` (UTC)
- Entry is permanent and persists in database

### What Gets Filtered
When toggle is set to **production preview**:
- Frontend filters out test user entries from Recent Activity display
- Database entries still exist (not deleted)
- Only the **display** is affected, not the database

### Cleaning Up Test Data
If needed, test user entries can be deleted with:
```sql
DELETE FROM employees.time_entries
WHERE employee_id = 'bbb42de4-61b0-45cc-ae92-2e6dec6b53ee';
```

---

## Implementation Details

### Code Location
- **Clock In/Out Page**: `/bagelcrust/react-app/src/pages/ClockInOut.tsx`
- **Toggle State**: Lines 86-88
- **PIN Validation**: Lines 289-302
- **Activity Filter**: Lines 505-512

### How It Works

1. **Toggle State**:
   ```typescript
   const [devMode, setDevMode] = useState(import.meta.env.DEV)
   ```
   - Defaults to `true` in development environment
   - User can toggle between dev/production preview

2. **PIN Validation**:
   ```typescript
   if (pin === '9999' && !devMode) {
     // Block test user in production preview
     setMessage('Invalid PIN - Please try again')
     return
   }
   ```

3. **Activity Filter**:
   ```typescript
   recentEvents.filter(event => {
     if (!devMode && event.employeeId === 'bbb42de4-61b0-45cc-ae92-2e6dec6b53ee') {
       return false; // Hide test user in production preview
     }
     return true;
   })
   ```

---

## Production Deployment

### What Happens in Production
When code is deployed to Vercel (production):
- `import.meta.env.DEV` is `false`
- Toggle button **does not render** (line 533)
- `devMode` is always `false`
- Test user PIN `9999` is **always blocked**
- Test user entries **always hidden** from Recent Activity

### Security
- No risk of test user accessing production
- Toggle only exists in development builds
- Production has no way to enable dev mode
- Real employees unaffected in all environments

---

## Troubleshooting

### Test User Not Working in Dev Mode
- ✅ Check toggle shows **🛠 DEV MODE** (blue button)
- ✅ Verify URL is http://134.209.45.231:3010
- ✅ Hard refresh page (Ctrl+Shift+R)
- ✅ Check browser console for errors (F12)

### Test User Appearing in Production Preview
- ✅ Verify toggle shows **🚀 PROD PREVIEW** (gray button)
- ✅ Hard refresh page to reload data
- ✅ Check if using correct port (3010 for dev, not 3001)

### Toggle Not Visible
- ✅ You might be on production (bagelcrust.biz) instead of dev server
- ✅ Toggle only appears on http://134.209.45.231:3010
- ✅ Never appears in production builds

---

## PM2 Server Management

### Restart Dev Server
```bash
pm2 restart react-dev-server
```

### Check Server Status
```bash
pm2 status
# Look for: react-dev-server (port 3010)
```

### View Logs
```bash
pm2 logs react-dev-server --lines 50
```

---

## Summary

| Feature | Dev Mode (🛠) | Production Preview (🚀) |
|---------|---------------|-------------------------|
| Test user PIN `9999` | ✅ Works | ❌ Blocked ("Invalid PIN") |
| Test user in Recent Activity | ✅ Visible | ❌ Hidden |
| Debug indicators | ✅ Shown | ❌ Hidden |
| Real employee PINs | ✅ Works | ✅ Works |
| Database writes | ✅ Real writes | ✅ Real writes |
| Toggle button visible | ✅ Yes | ✅ Yes |

**Production (bagelcrust.biz)**:
- Toggle does not exist
- Test user always blocked
- Always behaves like production preview mode
