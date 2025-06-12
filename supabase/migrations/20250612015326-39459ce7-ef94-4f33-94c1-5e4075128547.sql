
-- Drop existing policies for expenses to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.expenses;
DROP POLICY IF EXISTS "Users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;

-- Re-create secure RLS policies for expenses
CREATE POLICY "Users can manage their own expenses"
ON public.expenses
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- For expense_categories, drop all existing policies including the one that already exists
DROP POLICY IF EXISTS "Enable all access for users based on owner_id" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can create expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can view expense categories" ON public.expense_categories;

-- Allow all authenticated users to read expense categories
CREATE POLICY "Authenticated users can view expense categories"
ON public.expense_categories
FOR SELECT
USING (auth.role() = 'authenticated');
