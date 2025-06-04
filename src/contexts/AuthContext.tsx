
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  supabaseToken: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  supabaseToken: null,
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

  useEffect(() => {
    console.log('AuthProvider - Estado do Clerk:', { isLoaded, isSignedIn });
    
    const setupSupabaseAuth = async () => {
      if (isLoaded) {
        if (isSignedIn) {
          try {
            console.log('AuthProvider - Obtendo token do Supabase...');
            const token = await getToken({ template: 'supabase' });
            console.log('AuthProvider - Token obtido:', !!token);
            
            if (token) {
              // Configura o token globalmente no cliente Supabase
              await supabase.auth.setSession({
                access_token: token,
                refresh_token: 'placeholder',
              });
              setSupabaseToken(token);
              console.log('AuthProvider - Token configurado no Supabase');
            }
            
            setIsAuthenticated(true);
          } catch (error) {
            console.error('AuthProvider - Erro ao obter token:', error);
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
        console.log('AuthProvider - Autenticação configurada:', { isAuthenticated: isSignedIn });
      }
    };

    setupSupabaseAuth();
  }, [isSignedIn, isLoaded, getToken]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, supabaseToken }}>
      {children}
    </AuthContext.Provider>
  );
};
