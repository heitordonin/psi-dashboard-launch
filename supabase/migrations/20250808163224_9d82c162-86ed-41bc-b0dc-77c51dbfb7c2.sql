-- Phase 1: Enable RLS and tighten policies for payments, expenses, patients

-- Ensure RLS is enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies if they exist (defensive)
DROP POLICY IF EXISTS "Allow all to view payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all to insert payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all to update payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all to delete payments" ON public.payments;

DROP POLICY IF EXISTS "Allow authenticated users to insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to delete expenses" ON public.expenses;

DROP POLICY IF EXISTS "Authenticated users can create patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all to view patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all to update patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all to delete patients" ON public.patients;

-- Payments policies (owner or admin)
DROP POLICY IF EXISTS "Payments: select own or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments: insert own or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments: update own or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments: delete own or admin" ON public.payments;

CREATE POLICY "Payments: select own or admin"
ON public.payments
FOR SELECT
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Payments: insert own or admin"
ON public.payments
FOR INSERT
WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Payments: update own or admin"
ON public.payments
FOR UPDATE
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Payments: delete own or admin"
ON public.payments
FOR DELETE
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Expenses policies (owner or admin)
DROP POLICY IF EXISTS "Expenses: select own or admin" ON public.expenses;
DROP POLICY IF EXISTS "Expenses: insert own or admin" ON public.expenses;
DROP POLICY IF EXISTS "Expenses: update own or admin" ON public.expenses;
DROP POLICY IF EXISTS "Expenses: delete own or admin" ON public.expenses;

CREATE POLICY "Expenses: select own or admin"
ON public.expenses
FOR SELECT
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Expenses: insert own or admin"
ON public.expenses
FOR INSERT
WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Expenses: update own or admin"
ON public.expenses
FOR UPDATE
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Expenses: delete own or admin"
ON public.expenses
FOR DELETE
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Patients policies (owner or admin)
DROP POLICY IF EXISTS "Patients: select own or admin" ON public.patients;
DROP POLICY IF EXISTS "Patients: insert own or admin" ON public.patients;
DROP POLICY IF EXISTS "Patients: update own or admin" ON public.patients;
DROP POLICY IF EXISTS "Patients: delete own or admin" ON public.patients;

CREATE POLICY "Patients: select own or admin"
ON public.patients
FOR SELECT
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Patients: insert own or admin"
ON public.patients
FOR INSERT
WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Patients: update own or admin"
ON public.patients
FOR UPDATE
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Patients: delete own or admin"
ON public.patients
FOR DELETE
USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

-- Profiles policies (own profile or admin)
DROP POLICY IF EXISTS "Profiles: select own or admin" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update own or admin" ON public.profiles;

CREATE POLICY "Profiles: select own or admin"
ON public.profiles
FOR SELECT
USING (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Profiles: update own or admin"
ON public.profiles
FOR UPDATE
USING (id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

-- Phase 1b: Triggers to enforce owner integrity and validations
-- Payments triggers
DROP TRIGGER IF EXISTS payments_owner_enforce ON public.payments;
CREATE TRIGGER payments_owner_enforce
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_payment_owner();

DROP TRIGGER IF EXISTS payments_validate_due_date ON public.payments;
CREATE TRIGGER payments_validate_due_date
BEFORE INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.validate_due_date();

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Expenses triggers
DROP TRIGGER IF EXISTS expenses_owner_enforce ON public.expenses;
CREATE TRIGGER expenses_owner_enforce
BEFORE INSERT OR UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.enforce_expense_owner();

DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.expenses;
CREATE TRIGGER set_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Patients triggers
DROP TRIGGER IF EXISTS patients_owner_enforce ON public.patients;
CREATE TRIGGER patients_owner_enforce
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.enforce_patient_owner();

DROP TRIGGER IF EXISTS set_patients_updated_at ON public.patients;
CREATE TRIGGER set_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles triggers (prevent privilege escalation)
DROP TRIGGER IF EXISTS prevent_is_admin_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_is_admin_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_is_admin_escalation();

-- Ensure the appointment reminder metrics view uses invoker's rights (safety)
ALTER VIEW public.appointment_reminder_metrics_summary SET (security_invoker = on);
