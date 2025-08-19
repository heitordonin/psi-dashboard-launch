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
          email_reminder_1_enabled: boolean
          email_reminder_1_minutes: number | null
          email_reminder_2_enabled: boolean
          email_reminder_2_minutes: number | null
          email_reminder_enabled: boolean
          email_reminder_minutes: number | null
          end_time: string
          google_calendar_id: string | null
          google_calendar_integration: boolean
          id: string
          session_duration: number
          start_time: string
          therapist_whatsapp_notifications: boolean
          timezone: string
          updated_at: string
          user_id: string
          whatsapp_reminder_1_enabled: boolean
          whatsapp_reminder_1_minutes: number | null
          whatsapp_reminder_2_enabled: boolean
          whatsapp_reminder_2_minutes: number | null
          whatsapp_reminder_enabled: boolean
          whatsapp_reminder_minutes: number | null
          working_days: Json
        }
        Insert: {
          created_at?: string
          email_reminder_1_enabled?: boolean
          email_reminder_1_minutes?: number | null
          email_reminder_2_enabled?: boolean
          email_reminder_2_minutes?: number | null
          email_reminder_enabled?: boolean
          email_reminder_minutes?: number | null
          end_time?: string
          google_calendar_id?: string | null
          google_calendar_integration?: boolean
          id?: string
          session_duration?: number
          start_time?: string
          therapist_whatsapp_notifications?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          whatsapp_reminder_1_enabled?: boolean
          whatsapp_reminder_1_minutes?: number | null
          whatsapp_reminder_2_enabled?: boolean
          whatsapp_reminder_2_minutes?: number | null
          whatsapp_reminder_enabled?: boolean
          whatsapp_reminder_minutes?: number | null
          working_days?: Json
        }
        Update: {
          created_at?: string
          email_reminder_1_enabled?: boolean
          email_reminder_1_minutes?: number | null
          email_reminder_2_enabled?: boolean
          email_reminder_2_minutes?: number | null
          email_reminder_enabled?: boolean
          email_reminder_minutes?: number | null
          end_time?: string
          google_calendar_id?: string | null
          google_calendar_integration?: boolean
          id?: string
          session_duration?: number
          start_time?: string
          therapist_whatsapp_notifications?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          whatsapp_reminder_1_enabled?: boolean
          whatsapp_reminder_1_minutes?: number | null
          whatsapp_reminder_2_enabled?: boolean
          whatsapp_reminder_2_minutes?: number | null
          whatsapp_reminder_enabled?: boolean
          whatsapp_reminder_minutes?: number | null
          working_days?: Json
        }
        Relationships: []
      }
      appointment_reminder_deliveries: {
        Row: {
          appointment_id: string
          content_hash: string | null
          created_at: string
          delivery_status: string
          error_message: string | null
          id: string
          recipient_contact: string
          reminder_type: string
          time_bucket: string
        }
        Insert: {
          appointment_id: string
          content_hash?: string | null
          created_at?: string
          delivery_status?: string
          error_message?: string | null
          id?: string
          recipient_contact: string
          reminder_type: string
          time_bucket: string
        }
        Update: {
          appointment_id?: string
          content_hash?: string | null
          created_at?: string
          delivery_status?: string
          error_message?: string | null
          id?: string
          recipient_contact?: string
          reminder_type?: string
          time_bucket?: string
        }
        Relationships: []
      }
      appointment_reminder_logs: {
        Row: {
          appointment_id: string | null
          context: Json | null
          error_details: Json | null
          execution_id: string
          id: string
          log_level: string
          message: string
          reminder_type: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          context?: Json | null
          error_details?: Json | null
          execution_id: string
          id?: string
          log_level?: string
          message: string
          reminder_type?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          context?: Json | null
          error_details?: Json | null
          execution_id?: string
          id?: string
          log_level?: string
          message?: string
          reminder_type?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_reminder_metrics: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          execution_id: string
          failed_reminders: number | null
          id: string
          performance_data: Json | null
          rate_limited_reminders: number | null
          started_at: string
          status: string
          successful_reminders: number | null
          total_reminders: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_id: string
          failed_reminders?: number | null
          id?: string
          performance_data?: Json | null
          rate_limited_reminders?: number | null
          started_at?: string
          status?: string
          successful_reminders?: number | null
          total_reminders?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          execution_id?: string
          failed_reminders?: number | null
          id?: string
          performance_data?: Json | null
          rate_limited_reminders?: number | null
          started_at?: string
          status?: string
          successful_reminders?: number | null
          total_reminders?: number | null
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
          {
            foreignKeyName: "fk_appointments_patient_id"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_status: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          file_size: number | null
          filename: string | null
          id: string
          started_at: string | null
          status: string
        }
        Insert: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          file_size?: number | null
          filename?: string | null
          id?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          file_size?: number | null
          filename?: string | null
          id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          owner_id: string
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
          owner_id: string
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
          owner_id?: string
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
      subscription_overrides: {
        Row: {
          created_at: string
          created_by_admin_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          plan_slug: string
          reason: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by_admin_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan_slug: string
          reason: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan_slug?: string
          reason?: string
          updated_at?: string
          user_id?: string
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
      system_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          details: Json | null
          execution_id: string | null
          id: string
          message: string
          resolved_at: string | null
          severity: string
          status: string
          title: string
          triggered_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          details?: Json | null
          execution_id?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          triggered_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          details?: Json | null
          execution_id?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          triggered_at?: string
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
          message_type: Database["public"]["Enums"]["whatsapp_message_type"]
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
          message_type?: Database["public"]["Enums"]["whatsapp_message_type"]
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
          message_type?: Database["public"]["Enums"]["whatsapp_message_type"]
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
      appointment_reminder_metrics_summary: {
        Row: {
          avg_duration_ms: number | null
          execution_date: string | null
          failed_executions: number | null
          success_rate_percentage: number | null
          successful_executions: number | null
          total_executions: number | null
          total_failed_reminders: number | null
          total_rate_limited_reminders: number | null
          total_reminders_sent: number | null
          total_successful_reminders: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      atomic_cancel_and_insert_subscription: {
        Args: {
          p_new_plan_id: string
          p_stripe_customer_id?: string
          p_subscribed?: boolean
          p_subscription_end?: string
          p_subscription_tier?: string
          p_user_id: string
        }
        Returns: Json
      }
      atomic_cancel_subscription: {
        Args: { p_immediate?: boolean; p_user_id: string }
        Returns: Json
      }
      atomic_force_sync_subscription: {
        Args: {
          p_plan_slug: string
          p_stripe_customer_id?: string
          p_subscribed?: boolean
          p_subscription_end?: string
          p_subscription_tier?: string
          p_user_id: string
        }
        Returns: Json
      }
      atomic_upsert_subscription: {
        Args: {
          p_plan_slug: string
          p_stripe_customer_id?: string
          p_subscribed?: boolean
          p_subscription_end?: string
          p_subscription_tier?: string
          p_user_id: string
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
      create_system_alert: {
        Args: {
          p_alert_type: string
          p_details?: Json
          p_execution_id?: string
          p_message: string
          p_severity: string
          p_title: string
        }
        Returns: string
      }
      decrypt_value: {
        Args: { value_to_decrypt: string }
        Returns: string
      }
      encrypt_value: {
        Args: { value_to_encrypt: string }
        Returns: string
      }
      get_active_subscription_override: {
        Args: { p_user_id: string }
        Returns: {
          expires_at: string
          plan_slug: string
          reason: string
        }[]
      }
      get_admin_financial_overview: {
        Args: { end_date: string; start_date: string }
        Returns: {
          total_issued: number
          total_overdue: number
          total_paid: number
        }[]
      }
      get_admin_user_kpis: {
        Args: Record<PropertyKey, never>
        Returns: {
          inactive_users: number
          new_users_last_30_days: number
          total_users: number
        }[]
      }
      get_admin_user_kpis_by_plan: {
        Args: Record<PropertyKey, never>
        Returns: {
          new_users_free_30_days: number
          new_users_gestao_30_days: number
          new_users_psi_regular_30_days: number
          total_users_free: number
          total_users_gestao: number
          total_users_psi_regular: number
        }[]
      }
      get_churn_metrics: {
        Args:
          | Record<PropertyKey, never>
          | { end_date?: string; start_date?: string }
        Returns: {
          active_subscribers: number
          monthly_churn_rate: number
          retention_rate: number
          total_cancellations_30_days: number
        }[]
      }
      get_conversion_metrics: {
        Args:
          | Record<PropertyKey, never>
          | { end_date?: string; start_date?: string }
        Returns: {
          free_to_paid_rate: number
          gestao_to_psi_regular_rate: number
          total_conversions_30_days: number
        }[]
      }
      get_daily_user_growth: {
        Args: { end_date: string; start_date: string }
        Returns: {
          count: number
          date: string
        }[]
      }
      get_daily_user_growth_by_plan: {
        Args: { end_date: string; start_date: string }
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
          completion_percentage: number
          total_psi_regular_users: number
          users_manually_completed: number
          users_pending: number
          users_with_darf_sent: number
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
        Args:
          | Record<PropertyKey, never>
          | { end_date?: string; start_date?: string }
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
      get_monthly_whatsapp_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_monthly_whatsapp_count_by_month: {
        Args: { p_month: string; p_user_id: string }
        Returns: number
      }
      get_mrr_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          mrr_free: number
          mrr_gestao: number
          mrr_growth_rate: number
          mrr_psi_regular: number
          total_mrr: number
        }[]
      }
      get_time_bucket_5min: {
        Args: { input_time: string }
        Returns: string
      }
      get_top_earning_users: {
        Args: { limit_count: number }
        Returns: {
          total_revenue: number
          user_id: string
          user_name: string
        }[]
      }
      get_top_whatsapp_users: {
        Args: { end_date?: string; limit_count?: number; start_date?: string }
        Returns: {
          total_messages: number
          user_id: string
          user_name: string
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
      is_reminder_already_sent: {
        Args: {
          p_appointment_id: string
          p_current_time?: string
          p_reminder_type: string
        }
        Returns: boolean
      }
      log_reminder_event: {
        Args: {
          p_appointment_id?: string
          p_context?: Json
          p_error_details?: Json
          p_execution_id: string
          p_level: string
          p_message: string
          p_reminder_type?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_reminder_execution_metrics: {
        Args: {
          p_duration_ms?: number
          p_error_message?: string
          p_execution_id: string
          p_failed_reminders?: number
          p_performance_data?: Json
          p_rate_limited_reminders?: number
          p_status: string
          p_successful_reminders?: number
          p_total_reminders?: number
        }
        Returns: string
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string; p_user_id?: string }
        Returns: string
      }
      register_reminder_delivery: {
        Args: {
          p_appointment_id: string
          p_content_hash?: string
          p_current_time?: string
          p_delivery_status?: string
          p_error_message?: string
          p_recipient_contact: string
          p_reminder_type: string
        }
        Returns: string
      }
      trigger_expired_overrides_sync: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      admin_document_status: "pending" | "paid" | "overdue" | "draft"
      appointment_status: "scheduled" | "completed" | "no_show" | "cancelled"
      payment_status: "draft" | "pending" | "paid" | "failed"
      reminder_status: "sent" | "failed"
      reminder_type: "email" | "whatsapp"
      whatsapp_message_type:
        | "text"
        | "payment_reminder"
        | "appointment_reminder"
        | "otp"
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
      whatsapp_message_type: [
        "text",
        "payment_reminder",
        "appointment_reminder",
        "otp",
      ],
    },
  },
} as const
