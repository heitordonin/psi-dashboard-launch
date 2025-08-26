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
Edite o arquivo `src/components/ui/captcha.tsx`:
```typescript
// Substitua pela sua chave real
const HCAPTCHA_SITE_KEY = 'sua-site-key-aqui';
```

### Backend (Secret Key)
A secret key já foi configurada no Supabase. Ela será usada pela Edge Function `verify-captcha` para validar os tokens.

## 5. Testar

1. Faça login na aplicação
2. O CAPTCHA deve aparecer normalmente (sem mensagem de teste)
3. Complete o desafio
4. A validação deve funcionar corretamente

## Importante

- A Site Key é pública e pode ser vista por qualquer usuário
- A Secret Key deve permanecer privada e segura
- Use diferentes chaves para desenvolvimento e produção
- O plano gratuito do hCaptcha suporta até 1 milhão de solicitações por mês