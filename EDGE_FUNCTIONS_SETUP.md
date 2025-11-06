# ⚠️ CRITICAL: Edge Functions Setup Required

## 🔴 Action Required Before Edge Functions Work

The Edge Functions have been deployed, but **they will crash immediately** because environment variables are not set.

---

## 📝 Step-by-Step Setup (5 minutes)

### Step 1: Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/gyyjviynlwbbodyfmvoi/settings/api
2. Look for **"Project API keys"** section
3. Find the **"service_role"** key (NOT the anon key!)
4. Click "Reveal" and copy the key

It will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...` (very long)

---

### Step 2: Set Environment Variables in Supabase

1. Go to: https://supabase.com/dashboard/project/gyyjviynlwbbodyfmvoi/settings/functions
2. Click on **"Edge Functions"** in the left sidebar
3. Click **"Add new secret"** (or "Manage secrets")
4. Add these two secrets:

**Secret 1:**
- **Name:** `SUPABASE_URL`
- **Value:** `https://gyyjviynlwbbodyfmvoi.supabase.co`

**Secret 2:**
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** [Paste the service role key you copied in Step 1]

5. Click **"Save"** or **"Add secret"**

---

### Step 3: Wait (Important!)

After saving the secrets:
- **Wait 10-30 seconds** for secrets to propagate
- The Edge Functions will pick them up automatically
- No need to redeploy

---

### Step 4: Test Edge Functions

Test that they work:

```bash
# Test timezone conversion
curl -X POST \
  https://gyyjviynlwbbodyfmvoi.supabase.co/functions/v1/timezone-convert \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODgwNzEsImV4cCI6MjA3Nzg2NDA3MX0.9TNiFzrKPPv1yvUnsO0NkVdlh2V7CzH323j6DiBeOtg" \
  -H "Content-Type: application/json" \
  -d '{"timestamps": ["2025-11-05T14:30:00Z"]}'
```

**Expected response:**
```json
{
  "conversions": [
    {
      "utc": "2025-11-05T14:30:00Z",
      "local": "2025-11-05T10:30:00-04:00",
      "formatted": "Nov 5, 2025 10:30 AM EDT",
      "timezone": "America/New_York",
      "offset": "-04:00",
      "isDST": true
    }
  ]
}
```

If you get an error about missing environment variables, wait another 30 seconds and try again.

---

## ✅ What Was Fixed

### 1. **Time Extraction Bug** ✅
**Problem:** Timesheet displayed "AM" instead of "6:00 AM"
**Fixed:** Corrected string parsing in `useTimesheet.ts`

### 2. **Timezone Conversion Bug** ✅
**Problem:** Date range calculation was broken, would miss data
**Fixed:** Proper Eastern Time to UTC conversion with DST detection

### 3. **Error Handling** ✅
**Problem:** Generic errors, hard to debug
**Fixed:** Added detailed error messages with context

### 4. **Missing Documentation** ✅
**Problem:** No docs on how to set up Edge Functions
**Fixed:** Created `/supabase/functions/README.md`

---

## 🧪 How to Test Your Timesheet

After setting up the environment variables:

1. **Restart dev server:**
   ```bash
   pm2 restart react-dev-server
   ```

2. **Open app:**
   http://134.209.45.231:3010/employee-portal

3. **Login as an employee** (use PIN)

4. **Check "My Hours" tab** - Should show:
   - This week's hours
   - Last week's hours
   - Proper times (not "AM" or "PM" by itself)

---

## 🚨 Common Errors

### Error: "Missing Supabase environment variables"
**Cause:** Secrets not set in Supabase Dashboard
**Fix:** Complete Step 2 above

### Error: "Failed to calculate payroll"
**Cause:** Service role key is wrong or not set
**Fix:** Double-check you copied the **service_role** key (not anon key)

### Timesheet shows empty
**Cause:** Employee has no clock in/out events in date range
**Fix:** This is normal if employee hasn't worked this week

### Times show as "undefined undefined"
**Cause:** Edge Function returned unexpected format
**Fix:** Check Edge Function logs in Supabase Dashboard

---

## 📊 What Edge Functions Do

### `timezone-convert`
- Converts UTC timestamps to Eastern Time
- Automatically detects EST vs EDT
- Returns formatted strings + timezone info

### `calculate-payroll`
- Queries database for clock in/out events
- Pairs them into shifts
- Calculates hours worked
- Returns total hours + total pay

**All timezone logic happens server-side now!**

---

## 🔗 Useful Links

- **Edge Functions Dashboard:** https://supabase.com/dashboard/project/gyyjviynlwbbodyfmvoi/functions
- **API Settings:** https://supabase.com/dashboard/project/gyyjviynlwbbodyfmvoi/settings/api
- **Edge Function Docs:** See `/supabase/functions/README.md`

---

## ⚡ Next: Deploy to Production

After confirming Edge Functions work on dev:

```bash
git add .
git commit -m "Fix Edge Functions timezone bugs and add proper error handling"
git push origin main
```

Vercel will auto-deploy with the fixes.

**Remember:** The Edge Functions run on Supabase, not Vercel, so the environment variables only need to be set once in Supabase Dashboard.
