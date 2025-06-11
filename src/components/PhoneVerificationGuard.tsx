
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface PhoneVerificationGuardProps {
  children: React.ReactNode;
}

const PhoneVerificationGuard = ({ children }: PhoneVerificationGuardProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone, phone_verified')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
        setLoadingProfile(false);
      }
    };

    if (!isLoading && user) {
      fetchProfile();
    }
  }, [user, isLoading]);

  const handleSendOtp = async () => {
    if (!profile?.phone) {
      navigate('/update-phone');
      return;
    }

    setSendingOtp(true);
    try {
      const { error } = await supabase.functions.invoke('trigger-phone-otp', {
        body: { phone: profile.phone }
      });

      if (error) {
        console.error('Erro ao enviar OTP:', error);
        toast.error('Erro ao enviar código de verificação');
      } else {
        toast.success('Código enviado para seu WhatsApp!');
        navigate('/verify-phone');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar código de verificação');
    } finally {
      setSendingOtp(false);
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não tem telefone cadastrado, redireciona para cadastro
  if (!profile?.phone) {
    navigate('/update-phone');
    return null;
  }

  // Se o telefone já está verificado, renderiza o children
  if (profile?.phone_verified) {
    return <>{children}</>;
  }

  // Se o telefone não está verificado, mostra tela de verificação
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verificação de WhatsApp</CardTitle>
          <CardDescription>
            Precisamos verificar seu número de WhatsApp para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Número cadastrado: <span className="font-medium">{profile.phone}</span>
            </p>
          </div>

          <Button 
            onClick={handleSendOtp} 
            className="w-full" 
            disabled={sendingOtp}
          >
            {sendingOtp ? 'Enviando código...' : 'Enviar código de verificação'}
          </Button>

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/update-phone')}
              className="text-sm"
            >
              Alterar número de telefone
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneVerificationGuard;
