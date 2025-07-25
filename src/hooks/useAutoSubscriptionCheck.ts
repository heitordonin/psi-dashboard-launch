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

    // Verificação otimizada: 15 minutos + sempre no login
    const lastCheck = localStorage.getItem(`subscription-last-check-${user.id}`);
    const now = Date.now();
    const checkInterval = 15 * 60 * 1000; // 15 MINUTOS

    // Sempre verificar no primeiro login da sessão
    const sessionCheck = sessionStorage.getItem(`subscription-session-check-${user.id}`);
    
    if (!sessionCheck) {
      console.log('[AUTO-CHECK] Primeira verificação da sessão...');
      syncSubscription('AUTH_LOGIN').then((result) => {
        if (result.success) {
          localStorage.setItem(`subscription-last-check-${user.id}`, now.toString());
          sessionStorage.setItem(`subscription-session-check-${user.id}`, 'done');
        }
      });
    } else if (!lastCheck || now - parseInt(lastCheck) > checkInterval) {
      console.log('[AUTO-CHECK] Verificação automática necessária após 15 minutos...');
      syncSubscription('AUTO_CHECK').then((result) => {
        if (result.success) {
          localStorage.setItem(`subscription-last-check-${user.id}`, now.toString());
        }
      });
    } else {
      console.log('[AUTO-CHECK] Verificação pulada - ainda dentro do cache de 15 minutos');
    }

    // REMOVIDO: Verificação por foco é desnecessária e causa muitas chamadas
    // Apenas manter uma verificação essencial no login/load inicial
    console.log('[AUTO-CHECK] Verificação por foco removida para reduzir chamadas');

    // Função vazia para evitar verificações desnecessárias
    const handleFocus = () => {
      console.log('[AUTO-CHECK] Foco detectado, mas verificação desabilitada para performance');
    };

    // Remover event listener de focus para evitar verificações desnecessárias
    // window.addEventListener('focus', handleFocus);

    return () => {
      // window.removeEventListener('focus', handleFocus);
    };
  }, [user, syncSubscription, state.isLoading]);
};