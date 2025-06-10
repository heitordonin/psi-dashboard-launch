
-- Create admin aggregation functions for enhanced dashboard

-- Function to get user KPIs
CREATE OR REPLACE FUNCTION public.get_admin_user_kpis()
RETURNS TABLE (
  total_users bigint,
  new_users_last_30_days bigint,
  inactive_users bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_last_30_days,
    (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at < NOW() - INTERVAL '5 days' OR last_sign_in_at IS NULL) as inactive_users;
$function$;

-- Function for daily user growth chart
CREATE OR REPLACE FUNCTION public.get_daily_user_growth(start_date date, end_date date)
RETURNS TABLE (
  date date,
  count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    d.date::date,
    COALESCE(u.count, 0) as count
  FROM (
    SELECT generate_series($1::timestamp, $2::timestamp, '1 day'::interval)::date as date
  ) d
  LEFT JOIN (
    SELECT 
      created_at::date as date,
      COUNT(*) as count
    FROM auth.users 
    WHERE created_at::date BETWEEN $1 AND $2
    GROUP BY created_at::date
  ) u ON d.date = u.date
  ORDER BY d.date;
$function$;

-- Function for financial overview
CREATE OR REPLACE FUNCTION public.get_admin_financial_overview(start_date date, end_date date)
RETURNS TABLE (
  total_issued numeric,
  total_paid numeric,
  total_overdue numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(SUM(amount), 0) as total_issued,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
    COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0) as total_overdue
  FROM public.payments 
  WHERE created_at::date BETWEEN $1 AND $2;
$function$;

-- Function for top-earning users
CREATE OR REPLACE FUNCTION public.get_top_earning_users(limit_count int)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  total_revenue numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.owner_id as user_id,
    COALESCE(pr.full_name, pr.display_name, 'Usuário sem nome') as user_name,
    SUM(p.amount) as total_revenue
  FROM public.payments p
  LEFT JOIN public.profiles pr ON p.owner_id = pr.id
  WHERE p.status = 'paid'
  GROUP BY p.owner_id, pr.full_name, pr.display_name
  ORDER BY total_revenue DESC
  LIMIT $1;
$function$;
