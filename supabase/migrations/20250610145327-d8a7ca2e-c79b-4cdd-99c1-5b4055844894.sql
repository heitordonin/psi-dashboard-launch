
-- Criar tabela de bancos
CREATE TABLE public.banks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS para permitir leitura pública
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura dos bancos ativos para todos os usuários autenticados
CREATE POLICY "Anyone can view active banks" 
  ON public.banks 
  FOR SELECT 
  USING (is_active = true);

-- Inserir os bancos existentes
INSERT INTO public.banks (code, name) VALUES
  ('001', 'Banco do Brasil S.A.'),
  ('104', 'Caixa Econômica Federal'),
  ('237', 'Banco Bradesco S.A.'),
  ('033', 'Banco Santander (Brasil) S.A.'),
  ('341', 'Itaú Unibanco S.A.'),
  ('260', 'Nu Pagamentos S.A. - Nubank'),
  ('077', 'Banco Inter S.A.'),
  ('336', 'Banco C6 S.A.'),
  ('212', 'Banco Original S.A.'),
  ('208', 'Banco BTG Pactual S.A.'),
  ('655', 'Banco Votorantim S.A.'),
  ('422', 'Banco Safra S.A.'),
  ('041', 'Banco do Estado do Rio Grande do Sul S.A.'),
  ('070', 'Banco de Brasília S.A.'),
  ('748', 'Sicredi'),
  ('756', 'Sicoob');

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_banks_updated_at
  BEFORE UPDATE ON public.banks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
