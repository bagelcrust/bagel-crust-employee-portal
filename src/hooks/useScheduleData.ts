import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase/supabase'

/**
 * SCHEDULE DATA HOOK
 *
 * Fetches all data needed for the schedule builder:
 * - Employees
 * - Employee availability (recurring weekly)
 * - Time-off notices (for selected week)
 */

export interface Availability {
  id: number
  employee_id: string
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  start_time: string
  end_time: string
  effective_start_date: string
}

export interface TimeOff {
  id: number
  employee_id: string
  start_time: string
  end_time: string
  reason: string | null
  status: string
  requested_date: string | null
  requested_via: string | null
  source_text: string | null
}

export interface Employee {
  id: string
  employee_code: string
  first_name: string
  last_name: string | null
  active: boolean
  location: string
  role: string
}

export interface ScheduleData {
  employees: Employee[]
  availabilities: Availability[]
  timeOffs: TimeOff[]
}

export function useScheduleData(weekStart: Date, weekEnd: Date) {
  return useQuery({
    queryKey: ['scheduleData', weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async (): Promise<ScheduleData> => {
      // Fetch employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, employee_code, first_name, last_name, active, location, role')
        .eq('active', true)
        .order('first_name', { ascending: true })

      if (empError) throw empError

      // Fetch all availability (not filtered by date, as it's recurring)
      const { data: availabilities, error: availError } = await supabase
        .from('availability')
        .select('*')

      if (availError) throw availError

      // Fetch time-offs that overlap with the selected week
      const { data: timeOffs, error: timeOffError } = await supabase
        .from('time_off_notices')
        .select('*')
        .gte('end_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())

      if (timeOffError) throw timeOffError

      return {
        employees: employees || [],
        availabilities: availabilities || [],
        timeOffs: timeOffs || []
      }
    },
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}
