-- Add 'draft' status to admin_document_status enum
ALTER TYPE public.admin_document_status ADD VALUE 'draft';

-- Update RLS policies to ensure users only see non-draft documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.admin_documents;

CREATE POLICY "Users can view their own non-draft documents" 
ON public.admin_documents 
FOR SELECT 
USING (auth.uid() = user_id AND status != 'draft');

-- Admins can still see all documents including drafts (existing policy already covers this)