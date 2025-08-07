-- Fix security warning: ensure the view runs with caller permissions
ALTER VIEW public.appointment_reminder_metrics_summary
  SET (security_invoker = on);