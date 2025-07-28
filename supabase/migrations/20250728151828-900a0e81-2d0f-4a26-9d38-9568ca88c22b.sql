-- Fix Function Search Path Mutable Security Issue
-- Step 1: Fix functions without search_path (set to 'public' first)
-- Step 2: Upgrade all functions to secure empty search_path ('')

-- Fix functions that currently have no search_path set
ALTER FUNCTION public.trigger_cleanup_verification_codes() SET search_path = '';
ALTER FUNCTION public.cleanup_duplicate_subscriptions() SET search_path = '';
ALTER FUNCTION public.ensure_single_active_subscription() SET search_path = '';
ALTER FUNCTION public.get_encryption_key() SET search_path = '';
ALTER FUNCTION public.cleanup_old_subscriptions() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- Now upgrade all other functions to use secure empty search_path
ALTER FUNCTION public.get_admin_user_kpis() SET search_path = '';
ALTER FUNCTION public.get_daily_user_growth(date, date) SET search_path = '';
ALTER FUNCTION public.validate_whatsapp_log_owner() SET search_path = '';
ALTER FUNCTION public.get_admin_financial_overview(date, date) SET search_path = '';
ALTER FUNCTION public.get_top_earning_users(integer) SET search_path = '';
ALTER FUNCTION public.is_admin(uuid) SET search_path = '';
ALTER FUNCTION public.hash_value(text) SET search_path = '';
ALTER FUNCTION public.get_daily_user_growth_by_plan(date, date) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.assign_freemium_plan() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_verification_codes() SET search_path = '';
ALTER FUNCTION public.get_user_patient_limit(uuid) SET search_path = '';
ALTER FUNCTION public.encrypt_value(text) SET search_path = '';
ALTER FUNCTION public.get_admin_user_kpis_by_plan() SET search_path = '';
ALTER FUNCTION public.decrypt_value(text) SET search_path = '';
ALTER FUNCTION public.get_darf_completion_stats(date) SET search_path = '';
ALTER FUNCTION public.atomic_cancel_and_insert_subscription(uuid, uuid, text, text, timestamp with time zone, boolean) SET search_path = '';
ALTER FUNCTION public.atomic_cancel_subscription(uuid, boolean) SET search_path = '';
ALTER FUNCTION public.get_decrypted_profile() SET search_path = '';
ALTER FUNCTION public.atomic_upsert_subscription(uuid, text, text, text, timestamp with time zone, boolean) SET search_path = '';
ALTER FUNCTION public.atomic_force_sync_subscription(uuid, text, text, text, timestamp with time zone, boolean) SET search_path = '';
ALTER FUNCTION public.get_user_plan_features(uuid) SET search_path = '';
ALTER FUNCTION public.validate_due_date() SET search_path = '';