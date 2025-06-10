
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { generateOTP } from '@/utils/otpGenerator';
import { toast } from 'sonner';
import { Smartphone, RefreshCw } from 'lucide-react';

const VerifyPhone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendWhatsApp } = useWhatsApp();
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
      // Verificar OTP armazenado temporariamente
      const storedOtp = localStorage.getItem('temp_otp');
      const timestamp = localStorage.getItem('temp_otp_timestamp');
      
      if (!storedOtp || !timestamp) {
        toast.error('Código expirado. Solicite um novo código.');
        setIsVerifying(false);
        return;
      }

      // Verificar se o código não expirou (10 minutos)
      const now = Date.now();
      const otpTime = parseInt(timestamp);
      const tenMinutes = 10 * 60 * 1000;
      
      if (now - otpTime > tenMinutes) {
        toast.error('Código expirado. Solicite um novo código.');
        localStorage.removeItem('temp_otp');
        localStorage.removeItem('temp_otp_timestamp');
        setIsVerifying(false);
        return;
      }

      // Verificar se o OTP está correto
      if (otp !== storedOtp) {
        toast.error('Código inválido. Tente novamente.');
        setIsVerifying(false);
        return;
      }

      // Atualizar perfil como verificado
      const { error } = await supabase
        .from('profiles')
        .update({ phone_verified: true })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      // Limpar OTP armazenado
      localStorage.removeItem('temp_otp');
      localStorage.removeItem('temp_otp_timestamp');

      toast.success('Telefone verificado com sucesso!');
      navigate('/dashboard');
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
      // Buscar telefone do usuário
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

      // Gerar novo OTP
      const newOtp = generateOTP();
      
      // Armazenar novo OTP
      localStorage.setItem('temp_otp', newOtp);
      localStorage.setItem('temp_otp_timestamp', Date.now().toString());

      // Enviar novo OTP via WhatsApp usando template correto
      sendWhatsApp({
        to: profile.phone,
        templateSid: 'TWILIO_TEMPLATE_SID_OTP',
        templateVariables: [newOtp],
        messageType: 'otp_verification'
      });

      toast.success('Novo código enviado para seu WhatsApp!');
      setOtp('');
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
