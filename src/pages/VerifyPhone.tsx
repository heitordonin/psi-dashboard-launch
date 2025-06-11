
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Smartphone, RefreshCw } from 'lucide-react';

const VerifyPhone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Por favor, digite o código de 6 dígitos');
      return;
    }

    setIsVerifying(true);

    try {
      // Chamar a edge function para verificar o OTP
      const { data, error } = await supabase.functions.invoke('verify-phone-otp', {
        body: { token: otp }
      });

      if (error) {
        console.error('Erro na verificação:', error);
        toast.error(error.message || 'Erro ao verificar código');
        setIsVerifying(false);
        return;
      }

      if (data?.success) {
        toast.success('Telefone verificado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Código inválido ou expirado');
      }
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    setIsResending(true);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      if (error || !profile?.phone) {
        toast.error('Telefone não encontrado');
        setIsResending(false);
        return;
      }

      // Chamar a edge function para reenviar o OTP
      const { data: otpData, error: otpError } = await supabase.functions.invoke('trigger-phone-otp', {
        body: { phone: profile.phone }
      });

      if (otpError) {
        console.error('Erro ao reenviar código:', otpError);
        toast.error('Erro ao reenviar código. Tente novamente.');
      } else {
        toast.success('Novo código enviado para seu WhatsApp!');
        setOtp('');
      }
    } catch (error: any) {
      console.error('Erro ao reenviar código:', error);
      toast.error('Erro ao reenviar código. Tente novamente.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verifique seu WhatsApp</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos que enviamos para seu WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP value={otp} onChange={setOtp} maxLength={6}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            onClick={handleVerifyOtp} 
            className="w-full" 
            disabled={isVerifying || otp.length !== 6}
          >
            {isVerifying ? 'Verificando...' : 'Verificar'}
          </Button>

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                'Reenviar Código'
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Não recebeu o código? Verifique se o número está correto e tente reenviar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyPhone;
