
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const configureSupabaseAuth = async () => {
      console.log('Configurando autenticação Supabase...');
      console.log('isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
      
      if (isLoaded) {
        if (isSignedIn) {
          try {
            // Get the Clerk JWT token
            const token = await getToken({ template: 'supabase' });
            console.log('Token do Clerk obtido:', token ? 'Token presente' : 'Token ausente');
            
            if (token) {
              // Set the auth token in Supabase
              const { data, error } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: 'placeholder', // Clerk handles refresh
              });
              
              if (error) {
                console.error('Erro ao configurar sessão no Supabase:', error);
                setIsAuthenticated(false);
              } else {
                console.log('Sessão configurada no Supabase com sucesso:', data);
                setIsAuthenticated(true);
              }
            } else {
              console.error('Não foi possível obter o token do Clerk');
              setIsAuthenticated(false);
            }
          } catch (error) {
            console.error('Erro ao configurar autenticação:', error);
            setIsAuthenticated(false);
          }
        } else {
          // User is not signed in, clear Supabase session
          console.log('Usuário não autenticado, limpando sessão Supabase');
          await supabase.auth.signOut();
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    };

    configureSupabaseAuth();
  }, [isSignedIn, isLoaded, getToken]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
