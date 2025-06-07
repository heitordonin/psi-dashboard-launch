
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_patients: number | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  starts_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan;
}

export type PlanFeature = 
  | 'unlimited_invoices'
  | 'basic_dashboard'
  | 'email_support'
  | 'email_notifications'
  | 'whatsapp_support'
  | 'whatsapp_reminders'
  | 'receita_saude_receipts'
  | 'carne_leao_tracking'
  | 'monthly_darf'
  | 'radar_pj';
