import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase/supabase'

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
 */
export function useTimeOff(employeeId: string | undefined) {
  const queryClient = useQueryClient()

  // Fetch time-off requests from Edge Function
  const { data: requests = [] } = useQuery({
    queryKey: ['time-off', employeeId],
    queryFn: async () => {
      if (!employeeId) return []

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
        throw new Error(error.error || 'Failed to fetch time-off requests')
      }

      const { timeOffs } = await response.json()

      // Map database fields to interface format
      return (timeOffs || []).map((notice: any) => ({
        id: notice.id,
        employee_id: notice.employee_id,
        start_date: notice.start_time.split('T')[0], // Convert timestamp to date
        end_date: notice.end_time.split('T')[0],     // Convert timestamp to date
        reason: notice.reason || '',
        status: notice.status as 'pending' | 'approved' | 'denied',
        created_at: notice.requested_date || notice.start_time
      }))
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
        throw new Error(error.error || 'Failed to submit time-off request')
      }

      const { timeOff } = await response.json()

      // Map response to interface format
      return {
        id: timeOff.id,
        employee_id: timeOff.employee_id,
        start_date: timeOff.start_time.split('T')[0],
        end_date: timeOff.end_time.split('T')[0],
        reason: timeOff.reason || '',
        status: timeOff.status as 'pending' | 'approved' | 'denied',
        created_at: timeOff.requested_date || timeOff.start_time
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
