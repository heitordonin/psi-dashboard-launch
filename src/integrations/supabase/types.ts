export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_documents: {
        Row: {
          amount: number | null
          competency: string | null
          created_at: string
          created_by_admin_id: string
          due_date: string | null
          file_path: string
          hidden_from_user: boolean
          id: string
          marked_as_paid_at: string | null
          paid_date: string | null
          penalty_amount: number | null
          status: Database["public"]["Enums"]["admin_document_status"]
          title: string
          updated_at: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          amount?: number | null
          competency?: string | null
          created_at?: string
          created_by_admin_id: string
          due_date?: string | null
          file_path: string
          hidden_from_user?: boolean
          id?: string
          marked_as_paid_at?: string | null
          paid_date?: string | null
          penalty_amount?: number | null
          status?: Database["public"]["Enums"]["admin_document_status"]
          title: string
          updated_at?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          amount?: number | null
          competency?: string | null
          created_at?: string
          created_by_admin_id?: string
          due_date?: string | null
          file_path?: string
          hidden_from_user?: boolean
          id?: string
          marked_as_paid_at?: string | null
          paid_date?: string | null
          penalty_amount?: number | null
          status?: Database["public"]["Enums"]["admin_document_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      agenda_settings: {
        Row: {
          created_at: string
          email_reminder_enabled: boolean
          email_reminder_minutes: number | null
          end_time: string
          google_calendar_id: string | null
          google_calendar_integration: boolean
          id: string
          session_duration: number
          start_time: string
          timezone: string
          updated_at: string
          user_id: string
          whatsapp_reminder_enabled: boolean
          whatsapp_reminder_minutes: number | null
          working_days: Json
        }
        Insert: {
          created_at?: string
          email_reminder_enabled?: boolean
          email_reminder_minutes?: number | null
          end_time?: string
          google_calendar_id?: string | null
          google_calendar_integration?: boolean
          id?: string
          session_duration?: number
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id: string
          whatsapp_reminder_enabled?: boolean
          whatsapp_reminder_minutes?: number | null
          working_days?: Json
        }
        Update: {
          created_at?: string
          email_reminder_enabled?: boolean
          email_reminder_minutes?: number | null
          end_time?: string
          google_calendar_id?: string | null
          google_calendar_integration?: boolean
          id?: string
          session_duration?: number
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          whatsapp_reminder_enabled?: boolean
          whatsapp_reminder_minutes?: number | null
          working_days?: Json
        }
        Relationships: []
      }
      appointment_reminders: {
        Row: {
          appointment_id: string
          error_message: string | null
          id: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          sent_at: string
          status: Database["public"]["Enums"]["reminder_status"]
        }
        Insert: {
          appointment_id: string
          error_message?: string | null
          id?: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          sent_at?: string
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Update: {
          appointment_id?: string
          error_message?: string | null
          id?: string
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          sent_at?: string
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          email_reminder_sent_at: string | null
          end_datetime: string
          google_event_id: string | null
          id: string
          notes: string | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          send_email_reminder: boolean
          send_whatsapp_reminder: boolean
          start_datetime: string
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at: string
          user_id: string
          whatsapp_reminder_sent_at: string | null
        }
        Insert: {
          created_at?: string
          email_reminder_sent_at?: string | null
          end_datetime: string
          google_event_id?: string | null
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          send_email_reminder?: boolean
          send_whatsapp_reminder?: boolean
          start_datetime: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at?: string
          user_id: string
          whatsapp_reminder_sent_at?: string | null
        }
        Update: {
          created_at?: string
          email_reminder_sent_at?: string | null
          end_datetime?: string
          google_event_id?: string | null
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          send_email_reminder?: boolean
          send_whatsapp_reminder?: boolean
          start_datetime?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          updated_at?: string
          user_id?: string
          whatsapp_reminder_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
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
      darf_manual_completions: {
        Row: {
          admin_notes: string
          competency: string
          created_at: string
          created_by_admin_id: string
          id: string
          marked_completed_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes: string
          competency: string
          created_at?: string
          created_by_admin_id: string
          id?: string
          marked_completed_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string
          competency?: string
          created_at?: string
          created_by_admin_id?: string
          id?: string
          marked_completed_at?: string
          updated_at?: string
          user_id?: string
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
      patient_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          owner_id: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          owner_id: string
          status?: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          owner_id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          city: string | null
          cnpj: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string
          guardian_cpf: string | null
          has_financial_guardian: boolean
          id: string
          is_payment_from_abroad: boolean
          neighborhood: string | null
          owner_id: string | null
          patient_type: string
          phone: string | null
          state: string | null
          street: string | null
          street_number: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name: string
          guardian_cpf?: string | null
          has_financial_guardian?: boolean
          id?: string
          is_payment_from_abroad?: boolean
          neighborhood?: string | null
          owner_id?: string | null
          patient_type?: string
          phone?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          guardian_cpf?: string | null
          has_financial_guardian?: boolean
          id?: string
          is_payment_from_abroad?: boolean
          neighborhood?: string | null
          owner_id?: string | null
          patient_type?: string
          phone?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          zip_code?: string | null
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
          has_payment_link: boolean
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
          has_payment_link?: boolean
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
          has_payment_link?: boolean
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
      phone_verification_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone: string
          user_id: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agenda_module_enabled: boolean
          birth_date: string | null
          city: string | null
          complement: string | null
          cpf: string | null
          cpf_encrypted: string | null
          created_at: string
          crp_number: string | null
          display_name: string | null
          email_reminders_enabled: boolean
          full_name: string | null
          id: string
          is_admin: boolean | null
          neighborhood: string | null
          nit_nis_pis: string | null
          pagarme_recipient_id: string | null
          phone: string | null
          phone_country_code: string
          phone_encrypted: string | null
          phone_verified: boolean
          state: string | null
          street: string | null
          street_number: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          agenda_module_enabled?: boolean
          birth_date?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          cpf_encrypted?: string | null
          created_at?: string
          crp_number?: string | null
          display_name?: string | null
          email_reminders_enabled?: boolean
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          neighborhood?: string | null
          nit_nis_pis?: string | null
          pagarme_recipient_id?: string | null
          phone?: string | null
          phone_country_code?: string
          phone_encrypted?: string | null
          phone_verified?: boolean
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          agenda_module_enabled?: boolean
          birth_date?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          cpf_encrypted?: string | null
          created_at?: string
          crp_number?: string | null
          display_name?: string | null
          email_reminders_enabled?: boolean
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          neighborhood?: string | null
          nit_nis_pis?: string | null
          pagarme_recipient_id?: string | null
          phone?: string | null
          phone_country_code?: string
          phone_encrypted?: string | null
          phone_verified?: boolean
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          zip_code?: string | null
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
          cancel_at_period_end: boolean
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
          cancel_at_period_end?: boolean
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
          cancel_at_period_end?: boolean
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
      atomic_cancel_and_insert_subscription: {
        Args: {
          p_user_id: string
          p_new_plan_id: string
          p_stripe_customer_id?: string
          p_subscription_tier?: string
          p_subscription_end?: string
          p_subscribed?: boolean
        }
        Returns: Json
      }
      atomic_cancel_subscription: {
        Args: { p_user_id: string; p_immediate?: boolean }
        Returns: Json
      }
      atomic_force_sync_subscription: {
        Args: {
          p_user_id: string
          p_plan_slug: string
          p_stripe_customer_id?: string
          p_subscription_tier?: string
          p_subscription_end?: string
          p_subscribed?: boolean
        }
        Returns: Json
      }
      atomic_upsert_subscription: {
        Args: {
          p_user_id: string
          p_plan_slug: string
          p_stripe_customer_id?: string
          p_subscription_tier?: string
          p_subscription_end?: string
          p_subscribed?: boolean
        }
        Returns: Json
      }
      cleanup_duplicate_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_verification_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_value: {
        Args: { value_to_decrypt: string }
        Returns: string
      }
      encrypt_value: {
        Args: { value_to_encrypt: string }
        Returns: string
      }
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
      get_admin_user_kpis_by_plan: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users_free: number
          total_users_gestao: number
          total_users_psi_regular: number
          new_users_free_30_days: number
          new_users_gestao_30_days: number
          new_users_psi_regular_30_days: number
        }[]
      }
      get_churn_metrics: {
        Args:
          | Record<PropertyKey, never>
          | { start_date?: string; end_date?: string }
        Returns: {
          monthly_churn_rate: number
          total_cancellations_30_days: number
          retention_rate: number
          active_subscribers: number
        }[]
      }
      get_conversion_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          free_to_paid_rate: number
          gestao_to_psi_regular_rate: number
          total_conversions_30_days: number
        }[]
      }
      get_daily_user_growth: {
        Args: { start_date: string; end_date: string }
        Returns: {
          date: string
          count: number
        }[]
      }
      get_daily_user_growth_by_plan: {
        Args: { start_date: string; end_date: string }
        Returns: {
          date: string
          free_count: number
          gestao_count: number
          psi_regular_count: number
        }[]
      }
      get_darf_completion_stats: {
        Args: { due_month: string }
        Returns: {
          total_psi_regular_users: number
          users_with_darf_sent: number
          users_manually_completed: number
          users_pending: number
          completion_percentage: number
        }[]
      }
      get_decrypted_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          agenda_module_enabled: boolean
          birth_date: string | null
          city: string | null
          complement: string | null
          cpf: string | null
          cpf_encrypted: string | null
          created_at: string
          crp_number: string | null
          display_name: string | null
          email_reminders_enabled: boolean
          full_name: string | null
          id: string
          is_admin: boolean | null
          neighborhood: string | null
          nit_nis_pis: string | null
          pagarme_recipient_id: string | null
          phone: string | null
          phone_country_code: string
          phone_encrypted: string | null
          phone_verified: boolean
          state: string | null
          street: string | null
          street_number: string | null
          updated_at: string
          zip_code: string | null
        }[]
      }
      get_encryption_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_ltv_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_ltv_gestao: number
          avg_ltv_psi_regular: number
          avg_subscription_duration_days: number
        }[]
      }
      get_monthly_revenue_evolution: {
        Args: { months_back?: number }
        Returns: {
          month_year: string
          mrr: number
          mrr_growth_rate: number
        }[]
      }
      get_mrr_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_mrr: number
          mrr_free: number
          mrr_gestao: number
          mrr_psi_regular: number
          mrr_growth_rate: number
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
      hash_value: {
        Args: { value_to_hash: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_document_status: "pending" | "paid" | "overdue" | "draft"
      appointment_status: "scheduled" | "completed" | "no_show" | "cancelled"
      payment_status: "draft" | "pending" | "paid" | "failed"
      reminder_status: "sent" | "failed"
      reminder_type: "email" | "whatsapp"
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
      admin_document_status: ["pending", "paid", "overdue", "draft"],
      appointment_status: ["scheduled", "completed", "no_show", "cancelled"],
      payment_status: ["draft", "pending", "paid", "failed"],
      reminder_status: ["sent", "failed"],
      reminder_type: ["email", "whatsapp"],
    },
  },
} as const
