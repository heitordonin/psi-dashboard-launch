-- Create enum for document status
CREATE TYPE public.admin_document_status AS ENUM ('pending', 'paid', 'overdue');

-- Create admin_documents table
CREATE TABLE public.admin_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  competency DATE NOT NULL,
  status admin_document_status NOT NULL DEFAULT 'pending',
  file_path TEXT NOT NULL,
  paid_date DATE NULL,
  penalty_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marked_as_paid_at TIMESTAMP WITH TIME ZONE NULL,
  created_by_admin_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_documents
CREATE POLICY "Users can view their own documents" 
ON public.admin_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.admin_documents 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all documents" 
ON public.admin_documents 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-documents', 'admin-documents', false);

-- Create policies for document storage
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'admin-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'admin-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins can manage documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'admin-documents' AND is_admin(auth.uid()));

-- Add trigger for updating updated_at
CREATE TRIGGER update_admin_documents_updated_at
BEFORE UPDATE ON public.admin_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();