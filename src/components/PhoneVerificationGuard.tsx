
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { generateOTP, formatPhoneForOTP } from '@/utils/otpGenerator';
import { toast } from 'sonner';

interface PhoneVerificationGuardProps {
  children: React.ReactNode;
}

const PhoneVerificationGuard: React.FC<PhoneVerificationGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { sendWhatsApp } = useWhatsApp();
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

        console.log('Dados do perfil:', profile);

        // Se o usuário não tem telefone cadastrado, redirecionar para atualizar
        if (!profile?.phone) {
          console.log('Usuário sem telefone cadastrado, redirecionando para /update-phone');
          navigate('/update-phone');
          return;
        }

        // Se o telefone não está verificado, enviar OTP e redirecionar
        if (!profile?.phone_verified) {
          console.log('Telefone não verificado, enviando OTP...');
          
          try {
            // Gerar OTP e enviar via template
            const otp = generateOTP();
            
            // Armazenar OTP temporariamente no localStorage (em produção, usar base de dados)
            localStorage.setItem('temp_otp', otp);
            localStorage.setItem('temp_otp_timestamp', Date.now().toString());
            
            // Enviar OTP via WhatsApp usando template
            sendWhatsApp({
              to: profile.phone,
              templateSid: 'TWILIO_TEMPLATE_SID_OTP',
              templateVariables: [otp],
              messageType: 'otp_verification'
            });

            toast.success('Código de verificação enviado para seu WhatsApp!');
            navigate('/verify-phone');
          } catch (otpSendError) {
            console.error('Erro no envio do OTP:', otpSendError);
            toast.error('Erro ao enviar código de verificação');
          }
        } else {
          // Telefone está verificado
          setPhoneVerified(true);
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
  }, [user, isLoading, navigate, sendWhatsApp]);

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

  // Se o telefone está verificado, renderizar children
  if (phoneVerified === true) {
    return <>{children}</>;
  }

  // Se chegou aqui, significa que estamos redirecionando
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="mt-4">Redirecionando...</p>
      </div>
    </div>
  );
};

export default PhoneVerificationGuard;
