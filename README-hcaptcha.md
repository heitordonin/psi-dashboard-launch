# Configuração do hCaptcha

## 1. Criar conta no hCaptcha

1. Acesse [https://www.hcaptcha.com/](https://www.hcaptcha.com/)
2. Crie uma conta gratuita
3. Faça login no [Dashboard do hCaptcha](https://dashboard.hcaptcha.com/)

## 2. Registrar seu site

1. No dashboard, vá em "Sites"
2. Clique em "Add new site"
3. Adicione seus domínios:
   - Para desenvolvimento: `localhost`, `127.0.0.1`
   - Para produção: seu domínio real (ex: `meusite.com`)
4. Salve as configurações

## 3. Obter as chaves

Após registrar o site, você receberá:
- **Site Key** (pública): pode ser exposta no código frontend
- **Secret Key** (privada): deve ser mantida segura no backend

## 4. Configurar no projeto

### Frontend (Site Key)
A Site Key já foi configurada no projeto:
```typescript
// Em src/components/ui/captcha.tsx
const HCAPTCHA_SITE_KEY = '3ca82662-74f4-47d8-82f0-a30e15da650c';
```

### Backend (Secret Key)
A Secret Key precisa ser configurada no Supabase:
1. No dashboard do hCaptcha, vá para a mesma página da Site Key (Sites → sua site)
2. Copie a "Secret Key" que corresponde à Site Key acima
3. No Supabase: Settings → Edge Functions → Secrets
4. Atualize a secret `HCAPTCHA_SECRET_KEY` com o valor copiado

⚠️ **IMPORTANTE**: A Site Key e Secret Key devem ser da MESMA site no dashboard do hCaptcha!

## 5. Testar

1. Faça login na aplicação
2. O CAPTCHA deve aparecer normalmente (sem mensagem de teste)
3. Complete o desafio
4. A validação deve funcionar corretamente

## 6. Solução de Problemas

### Erro: "sitekey-secret-mismatch"
- A Site Key e Secret Key não pertencem à mesma site no hCaptcha
- Solução: Verifique se você copiou a Secret Key da MESMA página onde está a Site Key

### Erro: "invalid-input-response"
- O token do CAPTCHA é inválido ou malformado
- Solução: Recarregue a página e tente novamente

### Erro: "timeout-or-duplicate"
- O CAPTCHA expirou ou já foi usado
- Solução: Complete o CAPTCHA novamente

### Domínios não configurados
- Se o CAPTCHA não aparecer ou der erro de domínio
- Solução: Adicione todos os domínios necessários no dashboard do hCaptcha:
  - `localhost` e `127.0.0.1` para desenvolvimento
  - Seu domínio de produção

## Importante

- A Site Key é pública e pode ser vista por qualquer usuário
- A Secret Key deve permanecer privada e segura
- Use diferentes chaves para desenvolvimento e produção
- O plano gratuito do hCaptcha suporta até 1 milhão de solicitações por mês