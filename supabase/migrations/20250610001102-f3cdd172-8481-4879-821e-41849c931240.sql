
-- Add pagarme_recipient_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN pagarme_recipient_id TEXT;

-- Add pagarme_transaction_id and pix_qr_code to payments table
ALTER TABLE public.payments 
ADD COLUMN pagarme_transaction_id TEXT,
ADD COLUMN pix_qr_code TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_pagarme_transaction_id 
ON public.payments(pagarme_transaction_id);

CREATE INDEX IF NOT EXISTS idx_profiles_pagarme_recipient_id 
ON public.profiles(pagarme_recipient_id);
