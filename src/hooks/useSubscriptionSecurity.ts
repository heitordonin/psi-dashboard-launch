import { useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useSubscriptionSync } from '@/contexts/SubscriptionSyncContext';
import { toast } from 'sonner';

/**
 * Hook para verificações de segurança em operações críticas
 * Garante que usuários inadimplentes não tenham acesso a features premium
 */
export const useSubscriptionSecurity = () => {
  const { userSubscription, currentPlan, hasFeature, isLoading } = useSubscription();
  const { syncSubscription } = useSubscriptionSync();

  /**
   * Verifica se o usuário pode acessar uma feature específica
   * Força sincronização se necessário
   */
  const verifyFeatureAccess = useCallback(async (feature: string, forceCheck = false) => {
    // Se está carregando, aguardar
    if (isLoading) {
      return { allowed: false, reason: 'loading' };
    }

    // Força verificação se solicitado ou se não tem dados de assinatura
    if (forceCheck || !userSubscription) {
      console.log('[SECURITY] Forçando verificação antes da operação crítica...');
      const syncResult = await syncSubscription('CRITICAL_CHECK');
      
      if (!syncResult.success) {
        console.error('[SECURITY] Falha na verificação de segurança:', syncResult.error);
        return { allowed: false, reason: 'sync_failed' };
      }
    }

    // Verificar se tem acesso à feature
    const hasAccess = hasFeature(feature as any);
    
    console.log(`[SECURITY] Verificação de acesso para ${feature}:`, {
      hasAccess,
      plan: currentPlan?.slug,
      subscriptionStatus: userSubscription?.status
    });

    return {
      allowed: hasAccess,
      reason: hasAccess ? 'allowed' : 'no_access',
      plan: currentPlan?.slug,
      subscriptionStatus: userSubscription?.status
    };
  }, [userSubscription, currentPlan, hasFeature, isLoading, syncSubscription]);

  /**
   * Verifica limite de pacientes antes de criar novo
   */
  const verifyPatientLimit = useCallback(async (currentCount: number, forceCheck = false) => {
    const accessCheck = await verifyFeatureAccess('unlimited_patients', forceCheck);
    
    if (!accessCheck.allowed) {
      const freeLimit = 3;
      if (currentCount >= freeLimit) {
        return {
          allowed: false,
          reason: 'limit_exceeded',
          limit: freeLimit,
          current: currentCount
        };
      }
    }

    return { allowed: true, reason: 'within_limit' };
  }, [verifyFeatureAccess]);

  /**
   * Middleware para operações que requerem plano premium
   */
  const requirePremiumAccess = useCallback(async (
    operation: () => Promise<void> | void,
    feature: string,
    onAccessDenied?: () => void
  ) => {
    const accessCheck = await verifyFeatureAccess(feature, true);

    if (!accessCheck.allowed) {
      const message = accessCheck.reason === 'sync_failed' 
        ? 'Erro ao verificar assinatura. Tente novamente.'
        : 'Esta funcionalidade requer um plano premium.';
      
      toast.error(message);
      
      if (onAccessDenied) {
        onAccessDenied();
      }
      
      return false;
    }

    try {
      await operation();
      return true;
    } catch (error) {
      console.error('[SECURITY] Erro na operação protegida:', error);
      toast.error('Erro ao executar operação');
      return false;
    }
  }, [verifyFeatureAccess]);

  /**
   * Verifica se a assinatura expirou recentemente
   */
  const checkSubscriptionHealth = useCallback(() => {
    if (!userSubscription || !currentPlan) {
      return { healthy: false, reason: 'no_subscription' };
    }

    const now = new Date();
    const expiresAt = userSubscription.expires_at ? new Date(userSubscription.expires_at) : null;

    // Verificar se expirou
    if (expiresAt && expiresAt < now) {
      return { 
        healthy: false, 
        reason: 'expired',
        expiredAt: expiresAt 
      };
    }

    // Verificar se expira em breve (próximos 3 dias)
    if (expiresAt) {
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (expiresAt < threeDaysFromNow) {
        return {
          healthy: true,
          warning: 'expires_soon',
          expiresAt
        };
      }
    }

    return { healthy: true, reason: 'active' };
  }, [userSubscription, currentPlan]);

  return {
    verifyFeatureAccess,
    verifyPatientLimit,
    requirePremiumAccess,
    checkSubscriptionHealth,
    isLoading
  };
};