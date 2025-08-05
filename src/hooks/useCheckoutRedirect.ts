import { useEffect, useState } from 'react';
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
        const timer = setTimeout(() => {
          setIsReadyForCheckout(true);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsReadyForCheckout(false);
      setEmailNotConfirmed(false);
    }
  }, [selectedPlan, user]);

  const executeCheckout = async () => {
    if (!selectedPlan || isProcessingCheckout || !isReadyForCheckout) return;

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
        // Só limpar após checkout bem-sucedido
        window.open(data.url, '_blank');
        // Aguardar um momento antes de limpar (caso falhe a abertura da janela)
        setTimeout(() => {
          localStorage.removeItem(PLAN_STORAGE_KEY);
        }, 1000);
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
  };

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

  return {
    selectedPlan,
    isProcessingCheckout,
    isReadyForCheckout,
    emailNotConfirmed,
    invalidPlan,
    executeCheckout,
    clearSelectedPlan,
    dismissEmailModal,
    dismissInvalidPlanModal
  };
};