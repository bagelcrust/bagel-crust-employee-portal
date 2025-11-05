# Bagel Crust Employee Portal - Deployment Guide

## Quick Deploy to Vercel

### 1. Push to GitHub
```bash
# Already done if you're reading this in the repo!
git add .
git commit -m "Initial commit: Bagel Crust Employee Portal"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Fastest)
```bash
npm i -g vercel
vercel login
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3. Environment Variables (REQUIRED)

Add these environment variables in Vercel:
- **VITE_SUPABASE_URL**: Your Supabase project URL
- **VITE_SUPABASE_ANON_KEY**: Your Supabase anon/public key

**To add in Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://gyyjviynlwbbodyfmvoi.supabase.co`
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eWp2aXlubHdiYm9keWZtdm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzMxMDQsImV4cCI6MjA0MTA0OTEwNH0.lBCMz9a-v1JVzsvf1dSp3v8WVo0x1xXqSV1qHqQFCGo`

3. Click "Save"
4. Redeploy the project

## Supabase Configuration

Your Supabase database is already set up with:
- `core_employees` table
- `timeclock_events` table
- `posted_schedules` table

Test PIN for employee login: **0000**

## Features

✅ Employee Clock In/Out (PIN-based)
✅ Employee Portal with:
  - Weekly schedule view
  - Team schedule
  - Timesheet tracking
  - Employee profile
✅ Refined glassmorphism design
✅ Multiple design variations available at `/compare`

## Routes

- `/` - Design comparison page
- `/compare` - Design comparison page
- `/clockinout` - Clock In/Out page
- `/employee-portal` - Main employee portal (login with PIN)
- `/design-a` - Professional design variant
- `/design-b` - Refined glassmorphism variant
- `/design-c` - Flat minimal variant

## Local Development

```bash
npm install
npm run dev
```

Server runs on http://localhost:5173

## Production Build

```bash
npm run build
npm run preview
```

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Router:** React Router v6
- **Date Handling:** date-fns
- **Deployment:** Vercel

---

**Need help?** Contact support or check the [Supabase docs](https://supabase.com/docs)
