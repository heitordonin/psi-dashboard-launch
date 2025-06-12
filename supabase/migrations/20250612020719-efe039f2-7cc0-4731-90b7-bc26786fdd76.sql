
-- ========================================
-- COMPREHENSIVE SECURITY FIX: RLS POLICIES
-- ========================================

-- 1. FIX PATIENTS TABLE POLICIES
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.patients;
DROP POLICY IF EXISTS "Users can manage their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;

-- Create single secure policy for patients
CREATE POLICY "Users can manage their own patients"
ON public.patients
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Admin override policy for patients
CREATE POLICY "Admins can manage all patients"
ON public.patients
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2. FIX PAYMENTS TABLE POLICIES
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.payments;
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;

-- Create single secure policy for payments
CREATE POLICY "Users can manage their own payments"
ON public.payments
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Admin override policy for payments
CREATE POLICY "Admins can manage all payments"
ON public.payments
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 3. FIX EMAIL_LOGS TABLE POLICIES
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.email_logs;
DROP POLICY IF EXISTS "Users can manage their own email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can create email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can update email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can delete email_logs" ON public.email_logs;

-- Enable RLS on email_logs if not already enabled
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create secure policy for email_logs
CREATE POLICY "Users can manage their own email_logs"
ON public.email_logs
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Admin override policy for email_logs
CREATE POLICY "Admins can manage all email_logs"
ON public.email_logs
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 4. FIX WHATSAPP_LOGS TABLE POLICIES
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Users can manage their own whatsapp_logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Users can view whatsapp_logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Users can create whatsapp_logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Users can update whatsapp_logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "Users can delete whatsapp_logs" ON public.whatsapp_logs;

-- Enable RLS on whatsapp_logs if not already enabled
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Create secure policy for whatsapp_logs
CREATE POLICY "Users can manage their own whatsapp_logs"
ON public.whatsapp_logs
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Admin override policy for whatsapp_logs
CREATE POLICY "Admins can manage all whatsapp_logs"
ON public.whatsapp_logs
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 5. FIX WHATSAPP_TEMPLATES TABLE POLICIES
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can manage their own whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can view whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can create whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can update whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can delete whatsapp_templates" ON public.whatsapp_templates;

-- Enable RLS on whatsapp_templates if not already enabled
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Create secure policy for whatsapp_templates
CREATE POLICY "Users can manage their own whatsapp_templates"
ON public.whatsapp_templates
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Admin override policy for whatsapp_templates
CREATE POLICY "Admins can manage all whatsapp_templates"
ON public.whatsapp_templates
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 6. FIX INVOICE_DESCRIPTIONS TABLE POLICIES
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can manage their own invoice_descriptions" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can view invoice_descriptions" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can create invoice_descriptions" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can update invoice_descriptions" ON public.invoice_descriptions;
DROP POLICY IF EXISTS "Users can delete invoice_descriptions" ON public.invoice_descriptions;

-- Enable RLS on invoice_descriptions if not already enabled
ALTER TABLE public.invoice_descriptions ENABLE ROW LEVEL SECURITY;

-- Create secure policy for invoice_descriptions
CREATE POLICY "Users can manage their own invoice_descriptions"
ON public.invoice_descriptions
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Admin override policy for invoice_descriptions
CREATE POLICY "Admins can manage all invoice_descriptions"
ON public.invoice_descriptions
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 7. FIX PATIENT_INVITES TABLE POLICIES
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.patient_invites;
DROP POLICY IF EXISTS "Users can manage their own patient_invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Users can view patient_invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Users can create patient_invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Users can update patient_invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Users can delete patient_invites" ON public.patient_invites;

-- Enable RLS on patient_invites if not already enabled
ALTER TABLE public.patient_invites ENABLE ROW LEVEL SECURITY;

-- Create secure policy for patient_invites
CREATE POLICY "Users can manage their own patient_invites"
ON public.patient_invites
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Admin override policy for patient_invites
CREATE POLICY "Admins can manage all patient_invites"
ON public.patient_invites
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 8. FIX PROFILES TABLE POLICIES
-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Enable all access for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete profiles" ON public.profiles;

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure policy for profiles
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin override policy for profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 9. SECURE READ-ONLY TABLES
-- subscription_plans - should be readable by all authenticated users
DROP POLICY IF EXISTS "Enable all access for users" ON public.subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can view subscription_plans" ON public.subscription_plans;

-- Enable RLS on subscription_plans if not already enabled
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create read-only policy for subscription_plans
CREATE POLICY "Authenticated users can view subscription_plans"
ON public.subscription_plans
FOR SELECT
USING (auth.role() = 'authenticated');

-- Admin policy for subscription_plans management
CREATE POLICY "Admins can manage subscription_plans"
ON public.subscription_plans
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- user_subscriptions - users can only see their own subscriptions
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.user_subscriptions;

-- Enable RLS on user_subscriptions if not already enabled
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create secure policy for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Admin policy for user_subscriptions management
CREATE POLICY "Admins can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- banks - should be readable by all authenticated users
DROP POLICY IF EXISTS "Enable all access for users" ON public.banks;
DROP POLICY IF EXISTS "Authenticated users can view banks" ON public.banks;

-- Enable RLS on banks if not already enabled
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- Create read-only policy for banks
CREATE POLICY "Authenticated users can view banks"
ON public.banks
FOR SELECT
USING (auth.role() = 'authenticated');

-- Admin policy for banks management
CREATE POLICY "Admins can manage banks"
ON public.banks
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
