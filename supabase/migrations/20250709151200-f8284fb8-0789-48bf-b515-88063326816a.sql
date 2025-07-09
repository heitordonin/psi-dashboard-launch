-- Add field to track if document is hidden from user panel
ALTER TABLE public.admin_documents 
ADD COLUMN hidden_from_user BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN public.admin_documents.hidden_from_user IS 'When true, document is hidden from user panel but still visible to admin';

-- Create index for better performance when filtering
CREATE INDEX idx_admin_documents_hidden_from_user ON public.admin_documents(hidden_from_user);