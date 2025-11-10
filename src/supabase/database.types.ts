export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  employees: {
    Tables: {
      employees: {
        Row: {
          id: string
          employee_code: string | null
          first_name: string
          last_name: string | null
          email: string | null
          hire_date: string | null
          active: boolean | null
          location: string | null
          role: string | null
          pay_schedule: string | null
          pin: string | null
          phone_number: string | null
          user_id: string | null
          preferred_language: string | null
        }
        Insert: {
          id?: string
          employee_code?: string | null
          first_name: string
          last_name?: string | null
          email?: string | null
          hire_date?: string | null
          active?: boolean | null
          location?: string | null
          role?: string | null
          pay_schedule?: string | null
          pin?: string | null
          phone_number?: string | null
          user_id?: string | null
          preferred_language?: string | null
        }
        Update: {
          id?: string
          employee_code?: string | null
          first_name?: string
          last_name?: string | null
          email?: string | null
          hire_date?: string | null
          active?: boolean | null
          location?: string | null
          role?: string | null
          pay_schedule?: string | null
          pin?: string | null
          phone_number?: string | null
          user_id?: string | null
          preferred_language?: string | null
        }
      }
      time_entries: {
        Row: {
          id: number
          employee_id: string
          event_type: string
          event_timestamp: string
        }
        Insert: {
          id?: number
          employee_id: string
          event_type: string
          event_timestamp: string
        }
        Update: {
          id?: number
          employee_id?: string
          event_type?: string
          event_timestamp?: string
        }
      }
      shifts: {
        Row: {
          id: number
          employee_id: string | null
          start_time: string
          end_time: string
          location: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          id?: number
          employee_id?: string | null
          start_time: string
          end_time: string
          location?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          employee_id?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          role?: string | null
          status?: string | null
        }
      }
      draft_shifts: {
        Row: {
          id: number
          employee_id: string | null
          start_time: string
          end_time: string
          location: string | null
          role: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          employee_id?: string | null
          start_time: string
          end_time: string
          location?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          employee_id?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      published_shifts: {
        Row: {
          id: number
          employee_id: string | null
          start_time: string
          end_time: string
          location: string | null
          role: string | null
          published_at: string | null
          week_start: string
          week_end: string
        }
        Insert: {
          id?: number
          employee_id?: string | null
          start_time: string
          end_time: string
          location?: string | null
          role?: string | null
          published_at?: string | null
          week_start: string
          week_end: string
        }
        Update: {
          id?: number
          employee_id?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          role?: string | null
          published_at?: string | null
          week_start?: string
          week_end?: string
        }
      }
      time_off_notices: {
        Row: {
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
        Insert: {
          id?: number
          employee_id: string
          start_time: string
          end_time: string
          reason?: string | null
          status?: string
          requested_date?: string | null
          requested_via?: string | null
          source_text?: string | null
        }
        Update: {
          id?: number
          employee_id?: string
          start_time?: string
          end_time?: string
          reason?: string | null
          status?: string
          requested_date?: string | null
          requested_via?: string | null
          source_text?: string | null
        }
      }
      pay_rates: {
        Row: {
          id: number
          employee_id: string
          rate: number
          pay_type: string
          effective_date: string
        }
        Insert: {
          id?: number
          employee_id: string
          rate: number
          pay_type?: string
          effective_date: string
        }
        Update: {
          id?: number
          employee_id?: string
          rate?: number
          pay_type?: string
          effective_date?: string
        }
      }
      availability: {
        Row: {
          id: number
          employee_id: string
          day_of_week: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
          start_time: string
          end_time: string
          effective_start_date: string
        }
        Insert: {
          id?: number
          employee_id: string
          day_of_week: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
          start_time: string
          end_time: string
          effective_start_date: string
        }
        Update: {
          id?: number
          employee_id?: string
          day_of_week?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
          start_time?: string
          end_time?: string
          effective_start_date?: string
        }
      }
      payroll_records: {
        Row: {
          id: number
          employee_id: string
          pay_period_start: string
          pay_period_end: string
          total_hours: number
          hourly_rate: number
          gross_pay: number
          deductions: number | null
          net_pay: number
          payment_date: string | null
          payment_method: string | null
          check_number: string | null
          status: 'pending' | 'paid' | 'cancelled'
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          employee_id: string
          pay_period_start: string
          pay_period_end: string
          total_hours: number
          hourly_rate: number
          gross_pay: number
          deductions?: number | null
          net_pay: number
          payment_date?: string | null
          payment_method?: string | null
          check_number?: string | null
          status?: 'pending' | 'paid' | 'cancelled'
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          employee_id?: string
          pay_period_start?: string
          pay_period_end?: string
          total_hours?: number
          hourly_rate?: number
          gross_pay?: number
          deductions?: number | null
          net_pay?: number
          payment_date?: string | null
          payment_method?: string | null
          check_number?: string | null
          status?: 'pending' | 'paid' | 'cancelled'
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {
      clock_in_out: {
        Args: {
          p_employee_id: string
        }
        Returns: {
          id: number
          employee_id: string
          event_type: string
          event_timestamp: string
        }[]
      }
      get_time_entries_et: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_employee_id?: string
        }
        Returns: {
          id: number
          employee_id: string
          event_type: string
          event_timestamp: string
          event_time_et: string
          event_date_et: string
          employee_name: string
        }[]
      }
      get_currently_working: {
        Args: Record<string, never>
        Returns: {
          employee_id: string
          employee_name: string
          clock_in_time: string
        }[]
      }
      calculate_all_employee_hours: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_published_only: boolean
        }
        Returns: {
          employee_id: string
          total_hours: number
        }[]
      }
      detect_schedule_conflicts: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          shift_id: number
          employee_id: string
          employee_name: string
          shift_start: string
          shift_end: string
          timeoff_start: string
          timeoff_end: string
          reason: string
        }[]
      }
    }
    Enums: {}
  }
}
