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
      email_automations: {
        Row: {
          condition_type: string
          condition_value: string
          created_at: string
          delay_minutes: number
          description: string
          enabled: boolean
          id: string
          name: string
          template_id: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          condition_type?: string
          condition_value?: string
          created_at?: string
          delay_minutes?: number
          description?: string
          enabled?: boolean
          id?: string
          name?: string
          template_id: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          condition_type?: string
          condition_value?: string
          created_at?: string
          delay_minutes?: number
          description?: string
          enabled?: boolean
          id?: string
          name?: string
          template_id?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_automations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_paragraphs: Json
          created_at: string
          cta_text: string
          cta_url: string
          description: string
          enabled: boolean
          footer_text: string
          greeting: string
          id: string
          label: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_paragraphs?: Json
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          enabled?: boolean
          footer_text?: string
          greeting?: string
          id: string
          label?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body_paragraphs?: Json
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          enabled?: boolean
          footer_text?: string
          greeting?: string
          id?: string
          label?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      finance_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_tables: {
        Row: {
          columns: Json
          created_at: string
          folder_id: string
          id: string
          name: string
          position: number
          rows: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          columns?: Json
          created_at?: string
          folder_id: string
          id?: string
          name?: string
          position?: number
          rows?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          columns?: Json
          created_at?: string
          folder_id?: string
          id?: string
          name?: string
          position?: number
          rows?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_tables_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "finance_folders"
            referencedColumns: ["id"]
          },
        ]
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
      received_proposals: {
        Row: {
          client_name: string
          created_at: string
          document_id: string
          id: string
          last_action: string
          last_action_at: string | null
          proposal_link_id: string
          received_at: string
          sender_company: string
          sender_name: string
          sender_user_id: string
          status: string
          template_name: string
          token: string
          total_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string
          created_at?: string
          document_id: string
          id?: string
          last_action?: string
          last_action_at?: string | null
          proposal_link_id: string
          received_at?: string
          sender_company?: string
          sender_name?: string
          sender_user_id: string
          status?: string
          template_name?: string
          token?: string
          total_value?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string
          created_at?: string
          document_id?: string
          id?: string
          last_action?: string
          last_action_at?: string | null
          proposal_link_id?: string
          received_at?: string
          sender_company?: string
          sender_name?: string
          sender_user_id?: string
          status?: string
          template_name?: string
          token?: string
          total_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          notes: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          notes?: string
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          notes?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
          proposal_validity_days: number
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
          proposal_validity_days?: number
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
          proposal_validity_days?: number
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempts: number
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          next_retry_at: string | null
          request_payload: Json
          response_body: string | null
          status: string
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          next_retry_at?: string | null
          request_payload?: Json
          response_body?: string | null
          status?: string
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_id?: string | null
          event_type?: string
          id?: string
          next_retry_at?: string | null
          request_payload?: Json
          response_body?: string | null
          status?: string
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          name: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          name?: string
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          name?: string
          secret?: string
          updated_at?: string
          url?: string
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
