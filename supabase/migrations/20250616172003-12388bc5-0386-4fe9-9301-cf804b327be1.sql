
-- Update the validate_due_date function to only apply validation for payment links
CREATE OR REPLACE FUNCTION public.validate_due_date()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only apply the date validation if the charge has a payment link.
  IF NEW.has_payment_link IS TRUE AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.due_date IS DISTINCT FROM NEW.due_date)) THEN
    -- If it's a link payment, the due date cannot be in the past.
    IF NEW.due_date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Due date must be today or in the future for payment links';
    END IF;
  END IF;
  
  -- For manual payments (has_payment_link is FALSE), the function will do nothing and allow the operation.
  RETURN NEW;
END;
$function$
