
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { SubscriptionSyncProvider } from '@/contexts/SubscriptionSyncContext';
import { Toaster } from 'sonner';
import { queryClient } from '@/config/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <SubscriptionSyncProvider>
          <Router>
            <div className="App">
              <AppRoutes />
              <Toaster position="top-center" />
            </div>
          </Router>
        </SubscriptionSyncProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
