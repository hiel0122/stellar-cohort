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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checklist_items: {
        Row: {
          id: string
          label: string
          sort_order: number
          template_id: string
        }
        Insert: {
          id?: string
          label: string
          sort_order?: number
          template_id: string
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          course_id: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_checklist: {
        Row: {
          assignee: string | null
          cohort_id: string
          done_at: string | null
          id: string
          is_done: boolean
          item_id: string
        }
        Insert: {
          assignee?: string | null
          cohort_id: string
          done_at?: string | null
          id?: string
          is_done?: boolean
          item_id: string
        }
        Update: {
          assignee?: string | null
          cohort_id?: string
          done_at?: string | null
          id?: string
          is_done?: boolean
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_checklist_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_checklist_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_kpis"
            referencedColumns: ["cohort_id"]
          },
          {
            foreignKeyName: "cohort_checklist_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          cohort_no: number
          course_id: string
          created_at: string
          end_date: string | null
          id: string
          instructor_id: string
          price: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["cohort_status"]
          youtube_denominator_est: number | null
          youtube_last_error: string | null
          youtube_last_synced_at: string | null
          youtube_live_url: string | null
          youtube_max_est: number | null
          youtube_min_est: number | null
          youtube_sampling_enabled: boolean
          youtube_stream_status: string | null
          youtube_video_id: string | null
        }
        Insert: {
          cohort_no: number
          course_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          instructor_id: string
          price?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["cohort_status"]
          youtube_denominator_est?: number | null
          youtube_last_error?: string | null
          youtube_last_synced_at?: string | null
          youtube_live_url?: string | null
          youtube_max_est?: number | null
          youtube_min_est?: number | null
          youtube_sampling_enabled?: boolean
          youtube_stream_status?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          cohort_no?: number
          course_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          instructor_id?: string
          price?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["cohort_status"]
          youtube_denominator_est?: number | null
          youtube_last_error?: string | null
          youtube_last_synced_at?: string | null
          youtube_live_url?: string | null
          youtube_max_est?: number | null
          youtube_min_est?: number | null
          youtube_sampling_enabled?: boolean
          youtube_stream_status?: string | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          cohort_id: string
          created_at: string
          id: string
          paid_amount: number
          paid_at: string | null
          refund_at: string | null
          refunded_amount: number
          student_email: string | null
          student_name: string | null
        }
        Insert: {
          cohort_id: string
          created_at?: string
          id?: string
          paid_amount?: number
          paid_at?: string | null
          refund_at?: string | null
          refunded_amount?: number
          student_email?: string | null
          student_name?: string | null
        }
        Update: {
          cohort_id?: string
          created_at?: string
          id?: string
          paid_amount?: number
          paid_at?: string | null
          refund_at?: string | null
          refunded_amount?: number
          student_email?: string | null
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_kpis"
            referencedColumns: ["cohort_id"]
          },
        ]
      }
      instructors: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          cohort_id: string
          created_at: string
          id: string
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
        }
        Insert: {
          cohort_id: string
          created_at?: string
          id?: string
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
        }
        Update: {
          cohort_id?: string
          created_at?: string
          id?: string
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "leads_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_kpis"
            referencedColumns: ["cohort_id"]
          },
        ]
      }
      youtube_concurrent_samples: {
        Row: {
          captured_at: string
          cohort_id: string
          concurrent_viewers: number
          id: string
        }
        Insert: {
          captured_at?: string
          cohort_id: string
          concurrent_viewers: number
          id?: string
        }
        Update: {
          captured_at?: string
          cohort_id?: string
          concurrent_viewers?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "youtube_concurrent_samples_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "youtube_concurrent_samples_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "v_cohort_kpis"
            referencedColumns: ["cohort_id"]
          },
        ]
      }
    }
    Views: {
      v_cohort_kpis: {
        Row: {
          cohort_id: string | null
          cohort_no: number | null
          course_id: string | null
          end_date: string | null
          instructor_id: string | null
          leads: number | null
          leads_delta_pct: number | null
          prev_leads: number | null
          prev_revenue: number | null
          prev_students: number | null
          prev_youtube_denominator_est: number | null
          revenue: number | null
          revenue_delta_pct: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["cohort_status"] | null
          students: number | null
          students_delta_pct: number | null
          youtube_conversion_delta_pct: number | null
          youtube_conversion_est: number | null
          youtube_denominator_est: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_youtube_min_max: {
        Args: { p_cohort_id: string }
        Returns: {
          max_est: number
          min_est: number
        }[]
      }
    }
    Enums: {
      cohort_status: "planned" | "active" | "closed"
      lead_stage: "lead" | "applied" | "paid"
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
  public: {
    Enums: {
      cohort_status: ["planned", "active", "closed"],
      lead_stage: ["lead", "applied", "paid"],
    },
  },
} as const
