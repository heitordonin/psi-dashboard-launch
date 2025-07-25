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
      
      // OTIMIZADO: Verificar apenas se necessário e com debounce maior
      setTimeout(() => {
        if (!state.isLoading && !loginSyncCompletedRef.current) {
          // Verificar se já foi sincronizado recentemente para evitar duplicação
          const lastCheck = localStorage.getItem(`subscription-last-check-${currentUserId}`);
          const now = Date.now();
          const minInterval = 30 * 1000; // 30 segundos mínimo entre checks
          
          if (!lastCheck || now - parseInt(lastCheck) > minInterval) {
            const context = isLogin ? 'AUTH_LOGIN' : 'AUTH_USER_CHANGE';
            console.log(`[AUTH-SYNC] ${context} - Sincronizando após debounce...`);
            
            syncSubscription(context).then((result) => {
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
          } else {
            console.log('[AUTH-SYNC] Sincronização pulada - muito recente');
            loginSyncCompletedRef.current = true;
          }
        }
      }, 500); // Aumentado de 100ms para 500ms
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