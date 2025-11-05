import { useState, useEffect } from 'react'
import { employeeApi, scheduleApi, timeclockApi } from '../lib/supabase'
import { format } from 'date-fns'

/**
 * EMPLOYEE PORTAL - OPTION A: PROFESSIONAL/ENTERPRISE DESIGN
 *
 * A professional, corporate-style interface optimized for business environments.
 * Features clean lines, subtle shadows, muted colors, and a banking app aesthetic.
 *
 * Design Principles:
 * - Border radius: 4-6px maximum (very subtle corners)
 * - NO glass effects, NO backdrop blur
 * - Muted, desaturated colors (70-80% saturation)
 * - Subtle shadows: 0 1px 3px rgba(0,0,0,0.04) to 0 2px 8px rgba(0,0,0,0.06)
 * - Professional color palette: Navy blues (#2C5282), muted greens (#2D7A4F), grays
 * - Minimal hover effects (opacity changes only, no transforms)
 * - Clean white backgrounds with subtle borders
 * - Font: System fonts for maximum clarity
 *
 * Features PIN authentication and employee self-service functions:
 * - View weekly schedule
 * - Check timesheet/hours worked
 * - See team schedule
 * - Employee profile
 */

// Professional color palette
const colors = {
  primary: '#2C5282',      // Navy blue
  primaryLight: '#3B69A8',
  success: '#2D7A4F',      // Muted green
  danger: '#C53030',       // Muted red
  dangerLight: '#FC8181',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
}

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
    weeklySchedule: 'My Weekly Schedule',
    todaySchedule: 'Team Schedule',
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
    weeklySchedule: 'Mi Horario Semanal',
    todaySchedule: 'Horario del Equipo',
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

// Professional Keypad Component - No glass effects, clean and minimal
function ProfessionalKeypad({ onInput, onClear, disabled, t }: {
  onInput: (digit: string) => void,
  onClear: () => void,
  disabled?: boolean,
  t: typeof translations.en
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      maxWidth: '320px',
      margin: '0 auto'
    }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <button
          key={num}
          onClick={() => onInput(num.toString())}
          disabled={disabled}
          style={{
            padding: '20px',
            fontSize: '22px',
            fontWeight: '600',
            background: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: colors.gray800,
            transition: 'opacity 0.15s',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '64px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            opacity: disabled ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.opacity = '0.7'
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.opacity = '1'
            }
          }}
        >
          {num}
        </button>
      ))}

      {/* Empty space - bottom left */}
      <div style={{ minHeight: '64px' }}></div>

      <button
        onClick={() => onInput('0')}
        disabled={disabled}
        style={{
          padding: '20px',
          fontSize: '22px',
          fontWeight: '600',
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: colors.gray800,
          transition: 'opacity 0.15s',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '64px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          opacity: disabled ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '0.7'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '1'
          }
        }}
      >
        0
      </button>

      <button
        onClick={onClear}
        disabled={disabled}
        style={{
          padding: '20px',
          fontSize: '16px',
          fontWeight: '600',
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: colors.danger,
          transition: 'opacity 0.15s',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '64px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          opacity: disabled ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '0.7'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '1'
          }
        }}
      >
        {t.clear}
      </button>
    </div>
  )
}

export default function EmployeePortal_A() {
  const [pin, setPin] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [employee, setEmployee] = useState<any>(null)
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [timesheetData, setTimesheetData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'weeklySchedule' | 'todaySchedule' | 'timesheet' | 'profile' | 'feedback'>('weeklySchedule')
  const [showWeek, setShowWeek] = useState<'this' | 'next'>('this')
  const [language, setLanguage] = useState<'en' | 'es'>('en')
  const [menuOpen, setMenuOpen] = useState(false)
  const [todayScheduleData, setTodayScheduleData] = useState<any[]>([])

  // Get current translations
  const t = translations[language]

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

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
        setTimesheetData({ days: [], totalHours: 0 })
        setTodayScheduleData([])
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

      // Filter for this employee
      const myThisWeekSchedule = thisWeekSchedules.filter(s => s.employee_id === employeeId)
      const myNextWeekSchedule = nextWeekSchedules.filter(s => s.employee_id === employeeId)

      // Group by day of week
      const thisWeekByDay = groupScheduleByDay(myThisWeekSchedule)
      const nextWeekByDay = groupScheduleByDay(myNextWeekSchedule)

      setScheduleData({
        thisWeek: thisWeekByDay,
        nextWeek: nextWeekByDay
      })

      // Load timesheet data (hours worked)
      const recentEvents = await timeclockApi.getRecentEvents(50)
      const myEvents = recentEvents.filter(e => e.employee_id === employeeId)

      // Calculate hours worked this week
      const thisWeekHours = calculateWeeklyHours(myEvents)
      setTimesheetData(thisWeekHours)

      // Load today's team schedule
      const todaySchedules = await scheduleApi.getTodaySchedule()
      setTodayScheduleData(todaySchedules)
    } catch (error) {
      console.error('Failed to load employee data:', error)
    }
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
      const date = new Date(schedule.schedule_date + 'T12:00:00')
      const dayName = dayOrder[date.getDay() === 0 ? 6 : date.getDay() - 1]

      grouped[dayName].push({
        startTime: schedule.shift_start_time_est,
        endTime: schedule.shift_end_time_est,
        hoursScheduled: schedule.hours_scheduled,
        location: schedule.location
      })
    })

    return grouped
  }

  const calculateWeeklyHours = (events: any[]) => {
    // Group events by day and calculate hours
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const thisWeekEvents = events.filter(e => {
      const eventDate = new Date(e.event_date)
      return eventDate >= weekStart && eventDate < weekEnd
    })

    // Pair clock in/out events and calculate hours
    const dailyHours: any[] = []
    let totalHours = 0

    // Process events to match in/out pairs
    const processedDates = new Set()

    thisWeekEvents.forEach(event => {
      if (processedDates.has(event.event_date)) return

      const dayEvents = thisWeekEvents.filter(e => e.event_date === event.event_date)
      const clockIn = dayEvents.find(e => e.event_type === 'in')
      const clockOut = dayEvents.find(e => e.event_type === 'out')

      if (clockIn && clockOut) {
        const inTime = new Date(`${clockIn.event_date} ${clockIn.event_time_est}`)
        const outTime = new Date(`${clockOut.event_date} ${clockOut.event_time_est}`)
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)

        dailyHours.push({
          date: event.event_date,
          day_name: format(new Date(event.event_date), 'EEEE'),
          clock_in: clockIn.event_time_est,
          clock_out: clockOut.event_time_est,
          hours_worked: hours.toFixed(2)
        })

        totalHours += hours
        processedDates.add(event.event_date)
      }
    })

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

  // PIN Login Screen - Professional Design
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.gray50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '40px 28px',
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: colors.gray900,
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}>
              {t.bagelCrust}
            </h1>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '500',
              color: colors.gray600
            }}>
              {t.employeePortal}
            </h2>
          </div>

          <p style={{
            textAlign: 'center',
            color: colors.gray600,
            marginBottom: '24px',
            fontSize: '15px'
          }}>
            {t.enterPin}
          </p>

          {/* PIN Display */}
          <div style={{
            height: '72px',
            background: colors.gray50,
            border: `1px solid ${colors.gray200}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '28px',
            gap: '16px'
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: i < pin.length ? colors.primary : colors.gray300,
                  transition: 'background 0.2s'
                }}
              />
            ))}
          </div>

          {loginError && (
            <div style={{
              background: '#FEF2F2',
              color: colors.danger,
              padding: '12px 16px',
              borderRadius: '4px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
              border: `1px solid ${colors.dangerLight}`
            }}>
              {loginError}
            </div>
          )}

          <ProfessionalKeypad
            onInput={handlePinInput}
            onClear={handlePinClear}
            disabled={loading}
            t={t}
          />

          {loading && (
            <div style={{
              textAlign: 'center',
              marginTop: '24px',
              color: colors.gray600,
              fontSize: '15px'
            }}>
              {t.verifying}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main Portal View - Professional Design
  const currentSchedule = showWeek === 'this' ? scheduleData?.thisWeek : scheduleData?.nextWeek

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.gray50,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {/* Design Label */}
      <div style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        background: colors.primary,
        color: colors.white,
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)'
      }}>
        OPTION A: PROFESSIONAL/ENTERPRISE
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        paddingTop: '60px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '16px',
          padding: '20px',
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: colors.gray900,
            margin: 0
          }}>
            {employee?.display_name || employee?.name}
          </h2>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {t.logout}
          </button>
        </div>

        {/* Menu Navigation */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '15px',
              fontWeight: '600',
              background: colors.white,
              border: `1px solid ${colors.gray200}`,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: colors.gray800,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'opacity 0.15s',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <span>
              {activeTab === 'weeklySchedule' && t.weeklySchedule}
              {activeTab === 'todaySchedule' && t.todaySchedule}
              {activeTab === 'timesheet' && t.timesheet}
              {activeTab === 'profile' && t.profile}
              {activeTab === 'feedback' && t.feedback}
            </span>
            <span style={{ fontSize: '11px', color: colors.gray500 }}>{menuOpen ? '▲' : '▼'}</span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: colors.white,
              border: `1px solid ${colors.gray200}`,
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
              zIndex: 1000
            }}>
              {['weeklySchedule', 'todaySchedule', 'timesheet', 'profile'].map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as any)
                    setMenuOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: 'none',
                    borderBottom: index < 3 ? `1px solid ${colors.gray100}` : 'none',
                    backgroundColor: activeTab === tab ? colors.gray50 : colors.white,
                    color: activeTab === tab ? colors.primary : colors.gray700,
                    fontWeight: activeTab === tab ? '600' : '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.backgroundColor = colors.gray50
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.backgroundColor = colors.white
                    }
                  }}
                >
                  {t[tab as keyof typeof t]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div style={{
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: '6px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          {/* WEEKLY SCHEDULE TAB */}
          {activeTab === 'weeklySchedule' && (
            <div>
              {/* Week Toggle */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowWeek('this')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: `1px solid ${showWeek === 'this' ? colors.primary : colors.gray200}`,
                    borderRadius: '4px',
                    backgroundColor: showWeek === 'this' ? colors.primary : colors.white,
                    color: showWeek === 'this' ? colors.white : colors.gray700,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {t.thisWeek}
                </button>
                <button
                  onClick={() => setShowWeek('next')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: `1px solid ${showWeek === 'next' ? colors.primary : colors.gray200}`,
                    borderRadius: '4px',
                    backgroundColor: showWeek === 'next' ? colors.primary : colors.white,
                    color: showWeek === 'next' ? colors.white : colors.gray700,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {t.nextWeek}
                </button>
              </div>

              {/* Schedule List */}
              <div style={{
                border: `1px solid ${colors.gray200}`,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                {dayOrder.map((day, index) => {
                  const shifts = currentSchedule?.[day] || []
                  const dayName = t[day as keyof typeof t] as string
                  const isToday = new Date().getDay() === (dayOrder.indexOf(day) + 1) % 7

                  return (
                    <div
                      key={day}
                      style={{
                        padding: '14px 16px',
                        borderBottom: index < 6 ? `1px solid ${colors.gray100}` : 'none',
                        backgroundColor: isToday ? '#EFF6FF' : colors.white,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: colors.gray900,
                          fontSize: '14px'
                        }}>
                          {dayName}
                        </div>
                        {isToday && (
                          <div style={{
                            fontSize: '12px',
                            color: colors.primary,
                            marginTop: '2px'
                          }}>
                            Today
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {shifts.length === 0 ? (
                          <span style={{
                            color: colors.gray400,
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>
                            {t.off}
                          </span>
                        ) : (
                          shifts.map((shift: any, idx: number) => (
                            <div key={idx}>
                              <div style={{
                                fontWeight: '600',
                                color: colors.gray900,
                                fontSize: '14px'
                              }}>
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: colors.gray600
                              }}>
                                {shift.hoursScheduled}h
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TEAM SCHEDULE TAB */}
          {activeTab === 'todaySchedule' && (
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: colors.gray900,
                marginBottom: '16px',
                marginTop: 0
              }}>
                Today's Team Schedule
              </h3>
              {todayScheduleData.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  color: colors.gray400,
                  fontSize: '14px'
                }}>
                  {t.noOneScheduledToday}
                </div>
              ) : (
                <div style={{
                  border: `1px solid ${colors.gray200}`,
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  {todayScheduleData.map((schedule: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: '14px 16px',
                        borderBottom: index < todayScheduleData.length - 1 ? `1px solid ${colors.gray100}` : 'none'
                      }}
                    >
                      <div style={{
                        fontWeight: '600',
                        color: colors.gray900,
                        marginBottom: '4px',
                        fontSize: '14px'
                      }}>
                        {schedule.core_employees?.display_name || schedule.core_employees?.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: colors.gray600
                      }}>
                        <span style={{ fontWeight: '500' }}>
                          {formatTime(schedule.shift_start_time_est)} - {formatTime(schedule.shift_end_time_est)}
                        </span>
                        <span style={{ marginLeft: '12px' }}>
                          {schedule.hours_scheduled}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TIMESHEET TAB */}
          {activeTab === 'timesheet' && timesheetData && (
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: colors.gray900,
                marginBottom: '16px',
                marginTop: 0
              }}>
                {t.timesheet}
              </h3>

              {timesheetData.days && timesheetData.days.length > 0 ? (
                <div>
                  <div style={{
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '16px'
                  }}>
                    {timesheetData.days.map((day: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '14px 16px',
                          borderBottom: idx < timesheetData.days.length - 1 ? `1px solid ${colors.gray100}` : 'none',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{
                            fontWeight: '600',
                            color: colors.gray900,
                            fontSize: '14px'
                          }}>
                            {day.day_name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: colors.gray500,
                            marginTop: '2px'
                          }}>
                            {day.date}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontWeight: '600',
                            color: colors.gray900,
                            fontSize: '14px'
                          }}>
                            {formatHoursMinutes(day.hours_worked)}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: colors.gray600
                          }}>
                            {formatTime(day.clock_in)} - {formatTime(day.clock_out)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '14px 16px',
                    background: '#EFF6FF',
                    border: `1px solid #DBEAFE`,
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontWeight: '600',
                      color: colors.gray900,
                      fontSize: '14px'
                    }}>
                      {t.total}
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: colors.primary
                    }}>
                      {formatHoursMinutes(timesheetData.totalHours)}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  color: colors.gray400,
                  fontSize: '14px'
                }}>
                  {t.noHoursThisWeek}
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: colors.gray900,
                marginBottom: '16px',
                marginTop: 0
              }}>
                {t.employeeInfo}
              </h3>

              <div style={{
                border: `1px solid ${colors.gray200}`,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid ${colors.gray100}`
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: colors.gray500,
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    {t.name}
                  </div>
                  <div style={{
                    fontWeight: '600',
                    color: colors.gray900,
                    fontSize: '14px'
                  }}>
                    {employee?.display_name || employee?.name}
                  </div>
                </div>

                <div style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid ${colors.gray100}`
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: colors.gray500,
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    PIN
                  </div>
                  <div style={{
                    fontWeight: '600',
                    color: colors.gray900,
                    fontSize: '14px'
                  }}>
                    {employee?.pin || '****'}
                  </div>
                </div>

                {employee?.hourly_rate && (
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${colors.gray100}`
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: colors.gray500,
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {t.hourlyRate}
                    </div>
                    <div style={{
                      fontWeight: '600',
                      color: colors.gray900,
                      fontSize: '14px'
                    }}>
                      ${employee.hourly_rate}/hr
                    </div>
                  </div>
                )}

                {employee?.phone_number && (
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${colors.gray100}`
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: colors.gray500,
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {t.phoneNumber}
                    </div>
                    <a
                      href={`tel:${employee.phone_number}`}
                      style={{
                        fontWeight: '600',
                        color: colors.primary,
                        fontSize: '14px',
                        textDecoration: 'none'
                      }}
                    >
                      {employee.phone_number}
                    </a>
                  </div>
                )}

                {employee?.email && (
                  <div style={{
                    padding: '14px 16px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: colors.gray500,
                      marginBottom: '4px',
                      fontWeight: '500'
                    }}>
                      {t.email}
                    </div>
                    <a
                      href={`mailto:${employee.email}`}
                      style={{
                        fontWeight: '600',
                        color: colors.primary,
                        fontSize: '14px',
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
  )
}
