import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../shared/supabase-client'
import { logData, assertShape, logError, logApiCall } from '../shared/debug-utils'

/**
 * Time off request interface
 * Maps to time_off_notices table in Supabase
 */
export interface TimeOffRequest {
  id: number
  employee_id: string
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  created_at: string
}

/**
 * Hook to manage time-off requests
 * Connected to Supabase time-off Edge Function
 *
 * CRITICAL: ALL date/time logic is handled by the Edge Function
 * to avoid browser timezone bugs. We just pass date strings (YYYY-MM-DD).
 *
 * Naming matches Postgres function: fetch_my_time_off, submit_my_time_off
 */
export function useGetTimeOff(employeeId: string | undefined) {
  const queryClient = useQueryClient()

  // Fetch time-off requests from Edge Function
  const { data: requests = [] } = useQuery({
    queryKey: ['time-off', employeeId],
    queryFn: async () => {
      if (!employeeId) return []

      const finishLog = logApiCall('TIME_OFF', 'getForEmployee', { employeeId: employeeId.substring(0, 8) + '...' })

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-off`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              operation: 'getForEmployee',
              employeeId
            })
          }
        )

        if (!response.ok) {
          const error = await response.json()
          logError('TIME_OFF', 'Edge function returned error', error)
          throw new Error(error.error || 'Failed to fetch time-off requests')
        }

        const { timeOffs } = await response.json()
        finishLog?.()

        logData('TIME_OFF', 'Edge function returned timeOffs', timeOffs, ['id', 'employee_id', 'start_time', 'end_time', 'status'])

      // Helper: Convert UTC timestamp to Eastern Time date string (YYYY-MM-DD)
      const utcToEasternDate = (utcTimestamp: string): string => {
        const date = new Date(utcTimestamp)
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
        const parts = formatter.formatToParts(date)
        const year = parts.find(p => p.type === 'year')?.value
        const month = parts.find(p => p.type === 'month')?.value
        const day = parts.find(p => p.type === 'day')?.value
        return `${year}-${month}-${day}`
      }

        // Map database fields to interface format
        const mapped = (timeOffs || []).map((notice: any) => ({
          id: notice.id,
          employee_id: notice.employee_id,
          start_date: utcToEasternDate(notice.start_time), // Convert UTC to ET date
          end_date: utcToEasternDate(notice.end_time),     // Convert UTC to ET date
          reason: notice.reason || '',
          status: notice.status as 'pending' | 'approved' | 'denied',
          created_at: notice.requested_date || notice.start_time
        }))

        logData('TIME_OFF', 'Mapped to interface format', mapped, ['id', 'start_date', 'end_date', 'status'])
        if (mapped.length > 0) {
          assertShape('TIME_OFF', mapped[0], ['id', 'employee_id', 'start_date', 'end_date', 'status'], 'time-off request')
        }

        return mapped
      } catch (error) {
        logError('TIME_OFF', 'Failed to fetch time-off requests', error, { employeeId })
        throw error
      }
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000
  })

  // Submit time-off request via Edge Function
  const submitMutation = useMutation({
    mutationFn: async (params: {
      employee_id: string
      start_date: string
      end_date: string
      reason: string
    }) => {
      const finishLog = logApiCall('TIME_OFF', 'request', {
        employeeId: params.employee_id.substring(0, 8) + '...',
        startDate: params.start_date,
        endDate: params.end_date
      })

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        // Call Edge Function - it handles all timezone logic server-side
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-off`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              operation: 'request',
              employeeId: params.employee_id,
              startDate: params.start_date,  // Just pass YYYY-MM-DD string
              endDate: params.end_date,      // Edge Function handles timezone conversion
              reason: params.reason
            })
          }
        )

        if (!response.ok) {
          const error = await response.json()
          logError('TIME_OFF', 'Submit failed', error, { params })
          throw new Error(error.error || 'Failed to submit time-off request')
        }

        const { timeOff } = await response.json()
        finishLog?.()

        logData('TIME_OFF', 'Submit response', timeOff, ['id', 'employee_id', 'start_time', 'end_time', 'status'])

        // Map response to interface format
        const mapped = {
          id: timeOff.id,
          employee_id: timeOff.employee_id,
          start_date: timeOff.start_time.split('T')[0],
          end_date: timeOff.end_time.split('T')[0],
          reason: timeOff.reason || '',
          status: timeOff.status as 'pending' | 'approved' | 'denied',
          created_at: timeOff.requested_date || timeOff.start_time
        }

        assertShape('TIME_OFF', mapped, ['id', 'employee_id', 'start_date', 'end_date', 'status'], 'submitted time-off')
        return mapped
      } catch (error) {
        logError('TIME_OFF', 'Submit mutation failed', error, { params })
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['time-off', employeeId] })
    }
  })

  return {
    requests,
    submitRequest: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error
  }
}
