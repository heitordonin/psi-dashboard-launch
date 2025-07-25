
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { SubscriptionSyncProvider } from '@/contexts/SubscriptionSyncContext';
import { Toaster } from 'sonner';
import { queryClient } from '@/config/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';
import { useAutoSubscriptionCheck } from '@/hooks/useAutoSubscriptionCheck';
import { useAuthSubscriptionSync } from '@/hooks/useAuthSubscriptionSync';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Componente interno para usar hooks dentro do contexto
const AppContent = () => {
  const { user, isLoading } = useAuth();
  
  // Hook global para verificação automática de assinatura
  useAutoSubscriptionCheck();
  
  // Integração entre auth e sincronização de assinatura
  useAuthSubscriptionSync(user, isLoading);

  return (
    <Router>
      <div className="App">
        <AppRoutes />
        <Toaster position="top-center" />
      </div>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <SubscriptionSyncProvider>
          <AppContent />
        </SubscriptionSyncProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
