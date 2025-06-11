
-- Add has_payment_link column to payments table
ALTER TABLE public.payments
ADD COLUMN has_payment_link BOOLEAN NOT NULL DEFAULT true;
