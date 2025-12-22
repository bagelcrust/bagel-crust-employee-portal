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
  created_at: string
}

/**
 * Hook to manage time-off requests
 * Uses database RPC functions: fetch_my_time_off, submit_my_time_off
 *
 * CRITICAL: ALL date/time logic is handled by the database function
 * to avoid browser timezone bugs. We just pass date strings (YYYY-MM-DD).
 */
export function useGetTimeOff(employeeId: string | undefined) {
  const queryClient = useQueryClient()

  // Fetch time-off requests from database RPC
  const { data: requests = [] } = useQuery({
    queryKey: ['time-off', employeeId],
    queryFn: async () => {
      if (!employeeId) return []

      const finishLog = logApiCall('TIME_OFF', 'fetch_my_time_off', { employeeId: employeeId.substring(0, 8) + '...' })

      try {
        const { data, error } = await supabase
          .schema('employees')
          .rpc('fetch_my_time_off', {
            p_employee_id: employeeId
          })

        if (error) {
          logError('TIME_OFF', 'RPC fetch_my_time_off failed', error, { employeeId })
          throw error
        }

        finishLog?.()

        logData('TIME_OFF', 'RPC returned data', data, ['id', 'employee_id', 'start_date_et', 'end_date_et'])

        // Map database fields to interface format
        const mapped = (data || []).map((notice: any) => ({
          id: notice.id,
          employee_id: notice.employee_id,
          start_date: notice.start_date_et, // Already in Eastern Time from RPC
          end_date: notice.end_date_et,     // Already in Eastern Time from RPC
          reason: notice.reason || '',
          created_at: notice.requested_date_et || notice.start_time_et
        }))

        logData('TIME_OFF', 'Mapped to interface format', mapped, ['id', 'start_date', 'end_date', 'created_at'])
        if (mapped.length > 0) {
          assertShape('TIME_OFF', mapped[0], ['id', 'employee_id', 'start_date', 'end_date', 'reason', 'created_at'], 'time-off request')
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

  // Submit time-off request via database RPC
  const submitMutation = useMutation({
    mutationFn: async (params: {
      employee_id: string
      start_date: string
      end_date: string
      reason: string
    }) => {
      const finishLog = logApiCall('TIME_OFF', 'submit_my_time_off', {
        employeeId: params.employee_id.substring(0, 8) + '...',
        startDate: params.start_date,
        endDate: params.end_date
      })

      try {
        const { data, error } = await supabase
          .schema('employees')
          .rpc('submit_my_time_off', {
            p_employee_id: params.employee_id,
            p_start_date: params.start_date,  // Just pass YYYY-MM-DD string
            p_end_date: params.end_date,      // RPC handles timezone conversion
            p_reason: params.reason
          })

        if (error) {
          logError('TIME_OFF', 'RPC submit_my_time_off failed', error, { params })
          throw error
        }

        finishLog?.()

        logData('TIME_OFF', 'RPC submit response', data, ['id', 'employee_id', 'start_date_et', 'end_date_et'])

        // RPC returns array with single record
        const timeOff = data?.[0]
        if (!timeOff) {
          throw new Error('No data returned from submit_my_time_off')
        }

        // Map response to interface format
        const mapped = {
          id: timeOff.id,
          employee_id: timeOff.employee_id,
          start_date: timeOff.start_date_et, // Already in Eastern Time from RPC
          end_date: timeOff.end_date_et,     // Already in Eastern Time from RPC
          reason: timeOff.reason || '',
          created_at: timeOff.requested_date_et || timeOff.start_time_et
        }

        assertShape('TIME_OFF', mapped, ['id', 'employee_id', 'start_date', 'end_date', 'reason', 'created_at'], 'submitted time-off')
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
