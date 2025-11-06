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
      const employee = await getEmployeeByPin(pin)

      if (!employee) {
        throw new Error('Invalid PIN')
      }

      return employee
    },
    onSuccess: (employee) => {
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
