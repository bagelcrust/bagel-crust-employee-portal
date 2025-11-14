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
      availability: {
        Row: {
          id: number
          employee_id: string
          day_of_week: string
          start_time: string
          end_time: string
          effective_start_date: string
        }
        Insert: {
          id?: number
          employee_id: string
          day_of_week: string
          start_time: string
          end_time: string
          effective_start_date: string
        }
        Update: {
          id?: number
          employee_id?: string
          day_of_week?: string
          start_time?: string
          end_time?: string
          effective_start_date?: string
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
      employees: {
        Row: {
          id: string
          employee_code: string
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
          employee_code: string
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
          employee_code?: string
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
      pay_rates: {
        Row: {
          id: number
          employee_id: string
          rate: number
          pay_type: string
          effective_date: string
          payment_method: string | null
          pay_schedule: string | null
          tax_classification: string | null
        }
        Insert: {
          id?: number
          employee_id: string
          rate: number
          pay_type?: string
          effective_date: string
          payment_method?: string | null
          pay_schedule?: string | null
          tax_classification?: string | null
        }
        Update: {
          id?: number
          employee_id?: string
          rate?: number
          pay_type?: string
          effective_date?: string
          payment_method?: string | null
          pay_schedule?: string | null
          tax_classification?: string | null
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
          status: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
          pay_rate_id: number | null
          payment_type: string
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
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          pay_rate_id?: number | null
          payment_type?: string
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
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          pay_rate_id?: number | null
          payment_type?: string
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
          shift_status: string
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
          shift_status?: string
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
          shift_status?: string
        }
      }
      shifts: {
        Row: {
          id: number
          employee_id: string
          start_time: string
          end_time: string
          location: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          id?: number
          employee_id: string
          start_time: string
          end_time: string
          location?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          employee_id?: string
          start_time?: string
          end_time?: string
          location?: string | null
          role?: string | null
          status?: string | null
        }
      }
      time_entries: {
        Row: {
          id: number
          employee_id: string
          event_type: string
          event_timestamp: string
          manually_edited: boolean
        }
        Insert: {
          id?: number
          employee_id: string
          event_type: string
          event_timestamp: string
          manually_edited?: boolean
        }
        Update: {
          id?: number
          employee_id?: string
          event_type?: string
          event_timestamp?: string
          manually_edited?: boolean
        }
      }
      time_off_notices: {
        Row: {
          id: number
          employee_id: string
          start_time: string | null
          end_time: string | null
          reason: string | null
          status: string
          requested_date: string | null
          requested_via: string | null
          source_text: string | null
          all_day: boolean | null
          start_date: string | null
          end_date: string | null
          start_time_only: string | null
          end_time_only: string | null
        }
        Insert: {
          id?: number
          employee_id: string
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
          status?: string
          requested_date?: string | null
          requested_via?: string | null
          source_text?: string | null
          all_day?: boolean | null
          start_date?: string | null
          end_date?: string | null
          start_time_only?: string | null
          end_time_only?: string | null
        }
        Update: {
          id?: number
          employee_id?: string
          start_time?: string | null
          end_time?: string | null
          reason?: string | null
          status?: string
          requested_date?: string | null
          requested_via?: string | null
          source_text?: string | null
          all_day?: boolean | null
          start_date?: string | null
          end_date?: string | null
          start_time_only?: string | null
          end_time_only?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
