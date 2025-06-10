
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhoneVerificationGuardProps {
  children: React.ReactNode;
}

const PhoneVerificationGuard: React.FC<PhoneVerificationGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPhoneVerification = async () => {
      if (!user?.id) {
        setIsCheckingVerification(false);
        return;
      }

      try {
        console.log('Verificando status de verificação do telefone para usuário:', user.id);
        
        // Buscar o perfil do usuário
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('phone_verified, phone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          setIsCheckingVerification(false);
          return;
        }

        console.log('Status de verificação do telefone:', profile?.phone_verified);
        setPhoneVerified(profile?.phone_verified ?? false);

        // Se o telefone não está verificado, enviar OTP e redirecionar
        if (!profile?.phone_verified && profile?.phone) {
          console.log('Telefone não verificado, enviando OTP...');
          
          try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
              phone: profile.phone
            });

            if (otpError) {
              console.error('Erro ao enviar OTP:', otpError);
              toast.error('Erro ao enviar código de verificação');
            } else {
              toast.success('Código de verificação enviado para seu WhatsApp!');
              navigate('/verify-phone');
            }
          } catch (otpSendError) {
            console.error('Erro no envio do OTP:', otpSendError);
            toast.error('Erro ao enviar código de verificação');
          }
        }
      } catch (error) {
        console.error('Erro na verificação do telefone:', error);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    if (!isLoading && user) {
      checkPhoneVerification();
    } else if (!isLoading) {
      setIsCheckingVerification(false);
    }
  }, [user, isLoading, navigate]);

  // Mostrar loading enquanto verifica autenticação ou verificação do telefone
  if (isLoading || isCheckingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Verificando...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário, não renderizar nada (ProtectedRoute cuidará disso)
  if (!user) {
    return null;
  }

  // Se o telefone está verificado ou ainda estamos checando, renderizar children
  if (phoneVerified === true) {
    return <>{children}</>;
  }

  // Se chegou aqui e phoneVerified é false, significa que estamos redirecionando
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="mt-4">Redirecionando para verificação...</p>
      </div>
    </div>
  );
};

export default PhoneVerificationGuard;
