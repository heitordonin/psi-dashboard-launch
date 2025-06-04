
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseAuth = () => {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const ensureSupabaseAuth = async () => {
    console.log('useSupabaseAuth - Verificando autenticação...', { isLoaded, isSignedIn });
    
    if (!isLoaded) {
      console.log('useSupabaseAuth - Clerk ainda não carregou');
      throw new Error('Autenticação ainda não carregada');
    }

    if (!isSignedIn) {
      console.log('useSupabaseAuth - Usuário não autenticado no Clerk');
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('useSupabaseAuth - Obtendo token do Supabase...');
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        console.error('useSupabaseAuth - Token do Supabase não disponível');
        throw new Error('Token do Supabase não disponível. Verifique se o template "supabase" está configurado no Clerk.');
      }

      console.log('useSupabaseAuth - Token obtido:', token.substring(0, 20) + '...');
      
      // Configura o token no cliente Supabase para esta requisição
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: 'placeholder', // Clerk gerencia o refresh
      });

      console.log('useSupabaseAuth - Token configurado no cliente Supabase');
      
      // Verifica se o token está funcionando
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('useSupabaseAuth - Erro ao verificar usuário:', error);
        throw new Error('Token inválido: ' + error.message);
      }
      
      console.log('useSupabaseAuth - Usuário autenticado no Supabase:', user?.id);
      
    } catch (error) {
      console.error('useSupabaseAuth - Erro ao configurar autenticação:', error);
      throw error;
    }
  };

  return { ensureSupabaseAuth, isAuthenticated: isSignedIn && isLoaded };
};
