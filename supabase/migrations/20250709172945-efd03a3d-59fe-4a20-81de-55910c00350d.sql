-- Adicionar campo para rastrear quando o usuário visualizou o documento
ALTER TABLE public.admin_documents 
ADD COLUMN viewed_at timestamp with time zone DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.admin_documents.viewed_at IS 'Timestamp de quando o usuário visualizou o documento pela primeira vez';