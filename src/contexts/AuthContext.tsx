
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

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
  const { isSignedIn, isLoaded } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider - Estado do Clerk:', { isLoaded, isSignedIn });
    
    if (isLoaded) {
      setIsAuthenticated(!!isSignedIn);
      setIsLoading(false);
      console.log('AuthProvider - Autenticação configurada:', { isAuthenticated: !!isSignedIn });
    }
  }, [isSignedIn, isLoaded]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
