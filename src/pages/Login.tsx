
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { EmailNotConfirmedModal } from '@/components/auth/EmailNotConfirmedModal';
import { Captcha, type CaptchaRef } from '@/components/ui/captcha';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isEmailNotConfirmedOpen, setIsEmailNotConfirmedOpen] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const captchaRef = useRef<CaptchaRef>(null);

  // Pré-preencher email se veio do cadastro
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.showForgotPassword) {
      setIsForgotPasswordOpen(true);
    }

    // Show success message for post-signup checkout
    const checkoutSuccess = location.search.includes('checkout_success=true');
    const plan = new URLSearchParams(location.search).get('plan');
    
    if (checkoutSuccess && plan) {
      toast.success(`Pagamento realizado com sucesso! Faça login para acessar sua conta ${plan === 'gestao' ? 'Gestão' : plan === 'psi_regular' ? 'Psi Regular' : ''}.`);
    }
  }, [location.state, location.search]);

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      console.log('🔍 [CAPTCHA] Iniciando verificação do token:', token?.substring(0, 20) + '...');
      
      const { data, error } = await supabase.functions.invoke('verify-captcha', {
        body: { token }
      });

      console.log('🔍 [CAPTCHA] Resposta completa da Edge Function:', JSON.stringify({ data, error }, null, 2));

      // Se houve erro na invocação da função
      if (error) {
        console.error('❌ [CAPTCHA] Erro na invocação da função:', error);
        toast.error('Erro ao conectar com serviço de verificação');
        return false;
      }

      // Verificar se a validação foi bem-sucedida
      if (data?.success === true) {
        console.log('✅ [CAPTCHA] CAPTCHA validado com SUCESSO!');
        return true;
      } else {
        // Tratar diferentes códigos de erro do hCaptcha
        const errorCodes = data?.['error-codes'] || [];
        console.log('❌ [CAPTCHA] Validação falhou. Error codes:', errorCodes);
        console.log('❌ [CAPTCHA] Dados completos de erro:', data);
        
        if (errorCodes.includes('sitekey-secret-mismatch')) {
          console.log('❌ [CAPTCHA] Erro: Site Key e Secret Key não coincidem');
          toast.error('Erro de configuração do CAPTCHA. Contate o suporte.');
        } else if (errorCodes.includes('invalid-input-response')) {
          console.log('❌ [CAPTCHA] Erro: Token inválido');
          toast.error('Token do CAPTCHA inválido. Tente novamente.');
        } else if (errorCodes.includes('timeout-or-duplicate')) {
          console.log('❌ [CAPTCHA] Erro: Token expirado ou duplicado');
          toast.error('CAPTCHA expirou ou já foi usado. Complete novamente.');
        } else {
          console.log('❌ [CAPTCHA] Erro genérico:', data?.error);
          toast.error(data?.error || 'Falha na verificação do CAPTCHA');
        }
        return false;
      }
    } catch (error) {
      console.error('💥 [CAPTCHA] Erro inesperado:', error);
      toast.error('Erro inesperado ao verificar CAPTCHA');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [LOGIN] Iniciando processo de login');
    
    if (!captchaToken) {
      console.log('❌ [LOGIN] CAPTCHA não foi resolvido');
      toast.error('Por favor, complete o CAPTCHA');
      return;
    }

    console.log('🔐 [LOGIN] CAPTCHA token disponível, iniciando login...');
    setIsLoading(true);

    try {
      // Verificar CAPTCHA primeiro
      console.log('🔍 [LOGIN] Verificando CAPTCHA...');
      const captchaValid = await verifyCaptcha(captchaToken);
      
      console.log('🔍 [LOGIN] Resultado da verificação CAPTCHA:', captchaValid);
      
      if (!captchaValid) {
        console.log('❌ [LOGIN] CAPTCHA inválido, resetando e abortando login');
        captchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      console.log('✅ [LOGIN] CAPTCHA válido! Prosseguindo com autenticação...');
      console.log('👤 [LOGIN] Tentando autenticar usuário:', email);
      
      const { error } = await signIn(email, password);
      
      console.log('🔐 [LOGIN] Resultado da autenticação:', error ? 'ERRO' : 'SUCESSO');
      
      if (error) {
        console.error('❌ [LOGIN] Erro na autenticação:', error);
        console.log('❌ [LOGIN] Detalhes do erro:', JSON.stringify(error, null, 2));
        
        captchaRef.current?.reset();
        setCaptchaToken(null);
        
        if (error.message === 'Invalid login credentials') {
          console.log('❌ [LOGIN] Credenciais inválidas');
          toast.error('Email ou senha incorretos');
        } else if (error.message === 'Email not confirmed') {
          console.log('❌ [LOGIN] Email não confirmado');
          setIsEmailNotConfirmedOpen(true);
        } else {
          console.log('❌ [LOGIN] Erro genérico:', error.message);
          toast.error('Erro ao fazer login: ' + error.message);
        }
      } else {
        console.log('🎉 [LOGIN] Login realizado com SUCESSO!');
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('💥 [LOGIN] Erro inesperado durante o login:', error);
      captchaRef.current?.reset();
      setCaptchaToken(null);
      toast.error('Erro inesperado ao fazer login');
    } finally {
      console.log('🏁 [LOGIN] Finalizando processo de login');
      setIsLoading(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    toast.error('Erro no CAPTCHA. Tente novamente.');
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    toast.warning('CAPTCHA expirou. Complete novamente.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>
            Entre com sua conta para acessar o Declara Psi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            
            <Captcha
              ref={captchaRef}
              onVerify={handleCaptchaVerify}
              onError={handleCaptchaError}
              onExpire={handleCaptchaExpire}
              className="my-4"
            />
            
            <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Esqueci minha senha
            </button>
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <ForgotPasswordModal 
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
        initialEmail={email}
      />

      <EmailNotConfirmedModal 
        open={isEmailNotConfirmedOpen}
        onOpenChange={setIsEmailNotConfirmedOpen}
        email={email}
      />
    </div>
  );
};

export default Login;
