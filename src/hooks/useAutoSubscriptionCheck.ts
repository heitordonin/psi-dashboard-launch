import { useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSubscriptionSync } from '@/contexts/SubscriptionSyncContext';

/**
 * Hook para verificação automática da assinatura quando o usuário
 * retorna à aplicação após um período de inatividade
 */
export const useAutoSubscriptionCheck = () => {
  const { user } = useAuth();
  const { syncSubscription, state } = useSubscriptionSync();

  useEffect(() => {
    if (!user || state.isLoading) return;

    // Verificar ao carregar a página se não verificou recentemente
    const lastCheck = localStorage.getItem(`subscription-last-check-${user.id}`);
    const now = Date.now();
    const checkInterval = 5 * 60 * 1000; // 5 minutos

    if (!lastCheck || now - parseInt(lastCheck) > checkInterval) {
      console.log('Verificando assinatura automaticamente...');
      syncSubscription('AUTO_CHECK').then((result) => {
        if (result.success) {
          localStorage.setItem(`subscription-last-check-${user.id}`, now.toString());
        }
      });
    }

    // Verificar quando a janela volta a ter foco (usuário retorna de outra aba)
    const handleFocus = () => {
      // Não verificar se já há uma sincronização em andamento
      if (state.isLoading) return;
      
      const lastFocusCheck = localStorage.getItem(`subscription-focus-check-${user.id}`);
      const focusNow = Date.now();
      const focusInterval = 2 * 60 * 1000; // 2 minutos

      if (!lastFocusCheck || focusNow - parseInt(lastFocusCheck) > focusInterval) {
        console.log('Verificando assinatura ao retornar o foco...');
        syncSubscription('FOCUS_CHECK').then((result) => {
          if (result.success) {
            localStorage.setItem(`subscription-focus-check-${user.id}`, focusNow.toString());
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, syncSubscription, state.isLoading]);
};