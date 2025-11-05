import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { employeeApi } from '../supabase/supabase'
import type { Employee } from '../supabase/supabase'

/**
 * Hook for employee PIN-based authentication
 *
 * Handles login, logout, and authentication state
 */
export function useEmployeeAuth() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Login mutation with PIN
  const loginMutation = useMutation({
    mutationFn: async (pin: string) => {
      // TEMPORARY: Allow login with 0000 for testing
      if (pin === '0000') {
        return {
          id: 'test-employee',
          employee_code: 'TEST001',
          first_name: 'Test',
          last_name: 'User',
          display_name: 'Test User',
          pin: '0000',
          hourly_rate: 15.00,
          phone_number: '555-0123',
          email: 'test@bagelcrust.com',
          hire_date: null,
          active: true,
          location: 'Main Street',
          role: 'Employee',
          pay_schedule: 'weekly',
          user_id: 'test-user-id'
        } as Employee
      }

      const employee = await employeeApi.getByPin(pin)

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
