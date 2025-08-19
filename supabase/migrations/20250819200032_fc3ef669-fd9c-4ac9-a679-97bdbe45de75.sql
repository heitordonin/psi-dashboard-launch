-- Fix security issues with RLS policies on sensitive tables
-- Remove duplicate and conflicting policies, ensure proper access control

-- First, drop all existing policies on patients table to start clean
DROP POLICY IF EXISTS "Admins can manage all patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Patients: delete own or admin" ON public.patients;
DROP POLICY IF EXISTS "Patients: insert own or admin" ON public.patients;
DROP POLICY IF EXISTS "Patients: select own or admin" ON public.patients;
DROP POLICY IF EXISTS "Patients: update own or admin" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can insert their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can manage their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can view their own patients" ON public.patients;

-- Create clean, secure RLS policies for patients table
CREATE POLICY "patients_select_policy" ON public.patients
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  is_admin(auth.uid())
);

CREATE POLICY "patients_insert_policy" ON public.patients
FOR INSERT 
WITH CHECK (
  auth.uid() = owner_id
);

CREATE POLICY "patients_update_policy" ON public.patients
FOR UPDATE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = owner_id OR is_admin(auth.uid()));

CREATE POLICY "patients_delete_policy" ON public.patients
FOR DELETE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

-- Fix profiles table policies - remove duplicates
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: select own or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update own or admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile except is_admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create clean profiles policies
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT 
USING (
  auth.uid() = id OR 
  is_admin(auth.uid())
);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE 
USING (
  (auth.uid() = id AND NOT is_admin) OR 
  is_admin(auth.uid())
)
WITH CHECK (
  (auth.uid() = id AND is_admin = false) OR 
  is_admin(auth.uid())
);

-- Fix payments table policies - remove duplicates  
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Payments: delete own or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments: insert own or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments: select own or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments: update own or admin" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

-- Create clean payments policies
CREATE POLICY "payments_select_policy" ON public.payments
FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  is_admin(auth.uid())
);

CREATE POLICY "payments_insert_policy" ON public.payments
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "payments_update_policy" ON public.payments
FOR UPDATE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = owner_id OR is_admin(auth.uid()));

CREATE POLICY "payments_delete_policy" ON public.payments
FOR DELETE 
USING (auth.uid() = owner_id OR is_admin(auth.uid()));

-- Fix appointments table policies - remove duplicates
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;

-- Create clean appointments policies
CREATE POLICY "appointments_select_policy" ON public.appointments
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  is_admin(auth.uid())
);

CREATE POLICY "appointments_insert_policy" ON public.appointments
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_update_policy" ON public.appointments
FOR UPDATE 
USING (auth.uid() = user_id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "appointments_delete_policy" ON public.appointments
FOR DELETE 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Ensure owner_id column is not nullable on patients table (security requirement)
ALTER TABLE public.patients ALTER COLUMN owner_id SET NOT NULL;

-- Add security comment
COMMENT ON TABLE public.patients IS 'Contains sensitive patient data. Access strictly controlled via RLS policies - users can only access their own patients, admins can access all.';
COMMENT ON TABLE public.profiles IS 'Contains sensitive user profile data. Access strictly controlled via RLS policies.';
COMMENT ON TABLE public.payments IS 'Contains sensitive financial data. Access strictly controlled via RLS policies.';
COMMENT ON TABLE public.appointments IS 'Contains sensitive patient appointment data. Access strictly controlled via RLS policies.';