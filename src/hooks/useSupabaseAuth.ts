
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseAuth = () => {
  const { getToken, isSignedIn } = useAuth();

  const ensureSupabaseAuth = async () => {
    if (!isSignedIn) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const token = await getToken({ template: 'supabase' });
      if (token) {
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: 'placeholder',
        });
        console.log('Token do Supabase configurado para a requisição');
      } else {
        throw new Error('Token do Supabase não disponível');
      }
    } catch (error) {
      console.error('Erro ao configurar autenticação do Supabase:', error);
      throw error;
    }
  };

  return { ensureSupabaseAuth };
};
