
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedForm } from '@/components/ui/enhanced-form';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Captcha, type CaptchaRef } from '@/components/ui/captcha';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateEmail } from '@/utils/securityValidation';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({ open, onOpenChange, initialEmail }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { resetPassword } = useAuth();
  const captchaRef = useRef<CaptchaRef>(null);

  useEffect(() => {
    if (initialEmail && open) {
      setEmail(initialEmail);
    }
    if (!open) {
      // Reset CAPTCHA when modal closes
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
  }, [initialEmail, open]);

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-captcha', {
        body: { token }
      });

      if (error) {
        console.error('Error verifying CAPTCHA:', error);
        toast.error('Erro ao verificar CAPTCHA');
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.error('Error verifying CAPTCHA:', error);
      toast.error('Erro ao verificar CAPTCHA');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error('Por favor, digite seu email');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Por favor, digite um email válido');
      return;
    }

    if (!captchaToken) {
      toast.error('Por favor, complete o CAPTCHA');
      return;
    }

    setIsLoading(true);

    try {
      // Verificar CAPTCHA primeiro
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        captchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      const { error } = await resetPassword(email);
      
      if (error) {
        captchaRef.current?.reset();
        setCaptchaToken(null);
        toast.error('Erro ao enviar email de recuperação: ' + error.message);
      } else {
        toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
        handleClose();
      }
    } catch (error) {
      captchaRef.current?.reset();
      setCaptchaToken(null);
      toast.error('Erro inesperado ao enviar email de recuperação');
    } finally {
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

  const handleClose = () => {
    setEmail('');
    setCaptchaToken(null);
    captchaRef.current?.reset();
    onOpenChange(false);
  };

  return (
    <EnhancedForm
      isOpen={open}
      onClose={handleClose}
      title="Recuperar Senha"
      onSubmit={handleSubmit}
      isLoading={isLoading || !captchaToken}
      submitText="Enviar"
      className="space-y-4"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Digite seu email para receber um link de recuperação de senha
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="touch-target"
            required
          />
        </div>

        <Captcha
          ref={captchaRef}
          onVerify={handleCaptchaVerify}
          onError={handleCaptchaError}
          onExpire={handleCaptchaExpire}
          className="flex justify-center"
        />
      </div>
    </EnhancedForm>
  );
}
