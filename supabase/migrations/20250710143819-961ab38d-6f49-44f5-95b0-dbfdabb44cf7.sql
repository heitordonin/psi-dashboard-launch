-- Make admin_documents fields nullable to allow draft creation with minimal data
ALTER TABLE public.admin_documents 
ALTER COLUMN amount DROP NOT NULL,
ALTER COLUMN competency DROP NOT NULL, 
ALTER COLUMN due_date DROP NOT NULL,
ALTER COLUMN user_id DROP NOT NULL;