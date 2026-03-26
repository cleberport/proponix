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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      custom_templates: {
        Row: {
          calculated_fields: Json
          canvas_height: number
          canvas_width: number
          category: string
          color: string | null
          created_at: string
          default_values: Json
          description: string
          elements: Json
          id: string
          input_fields: string[]
          name: string
          settings: Json
          thumbnail: string
          updated_at: string
          user_id: string
          variables: string[]
        }
        Insert: {
          calculated_fields?: Json
          canvas_height?: number
          canvas_width?: number
          category?: string
          color?: string | null
          created_at?: string
          default_values?: Json
          description?: string
          elements?: Json
          id?: string
          input_fields?: string[]
          name: string
          settings?: Json
          thumbnail?: string
          updated_at?: string
          user_id: string
          variables?: string[]
        }
        Update: {
          calculated_fields?: Json
          canvas_height?: number
          canvas_width?: number
          category?: string
          color?: string | null
          created_at?: string
          default_values?: Json
          description?: string
          elements?: Json
          id?: string
          input_fields?: string[]
          name?: string
          settings?: Json
          thumbnail?: string
          updated_at?: string
          user_id?: string
          variables?: string[]
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          client_name: string
          created_at: string
          file_name: string
          generated_at: string
          id: string
          status: string
          template_id: string
          template_name: string
          updated_at: string
          user_id: string
          values: Json
        }
        Insert: {
          client_name?: string
          created_at?: string
          file_name: string
          generated_at?: string
          id?: string
          status?: string
          template_id: string
          template_name?: string
          updated_at?: string
          user_id: string
          values?: Json
        }
        Update: {
          client_name?: string
          created_at?: string
          file_name?: string
          generated_at?: string
          id?: string
          status?: string
          template_id?: string
          template_name?: string
          updated_at?: string
          user_id?: string
          values?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          status: string
          trial_end: string
          trial_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_links: {
        Row: {
          approved_at: string | null
          approver_name: string | null
          created_at: string
          document_id: string
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          max_views: number
          negotiation_message: string | null
          status: string
          token: string
          updated_at: string
          user_id: string
          view_count: number
          viewed_at: string | null
          viewer_device: string | null
          viewer_ip: string | null
        }
        Insert: {
          approved_at?: string | null
          approver_name?: string | null
          created_at?: string
          document_id: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          max_views?: number
          negotiation_message?: string | null
          status?: string
          token?: string
          updated_at?: string
          user_id: string
          view_count?: number
          viewed_at?: string | null
          viewer_device?: string | null
          viewer_ip?: string | null
        }
        Update: {
          approved_at?: string | null
          approver_name?: string | null
          created_at?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          max_views?: number
          negotiation_message?: string | null
          status?: string
          token?: string
          updated_at?: string
          user_id?: string
          view_count?: number
          viewed_at?: string | null
          viewer_device?: string | null
          viewer_ip?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          company_address: string
          company_cnpj: string
          company_email: string
          company_name: string
          company_phone: string
          company_website: string
          created_at: string
          default_tax_rate: number
          default_template_id: string
          id: string
          logo_aspect_ratio: number | null
          logo_height: number | null
          logo_url: string
          logo_width: number | null
          pdf_base_name: string
          profile_name: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string
          company_cnpj?: string
          company_email?: string
          company_name?: string
          company_phone?: string
          company_website?: string
          created_at?: string
          default_tax_rate?: number
          default_template_id?: string
          id?: string
          logo_aspect_ratio?: number | null
          logo_height?: number | null
          logo_url?: string
          logo_width?: number | null
          pdf_base_name?: string
          profile_name?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string
          company_cnpj?: string
          company_email?: string
          company_name?: string
          company_phone?: string
          company_website?: string
          created_at?: string
          default_tax_rate?: number
          default_template_id?: string
          id?: string
          logo_aspect_ratio?: number | null
          logo_height?: number | null
          logo_url?: string
          logo_width?: number | null
          pdf_base_name?: string
          profile_name?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_profile: {
        Args: { _profile_user_id: string }
        Returns: undefined
      }
      admin_get_all_profiles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          status: string
          trial_end: string
          trial_start: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_get_stats: { Args: never; Returns: Json }
      admin_update_profile: {
        Args: {
          _email: string
          _full_name: string
          _profile_user_id: string
          _status: string
          _trial_end: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
