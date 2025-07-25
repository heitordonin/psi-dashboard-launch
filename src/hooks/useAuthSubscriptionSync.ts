import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useSubscriptionSync } from '@/contexts/SubscriptionSyncContext';

/**
 * Hook para integrar autenticação com sincronização de assinatura
 * Verifica a assinatura automaticamente em eventos críticos de auth
 */
export const useAuthSubscriptionSync = (user: User | null, isLoading: boolean) => {
  const { syncSubscription, state } = useSubscriptionSync();
  const lastUserIdRef = useRef<string | null>(null);
  const loginSyncCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    // Se ainda está carregando auth, não fazer nada
    if (isLoading) return;

    const currentUserId = user?.id || null;
    const previousUserId = lastUserIdRef.current;

    // Detectar login (mudança de null para user válido)
    const isLogin = !previousUserId && currentUserId;
    
    // Detectar mudança de usuário (troca de conta)
    const isUserChange = previousUserId && currentUserId && previousUserId !== currentUserId;
    
    // Detectar logout (mudança de user válido para null)
    const isLogout = previousUserId && !currentUserId;

    if (isLogin || isUserChange) {
      console.log(`[AUTH-SYNC] ${isLogin ? 'Login' : 'Mudança de usuário'} detectado, sincronizando assinatura...`);
      
      // Resetar flag de sync concluído
      loginSyncCompletedRef.current = false;
      
      // Verificar assinatura imediatamente após login/mudança de usuário
      // Usar setTimeout para garantir que o auth context terminou de processar
      setTimeout(() => {
        if (!state.isLoading && !loginSyncCompletedRef.current) {
          syncSubscription(true).then((result) => {
            if (result.success) {
              console.log('[AUTH-SYNC] Sincronização pós-login concluída com sucesso');
              loginSyncCompletedRef.current = true;
              
              // Marcar último check para evitar verificações desnecessárias
              if (currentUserId) {
                localStorage.setItem(`subscription-last-check-${currentUserId}`, Date.now().toString());
              }
            } else {
              console.error('[AUTH-SYNC] Erro na sincronização pós-login:', result.error);
            }
          });
        }
      }, 100);
    }

    if (isLogout) {
      console.log('[AUTH-SYNC] Logout detectado, limpando dados de sincronização');
      // Limpar dados de cache relacionados ao usuário anterior
      if (previousUserId) {
        localStorage.removeItem(`subscription-last-check-${previousUserId}`);
        localStorage.removeItem(`subscription-focus-check-${previousUserId}`);
      }
      loginSyncCompletedRef.current = false;
    }

    // Atualizar referência do usuário anterior
    lastUserIdRef.current = currentUserId;

  }, [user, isLoading, syncSubscription, state.isLoading]);
};