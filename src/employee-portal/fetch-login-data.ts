import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '../shared/supabase-client'
import type { Employee } from '../shared/supabase-client'

/**
 * Hook for employee PIN-based authentication
 *
 * Handles login, logout, and authentication state
 * UPDATED: Uses Edge Function for server-side authentication
 *
 * Naming matches Postgres function: get_employee_by_pin
 */
export function useGetEmployeeByPin() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Login mutation with PIN (uses Postgres RPC)
  const loginMutation = useMutation({
    mutationFn: async (pin: string) => {
      console.log('[AUTH] Starting PIN verification...', new Date().toISOString())
      const start = performance.now()

      const { data: employee, error } = await supabase
        .rpc('get_employee_by_pin', {
          p_pin: pin
        })

      console.log(`[AUTH] PIN verification took ${(performance.now() - start).toFixed(0)}ms`)

      if (error) {
        console.error('[AUTH] Database error:', error)
        throw new Error(`Failed to verify PIN: ${error.message}`)
      }

      if (!employee) {
        throw new Error('Invalid PIN')
      }

      return employee
    },
    onSuccess: (employee) => {
      console.log('[AUTH] Login successful, setting employee state')
      setEmployee(employee)
      setIsLoggedIn(true)
    }
  })

  const logout = () => {
    setEmployee(null)
    setIsLoggedIn(false)
  }

  return {
    employee,
    isLoggedIn,
    login: loginMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message || null
  }
}
