import { useQuery } from '@tanstack/react-query'
import { supabase } from '../shared/supabase-client'

/**
 * Calendar event interface
 * Maps to calendar_events table via fetch_calendar_events RPC
 */
export interface CalendarEvent {
  id: string
  event_date: string
  day_of_week: string | null
  school_semester: string | null
  semester_week_number: number | null
  academic_notes: string | null
  holiday_notes: string | null
  local_event_notes: string | null
  game_notes: string | null
  operation_level: 'closed' | 'limited' | 'full' | null
  is_busy: boolean
}

/**
 * Hook to fetch calendar events
 * Uses database RPC: fetch_calendar_events
 *
 * Returns events with any notes (academic, holiday, local, game)
 * within the specified date range.
 */
export function useGetCalendarEvents(startDate?: string, endDate?: string) {
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['calendar-events', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('employees')
        .rpc('fetch_calendar_events', {
          start_date: startDate || new Date().toISOString().split('T')[0],
          end_date: endDate
        })

      if (error) {
        console.error('CALENDAR: fetch_calendar_events failed', error)
        throw error
      }

      return (data || []) as CalendarEvent[]
    },
    staleTime: 10 * 60 * 1000 // 10 minutes - calendar data doesn't change often
  })

  return {
    events,
    isLoading,
    error
  }
}
