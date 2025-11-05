import { useState } from 'react'
import { employeeApi, scheduleApi, timeclockApi } from '../supabase/supabase'
import { format } from 'date-fns'

/**
 * EMPLOYEE PORTAL - Mobile-First Design with Refined Glassmorphism
 *
 * A sophisticated, professional employee self-service portal with:
 * - Subtle glass effects (90% opacity, 10px blur)
 * - Moderate border radius (8-10px) for modern, refined appearance
 * - Refined shadows (0 4px 12-16px rgba(0,0,0,0.06-0.08))
 * - Muted accent colors (#2563EB blue) for professional look
 * - Minimal hover effects (1-2px transforms)
 * - Elegant gradient background
 * - PIN authentication and employee self-service functions
 * - Weekly schedule, timesheet, team schedule, and profile views
 */

// Translation strings for multi-language support
const translations = {
  en: {
    bagelCrust: 'Bagel Crust',
    employeePortal: 'Employee Portal',
    enterPin: 'Enter Your PIN',
    clear: 'Clear',
    verifying: 'Verifying...',
    loadingSchedule: 'Loading schedule...',
    logout: 'Logout',
    weeklySchedule: 'My Schedule',
    teamSchedule: 'Team Schedule',
    openShifts: 'Open Shifts',
    timeOff: 'Time Off',
    timesheet: 'Timesheet',
    profile: 'Profile',
    feedback: 'Feedback',
    thisWeek: 'This Week',
    nextWeek: 'Next Week',
    lastWeek: 'Last Week',
    off: 'OFF',
    total: 'Total',
    noHoursThisWeek: 'No hours worked this week',
    noHoursLastWeek: 'No hours worked last week',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    menu: 'Menu',
    selectSection: 'Select a section',
    scheduleNotPublished: 'Schedule not published yet',
    noOneScheduledToday: 'No one is scheduled to work today',
    employeeInfo: 'Employee Information',
    name: 'Name',
    role: 'Role',
    hourlyRate: 'Hourly Rate',
    employeeId: 'Employee ID',
    phoneNumber: 'Phone Number',
    email: 'Email'
  },
  es: {
    bagelCrust: 'Bagel Crust',
    employeePortal: 'Portal de Empleado',
    enterPin: 'Ingrese PIN',
    clear: 'Borrar',
    verifying: 'Verificando...',
    loadingSchedule: 'Cargando horario...',
    logout: 'Cerrar Sesión',
    weeklySchedule: 'Mi Horario',
    teamSchedule: 'Horario del Equipo',
    openShifts: 'Turnos Abiertos',
    timeOff: 'Tiempo Libre',
    timesheet: 'Horas Trabajadas',
    profile: 'Perfil',
    feedback: 'Comentarios',
    thisWeek: 'Esta Semana',
    nextWeek: 'Próxima Semana',
    lastWeek: 'Semana Pasada',
    off: 'LIBRE',
    total: 'Total',
    noHoursThisWeek: 'No hay horas trabajadas esta semana',
    noHoursLastWeek: 'No hay horas trabajadas la semana pasada',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
    menu: 'Menú',
    selectSection: 'Selecciona una sección',
    scheduleNotPublished: 'Horario no publicado todavía',
    noOneScheduledToday: 'Nadie está programado para trabajar hoy',
    employeeInfo: 'Información del Empleado',
    name: 'Nombre',
    role: 'Rol',
    hourlyRate: 'Tarifa por Hora',
    employeeId: 'ID de Empleado',
    phoneNumber: 'Número de Teléfono',
    email: 'Correo Electrónico'
  }
}

// Refined Glassmorphism Keypad Component
function RefinedKeypad({ onInput, onClear, disabled, t }: {
  onInput: (digit: string) => void,
  onClear: () => void,
  disabled?: boolean,
  t: any
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      maxWidth: '320px',
      margin: '0 auto'
    }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <button
          key={num}
          onClick={() => onInput(num.toString())}
          disabled={disabled}
          style={{
            padding: '18px',
            fontSize: '20px',
            fontWeight: '600',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#1F2937',
            transition: 'all 0.15s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitTapHighlightColor: 'rgba(0,0,0,0.05)',
            minHeight: '60px'
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)'
          }}
        >
          {num}
        </button>
      ))}

      {/* Empty space - bottom left */}
      <div style={{ minHeight: '60px' }}></div>

      <button
        onClick={() => onInput('0')}
        disabled={disabled}
        style={{
          padding: '18px',
          fontSize: '20px',
          fontWeight: '600',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#1F2937',
          transition: 'all 0.15s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitTapHighlightColor: 'rgba(0,0,0,0.05)',
          minHeight: '60px'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)'
        }}
      >
        0
      </button>

      <button
        onClick={onClear}
        disabled={disabled}
        style={{
          padding: '18px',
          fontSize: '16px',
          fontWeight: '600',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: 'rgba(239, 68, 68, 0.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#DC2626',
          transition: 'all 0.15s ease',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.06)',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitTapHighlightColor: 'rgba(0,0,0,0.05)',
          minHeight: '60px'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.08)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.06)'
        }}
      >
        {t.clear}
      </button>
    </div>
  )
}

export default function EmployeePortal_B() {
  const [pin, setPin] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [employee, setEmployee] = useState<any>(null)
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [timesheetData, setTimesheetData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'weeklySchedule' | 'teamSchedule' | 'openShifts' | 'timeOff' | 'timesheet' | 'profile'>('weeklySchedule')
  const [showWeek, setShowWeek] = useState<'this' | 'next'>('this')
  const [timesheetWeek, setTimesheetWeek] = useState<'this' | 'last'>('this')
  const [language, _setLanguage] = useState<'en' | 'es'>('en')
  const [teamScheduleWeek, setTeamScheduleWeek] = useState<'this' | 'next'>('this')
  const [fullTeamSchedule, setFullTeamSchedule] = useState<any>(null)
  const [timeOffRequests, setTimeOffRequests] = useState<any[]>([])
  const [timeOffStartDate, setTimeOffStartDate] = useState('')
  const [timeOffEndDate, setTimeOffEndDate] = useState('')
  const [timeOffReason, setTimeOffReason] = useState('')
  const [timeOffSubmitting, setTimeOffSubmitting] = useState(false)

  // Get current translations
  const t = translations[language]

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const [selectedTeamDay, setSelectedTeamDay] = useState<string>(() => {
    // Start with today's day
    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1 // Convert Sunday=0 to index 6
    return dayOrder[todayIndex]
  })

  const handlePinInput = (digit: string) => {
    setPin(prevPin => {
      const newPin = prevPin.length < 4 ? prevPin + digit : prevPin
      // Auto-submit when 4th digit is entered
      if (newPin.length === 4) {
        setTimeout(() => handlePinLogin(newPin), 0)
      }
      return newPin
    })
  }

  const handlePinClear = () => {
    setPin('')
    setLoginError('')
  }

  const handlePinLogin = async (pinValue?: string) => {
    const pinToUse = pinValue || pin
    if (pinToUse.length !== 4) {
      setLoginError('PIN must be 4 digits')
      return
    }

    setLoginError('')
    setLoading(true)

    try {
      // TEMPORARY: Allow login with 0000 for testing
      if (pinToUse === '0000') {
        // Create a test employee object
        const testEmployee = {
          id: 'test-employee',
          name: 'Test User',
          display_name: 'Test User',
          pin: '0000',
          hourly_rate: 15.00,
          phone_number: '555-0123',
          email: 'test@bagelcrust.com'
        }

        setEmployee(testEmployee)
        setPin('')

        // Load empty/mock data for now
        setScheduleData({
          thisWeek: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
          },
          nextWeek: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
          }
        })
        setTimesheetData({
          thisWeek: { days: [], totalHours: 0 },
          lastWeek: { days: [], totalHours: 0 }
        })
        setFullTeamSchedule({
          thisWeek: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
          },
          nextWeek: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
          }
        })
        setIsLoggedIn(true)
        setLoading(false)
        return
      }

      // Get employee by PIN
      const employee = await employeeApi.getByPin(pinToUse)

      if (!employee) {
        setLoginError('Invalid PIN')
        setPin('')
        setLoading(false)
        return
      }

      setEmployee(employee)
      setPin('')

      // Load schedule and timesheet data
      await loadEmployeeData(employee.id)
      setIsLoggedIn(true)
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('Login failed. Please try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployeeData = async (employeeId: string) => {
    try {
      // Load this week and next week schedules
      const thisWeekSchedules = await scheduleApi.getWeeklySchedule()
      const nextWeekSchedules = await scheduleApi.getNextWeekSchedule()

      console.log('🔍 DEBUG: This week schedules:', thisWeekSchedules)
      console.log('🔍 DEBUG: Next week schedules:', nextWeekSchedules)

      // Filter for this employee
      const myThisWeekSchedule = thisWeekSchedules.filter(s => s.employee_id === employeeId)
      const myNextWeekSchedule = nextWeekSchedules.filter(s => s.employee_id === employeeId)

      console.log('🔍 DEBUG: My this week schedule:', myThisWeekSchedule)
      console.log('🔍 DEBUG: My next week schedule:', myNextWeekSchedule)

      // Group by day of week
      const thisWeekByDay = groupScheduleByDay(myThisWeekSchedule)
      const nextWeekByDay = groupScheduleByDay(myNextWeekSchedule)

      console.log('🔍 DEBUG: This week by day:', thisWeekByDay)
      console.log('🔍 DEBUG: Next week by day:', nextWeekByDay)

      setScheduleData({
        thisWeek: thisWeekByDay,
        nextWeek: nextWeekByDay
      })

      // Store full team schedule (all employees)
      const fullThisWeekByDay = groupTeamScheduleByDay(thisWeekSchedules)
      const fullNextWeekByDay = groupTeamScheduleByDay(nextWeekSchedules)
      setFullTeamSchedule({
        thisWeek: fullThisWeekByDay,
        nextWeek: fullNextWeekByDay
      })

      // Load timesheet data (hours worked) - fetch more to ensure we get enough for one employee
      const recentEvents = await timeclockApi.getRecentEvents(200)
      console.log('⏰ Recent events fetched:', recentEvents.length)
      console.log('⏰ Employee ID:', employeeId)

      const myEvents = recentEvents.filter(e => e.employee_id === employeeId)
      console.log('⏰ My events:', myEvents.length)

      // Calculate hours worked this week and last week
      const thisWeekHours = calculateWeeklyHours(myEvents, 0)
      const lastWeekHours = calculateWeeklyHours(myEvents, -1)
      setTimesheetData({
        thisWeek: thisWeekHours,
        lastWeek: lastWeekHours
      })
    } catch (error) {
      console.error('❌ Failed to load employee data:', error)
    }
  }

  const groupTeamScheduleByDay = (schedules: any[]) => {
    const grouped: any = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }

    schedules.forEach(schedule => {
      const startDate = new Date(schedule.start_time)
      const dayOfWeek = startDate.getDay()
      const dayName = dayOrder[dayOfWeek === 0 ? 6 : dayOfWeek - 1]

      // Keep the full schedule object with employee data
      grouped[dayName].push(schedule)
    })

    return grouped
  }

  const groupScheduleByDay = (schedules: any[]) => {
    const grouped: any = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }

    schedules.forEach(schedule => {
      // Parse the timestamp to get the date and time
      const startDate = new Date(schedule.start_time)
      const endDate = new Date(schedule.end_time)

      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = startDate.getDay()
      const dayName = dayOrder[dayOfWeek === 0 ? 6 : dayOfWeek - 1]

      // Calculate hours scheduled
      const hoursScheduled = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

      // Format times as HH:MM
      const formatTimeString = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      }

      grouped[dayName].push({
        startTime: formatTimeString(startDate),
        endTime: formatTimeString(endDate),
        hoursScheduled: hoursScheduled.toFixed(1),
        location: schedule.location
      })
    })

    return grouped
  }

  const calculateWeeklyHours = (events: any[], weekOffset: number = 0) => {
    // Group events by day and calculate hours
    // Week starts on Monday (not Sunday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 6 days from Monday

    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - daysFromMonday + (weekOffset * 7))
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    // Filter events for this week using event_timestamp
    const thisWeekEvents = events.filter(e => {
      const eventDate = new Date(e.event_timestamp)
      return eventDate >= weekStart && eventDate < weekEnd
    })

    console.log('📊 Calculating hours from events:', thisWeekEvents.length)
    console.log('📊 This week date range:', weekStart, 'to', weekEnd)
    console.log('📊 Events detail:', thisWeekEvents)

    // Sort all events chronologically
    const sortedEvents = thisWeekEvents.sort((a, b) =>
      new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
    )

    // Calculate daily hours by pairing consecutive IN/OUT events (handles overnight shifts)
    const dailyHours: any[] = []
    let totalHours = 0
    let clockIn: any = null

    sortedEvents.forEach(event => {
      if (event.event_type === 'in') {
        clockIn = event
      } else if (event.event_type === 'out' && clockIn) {
        const inTime = new Date(clockIn.event_timestamp)
        const outTime = new Date(event.event_timestamp)
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)

        // Skip impossible shifts (over 16 hours = likely missing clock out/in)
        if (hours > 16) {
          console.warn('⚠️ Skipping impossible shift:', hours.toFixed(2), 'hours from', inTime, 'to', outTime)
          clockIn = null
          return
        }

        // Use the clock-in date as the reference date
        const dateKey = inTime.toISOString().split('T')[0]

        dailyHours.push({
          date: dateKey,
          day_name: format(inTime, 'EEEE'),
          clock_in: inTime.toTimeString().slice(0, 5), // HH:MM
          clock_out: outTime.toTimeString().slice(0, 5), // HH:MM
          hours_worked: hours.toFixed(2)
        })

        totalHours += hours
        clockIn = null // Reset for next pair
      }
    })

    console.log('📊 Calculated daily hours:', dailyHours)

    return {
      days: dailyHours,
      totalHours: totalHours.toFixed(2)
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatHoursMinutes = (decimal: string | number) => {
    const hours = Math.floor(Number(decimal))
    const minutes = Math.round((Number(decimal) - hours) * 60)
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setEmployee(null)
    setScheduleData(null)
    setTimesheetData(null)
    setPin('')
  }

  const handleTimeOffSubmit = async () => {
    if (!timeOffStartDate || !timeOffEndDate) {
      alert('Please select both start and end dates')
      return
    }

    const startDate = new Date(timeOffStartDate)
    const endDate = new Date(timeOffEndDate)

    if (endDate < startDate) {
      alert('End date must be after start date')
      return
    }

    setTimeOffSubmitting(true)

    // For now, just store locally (you can add API call later)
    const newRequest = {
      id: Date.now(),
      employee_id: employee.id,
      start_date: timeOffStartDate,
      end_date: timeOffEndDate,
      reason: timeOffReason,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    setTimeOffRequests([newRequest, ...timeOffRequests])

    // Clear form
    setTimeOffStartDate('')
    setTimeOffEndDate('')
    setTimeOffReason('')
    setTimeOffSubmitting(false)

    alert('Time off request submitted!')
  }

  if (!isLoggedIn) {
    return (
      <div className="w-full overflow-hidden flex items-start justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-5"
           style={{
             position: 'fixed',
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             paddingTop: '2rem'
           }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '36px 24px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>
              {t.bagelCrust}
            </h1>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#6B7280',
              letterSpacing: '-0.2px'
            }}>
              {t.employeePortal}
            </h2>
          </div>

          <p style={{
            textAlign: 'center',
            color: '#6B7280',
            marginBottom: '24px',
            fontSize: '15px',
            fontWeight: '500'
          }}>
            {t.enterPin}
          </p>

          {/* PIN Display */}
          <div style={{
            height: '70px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            gap: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: i < pin.length
                    ? '#2563EB'
                    : 'rgba(203, 213, 225, 0.5)',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          {loginError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid rgba(239, 68, 68, 0.15)'
            }}>
              {loginError}
            </div>
          )}

          <RefinedKeypad
            onInput={handlePinInput}
            onClear={handlePinClear}
            disabled={loading}
            t={t}
          />

          {loading && (
            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              color: '#6B7280',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {t.verifying}
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentSchedule = showWeek === 'this' ? scheduleData?.thisWeek : scheduleData?.nextWeek

  return (
    <div className="w-full overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-purple-50"
         style={{
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           paddingTop: '8px'
         }}>
      <div className="flex-1 overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-2xl mx-auto px-4 py-3">

        {/* Content Area with Glass Effect */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          {/* WEEKLY SCHEDULE TAB */}
          {activeTab === 'weeklySchedule' && (
            <div>
              {/* Clean Greeting */}
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: '32px',
                letterSpacing: '-0.5px'
              }}>
                Hi {employee?.first_name || 'there'}! 👋
              </h1>

              {/* Orange Gradient Next Shift Card */}
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                borderRadius: '14px',
                color: 'white',
                boxShadow: '0 6px 16px rgba(255, 107, 107, 0.3)'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px' }}>
                  NEXT SHIFT
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
                  Tomorrow
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', opacity: 0.95 }}>
                  9:00 AM - 5:00 PM
                </div>
              </div>

              {/* Week Toggle - full width segmented control */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-full">
                <button
                  onClick={() => setShowWeek('this')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    showWeek === 'this'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  {t.thisWeek}
                </button>
                <button
                  onClick={() => setShowWeek('next')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    showWeek === 'next'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  {t.nextWeek}
                </button>
              </div>

              {/* Compact Schedule */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayOrder.map((day, index) => {
                  const shifts = currentSchedule?.[day] || []
                  const dayName = t[day as keyof typeof t] as string
                  const isToday = showWeek === 'this' && new Date().getDay() === (dayOrder.indexOf(day) + 1) % 7

                  // Calculate date for this day
                  const now = new Date()
                  const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
                  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
                  const monday = new Date(now)
                  monday.setDate(now.getDate() + mondayOffset)

                  const weekOffset = showWeek === 'next' ? 7 : 0
                  const dayDate = new Date(monday)
                  dayDate.setDate(monday.getDate() + index + weekOffset)

                  const dateStr = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`

                  return (
                    <div
                      key={day}
                      style={{
                        padding: '14px 16px',
                        border: isToday ? '2px solid #2563EB' : '1px solid #E5E7EB',
                        borderRadius: '10px',
                        background: isToday ? 'rgba(37, 99, 235, 0.05)' : 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      {/* Left: Day & Date */}
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontWeight: '600',
                          color: '#1F2937',
                          fontSize: '16px',
                          marginBottom: '2px'
                        }}>
                          {dayName}
                          {isToday && (
                            <span style={{
                              fontSize: '10px',
                              color: '#2563EB',
                              fontWeight: '700',
                              marginLeft: '8px',
                              background: 'rgba(37, 99, 235, 0.15)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              TODAY
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>
                          {dateStr}
                        </div>
                      </div>

                      {/* Right: Time */}
                      <div style={{ textAlign: 'right' }}>
                        {shifts.length === 0 ? (
                          <span style={{
                            color: '#9CA3AF',
                            fontSize: '15px',
                            fontWeight: '600'
                          }}>
                            OFF
                          </span>
                        ) : (
                          shifts.map((shift: any, idx: number) => (
                            <div key={idx} style={{ marginBottom: idx < shifts.length - 1 ? '4px' : '0' }}>
                              <div style={{
                                fontWeight: '600',
                                color: '#2563EB',
                                fontSize: '16px'
                              }}>
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Open Shifts Section - Card Grid Style */}
              <div style={{
                marginTop: '64px',
                paddingTop: '48px',
                borderTop: '3px solid #D1D5DB'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1F2937',
                  marginBottom: '16px',
                  letterSpacing: '-0.5px'
                }}>
                  Open Shifts
                </h2>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  paddingBottom: '12px'
                }}>
                  {/* Card 1 */}
                  <div style={{
                    minWidth: '280px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    borderRadius: '16px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      marginBottom: '8px'
                    }}>
                      Tue, Nov 7
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      opacity: 0.95
                    }}>
                      9:00 AM - 5:00 PM
                    </div>
                    <div style={{
                      fontSize: '14px',
                      marginBottom: '20px',
                      opacity: 0.9
                    }}>
                      📍 Main Street
                    </div>
                    <button style={{
                      background: 'white',
                      color: '#2563EB',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      width: '100%'
                    }}>
                      Claim Shift
                    </button>
                  </div>

                  {/* Card 2 */}
                  <div style={{
                    minWidth: '280px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    borderRadius: '16px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      marginBottom: '8px'
                    }}>
                      Thu, Nov 9
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      opacity: 0.95
                    }}>
                      2:00 PM - 10:00 PM
                    </div>
                    <div style={{
                      fontSize: '14px',
                      marginBottom: '20px',
                      opacity: 0.9
                    }}>
                      📍 Downtown
                    </div>
                    <button style={{
                      background: 'white',
                      color: '#7C3AED',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      width: '100%'
                    }}>
                      Claim Shift
                    </button>
                  </div>

                  {/* Card 3 */}
                  <div style={{
                    minWidth: '280px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    borderRadius: '16px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      marginBottom: '8px'
                    }}>
                      Sat, Nov 11
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      opacity: 0.95
                    }}>
                      6:00 AM - 2:00 PM
                    </div>
                    <div style={{
                      fontSize: '14px',
                      marginBottom: '20px',
                      opacity: 0.9
                    }}>
                      📍 Main Street
                    </div>
                    <button style={{
                      background: 'white',
                      color: '#059669',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      width: '100%'
                    }}>
                      Claim Shift
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEAM SCHEDULE TAB */}
          {activeTab === 'teamSchedule' && fullTeamSchedule && (
            <div>
              {/* Week Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-full">
                <button
                  onClick={() => setTeamScheduleWeek('this')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    teamScheduleWeek === 'this'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  {t.thisWeek}
                </button>
                <button
                  onClick={() => setTeamScheduleWeek('next')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    teamScheduleWeek === 'next'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  {t.nextWeek}
                </button>
              </div>

              {/* Day Selector */}
              <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '16px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {dayOrder.map(day => {
                  const dayName = t[day as keyof typeof t] as string
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedTeamDay(day)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedTeamDay === day ? '#2563EB' : 'rgba(0,0,0,0.04)',
                        color: selectedTeamDay === day ? '#fff' : '#6B7280',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {dayName.slice(0, 3)}
                    </button>
                  )
                })}
              </div>

              {/* Team List for Selected Day */}
              {(() => {
                const currentWeekSchedule = teamScheduleWeek === 'this' ? fullTeamSchedule.thisWeek : fullTeamSchedule.nextWeek
                const daySchedules = currentWeekSchedule?.[selectedTeamDay] || []

                return daySchedules.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    paddingTop: '48px',
                    paddingBottom: '48px',
                    color: '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    No one scheduled for this day
                  </div>
                ) : (
                  <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    {daySchedules.map((schedule: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          padding: '16px',
                          borderBottom: index < daySchedules.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{
                          fontWeight: '700',
                          color: '#1F2937',
                          fontSize: '18px',
                          marginBottom: '6px'
                        }}>
                          {schedule.employee?.first_name}
                        </div>
                        <div style={{
                          fontWeight: '600',
                          color: '#2563EB',
                          fontSize: '17px'
                        }}>
                          {formatTime(new Date(schedule.start_time).toTimeString().slice(0,5))} - {formatTime(new Date(schedule.end_time).toTimeString().slice(0,5))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* OPEN SHIFTS TAB */}
          {activeTab === 'openShifts' && (
            <div>
              <div style={{
                textAlign: 'center',
                paddingTop: '48px',
                paddingBottom: '48px'
              }}>
                <div style={{
                  fontSize: '40px',
                  marginBottom: '12px'
                }}>
                  📋
                </div>
                <div style={{
                  color: '#6B7280',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Open Shifts
                </div>
                <div style={{
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Coming soon! You'll be able to pick up available shifts here.
                </div>
              </div>
            </div>
          )}

          {/* TIME OFF TAB */}
          {activeTab === 'timeOff' && (
            <div>
              {/* Request Form */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1F2937',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  Request Time Off
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={timeOffStartDate}
                    onChange={(e) => setTimeOffStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#1F2937',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={timeOffEndDate}
                    onChange={(e) => setTimeOffEndDate(e.target.value)}
                    min={timeOffStartDate || new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#1F2937',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Reason (Optional)
                  </label>
                  <textarea
                    value={timeOffReason}
                    onChange={(e) => setTimeOffReason(e.target.value)}
                    placeholder="E.g., Vacation, doctor's appointment..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#1F2937',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  onClick={handleTimeOffSubmit}
                  disabled={timeOffSubmitting || !timeOffStartDate || !timeOffEndDate}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: '700',
                    borderRadius: '8px',
                    border: 'none',
                    background: timeOffSubmitting || !timeOffStartDate || !timeOffEndDate
                      ? '#D1D5DB'
                      : '#2563EB',
                    color: '#fff',
                    cursor: timeOffSubmitting || !timeOffStartDate || !timeOffEndDate
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  {timeOffSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>

              {/* Previous Requests */}
              {timeOffRequests.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1F2937',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    Your Requests
                  </h3>
                  <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    {timeOffRequests.map((request, index) => {
                      const startDate = new Date(request.start_date)
                      const endDate = new Date(request.end_date)
                      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

                      return (
                        <div
                          key={request.id}
                          style={{
                            padding: '16px',
                            borderBottom: index < timeOffRequests.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#1F2937',
                            marginBottom: '4px'
                          }}>
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#6B7280',
                            marginBottom: '6px'
                          }}>
                            {days} day{days !== 1 ? 's' : ''}
                          </div>
                          {request.reason && (
                            <div style={{
                              fontSize: '14px',
                              color: '#9CA3AF',
                              fontStyle: 'italic',
                              marginBottom: '6px'
                            }}>
                              {request.reason}
                            </div>
                          )}
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: request.status === 'pending' ? '#F59E0B' : request.status === 'approved' ? '#10B981' : '#EF4444',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {request.status}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIMESHEET TAB */}
          {activeTab === 'timesheet' && timesheetData && (
            <div>
              {/* Week Toggle - full width segmented control */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-full">
                <button
                  onClick={() => setTimesheetWeek('this')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    timesheetWeek === 'this'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  {t.thisWeek}
                </button>
                <button
                  onClick={() => setTimesheetWeek('last')}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
                    timesheetWeek === 'last'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  {t.lastWeek}
                </button>
              </div>

              {(() => {
                const currentWeekData = timesheetWeek === 'this' ? timesheetData.thisWeek : timesheetData.lastWeek
                const hasHours = currentWeekData.days && currentWeekData.days.length > 0

                return hasHours ? (
                  <div>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
                      {currentWeekData.days.map((day: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '14px',
                            borderBottom: idx < currentWeekData.days.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{
                              fontWeight: '600',
                              color: '#1F2937',
                              fontSize: '15px'
                            }}>
                              {day.day_name}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#9CA3AF',
                              marginTop: '2px'
                            }}>
                              {format(new Date(day.date), 'MMMM do')}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontWeight: '600',
                              color: '#1F2937',
                              fontSize: '15px'
                            }}>
                              {formatHoursMinutes(day.hours_worked)}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#6B7280',
                              marginTop: '2px'
                            }}>
                              {formatTime(day.clock_in)} - {formatTime(day.clock_out)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      padding: '14px',
                      background: 'rgba(37, 99, 235, 0.06)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#1F2937',
                        fontSize: '15px'
                      }}>
                        {t.total}
                      </span>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#2563EB'
                      }}>
                        {formatHoursMinutes(currentWeekData.totalHours)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    paddingTop: '48px',
                    paddingBottom: '48px',
                    color: '#9CA3AF',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {timesheetWeek === 'this' ? t.noHoursThisWeek : t.noHoursLastWeek}
                  </div>
                )
              })()}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: '16px',
                letterSpacing: '-0.3px'
              }}>
                {t.employeeInfo}
              </h3>

              <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px', borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    {t.name}
                  </div>
                  <div style={{
                    fontWeight: '600',
                    color: '#1F2937',
                    fontSize: '15px'
                  }}>
                    {employee?.display_name || employee?.name}
                  </div>
                </div>

                <div style={{ padding: '14px', borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    PIN
                  </div>
                  <div style={{
                    fontWeight: '600',
                    color: '#1F2937',
                    fontSize: '15px'
                  }}>
                    {employee?.pin || '****'}
                  </div>
                </div>

                {employee?.hourly_rate && (
                  <div style={{ padding: '14px', borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {t.hourlyRate}
                    </div>
                    <div style={{
                      fontWeight: '600',
                      color: '#1F2937',
                      fontSize: '15px'
                    }}>
                      ${employee.hourly_rate}/hr
                    </div>
                  </div>
                )}

                {employee?.phone_number && (
                  <div style={{ padding: '14px', borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {t.phoneNumber}
                    </div>
                    <a
                      href={`tel:${employee.phone_number}`}
                      style={{
                        fontWeight: '600',
                        color: '#2563EB',
                        fontSize: '15px',
                        textDecoration: 'none'
                      }}
                    >
                      {employee.phone_number}
                    </a>
                  </div>
                )}

                {employee?.email && (
                  <div style={{ padding: '14px' }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {t.email}
                    </div>
                    <a
                      href={`mailto:${employee.email}`}
                      style={{
                        fontWeight: '600',
                        color: '#2563EB',
                        fontSize: '15px',
                        textDecoration: 'none'
                      }}
                    >
                      {employee.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Background Highlight */}
      <div className="fixed bottom-0 left-0 right-0 z-50"
           style={{
             paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
             background: 'rgba(255, 255, 255, 0.98)',
             backdropFilter: 'blur(10px)',
             WebkitBackdropFilter: 'blur(10px)',
             borderTop: '1px solid rgba(0, 0, 0, 0.06)',
             boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)'
           }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '8px 12px 0'
        }}>
          {[
            { key: 'weeklySchedule', label: 'Schedule' },
            { key: 'teamSchedule', label: 'Team' },
            { key: 'openShifts', label: 'Shifts' },
            { key: 'timeOff', label: 'Time Off' },
            { key: 'timesheet', label: 'Hours' },
            { key: 'profile', label: 'Profile' }
          ].map(({ key, label }) => {
            const isActive = activeTab === key
            const iconColor = isActive ? '#2563EB' : '#9CA3AF'

            // Minimal line icons as SVG
            const getIcon = () => {
              const iconProps = { width: 24, height: 24, stroke: iconColor, strokeWidth: 2, fill: 'none' }

              switch(key) {
                case 'weeklySchedule':
                  return <svg {...iconProps} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="4" x2="9" y2="8"/><line x1="15" y1="4" x2="15" y2="8"/></svg>
                case 'teamSchedule':
                  return <svg {...iconProps} viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="18" cy="9" r="3"/><path d="M20 21v-1.5a3 3 0 0 0-3-3h-1"/></svg>
                case 'openShifts':
                  return <svg {...iconProps} viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
                case 'timeOff':
                  return <svg {...iconProps} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                case 'timesheet':
                  return <svg {...iconProps} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                case 'profile':
                  return <svg {...iconProps} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                default:
                  return null
              }
            }

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  border: 'none',
                  background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  position: 'relative',
                  borderRadius: '12px'
                }}
              >
                <div style={{
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon()}
                </div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: isActive ? '700' : '500',
                  color: iconColor,
                  textAlign: 'center',
                  lineHeight: '1.2',
                  transition: 'all 0.2s ease'
                }}>
                  {label}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
