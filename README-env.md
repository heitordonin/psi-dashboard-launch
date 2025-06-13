
# Configuração de Variáveis de Ambiente

## Desenvolvimento Local

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. As variáveis já estão configuradas no arquivo `.env.example` com os valores corretos do projeto.

## Deploy na Vercel

Configure as seguintes variáveis de ambiente no painel da Vercel:

### Variáveis Obrigatórias:
- `VITE_SUPABASE_URL`: `https://xwaxvupymmlbehlocyzt.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXh2dXB5bW1sYmVobG9jeXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc1NzYsImV4cCI6MjA2NDU1MzU3Nn0.t3jxj74dZmzGzHiJJQL9-pgc2JT1KupqYma1JMMI8u8`

### Como configurar na Vercel:
1. Acesse o dashboard do seu projeto na Vercel
2. Vá em Settings > Environment Variables
3. Adicione cada variável com o nome exato e valor correspondente
4. Selecione todos os ambientes (Production, Preview, Development)
5. Faça um novo deploy após configurar as variáveis

### Verificação:
- O código incluí fallbacks para desenvolvimento, mas é recomendado sempre usar as variáveis de ambiente
- Em modo de desenvolvimento, o console mostrará informações sobre as variáveis carregadas
- Se alguma variável estiver ausente, será exibido um erro no console

### Segurança:
- As chaves `VITE_*` são públicas e podem ser expostas no frontend
- Nunca commite arquivos `.env.local` ou `.env` no controle de versão
- O arquivo `.env.example` é seguro para commitar pois contém apenas exemplos
