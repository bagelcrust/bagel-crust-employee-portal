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
  const [activeTab, setActiveTab] = useState<'weeklySchedule' | 'todaySchedule' | 'timesheet' | 'profile' | 'feedback'>('weeklySchedule')
  const [showWeek, setShowWeek] = useState<'this' | 'next'>('this')
  const [language, _setLanguage] = useState<'en' | 'es'>('en')
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

  // PIN Login Screen - Refined Glassmorphism
  if (!isLoggedIn) {
    return (
      <div style={{
        height: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'fixed',
        overflow: 'hidden'
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

  // Main Portal View - Refined Glassmorphism
  const currentSchedule = showWeek === 'this' ? scheduleData?.thisWeek : scheduleData?.nextWeek

  // APP SHELL ARCHITECTURE:
  // - Outer container: Fixed background (100vh, overflow: hidden) - Never scrolls
  // - Inner container: Scrollable content area (flex: 1, overflow: auto) - Only this scrolls
  // - Fixed footer: Position fixed at bottom, outside scroll area
  // This prevents "scrolling poster" effect where background moves with content
  return (
    <div style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Scrollable Content Area - paddingBottom creates safe area from mobile UI */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '100px'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px'
        }}>
          {/* Menu Navigation with Glass Effect */}
        <div style={{ marginBottom: '16px', marginTop: '16px', position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: '15px',
              fontWeight: '600',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#1F2937',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)'
            }}
          >
            <span>
              {activeTab === 'weeklySchedule' && t.weeklySchedule}
              {activeTab === 'todaySchedule' && t.todaySchedule}
              {activeTab === 'timesheet' && t.timesheet}
              {activeTab === 'profile' && t.profile}
              {activeTab === 'feedback' && t.feedback}
            </span>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>{menuOpen ? '▲' : '▼'}</span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              zIndex: 1000,
              border: '1px solid rgba(0, 0, 0, 0.06)'
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
                    padding: '12px 18px',
                    fontSize: '14px',
                    border: 'none',
                    borderBottom: index < 3 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                    backgroundColor: activeTab === tab ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    color: activeTab === tab ? '#2563EB' : '#1F2937',
                    fontWeight: activeTab === tab ? '600' : '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {t[tab as keyof typeof t]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area with Glass Effect */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '10px',
          padding: '22px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          {/* WEEKLY SCHEDULE TAB */}
          {activeTab === 'weeklySchedule' && (
            <div>
              {/* Week Toggle */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowWeek('this')}
                  style={{
                    flex: 1,
                    padding: '10px 18px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: showWeek === 'this' ? '#2563EB' : 'rgba(37, 99, 235, 0.08)',
                    color: showWeek === 'this' ? 'white' : '#2563EB',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: showWeek === 'this' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (showWeek !== 'this') {
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.12)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (showWeek !== 'this') {
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)'
                    }
                  }}
                >
                  {t.thisWeek}
                </button>
                <button
                  onClick={() => setShowWeek('next')}
                  style={{
                    flex: 1,
                    padding: '10px 18px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: showWeek === 'next' ? '#2563EB' : 'rgba(37, 99, 235, 0.08)',
                    color: showWeek === 'next' ? 'white' : '#2563EB',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: showWeek === 'next' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (showWeek !== 'next') {
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.12)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (showWeek !== 'next') {
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)'
                    }
                  }}
                >
                  {t.nextWeek}
                </button>
              </div>

              {/* Schedule List */}
              <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                {dayOrder.map((day, index) => {
                  const shifts = currentSchedule?.[day] || []
                  const dayName = t[day as keyof typeof t] as string
                  const isToday = new Date().getDay() === (dayOrder.indexOf(day) + 1) % 7

                  return (
                    <div
                      key={day}
                      style={{
                        padding: '14px',
                        borderBottom: index < 6 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                        backgroundColor: isToday ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: '#1F2937',
                          fontSize: '15px',
                          marginBottom: '2px'
                        }}>
                          {dayName}
                        </div>
                        {isToday && (
                          <div style={{
                            fontSize: '11px',
                            color: '#2563EB',
                            fontWeight: '600'
                          }}>
                            Today
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {shifts.length === 0 ? (
                          <span style={{
                            color: '#9CA3AF',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {t.off}
                          </span>
                        ) : (
                          shifts.map((shift: any, idx: number) => (
                            <div key={idx}>
                              <div style={{
                                fontWeight: '600',
                                color: '#1F2937',
                                fontSize: '14px'
                              }}>
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: '#6B7280',
                                marginTop: '2px'
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
                color: '#1F2937',
                marginBottom: '16px',
                letterSpacing: '-0.3px'
              }}>
                Today's Team Schedule
              </h3>
              {todayScheduleData.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  paddingTop: '48px',
                  paddingBottom: '48px',
                  color: '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {t.noOneScheduledToday}
                </div>
              ) : (
                <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  {todayScheduleData.map((schedule: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: '14px',
                        borderBottom: index < todayScheduleData.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none'
                      }}
                    >
                      <div style={{
                        fontWeight: '600',
                        color: '#1F2937',
                        fontSize: '15px',
                        marginBottom: '4px'
                      }}>
                        {schedule.core_employees?.display_name || schedule.core_employees?.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6B7280'
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
                color: '#1F2937',
                marginBottom: '16px',
                letterSpacing: '-0.3px'
              }}>
                {t.timesheet}
              </h3>

              {timesheetData.days && timesheetData.days.length > 0 ? (
                <div>
                  <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
                    {timesheetData.days.map((day: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '14px',
                          borderBottom: idx < timesheetData.days.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
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
                            {day.date}
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
                      {formatHoursMinutes(timesheetData.totalHours)}
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

      {/* Bottom Footer Bar - Fixed */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.08)',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1F2937',
            margin: 0
          }}>
            {employee?.first_name || ''}
          </h2>
          <button
            onClick={handleLogout}
            title={t.logout}
            style={{
              width: '42px',
              height: '42px',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              fontSize: '20px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            ⎋
          </button>
        </div>
      </div>
    </div>
  )
}
