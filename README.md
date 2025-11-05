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

## 🚀 Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   cd /bagelcrust/react-app
   git init
   git add .
   git commit -m "React app with Supabase"
   gh repo create bagel-crust-react --public --source=. --remote=origin --push
   ```

2. **Deploy on Vercel**:
   - Import from GitHub
   - Framework: Vite
   - Environment variables from `.env`

## 🔑 Test PINs

- 1234 - Elvia
- 2345 - Sophia
- 3456 - Noah
- (All employees have 4-digit PINs)

## 📝 Adding Features

### Example: Add Employee List Page

1. Create component:
```tsx
// src/components/EmployeeList.tsx
import { useEffect, useState } from 'react';
import { employeeApi } from '../lib/supabase';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    employeeApi.getAll().then(setEmployees);
  }, []);

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

2. Add route in App.tsx:
```tsx
<Route path="/employees" element={<EmployeeList />} />
```

That's it! No API routes, no server logic, just components.

## 🎯 Why We're Moving Away from Next.js

**Next.js Problems:**
- Too complex for internal tools
- Unnecessary SSR overhead
- API routes when Supabase has APIs
- Build complexity
- Framework lock-in

**React + Supabase Solution:**
- Simple components
- Direct database queries
- Real-time subscriptions built-in
- Fast Vite builds
- Complete freedom

## 🔮 Next Steps

1. **Finish migrating all employee features**
2. **Add Supabase Auth** (optional, PIN system works)
3. **Deploy to Vercel**
4. **Shut down PM2/Next.js server forever!**

---

**This is the future of Bagel Crust. Simple, fast, and maintainable.**