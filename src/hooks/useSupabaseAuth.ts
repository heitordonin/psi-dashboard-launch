
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
      
      // Configurar o token diretamente no cabeçalho Authorization do cliente Supabase
      supabase.realtime.setAuth(token);
      
      // Para queries REST, configure o token usando o método correto
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: 'dummy-refresh-token', // Clerk gerencia o refresh
      });

      console.log('useSupabaseAuth - Token configurado no cliente Supabase');
      
      // Verificar se o token contém o custom:sub claim
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('useSupabaseAuth - JWT payload:', payload);
        
        if (payload['custom:sub']) {
          console.log('useSupabaseAuth - custom:sub encontrado:', payload['custom:sub']);
        } else {
          console.warn('useSupabaseAuth - custom:sub não encontrado no JWT. Verifique o template do Clerk.');
        }
      } catch (parseError) {
        console.error('useSupabaseAuth - Erro ao fazer parse do JWT:', parseError);
      }
      
    } catch (error) {
      console.error('useSupabaseAuth - Erro ao configurar autenticação:', error);
      throw error;
    }
  };

  return { ensureSupabaseAuth, isAuthenticated: isSignedIn && isLoaded };
};
