
-- Criar tabela para códigos de verificação de telefone
CREATE TABLE public.phone_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Habilitar RLS
ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy para usuários visualizarem apenas seus próprios códigos
CREATE POLICY "Users can view their own verification codes" 
  ON public.phone_verification_codes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy para usuários criarem seus próprios códigos
CREATE POLICY "Users can create their own verification codes" 
  ON public.phone_verification_codes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy para usuários atualizarem seus próprios códigos
CREATE POLICY "Users can update their own verification codes" 
  ON public.phone_verification_codes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Função para limpar códigos expirados automaticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.phone_verification_codes 
  WHERE expires_at < now();
END;
$$;

-- Trigger para limpar códigos expirados a cada inserção
CREATE OR REPLACE FUNCTION public.trigger_cleanup_verification_codes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.cleanup_expired_verification_codes();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_verification_codes_trigger
  AFTER INSERT ON public.phone_verification_codes
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_cleanup_verification_codes();

-- Índice para performance
CREATE INDEX idx_phone_verification_codes_user_phone 
  ON public.phone_verification_codes(user_id, phone);

CREATE INDEX idx_phone_verification_codes_expires_at 
  ON public.phone_verification_codes(expires_at);
