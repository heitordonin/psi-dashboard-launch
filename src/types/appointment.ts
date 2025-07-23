export interface AppointmentWizardData {
  // Step 1: Title
  title: string;
  
  // Step 2: Date and time
  start_datetime: Date;
  end_datetime: Date;
  
  // Step 3: Patient selection (optional)
  patient_id?: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  
  // Step 4: Reminder settings
  send_email_reminder: boolean;
  send_whatsapp_reminder: boolean;
  send_immediate_reminder: boolean;
  
  // Additional fields
  notes?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  patient_id?: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  send_email_reminder: boolean;
  send_whatsapp_reminder: boolean;
  email_reminder_sent_at?: string;
  whatsapp_reminder_sent_at?: string;
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
  notes?: string;
  google_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AgendaSettings {
  id?: string;
  user_id: string;
  start_time: string;
  end_time: string;
  session_duration: number;
  working_days: number[];
  timezone: string;
  google_calendar_integration: boolean;
  google_calendar_id?: string;
  email_reminder_enabled: boolean;
  email_reminder_minutes?: number;
  whatsapp_reminder_enabled: boolean;
  whatsapp_reminder_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentReminder {
  id: string;
  appointment_id: string;
  reminder_type: 'email' | 'whatsapp';
  sent_at: string;
  status: 'sent' | 'failed';
  error_message?: string;
}

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarFilters {
  date?: Date;
  patient_name?: string;
  patient_email?: string;
  status?: Appointment['status'];
}
