
-- Create the patient_invites table to handle self-registration links
CREATE TABLE public.patient_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, completed, expired
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add a comment for clarity
COMMENT ON TABLE public.patient_invites IS 'Stores temporary tokens for patient self-registration links.';

-- Enable Row Level Security
ALTER TABLE public.patient_invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only see their own invites
CREATE POLICY "Users can view their own invites" 
  ON public.patient_invites 
  FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own invites" 
  ON public.patient_invites 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own invites" 
  ON public.patient_invites 
  FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own invites" 
  ON public.patient_invites 
  FOR DELETE 
  USING (auth.uid() = owner_id);

-- Create an index on token for faster lookups
CREATE INDEX idx_patient_invites_token ON public.patient_invites(token);

-- Create an index on expires_at for cleanup queries
CREATE INDEX idx_patient_invites_expires_at ON public.patient_invites(expires_at);
