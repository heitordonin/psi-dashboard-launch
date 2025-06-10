
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Smartphone } from 'lucide-react';

const UpdatePhone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePhone = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Por favor, digite um número de telefone válido');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    setIsUpdating(true);

    try {
      // Limpar o número de telefone removendo caracteres não numéricos
      const cleanedPhone = phone.replace(/\D/g, '');
      
      if (cleanedPhone.length < 10) {
        toast.error('Número de telefone deve ter pelo menos 10 dígitos');
        setIsUpdating(false);
        return;
      }

      // Atualizar o perfil do usuário com o novo telefone
      const { error } = await supabase
        .from('profiles')
        .update({ phone: cleanedPhone })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast.success('Telefone atualizado com sucesso!');
      navigate('/verify-phone');
    } catch (error: any) {
      console.error('Erro ao atualizar telefone:', error);
      toast.error('Erro ao atualizar telefone. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    // Para números em formação
    if (cleaned.length >= 7) {
      const match2 = cleaned.match(/^(\d{2})(\d{4,5})(\d{0,4})$/);
      if (match2) {
        return `(${match2[1]}) ${match2[2]}${match2[3] ? '-' + match2[3] : ''}`;
      }
    }
    
    if (cleaned.length >= 3) {
      const match3 = cleaned.match(/^(\d{2})(\d{0,5})$/);
      if (match3) {
        return `(${match3[1]}) ${match3[2]}`;
      }
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Adicione seu WhatsApp</CardTitle>
          <CardDescription>
            Para usar o sistema, precisamos verificar seu número de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
            <p className="text-xs text-gray-500">
              Digite o número do seu WhatsApp. Vamos enviar um código de verificação.
            </p>
          </div>

          <Button 
            onClick={handleUpdatePhone} 
            className="w-full" 
            disabled={isUpdating || phone.length < 10}
          >
            {isUpdating ? 'Atualizando...' : 'Continuar'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Seu número será usado apenas para verificação e lembretes de pagamento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePhone;
