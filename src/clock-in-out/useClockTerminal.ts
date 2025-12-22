import { useState, useEffect } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { supabase } from '../shared/supabase-client'
import { startSyncManager, onSyncEvent, getSyncStatus, type SyncEvent } from './syncManager'

/**
 * useClockTerminal Hook
 *
 * Manages all the terminal-level concerns:
 * - Time display updates
 * - Realtime subscription for time_entries
 * - Sync manager for offline queue
 * - Recent events loading
 * - Network monitoring
 */

// Comprehensive logging utility with timestamp and context (DEV mode only)
const log = (context: string, message: string, data?: any) => {
  if (!import.meta.env.DEV) return
  const timestamp = new Date().toISOString()
  console.log(`[ClockInOut] ${timestamp} - ${context}: ${message}`, data || '')
}

const logError = (context: string, error: any, details?: any) => {
  if (!import.meta.env.DEV) return
  const timestamp = new Date().toISOString()
  console.error(`[ClockInOut Error] ${timestamp} - ${context}:`, {
    error: error?.message || error,
    stack: error?.stack,
    details,
    userAgent: navigator.userAgent,
    online: navigator.onLine
  })
}

const logSuccess = (context: string, message: string, data?: any) => {
  if (!import.meta.env.DEV) return
  const timestamp = new Date().toISOString()
  console.log(`%c[ClockInOut Success] ${timestamp} - ${context}: ${message}`, 'color: green; font-weight: bold', data || '')
}

const logWarning = (context: string, message: string, data?: any) => {
  if (!import.meta.env.DEV) return
  const timestamp = new Date().toISOString()
  console.warn(`[ClockInOut Warning] ${timestamp} - ${context}: ${message}`, data || '')
}

export interface ClockTerminalState {
  currentTime: string
  currentDate: string
  recentEvents: any[]
  realtimeStatus: 'connected' | 'disconnected' | 'error'
  syncStatus: SyncEvent
  criticalError: string | null
  activityListRef: any
  loadRecentEvents: () => Promise<void>
}

export function useClockTerminal(): ClockTerminalState {
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [syncStatus, setSyncStatus] = useState<SyncEvent>({ status: 'idle', queueCount: 0 })
  const [criticalError, setCriticalError] = useState<string | null>(null)

  // AutoAnimate ref for smooth Recent Activity transitions
  const [activityListRef] = useAutoAnimate()

  const loadRecentEvents = async () => {
    const startTime = performance.now()
    log('API', '📥 Loading recent events from Postgres...')

    try {
      // Calculate date range (last 14 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 14)

      // Format dates as YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split('T')[0]

      // Timeout protection: 15 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
      )

      const dataPromise = supabase
        .rpc('get_recent_activity', {
          p_start_date: formatDate(startDate),
          p_end_date: formatDate(endDate),
          p_employee_id: null, // null = all employees
          p_limit: 10
        })

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any

      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }

      const duration = Math.round(performance.now() - startTime)
      logSuccess('API', `✅ Recent events loaded in ${duration}ms`, {
        eventCount: data?.length || 0,
        duration: `${duration}ms`
      })

      // Format events for display
      const formattedEvents = (data || []).map((event: any) => {
        // Extract first name only
        const firstName = event.employee_name.split(' ')[0]

        // Format timestamp to 12-hour time
        const timestamp = new Date(event.event_timestamp_et)
        const hours = timestamp.getHours()
        const minutes = timestamp.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours % 12 || 12
        const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`

        return {
          id: event.id,
          employeeId: event.employee_id,
          name: firstName,
          time: formattedTime,
          action: event.event_type === 'in' ? 'Clock In' : 'Clock Out'
        }
      })

      setRecentEvents(formattedEvents)
      log('State', 'Recent events state updated', { count: formattedEvents.length })
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime)
      logError('API', `Failed to load recent events after ${duration}ms`, error)

      // CRITICAL: Show error to user for debugging
      console.error('🚨🚨🚨 CRITICAL ERROR - Recent events failed to load:', {
        errorMessage: error?.message || String(error),
        errorStack: error?.stack,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })

      // Show visible error on page
      setCriticalError(`API Error: ${error?.message || String(error)}`)

      // Graceful degradation: Keep showing old events, don't crash
    }
  }

  useEffect(() => {
    log('Lifecycle', '🚀 Component mounted - Clock Terminal initializing')
    log('Environment', 'User agent', { userAgent: navigator.userAgent })
    log('Environment', 'Network status', { online: navigator.onLine })
    log('Environment', 'Timezone', { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })

    // Set page title for clock terminal
    document.title = 'Bagel Crust - Clock In/Out'

    // NUCLEAR FIX: Paint body to eliminate white bar in safe area
    const originalBgColor = document.body.style.backgroundColor
    const originalOverflow = document.body.style.overflow
    document.body.style.backgroundColor = '#f5f3ff' // Tailwind purple-50
    document.body.style.overflow = 'hidden'

    // OFFLINE QUEUE: Initialize sync manager
    log('Offline Queue', '🔄 Starting sync manager...')
    startSyncManager()

    // Subscribe to sync events
    const unsubscribe = onSyncEvent((event) => {
      logSuccess('Sync Event', `Sync status: ${event.status}`, event)
      setSyncStatus(event)
    })

    // Get initial sync status
    getSyncStatus().then(status => {
      log('Offline Queue', 'Initial sync status', status)
      setSyncStatus(status)
    }).catch(error => {
      logError('Offline Queue', 'Failed to get initial sync status', error)
    })

    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/New_York'
      }))
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York'
      }))
    }

    updateTime()
    log('Clock', 'Clock display initialized', { time: currentTime, date: currentDate })
    const timer = setInterval(updateTime, 1000)

    // Initial load with error handling
    log('Data', 'Loading initial recent events...')
    loadRecentEvents()

    // REAL-TIME SUBSCRIPTION: Listen for new clock in/out events
    // When someone clocks in or out, instantly update the recent activity feed
    log('Realtime', '📡 Setting up Realtime subscription for time_entries')
    const subscription = supabase
      .channel('time_entries_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'employees',
          table: 'time_entries'
        },
        (payload) => {
          try {
            logSuccess('Realtime', '🔔 New time entry received via Realtime', payload)
            // Reload recent events when new entry is inserted
            loadRecentEvents()
          } catch (err) {
            logError('Realtime', 'Handler error', err)
          }
        }
      )
      .subscribe((status) => {
        log('Realtime', `Subscription status changed: ${status}`)
        if (status === 'SUBSCRIBED') {
          logSuccess('Realtime', '✅ Realtime connected successfully')
          setRealtimeStatus('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          logError('Realtime', 'Subscription failed', { status })
          setRealtimeStatus('error')
          // Fallback: refresh activity manually since realtime is down
          loadRecentEvents()
        } else {
          log('Realtime', `Status: ${status}`)
          setRealtimeStatus('disconnected')
        }
      })

    // Health check: Verify realtime connection every 30 seconds
    log('Health Check', '🏥 Starting health monitoring (30s interval)')
    const healthCheck = setInterval(() => {
      log('Health Check', '💓 Checking system health', {
        realtimeStatus,
        online: navigator.onLine,
        recentEventsCount: recentEvents.length
      })
      if (realtimeStatus === 'error') {
        logError('Health Check', 'Realtime connection is in error state')
      }
    }, 30000)

    // Network status monitoring
    const handleOnline = () => logSuccess('Network', '🌐 Network back online')
    const handleOffline = () => logWarning('Network', '📵 Network went offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      log('Lifecycle', '🛑 Component unmounting - cleaning up')
      clearInterval(timer)
      clearInterval(healthCheck)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      log('Realtime', 'Unsubscribing from Realtime channel')
      subscription.unsubscribe()
      log('Offline Queue', 'Unsubscribing from sync events')
      unsubscribe()
      // Restore body styles for other pages
      document.body.style.backgroundColor = originalBgColor
      document.body.style.overflow = originalOverflow
    }
  }, []) // Empty dependency array - only run once on mount

  return {
    currentTime,
    currentDate,
    recentEvents,
    realtimeStatus,
    syncStatus,
    criticalError,
    activityListRef,
    loadRecentEvents
  }
}

// Re-export logging utilities for use in component
export { log, logError, logSuccess, logWarning }
