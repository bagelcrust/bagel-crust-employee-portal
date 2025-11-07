export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  employees: {
    Tables: {
      availability: {
        Row: {
          day_of_week: Database["employees"]["Enums"]["day_of_week_enum"]
          effective_start_date: string
          employee_id: string
          end_time: string
          id: number
          start_time: string
        }
        Insert: {
          day_of_week: Database["employees"]["Enums"]["day_of_week_enum"]
          effective_start_date: string
          employee_id: string
          end_time: string
          id?: number
          start_time: string
        }
        Update: {
          day_of_week?: Database["employees"]["Enums"]["day_of_week_enum"]
          effective_start_date?: string
          employee_id?: string
          end_time?: string
          id?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean | null
          email: string | null
          employee_code: string
          first_name: string
          hire_date: string | null
          id: string
          last_name: string | null
          location: string | null
          pay_schedule: string | null
          phone_number: string | null
          pin: string | null
          preferred_language: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          email?: string | null
          employee_code: string
          first_name: string
          hire_date?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          pay_schedule?: string | null
          phone_number?: string | null
          pin?: string | null
          preferred_language?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          email?: string | null
          employee_code?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          pay_schedule?: string | null
          phone_number?: string | null
          pin?: string | null
          preferred_language?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      draft_shifts: {
        Row: {
          created_at: string | null
          employee_id: string | null
          end_time: string
          id: number
          location: string | null
          role: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          end_time: string
          id?: number
          location?: string | null
          role?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          end_time?: string
          id?: number
          location?: string | null
          role?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draft_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_rates: {
        Row: {
          effective_date: string
          employee_id: string
          id: number
          pay_type: string
          rate: number
        }
        Insert: {
          effective_date: string
          employee_id: string
          id?: number
          pay_type?: string
          rate: number
        }
        Update: {
          effective_date?: string
          employee_id?: string
          id?: number
          pay_type?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "pay_rates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      published_shifts: {
        Row: {
          employee_id: string | null
          end_time: string
          id: number
          location: string | null
          published_at: string | null
          role: string | null
          start_time: string
          week_end: string
          week_start: string
        }
        Insert: {
          employee_id?: string | null
          end_time: string
          id?: number
          location?: string | null
          published_at?: string | null
          role?: string | null
          start_time: string
          week_end: string
          week_start: string
        }
        Update: {
          employee_id?: string | null
          end_time?: string
          id?: number
          location?: string | null
          published_at?: string | null
          role?: string | null
          start_time?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          employee_id: string
          end_time: string
          id: number
          location: string | null
          role: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          employee_id: string
          end_time: string
          id?: number
          location?: string | null
          role?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          employee_id?: string
          end_time?: string
          id?: number
          location?: string | null
          role?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          employee_id: string
          event_timestamp: string
          event_type: string
          id: number
        }
        Insert: {
          employee_id: string
          event_timestamp: string
          event_type: string
          id?: number
        }
        Update: {
          employee_id?: string
          event_timestamp?: string
          event_type?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_notices: {
        Row: {
          employee_id: string
          end_time: string
          id: number
          reason: string | null
          start_time: string
          status: string
        }
        Insert: {
          employee_id: string
          end_time: string
          id?: number
          reason?: string | null
          start_time: string
          status?: string
        }
        Update: {
          employee_id?: string
          end_time?: string
          id?: number
          reason?: string | null
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_notices_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // ===== EXISTING RPC FUNCTIONS (OPTIMIZED) =====
      calculate_all_employee_hours: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_published_only?: boolean
        }
        Returns: Array<{
          employee_id: string
          total_hours: number
        }>
      }
      clock_in_out: {
        Args: { p_employee_id: string }
        Returns: {
          id: number
          employee_id: string
          event_type: string
          event_timestamp: string
        }
      }
      find_shift_conflicts: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: Array<{
          shift_id: number
          employee_id: string
          employee_name: string
          shift_date: string
          shift_start: string
          shift_end: string
          time_off_reason: string
        }>
      }
      get_currently_working: {
        Args: never
        Returns: Array<{
          id: string
          first_name: string
          last_name: string
          role: string
          location: string
          clock_in_time: string
        }>
      }
      is_manager_or_owner: { Args: never; Returns: boolean }

      // ===== TIMEZONE HELPER FUNCTIONS =====
      et_now: { Args: never; Returns: string }
      et_today: { Args: never; Returns: string }
      et_start_of_day: { Args: { p_date: string }; Returns: string }
      et_end_of_day: { Args: { p_date: string }; Returns: string }
      et_start_of_week: { Args: { p_date: string }; Returns: string }
      et_end_of_week: { Args: { p_date: string }; Returns: string }
      format_et: { Args: { p_timestamp: string }; Returns: string }
      format_et_short: { Args: { p_timestamp: string }; Returns: string }
      get_et_offset: { Args: { p_timestamp: string }; Returns: string }
      is_dst: { Args: { p_timestamp: string }; Returns: boolean }

      // ===== TIMEZONE-AWARE QUERY FUNCTIONS =====
      get_shifts_et: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_include_drafts?: boolean
        }
        Returns: Array<{
          id: number
          employee_id: string
          employee_name: string
          start_time: string
          end_time: string
          start_time_et: string
          end_time_et: string
          location: string
          role: string
          status: string
          duration_hours: number
        }>
      }
      get_time_entries_et: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_employee_id?: string
        }
        Returns: Array<{
          id: number
          employee_id: string
          employee_name: string
          event_type: string
          event_timestamp: string
          event_time_et: string
          event_date_et: string
        }>
      }
      get_timeoffs_et: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: Array<{
          id: number
          employee_id: string
          employee_name: string
          start_time: string
          end_time: string
          start_time_et: string
          end_time_et: string
          reason: string
          status: string
        }>
      }
      get_today_schedule_et: {
        Args: never
        Returns: Array<{
          id: number
          employee_id: string
          employee_name: string
          start_time: string
          end_time: string
          start_time_et: string
          end_time_et: string
          location: string
          role: string
          status: string
        }>
      }
      get_week_schedule_et: {
        Args: { p_include_drafts?: boolean }
        Returns: Array<{
          id: number
          employee_id: string
          employee_name: string
          start_time: string
          end_time: string
          day_of_week: string
          start_time_et: string
          end_time_et: string
          location: string
          role: string
          status: string
        }>
      }
      calculate_hours_worked_et: {
        Args: {
          p_employee_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: Array<{
          employee_id: string
          employee_name: string
          total_hours: number
          shifts_worked: number
          clock_in_time: string
          clock_out_time: string
          clock_in_et: string
          clock_out_et: string
          hours_worked: number
        }>
      }
      get_timezone_info: {
        Args: never
        Returns: Array<{
          current_utc: string
          current_et: string
          current_et_formatted: string
          timezone_offset: string
          is_dst: boolean
          timezone_name: string
        }>
      }
    }
    Enums: {
      day_of_week_enum:
        | "sunday"
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  employees: {
    Enums: {
      day_of_week_enum: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
    },
  },
} as const
