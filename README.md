# 🥯 Bagel Crust - React + Vite Employee Portal

A clean, organized employee management system built with React, Vite, and Supabase.

## 🎉 Why React + Vite (Not Next.js)

- **10x Simpler** - Just React components, no framework magic
- **Faster Development** - Vite hot reload is instant
- **AI-Friendly** - Claude understands it perfectly
- **Less Abstraction** - You see exactly what's happening
- **Supabase Does Everything** - Auth, real-time, APIs all built-in

## 🚀 Current Status

### ✅ Active Features
- **Clock In/Out** - PIN-based time clock system
- **Employee Portal** - Self-service employee interface
- Connected to Supabase with real employee data
- Live at: http://134.209.45.231:3003

### 📊 Live Data
- 25 employees with PINs
- 731 timeclock events
- 77 posted schedules

## 🛠️ Tech Stack

- **Frontend**: React 19.1 + TypeScript + Vite 7.1
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Routing**: React Router DOM v7.9
- **Dates**: date-fns

## 📁 Project Structure (Clean & Organized)

```
/bagelcrust/react-app/
├── src/
│   ├── pages/                      # Full-page components (routes)
│   │   ├── ClockInOut.tsx         # Clock in/out page
│   │   └── EmployeePortal.tsx     # Employee self-service portal
│   ├── components/                 # Reusable UI components
│   │   └── NumericKeypad.tsx      # Shared PIN keypad component
│   ├── supabase/                   # Database & API layer
│   │   └── supabase.ts            # Supabase client, types, API functions
│   ├── assets/                     # Images, icons, static files
│   ├── App.tsx                     # Router configuration
│   ├── main.tsx                    # Application entry point (DO NOT MOVE)
│   └── index.css                   # Global styles (Tailwind)
│
├── public/                          # Static assets (copied as-is to build)
│   └── vite.svg                    # Favicon and static files
│
├── dist/                            # Build output (auto-generated, don't edit!)
│
├── Config Files (Required at Root)
├── index.html                       # Vite entry point (DO NOT MOVE)
├── vite.config.ts                   # Vite build configuration
├── package.json                     # Dependencies & scripts (DO NOT MOVE)
├── package-lock.json                # Locked dependency versions
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json                # TypeScript app-specific config
├── tsconfig.node.json               # TypeScript node-specific config
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
├── eslint.config.js                 # ESLint linting rules
├── vercel.json                      # Vercel deployment config
└── README.md                        # This file!
```

### 🗂️ Archived Files (Not in Active Use)
Located in `/bagelcrust/other-files/react-app/`:
- **archived-components/** - Old design variants (A/B/C), Dashboard, DesignComparison
- **scripts/** - Database check scripts, migration tools
- **docs/** - Setup guides, deployment instructions
- **test-files/** - Test HTML files

## 📖 Understanding the Structure

### What Goes Where?

#### **`src/pages/`** - Full-Page Components (Routes)
- Each file = one page/route in your app
- Currently: ClockInOut.tsx, EmployeePortal.tsx
- **Add new pages here** when creating features like Schedule, Reports, etc.

#### **`src/components/`** - Reusable Components
- Shared UI pieces used across multiple pages
- Currently: NumericKeypad.tsx (used in multiple pages)
- **Add reusable components here** like buttons, modals, cards, etc.

#### **`src/supabase/`** - Database Layer
- Supabase client configuration
- API functions (employeeApi, timeclockApi, scheduleApi)
- TypeScript types for database tables
- **All database queries go here**

#### **`src/assets/`** - Images, Fonts, etc.
- Images, logos, icons
- Fonts, PDFs, documents
- Processed by Vite during build

#### **`public/`** - Static Files
- Files copied as-is to build (not processed)
- Access in code as `/filename.svg` (not `/public/filename.svg`)

#### **`dist/`** - Build Output (DON'T TOUCH!)
- Auto-generated when you run `npm run build`
- Gets deployed to production
- Regenerates every build

#### **Config Files at Root**
- Required by their respective tools (Vite, TypeScript, Tailwind, ESLint)
- Must stay at root for auto-detection
- Industry standard location

### What's Locked vs What's Flexible?

**🔒 Cannot Move (Hard-Locked):**
- `index.html` - Vite entry point
- `src/main.tsx` - Referenced in index.html
- `package.json` - npm standard
- `package-lock.json` - npm standard

**⚙️ Should Not Move (Convention):**
- All config files (vite, tsconfig, tailwind, eslint, etc.)
- Tools auto-detect them at root

**✅ Totally Flexible:**
- Everything in `src/` (except main.tsx)
- You can rename, reorganize, move files
- Just update the import paths!

## 💻 Development

```bash
# Install dependencies
npm install

# Start dev server (uses PM2)
pm2 restart dev-server
pm2 logs dev-server --lines 20

# Build for production
npm run build

# Preview production build
npm run preview
```

**Access URLs:**
- Dev: http://134.209.45.231:3010
- Production: http://134.209.45.231:3001

## 📝 Adding New Features (Step-by-Step)

### Example: Add a New Schedule Page

**Step 1:** Create the page component
```tsx
// src/pages/Schedule.tsx
import { useEffect, useState } from 'react';
import { scheduleApi } from '../supabase/supabase';

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    scheduleApi.getTodaySchedule().then(setSchedule);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Today's Schedule</h1>
      {/* Your UI */}
    </div>
  );
}
```

**Step 2:** Add route in App.tsx
```tsx
import Schedule from './pages/Schedule';

// Inside <Routes>:
<Route path="/schedule" element={<Schedule />} />
```

**Step 3:** Test it!
- Navigate to http://134.209.45.231:3010/schedule
- That's it! No API routes, no server logic needed.

### Example: Add a Reusable Button Component

**Step 1:** Create the component
```tsx
// src/components/Button.tsx
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export default function Button({ onClick, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {children}
    </button>
  );
}
```

**Step 2:** Use it in any page
```tsx
import Button from '../components/Button';

<Button onClick={() => alert('Clicked!')}>
  Click Me
</Button>
```

## 🎯 Migration Progress from Next.js

### ✅ Phase 1: Core Features (COMPLETE)
- [x] Clock In/Out with PIN authentication
- [x] Employee Portal
- [x] Supabase connection
- [x] Clean project structure

### 🚧 Phase 2: Employee Management (In Progress)
- [ ] Employee list/grid view
- [ ] Add/edit employees
- [ ] Availability management
- [ ] Employee profiles

### 📅 Phase 3: Scheduling (Planned)
- [ ] Weekly schedule view
- [ ] Schedule builder
- [ ] Time off requests
- [ ] Shift swapping

### 📊 Phase 4: Reports (Planned)
- [ ] Timesheets
- [ ] Payroll reports
- [ ] Hours tracking
- [ ] Analytics dashboard

## 🚀 Deployment

**Current Setup:**
- Dev server: PM2 on port 3010
- Production: Planning Vercel deployment

**To deploy to Vercel:**
1. Push to GitHub: `./push-to-github.sh`
2. Connect repo to Vercel
3. Set environment variables from `.env`
4. Deploy!

## 🔑 Test Employee PINs

- 1234 - Elvia
- 2345 - Sophia
- 3456 - Noah
- (All 25 employees have 4-digit PINs)

## ❓ Common Questions

**Q: Where do I add a new page?**
A: Create a `.tsx` file in `src/pages/`, then add a route in `App.tsx`

**Q: Where do I put reusable components?**
A: In `src/components/` - things like buttons, modals, cards, etc.

**Q: How do I query the database?**
A: Use the API functions in `src/supabase/supabase.ts` (employeeApi, timeclockApi, scheduleApi)

**Q: Can I rename files?**
A: Yes! Everything except `index.html`, `src/main.tsx`, `package.json` can be renamed. Just update imports.

**Q: Where are the old design variants?**
A: Archived in `/bagelcrust/other-files/react-app/archived-components/`

**Q: Why config files at root?**
A: Industry standard - tools auto-detect them there. Moving them requires extra configuration.

---

**🥯 Clean, simple, and maintainable. The future of Bagel Crust employee management.**