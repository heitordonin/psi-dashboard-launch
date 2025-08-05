import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { isValidPlan, ValidPlan, validatePlanFromUrl } from '@/utils/planValidation';
import { toast } from 'sonner';

const PLAN_STORAGE_KEY = 'selectedPlan';
const CHECKOUT_DEBOUNCE_MS = 2000;

export const useCheckoutRedirect = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<ValidPlan | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isReadyForCheckout, setIsReadyForCheckout] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [invalidPlan, setInvalidPlan] = useState(false);
  const [lastCheckoutAttempt, setLastCheckoutAttempt] = useState(0);
  const [isCheckingEmailStatus, setIsCheckingEmailStatus] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Verificar parâmetro da URL
    const planParam = searchParams.get('plan');
    
    if (planParam) {
      // Validação robusta de planos
      const validation = validatePlanFromUrl(planParam);
      
      if (validation.isValid && validation.plan) {
        setSelectedPlan(validation.plan);
        localStorage.setItem(PLAN_STORAGE_KEY, validation.plan);
        setInvalidPlan(false);
      } else {
        setInvalidPlan(true);
        setSelectedPlan(null);
        localStorage.removeItem(PLAN_STORAGE_KEY);
        return;
      }
    } else {
      // Verificar localStorage
      const storedPlan = localStorage.getItem(PLAN_STORAGE_KEY);
      if (storedPlan && isValidPlan(storedPlan)) {
        setSelectedPlan(storedPlan);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    // Limpar todos os timers anteriores se existirem
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Verificar se está pronto para checkout
    if (selectedPlan && user) {
      // Verificar se email foi confirmado
      const emailConfirmed = user.email_confirmed_at !== null;
      
      if (!emailConfirmed) {
        setEmailNotConfirmed(true);
        setIsReadyForCheckout(false);
      } else {
        setEmailNotConfirmed(false);
        // Aguardar estabilização do estado antes de permitir checkout
        timerRef.current = setTimeout(() => {
          setIsReadyForCheckout(true);
        }, 500);
      }
    } else {
      setIsReadyForCheckout(false);
      setEmailNotConfirmed(false);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [selectedPlan, user]);

  // Cleanup global para todos os timers
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };
  }, []);

  const executeCheckout = useCallback(async () => {
    // Prevenir múltiplas execuções simultâneas
    if (!selectedPlan || isProcessingCheckout || !isReadyForCheckout || isCheckingEmailStatus) {
      console.log('Checkout bloqueado:', { selectedPlan, isProcessingCheckout, isReadyForCheckout, isCheckingEmailStatus });
      return;
    }

    // Rate limiting no frontend
    const now = Date.now();
    if (now - lastCheckoutAttempt < CHECKOUT_DEBOUNCE_MS) {
      toast.error('Aguarde um momento antes de tentar novamente.');
      return;
    }
    setLastCheckoutAttempt(now);

    // Verificar email confirmado novamente
    if (!user?.email_confirmed_at) {
      setEmailNotConfirmed(true);
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { planSlug: selectedPlan }
      });

      if (error) throw error;

      if (data?.url) {
        // Tentar abrir em nova aba
        const newWindow = window.open(data.url, '_blank');
        
        // Verificar se popup foi bloqueado ou falhou
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Fallback: redirect direto
          toast.info('Redirecionando para o checkout...');
          fallbackTimerRef.current = setTimeout(() => {
            window.location.href = data.url;
          }, 1000);
        } else {
          // Popup aberto com sucesso
          toast.success('Checkout aberto em nova aba');
          
          // Aguardar confirmação antes de limpar
          cleanupTimerRef.current = setTimeout(() => {
            // Verificar se a janela ainda está aberta
            if (!newWindow.closed) {
              localStorage.removeItem(PLAN_STORAGE_KEY);
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      
      // Tratamento de erros específicos
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('email not confirmed')) {
        setEmailNotConfirmed(true);
        toast.error('Email não confirmado. Verifique sua caixa de entrada.');
      } else if (errorMessage.includes('Rate limit exceeded')) {
        toast.error('Muitas tentativas. Tente novamente em alguns minutos.');
      } else {
        toast.error('Erro ao processar checkout. Tente novamente.');
      }
    } finally {
      setIsProcessingCheckout(false);
    }
  }, [selectedPlan, isProcessingCheckout, isReadyForCheckout, isCheckingEmailStatus, lastCheckoutAttempt, user]);

  const clearSelectedPlan = () => {
    setSelectedPlan(null);
    localStorage.removeItem(PLAN_STORAGE_KEY);
  };

  const dismissEmailModal = () => {
    setEmailNotConfirmed(false);
  };

  const dismissInvalidPlanModal = () => {
    setInvalidPlan(false);
    clearSelectedPlan();
  };

  // Computed state para loading unificado
  const isAnyLoading = isProcessingCheckout || isCheckingEmailStatus;
  const canExecuteCheckout = selectedPlan && isReadyForCheckout && !isAnyLoading && user?.email_confirmed_at;

  return {
    selectedPlan,
    isProcessingCheckout,
    isReadyForCheckout,
    emailNotConfirmed,
    invalidPlan,
    isCheckingEmailStatus,
    isAnyLoading,
    canExecuteCheckout,
    executeCheckout,
    clearSelectedPlan,
    dismissEmailModal,
    dismissInvalidPlanModal,
    setIsCheckingEmailStatus
  };
};