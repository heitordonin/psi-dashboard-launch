
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { SubscriptionSyncProvider } from '@/contexts/SubscriptionSyncContext';
import { Toaster } from 'sonner';
import { queryClient } from '@/config/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';
import { useAutoSubscriptionCheck } from '@/hooks/useAutoSubscriptionCheck';

// Componente interno para usar hooks dentro do contexto
const AppContent = () => {
  // Hook global para verificação automática de assinatura
  useAutoSubscriptionCheck();

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
