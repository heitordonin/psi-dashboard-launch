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
          cpf: string
          created_at: string
          email: string | null
          full_name: string
          guardian_cpf: string | null
          has_financial_guardian: boolean
          id: string
          is_payment_from_abroad: boolean
          owner_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          email?: string | null
          full_name: string
          guardian_cpf?: string | null
          has_financial_guardian?: boolean
          id?: string
          is_payment_from_abroad?: boolean
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          email?: string | null
          full_name?: string
          guardian_cpf?: string | null
          has_financial_guardian?: boolean
          id?: string
          is_payment_from_abroad?: boolean
          owner_id?: string | null
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
          id: string
          owner_id: string | null
          paid_date: string | null
          patient_id: string
          payer_cpf: string | null
          payment_url: string | null
          receita_saude_receipt_issued: boolean
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          owner_id?: string | null
          paid_date?: string | null
          patient_id: string
          payer_cpf?: string | null
          payment_url?: string | null
          receita_saude_receipt_issued?: boolean
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          owner_id?: string | null
          paid_date?: string | null
          patient_id?: string
          payer_cpf?: string | null
          payment_url?: string | null
          receita_saude_receipt_issued?: boolean
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
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
          full_name: string | null
          id: string
          is_admin: boolean | null
          nit_nis_pis: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          crp_number?: string | null
          display_name?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          nit_nis_pis?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          crp_number?: string | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          nit_nis_pis?: string | null
          updated_at?: string
        }
        Relationships: []
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
