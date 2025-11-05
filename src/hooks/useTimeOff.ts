import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Time off request interface
 *
 * TODO: Replace with actual API calls when backend is ready
 * Currently using local state for demo purposes
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
 *
 * Note: Currently stores requests in local state
 * Replace with actual API calls when backend endpoint exists
 */
export function useTimeOff(employeeId: string | undefined) {
  const queryClient = useQueryClient()

  // Temporary: Use local state (will be replaced with API)
  const [localRequests, setLocalRequests] = useState<TimeOffRequest[]>([])

  // Fetch time-off requests
  const { data: requests = [] } = useQuery({
    queryKey: ['time-off', employeeId],
    queryFn: async () => {
      if (!employeeId) return []

      // TODO: Replace with actual API call
      // const { data } = await supabase
      //   .from('time_off_requests')
      //   .select('*')
      //   .eq('employee_id', employeeId)
      //   .order('created_at', { ascending: false })

      // For now, return local state
      return localRequests.filter(r => r.employee_id === employeeId)
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
      // TODO: Replace with actual API call
      // const { data } = await supabase
      //   .from('time_off_requests')
      //   .insert(params)
      //   .select()
      //   .single()

      // For now, create local object
      const newRequest: TimeOffRequest = {
        id: Date.now(),
        employee_id: params.employee_id,
        start_date: params.start_date,
        end_date: params.end_date,
        reason: params.reason,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      // Update local state
      setLocalRequests(prev => [newRequest, ...prev])

      return newRequest
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
