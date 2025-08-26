-- Criar tabela para armazenar aceites dos termos de uso
CREATE TABLE public.user_terms_acceptance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  ip_address text,
  user_agent text,
  terms_url text NOT NULL DEFAULT 'https://psiclo.com.br/termos-de-uso',
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  form_type text NOT NULL CHECK (form_type IN ('user_signup', 'patient_signup', 'post_checkout')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage all terms acceptance" 
ON public.user_terms_acceptance 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "System can insert terms acceptance" 
ON public.user_terms_acceptance 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own terms acceptance" 
ON public.user_terms_acceptance 
FOR SELECT 
USING (user_id = auth.uid());

-- Índices para performance
CREATE INDEX idx_user_terms_acceptance_user_id ON public.user_terms_acceptance(user_id);
CREATE INDEX idx_user_terms_acceptance_email ON public.user_terms_acceptance(email);
CREATE INDEX idx_user_terms_acceptance_accepted_at ON public.user_terms_acceptance(accepted_at);