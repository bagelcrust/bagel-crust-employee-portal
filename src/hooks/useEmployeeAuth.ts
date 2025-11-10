import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getEmployeeByPin } from '../supabase/edgeFunctions'
import type { Employee } from '../supabase/supabase'

/**
 * Hook for employee PIN-based authentication
 *
 * Handles login, logout, and authentication state
 * UPDATED: Uses Edge Function for server-side authentication
 */
export function useEmployeeAuth() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Login mutation with PIN (uses Edge Function)
  const loginMutation = useMutation({
    mutationFn: async (pin: string) => {
      console.log('[AUTH] Starting PIN verification...', new Date().toISOString())
      const start = performance.now()
      const employee = await getEmployeeByPin(pin)
      console.log(`[AUTH] PIN verification took ${(performance.now() - start).toFixed(0)}ms`)

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
