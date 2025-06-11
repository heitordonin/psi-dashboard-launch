export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      banks: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          content: string | null
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          owner_id: string
          payment_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          owner_id: string
          payment_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          owner_id?: string
          payment_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          is_residential: boolean
          is_revenue: boolean
          name: string
          requires_competency: boolean
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_residential?: boolean
          is_revenue?: boolean
          name: string
          requires_competency?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_residential?: boolean
          is_revenue?: boolean
          name?: string
          requires_competency?: boolean
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          competency: string | null
          created_at: string
          description: string | null
          id: string
          is_residential: boolean
          owner_id: string
          payment_date: string
          penalty_interest: number
          residential_adjusted_amount: number | null
        }
        Insert: {
          amount: number
          category_id: string
          competency?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_residential?: boolean
          owner_id?: string
          payment_date: string
          penalty_interest?: number
          residential_adjusted_amount?: number | null
        }
        Update: {
          amount?: number
          category_id?: string
          competency?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_residential?: boolean
          owner_id?: string
          payment_date?: string
          penalty_interest?: number
          residential_adjusted_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_descriptions: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          subject: string | null
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string
          subject?: string | null
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          subject?: string | null
          text?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          cnpj: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          guardian_cpf: string | null
          has_financial_guardian: boolean
          id: string
          is_payment_from_abroad: boolean
          owner_id: string | null
          patient_type: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          guardian_cpf?: string | null
          has_financial_guardian?: boolean
          id?: string
          is_payment_from_abroad?: boolean
          owner_id?: string | null
          patient_type?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          guardian_cpf?: string | null
          has_financial_guardian?: boolean
          id?: string
          is_payment_from_abroad?: boolean
          owner_id?: string | null
          patient_type?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          email_reminder_sent_at: string | null
          id: string
          owner_id: string
          pagarme_transaction_id: string | null
          paid_date: string | null
          patient_id: string
          payer_cpf: string | null
          payment_url: string | null
          pix_qr_code: string | null
          receita_saude_receipt_issued: boolean
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          email_reminder_sent_at?: string | null
          id?: string
          owner_id: string
          pagarme_transaction_id?: string | null
          paid_date?: string | null
          patient_id: string
          payer_cpf?: string | null
          payment_url?: string | null
          pix_qr_code?: string | null
          receita_saude_receipt_issued?: boolean
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          email_reminder_sent_at?: string | null
          id?: string
          owner_id?: string
          pagarme_transaction_id?: string | null
          paid_date?: string | null
          patient_id?: string
          payer_cpf?: string | null
          payment_url?: string | null
          pix_qr_code?: string | null
          receita_saude_receipt_issued?: boolean
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_owner_id"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          crp_number: string | null
          display_name: string | null
          email_reminders_enabled: boolean
          full_name: string | null
          id: string
          is_admin: boolean | null
          nit_nis_pis: string | null
          pagarme_recipient_id: string | null
          phone: string | null
          phone_country_code: string
          phone_verified: boolean
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          crp_number?: string | null
          display_name?: string | null
          email_reminders_enabled?: boolean
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          nit_nis_pis?: string | null
          pagarme_recipient_id?: string | null
          phone?: string | null
          phone_country_code?: string
          phone_verified?: boolean
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          crp_number?: string | null
          display_name?: string | null
          email_reminders_enabled?: boolean
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          nit_nis_pis?: string | null
          pagarme_recipient_id?: string | null
          phone?: string | null
          phone_country_code?: string
          phone_verified?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_patients: number | null
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_patients?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_patients?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          starts_at: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          starts_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          starts_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          created_at: string
          delivered_at: string | null
          error_message: string | null
          evolution_message_id: string | null
          id: string
          message_content: string
          message_type: string
          owner_id: string
          payment_id: string | null
          phone_number: string
          read_at: string | null
          sent_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message_content: string
          message_type?: string
          owner_id: string
          payment_id?: string | null
          phone_number: string
          read_at?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message_content?: string
          message_type?: string
          owner_id?: string
          payment_id?: string | null
          phone_number?: string
          read_at?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          subject: string | null
          type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          subject?: string | null
          type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          subject?: string | null
          type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_financial_overview: {
        Args: { start_date: string; end_date: string }
        Returns: {
          total_issued: number
          total_paid: number
          total_overdue: number
        }[]
      }
      get_admin_user_kpis: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          new_users_last_30_days: number
          inactive_users: number
        }[]
      }
      get_daily_user_growth: {
        Args: { start_date: string; end_date: string }
        Returns: {
          date: string
          count: number
        }[]
      }
      get_top_earning_users: {
        Args: { limit_count: number }
        Returns: {
          user_id: string
          user_name: string
          total_revenue: number
        }[]
      }
      get_user_patient_limit: {
        Args: { user_id?: string }
        Returns: number
      }
      get_user_plan_features: {
        Args: { user_id?: string }
        Returns: Json
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      payment_status: "draft" | "pending" | "paid" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_status: ["draft", "pending", "paid", "failed"],
    },
  },
} as const
