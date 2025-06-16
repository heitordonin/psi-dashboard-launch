
-- Add deleted_at column to patients table for soft delete functionality
ALTER TABLE public.patients 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Create an index on deleted_at for better query performance
CREATE INDEX idx_patients_deleted_at ON public.patients(deleted_at);
