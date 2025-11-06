# Sentry Error Tracking Setup Guide

## 🎯 What is Sentry?

Sentry automatically catches and reports errors in your production app. When a user encounters an error, you'll:
- Get an email notification
- See exactly what the user did before the error
- View the error stack trace with source maps
- Track which users are affected

**Cost:** FREE for up to 5,000 errors/month

---

## 📝 Setup Instructions (5 minutes)

### Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up (free account)
3. Choose "React" when asked for platform

### Step 2: Create Project

1. Click "Create Project"
2. Select platform: **React**
3. Alert frequency: **On every new issue**
4. Project name: **bagel-crust-portal**
5. Click "Create Project"

### Step 3: Get Your DSN

1. You'll see a screen with setup instructions
2. Find the line that says: `dsn: "https://..."`
3. Copy the entire DSN URL (looks like: `https://abc123def456@o123456.ingest.sentry.io/789012`)

### Step 4: Add DSN to Environment

**On your server:**
```bash
cd /bagelcrust/react-app
nano .env
```

Add this line (replace with your actual DSN):
```
VITE_SENTRY_DSN=https://your-actual-dsn-here
```

Save and exit (Ctrl+X, Y, Enter)

**In Vercel Dashboard:**
1. Go to https://vercel.com/bagelcrust/bagel-crust-employee-portal
2. Settings → Environment Variables
3. Add new variable:
   - Name: `VITE_SENTRY_DSN`
   - Value: Your DSN from Step 3
   - Apply to: Production, Preview, Development
4. Click "Save"

### Step 5: Test It

**On dev server:**
```bash
pm2 restart react-dev-server
```

Open http://134.209.45.231:3010 and you'll see a red "🧪 Test Error" button (bottom left, dev only).

Click it → Error screen appears → Check your email for Sentry notification!

---

## 🔍 Viewing Errors

### In Sentry Dashboard:

1. Go to https://sentry.io/
2. Click your project: **bagel-crust-portal**
3. You'll see all errors grouped together

### Each error shows:

- **Message**: What went wrong
- **Stack Trace**: Exact line of code
- **Breadcrumbs**: What the user did before error (clicked buttons, API calls, etc.)
- **User Context**: Which employee was logged in
- **Browser**: iOS Safari, Chrome, etc.
- **Device**: iPhone, Android, etc.

---

## 📊 What Sentry Catches

✅ **Automatic (no code needed):**
- React component crashes
- Unhandled promise rejections
- API failures
- Network errors
- Console errors in production

✅ **Already integrated:**
- Error Boundary (shows friendly error page)
- User context (which employee had the error)
- Breadcrumbs (user actions before error)

---

## 🚀 Advanced Features (Optional)

### Track User Actions Manually

```typescript
import { addBreadcrumb } from '@/lib/sentry'

// When user clicks important button
addBreadcrumb('User clicked Clock In button', 'user-action', {
  employeeId: employee.id
})
```

### Capture Errors Manually

```typescript
import { captureError } from '@/lib/sentry'

try {
  await dangerousOperation()
} catch (error) {
  captureError(error, { context: 'Additional info' })
}
```

### Set User Context After Login

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry'

// After successful login
setSentryUser(employee)

// After logout
clearSentryUser()
```

---

## 💡 Tips

**Source Maps:**
- Enabled automatically in production builds
- Lets you see original TypeScript code in error stack traces (not minified)
- Uploaded to Sentry on every deployment

**Performance Monitoring:**
- Tracks page load times
- Monitors API call duration
- Currently sampling 10% of traffic (configurable in `src/lib/sentry.ts`)

**Session Replay:**
- Records what the user did before error (clicks, navigation)
- Does NOT record text/images (privacy)
- Only captures sessions with errors

---

## ❓ Troubleshooting

### "No errors showing in Sentry"

Check:
1. Is `VITE_SENTRY_DSN` set in `.env`?
2. Is app in production mode? (Sentry disabled in dev)
3. Test on production: https://bagelcrust.biz
4. Click "🧪 Test Error" button on dev server

### "Error says 'DSN not configured'"

1. Check `.env` file has `VITE_SENTRY_DSN=...`
2. Restart dev server: `pm2 restart react-dev-server`
3. Rebuild: `npm run build`

### "Getting too many alerts"

Sentry settings → Alerts → Adjust frequency to "Daily summary"

---

## 🎉 You're Done!

Sentry is now monitoring your app. When errors happen:
1. You get an email instantly
2. Error shows in Sentry dashboard with full details
3. Fix the bug using the stack trace
4. Deploy fix
5. Sentry marks issue as resolved automatically

**Dashboard:** https://sentry.io/organizations/your-org/issues/
