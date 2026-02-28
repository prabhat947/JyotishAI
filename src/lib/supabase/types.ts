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
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          model_used: string | null
          role: string
          session_id: string
          sources: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          model_used?: string | null
          role: string
          session_id: string
          sources?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          model_used?: string | null
          role?: string
          session_id?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string
          birth_place: string
          birth_time: string
          chart_calculated_at: string | null
          chart_data: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          relation: string | null
          timezone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date: string
          birth_place: string
          birth_time: string
          chart_calculated_at?: string | null
          chart_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          relation?: string | null
          timezone: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string
          birth_place?: string
          birth_time?: string
          chart_calculated_at?: string | null
          chart_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          relation?: string | null
          timezone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          profile_id: string
          report_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          profile_id: string
          report_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_chunks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_chunks_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content: string | null
          created_at: string | null
          generation_status: string | null
          id: string
          is_favorite: boolean | null
          language: string
          model_used: string | null
          pdf_generated_at: string | null
          pdf_url: string | null
          profile_id: string
          report_type: string
          summary: string | null
          year: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          generation_status?: string | null
          id?: string
          is_favorite?: boolean | null
          language?: string
          model_used?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          profile_id: string
          report_type: string
          summary?: string | null
          year?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          generation_status?: string | null
          id?: string
          is_favorite?: boolean | null
          language?: string
          model_used?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          profile_id?: string
          report_type?: string
          summary?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transit_alerts: {
        Row: {
          alert_type: string
          content: string
          created_at: string | null
          dispatched_email: boolean | null
          dispatched_whatsapp: boolean | null
          id: string
          is_read: boolean | null
          natal_planet: string | null
          orb: number | null
          planet: string | null
          profile_id: string
          title: string
          trigger_date: string
        }
        Insert: {
          alert_type: string
          content: string
          created_at?: string | null
          dispatched_email?: boolean | null
          dispatched_whatsapp?: boolean | null
          id?: string
          is_read?: boolean | null
          natal_planet?: string | null
          orb?: number | null
          planet?: string | null
          profile_id: string
          title: string
          trigger_date: string
        }
        Update: {
          alert_type?: string
          content?: string
          created_at?: string | null
          dispatched_email?: boolean | null
          dispatched_whatsapp?: boolean | null
          id?: string
          is_read?: boolean | null
          natal_planet?: string | null
          orb?: number | null
          planet?: string | null
          profile_id?: string
          title?: string
          trigger_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "transit_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          alert_enabled: boolean | null
          alert_orb: number | null
          ayanamsha: string | null
          chart_style: string | null
          created_at: string | null
          dasha_system: string | null
          default_language: string | null
          email_digest_day: string | null
          email_digest_enabled: boolean | null
          house_system: string | null
          id: string
          preferred_model: string | null
          updated_at: string | null
          user_id: string
          whatsapp_digest_enabled: boolean | null
          whatsapp_digest_time: string | null
          whatsapp_number: string | null
        }
        Insert: {
          alert_enabled?: boolean | null
          alert_orb?: number | null
          ayanamsha?: string | null
          chart_style?: string | null
          created_at?: string | null
          dasha_system?: string | null
          default_language?: string | null
          email_digest_day?: string | null
          email_digest_enabled?: boolean | null
          house_system?: string | null
          id?: string
          preferred_model?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_digest_enabled?: boolean | null
          whatsapp_digest_time?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          alert_enabled?: boolean | null
          alert_orb?: number | null
          ayanamsha?: string | null
          chart_style?: string | null
          created_at?: string | null
          dasha_system?: string | null
          default_language?: string | null
          email_digest_day?: string | null
          email_digest_enabled?: boolean | null
          house_system?: string | null
          id?: string
          preferred_model?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_digest_enabled?: boolean | null
          whatsapp_digest_time?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_report_chunks: {
        Args: {
          p_limit?: number
          p_profile_id: string
          p_query_embedding: number[] | string
          p_query_text: string
        }
        Returns: {
          combined_score: number
          content: string
          id: string
          metadata: Json
          report_id: string
          similarity: number
          ts_rank: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

