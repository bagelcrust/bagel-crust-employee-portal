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
 * Connected to Supabase time_off_notices table
 */
export function useTimeOff(employeeId: string | undefined) {
  const queryClient = useQueryClient()

  // Fetch time-off requests from Supabase
  const { data: requests = [] } = useQuery({
    queryKey: ['time-off', employeeId],
    queryFn: async () => {
      if (!employeeId) return []

      const { data, error } = await supabase
        .from('time_off_notices')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_time', { ascending: false })

      if (error) throw error

      // Map database fields to interface format
      return (data || []).map(notice => ({
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

  // Submit time-off request mutation
  const submitMutation = useMutation({
    mutationFn: async (params: {
      employee_id: string
      start_date: string
      end_date: string
      reason: string
    }) => {
      // Convert date strings to timestamps (start of day for start, end of day for end)
      const startTime = new Date(params.start_date)
      startTime.setHours(5, 0, 0, 0) // 12:00 AM Eastern = 5:00 AM UTC (EST)

      const endTime = new Date(params.end_date)
      endTime.setHours(4, 59, 59, 999) // 11:59:59 PM Eastern = 4:59:59 AM UTC next day

      const { data, error } = await supabase
        .from('time_off_notices')
        .insert({
          employee_id: params.employee_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          reason: params.reason || null,
          status: 'pending',
          requested_date: new Date().toISOString(),
          requested_via: 'app',
          source_text: null
        })
        .select()
        .single()

      if (error) throw error

      // Map response to interface format
      return {
        id: data.id,
        employee_id: data.employee_id,
        start_date: data.start_time.split('T')[0],
        end_date: data.end_time.split('T')[0],
        reason: data.reason || '',
        status: data.status as 'pending' | 'approved' | 'denied',
        created_at: data.requested_date || data.start_time
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
