
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedForm } from '@/components/ui/enhanced-form';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { validateEmail } from '@/utils/securityValidation';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error('Por favor, digite seu email');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Por favor, digite um email válido');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error('Erro ao enviar email de recuperação: ' + error.message);
      } else {
        toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
        handleClose();
      }
    } catch (error) {
      toast.error('Erro inesperado ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    onOpenChange(false);
  };

  return (
    <EnhancedForm
      isOpen={open}
      onClose={handleClose}
      title="Recuperar Senha"
      onSubmit={handleSubmit}
      isLoading={isLoading}
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
      </div>
    </EnhancedForm>
  );
}
