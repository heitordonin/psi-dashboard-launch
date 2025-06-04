
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
    console.log('ensureSupabaseAuth - Verificando autenticação...');
    
    if (!isLoaded) {
      console.log('ensureSupabaseAuth - Clerk ainda não carregou');
      throw new Error('Autenticação ainda não carregada');
    }

    if (!isSignedIn) {
      console.log('ensureSupabaseAuth - Usuário não autenticado no Clerk');
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('ensureSupabaseAuth - Obtendo token do Supabase...');
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        console.error('ensureSupabaseAuth - Token do Supabase não disponível');
        throw new Error('Token do Supabase não disponível');
      }

      console.log('ensureSupabaseAuth - Token obtido, configurando no cliente Supabase');
      
      // Configura o token no cliente Supabase
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: 'placeholder', // Clerk gerencia o refresh
      });

      setSupabaseToken(token);
      console.log('ensureSupabaseAuth - Token configurado com sucesso');
      
    } catch (error) {
      console.error('ensureSupabaseAuth - Erro:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('AuthProvider - Estado do Clerk:', { isLoaded, isSignedIn });
    
    const setupAuth = async () => {
      if (isLoaded) {
        if (isSignedIn) {
          try {
            await ensureSupabaseAuth();
            setIsAuthenticated(true);
          } catch (error) {
            console.error('AuthProvider - Erro na configuração:', error);
            setIsAuthenticated(false);
            setSupabaseToken(null);
          }
        } else {
          setIsAuthenticated(false);
          setSupabaseToken(null);
          // Limpa a sessão do Supabase quando não está autenticado
          await supabase.auth.signOut();
        }
        setIsLoading(false);
      }
    };

    setupAuth();
  }, [isSignedIn, isLoaded, getToken]);

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
