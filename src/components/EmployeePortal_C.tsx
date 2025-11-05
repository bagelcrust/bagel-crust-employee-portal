import { useState } from 'react'
import { employeeApi, scheduleApi, timeclockApi } from '../lib/supabase'
import { format } from 'date-fns'

/**
 * EMPLOYEE PORTAL - OPTION C: FLAT MINIMAL DESIGN
 *
 * A phone-optimized interface with flat, geometric Material Design aesthetic.
 * Features PIN authentication and employee self-service functions:
 * - View weekly schedule
 * - Check timesheet/hours worked
 * - See team schedule
 * - Employee profile
 *
 * Design: Flat white backgrounds, 2px solid borders, zero border radius,
 * high contrast black/white with gray accents, no blur effects or gradients
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

// Flat Minimal Keypad Component
function FlatKeypad({ onInput, onClear, disabled, t }: {
  onInput: (digit: string) => void,
  onClear: () => void,
  disabled?: boolean,
  t: any
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      maxWidth: '320px',
      margin: '0 auto'
    }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <button
          key={num}
          onClick={() => onInput(num.toString())}
          disabled={disabled}
          style={{
            padding: '22px',
            fontSize: '26px',
            fontWeight: '600',
            background: '#FFFFFF',
            border: '2px solid #000000',
            borderRadius: '0px',
            cursor: 'pointer',
            color: '#000000',
            transition: 'all 0.15s',
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '70px',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = '#000000'
              e.currentTarget.style.color = '#FFFFFF'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
            e.currentTarget.style.color = '#000000'
          }}
        >
          {num}
        </button>
      ))}

      {/* Empty space - bottom left */}
      <div style={{ minHeight: '70px' }}></div>

      <button
        onClick={() => onInput('0')}
        disabled={disabled}
        style={{
          padding: '22px',
          fontSize: '26px',
          fontWeight: '600',
          background: '#FFFFFF',
          border: '2px solid #000000',
          borderRadius: '0px',
          cursor: 'pointer',
          color: '#000000',
          transition: 'all 0.15s',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '70px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#000000'
            e.currentTarget.style.color = '#FFFFFF'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
          e.currentTarget.style.color = '#000000'
        }}
      >
        0
      </button>

      <button
        onClick={onClear}
        disabled={disabled}
        style={{
          padding: '22px',
          fontSize: '16px',
          fontWeight: '700',
          background: '#FFFFFF',
          border: '2px solid #DC2626',
          borderRadius: '0px',
          cursor: 'pointer',
          color: '#DC2626',
          transition: 'all 0.15s',
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '70px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = '#DC2626'
            e.currentTarget.style.color = '#FFFFFF'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
          e.currentTarget.style.color = '#DC2626'
        }}
      >
        {t.clear}
      </button>
    </div>
  )
}

export default function EmployeePortal_C() {
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

  // PIN Login Screen - FLAT MINIMAL DESIGN
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F5F5F5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Design Label */}
        <div style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          padding: '8px 16px',
          background: '#000000',
          color: '#FFFFFF',
          border: '2px solid #000000',
          borderRadius: '0px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          zIndex: 1000
        }}>
          OPTION C: FLAT MINIMAL
        </div>

        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '40px 20px',
          background: '#FFFFFF',
          border: '2px solid #000000',
          borderRadius: '0px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#000000',
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>
              {t.bagelCrust}
            </h1>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#666666'
            }}>
              {t.employeePortal}
            </h2>
          </div>

          <p style={{
            textAlign: 'center',
            color: '#666666',
            marginBottom: '24px',
            fontSize: '14px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {t.enterPin}
          </p>

          {/* PIN Display */}
          <div style={{
            height: '80px',
            background: '#FFFFFF',
            border: '2px solid #000000',
            borderRadius: '0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            gap: '16px'
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '0px',
                  background: i < pin.length ? '#000000' : '#E5E5E5',
                  transition: 'background 0.2s'
                }}
              />
            ))}
          </div>

          {loginError && (
            <div style={{
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '0px',
              marginBottom: '16px',
              textAlign: 'center',
              border: '2px solid #DC2626',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {loginError}
            </div>
          )}

          <FlatKeypad
            onInput={handlePinInput}
            onClear={handlePinClear}
            disabled={loading}
            t={t}
          />

          {loading && (
            <div style={{
              textAlign: 'center',
              marginTop: '24px',
              color: '#666666',
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {t.verifying}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main Portal View - FLAT MINIMAL DESIGN
  const currentSchedule = showWeek === 'this' ? scheduleData?.thisWeek : scheduleData?.nextWeek

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F5F5',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Design Label */}
      <div style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        padding: '8px 16px',
        background: '#000000',
        color: '#FFFFFF',
        border: '2px solid #000000',
        borderRadius: '0px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        zIndex: 1000
      }}>
        OPTION C: FLAT MINIMAL
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          background: '#FFFFFF',
          border: '2px solid #000000',
          borderRadius: '0px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#000000',
            margin: 0
          }}>
            {employee?.display_name || employee?.name}
          </h2>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#000000',
              color: '#FFFFFF',
              border: '2px solid #000000',
              borderRadius: '0px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#000000'
              e.currentTarget.style.color = '#FFFFFF'
            }}
          >
            {t.logout}
          </button>
        </div>

        {/* Menu Navigation */}
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: '700',
              background: '#FFFFFF',
              border: '2px solid #000000',
              borderRadius: '0px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#000000',
              transition: 'all 0.15s',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#000000'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.color = '#000000'
            }}
          >
            <span>
              {activeTab === 'weeklySchedule' && t.weeklySchedule}
              {activeTab === 'todaySchedule' && t.todaySchedule}
              {activeTab === 'timesheet' && t.timesheet}
              {activeTab === 'profile' && t.profile}
              {activeTab === 'feedback' && t.feedback}
            </span>
            <span style={{ fontSize: '12px' }}>{menuOpen ? '▲' : '▼'}</span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              background: '#FFFFFF',
              border: '2px solid #000000',
              borderRadius: '0px',
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
                    padding: '14px 20px',
                    fontSize: '15px',
                    border: 'none',
                    borderBottom: index < 3 ? '1px solid #E5E5E5' : 'none',
                    backgroundColor: activeTab === tab ? '#000000' : '#FFFFFF',
                    color: activeTab === tab ? '#FFFFFF' : '#000000',
                    fontWeight: activeTab === tab ? '700' : '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.backgroundColor = '#F5F5F5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF'
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
          background: '#FFFFFF',
          border: '2px solid #000000',
          borderRadius: '0px',
          padding: '24px'
        }}>
          {/* WEEKLY SCHEDULE TAB */}
          {activeTab === 'weeklySchedule' && (
            <div>
              {/* Week Toggle */}
              <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowWeek('this')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: '2px solid #000000',
                    borderRadius: '0px',
                    backgroundColor: showWeek === 'this' ? '#000000' : '#FFFFFF',
                    color: showWeek === 'this' ? '#FFFFFF' : '#000000',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    if (showWeek !== 'this') {
                      e.currentTarget.style.backgroundColor = '#F5F5F5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (showWeek !== 'this') {
                      e.currentTarget.style.backgroundColor = '#FFFFFF'
                    }
                  }}
                >
                  {t.thisWeek}
                </button>
                <button
                  onClick={() => setShowWeek('next')}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    border: '2px solid #000000',
                    borderRadius: '0px',
                    backgroundColor: showWeek === 'next' ? '#000000' : '#FFFFFF',
                    color: showWeek === 'next' ? '#FFFFFF' : '#000000',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    if (showWeek !== 'next') {
                      e.currentTarget.style.backgroundColor = '#F5F5F5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (showWeek !== 'next') {
                      e.currentTarget.style.backgroundColor = '#FFFFFF'
                    }
                  }}
                >
                  {t.nextWeek}
                </button>
              </div>

              {/* Schedule List */}
              <div style={{ border: '2px solid #000000', borderRadius: '0px', overflow: 'hidden' }}>
                {dayOrder.map((day, index) => {
                  const shifts = currentSchedule?.[day] || []
                  const dayName = t[day as keyof typeof t] as string
                  const isToday = new Date().getDay() === (dayOrder.indexOf(day) + 1) % 7

                  return (
                    <div
                      key={day}
                      style={{
                        padding: '16px',
                        borderBottom: index < 6 ? '2px solid #E5E5E5' : 'none',
                        backgroundColor: isToday ? '#F5F5F5' : '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{
                          fontWeight: '700',
                          color: '#000000',
                          fontSize: '15px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {dayName}
                        </div>
                        {isToday && (
                          <div style={{
                            fontSize: '11px',
                            color: '#666666',
                            marginTop: '4px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Today
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {shifts.length === 0 ? (
                          <span style={{
                            color: '#999999',
                            fontWeight: '700',
                            fontSize: '14px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {t.off}
                          </span>
                        ) : (
                          shifts.map((shift: any, idx: number) => (
                            <div key={idx}>
                              <div style={{
                                fontWeight: '700',
                                color: '#000000',
                                fontSize: '15px'
                              }}>
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: '#666666',
                                fontWeight: '600'
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
                fontSize: '20px',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Today's Team Schedule
              </h3>
              {todayScheduleData.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: '#999999',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {t.noOneScheduledToday}
                </div>
              ) : (
                <div style={{ border: '2px solid #000000', borderRadius: '0px', overflow: 'hidden' }}>
                  {todayScheduleData.map((schedule: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: '16px',
                        borderBottom: index < todayScheduleData.length - 1 ? '2px solid #E5E5E5' : 'none'
                      }}
                    >
                      <div style={{
                        fontWeight: '700',
                        color: '#000000',
                        marginBottom: '4px',
                        fontSize: '15px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {schedule.core_employees?.display_name || schedule.core_employees?.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#666666',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontWeight: '700' }}>
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
                fontSize: '20px',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t.timesheet}
              </h3>

              {timesheetData.days && timesheetData.days.length > 0 ? (
                <div>
                  <div style={{
                    border: '2px solid #000000',
                    borderRadius: '0px',
                    overflow: 'hidden',
                    marginBottom: '16px'
                  }}>
                    {timesheetData.days.map((day: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderBottom: idx < timesheetData.days.length - 1 ? '2px solid #E5E5E5' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{
                            fontWeight: '700',
                            color: '#000000',
                            fontSize: '15px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {day.day_name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#999999',
                            fontWeight: '500',
                            marginTop: '2px'
                          }}>
                            {day.date}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontWeight: '700',
                            color: '#000000',
                            fontSize: '15px'
                          }}>
                            {formatHoursMinutes(day.hours_worked)}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#666666',
                            fontWeight: '600'
                          }}>
                            {formatTime(day.clock_in)} - {formatTime(day.clock_out)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '16px',
                    background: '#000000',
                    color: '#FFFFFF',
                    border: '2px solid #000000',
                    borderRadius: '0px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '14px'
                    }}>
                      {t.total}
                    </span>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '700'
                    }}>
                      {formatHoursMinutes(timesheetData.totalHours)}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: '#999999',
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
                fontSize: '20px',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t.employeeInfo}
              </h3>

              <div style={{ border: '2px solid #000000', borderRadius: '0px', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '2px solid #E5E5E5' }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#666666',
                    marginBottom: '4px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {t.name}
                  </div>
                  <div style={{
                    fontWeight: '700',
                    color: '#000000',
                    fontSize: '15px'
                  }}>
                    {employee?.display_name || employee?.name}
                  </div>
                </div>

                <div style={{ padding: '16px', borderBottom: '2px solid #E5E5E5' }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#666666',
                    marginBottom: '4px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    PIN
                  </div>
                  <div style={{
                    fontWeight: '700',
                    color: '#000000',
                    fontSize: '15px'
                  }}>
                    {employee?.pin || '****'}
                  </div>
                </div>

                {employee?.hourly_rate && (
                  <div style={{ padding: '16px', borderBottom: '2px solid #E5E5E5' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#666666',
                      marginBottom: '4px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {t.hourlyRate}
                    </div>
                    <div style={{
                      fontWeight: '700',
                      color: '#000000',
                      fontSize: '15px'
                    }}>
                      ${employee.hourly_rate}/hr
                    </div>
                  </div>
                )}

                {employee?.phone_number && (
                  <div style={{ padding: '16px', borderBottom: '2px solid #E5E5E5' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#666666',
                      marginBottom: '4px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {t.phoneNumber}
                    </div>
                    <a
                      href={`tel:${employee.phone_number}`}
                      style={{
                        fontWeight: '700',
                        color: '#000000',
                        fontSize: '15px',
                        textDecoration: 'none'
                      }}
                    >
                      {employee.phone_number}
                    </a>
                  </div>
                )}

                {employee?.email && (
                  <div style={{ padding: '16px' }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#666666',
                      marginBottom: '4px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {t.email}
                    </div>
                    <a
                      href={`mailto:${employee.email}`}
                      style={{
                        fontWeight: '700',
                        color: '#000000',
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
  )
}
