# 🥯 Bagel Crust - React + Supabase

A clean, simple employee management system built with React, Vite, and Supabase.

## 🎉 Why This is Better Than Next.js

- **10x Simpler** - Just React components, no framework magic
- **Faster Development** - Vite hot reload is instant
- **AI-Friendly** - Claude understands it perfectly
- **Less Abstraction** - You see exactly what's happening
- **Supabase Does Everything** - Auth, real-time, APIs all built-in

## 🚀 Current Status

### ✅ What's Working Now
- Clock In/Out with PIN (live at http://134.209.45.231:3003)
- Dashboard showing who's currently working
- Recent activity feed
- Connected to Supabase with real employee data

### 📊 Live Data
- 25 employees with PINs
- 731 timeclock events
- 77 posted schedules
- 5 employees currently clocked in

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Routing**: React Router
- **Dates**: date-fns

## 📁 Project Structure

```
/react-app
├── src/
│   ├── components/
│   │   ├── ClockInOut.tsx    # PIN-based time clock
│   │   └── Dashboard.tsx     # Live employee dashboard
│   ├── lib/
│   │   └── supabase.ts       # Supabase client & APIs
│   ├── App.tsx               # Routes
│   └── index.css             # Tailwind
└── .env                      # Supabase credentials
```

## 🚀 Migration Plan from Next.js

### Phase 1: Core Features (DONE ✅)
- [x] Clock in/out
- [x] Dashboard
- [x] Supabase connection

### Phase 2: Employee Management
- [ ] Employee list/grid
- [ ] Add/edit employees
- [ ] Availability management

### Phase 3: Scheduling
- [ ] Weekly schedule view
- [ ] Drag-and-drop scheduling
- [ ] Time off requests

### Phase 4: Reports
- [ ] Timesheets
- [ ] Payroll reports
- [ ] Hours tracking

## 💻 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Access at: http://134.209.45.231:3003

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