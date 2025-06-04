
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  supabaseToken: string | null;
  ensureSupabaseAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  supabaseToken: null,
  ensureSupabaseAuth: async () => {},
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);

  const ensureSupabaseAuth = async () => {
    console.log('AuthContext - ensureSupabaseAuth iniciado');
    
    if (!isLoaded) {
      console.log('AuthContext - Clerk ainda não carregou');
      throw new Error('Autenticação ainda não carregada');
    }

    if (!isSignedIn) {
      console.log('AuthContext - Usuário não autenticado no Clerk');
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('AuthContext - Obtendo token do Clerk com template supabase...');
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        console.error('AuthContext - Token do Supabase não disponível');
        throw new Error('Token do Supabase não disponível');
      }

      console.log('AuthContext - Token obtido, configurando no cliente Supabase');
      
      // Configurar o token no cliente Supabase usando setAuth
      supabase.realtime.setAuth(token);
      
      // Para requisições REST, usar setSession
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: 'dummy-refresh-token', // Clerk gerencia refresh
      });

      setSupabaseToken(token);
      
      // Verificar se o JWT contém custom:sub
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('AuthContext - JWT payload verificado:', {
          sub: payload.sub,
          'custom:sub': payload['custom:sub'],
          aud: payload.aud,
          role: payload.role
        });
      } catch (parseError) {
        console.error('AuthContext - Erro ao verificar JWT:', parseError);
      }
      
      console.log('AuthContext - Token configurado com sucesso');
      
    } catch (error) {
      console.error('AuthContext - Erro:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('AuthContext - Estado do Clerk mudou:', { isLoaded, isSignedIn });
    
    const setupAuth = async () => {
      if (isLoaded) {
        if (isSignedIn) {
          try {
            await ensureSupabaseAuth();
            setIsAuthenticated(true);
          } catch (error) {
            console.error('AuthContext - Erro na configuração:', error);
            setIsAuthenticated(false);
            setSupabaseToken(null);
          }
        } else {
          setIsAuthenticated(false);
          setSupabaseToken(null);
          // Limpar a sessão do Supabase quando não está autenticado
          await supabase.auth.signOut();
        }
        setIsLoading(false);
      }
    };

    setupAuth();
  }, [isSignedIn, isLoaded]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      supabaseToken,
      ensureSupabaseAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
