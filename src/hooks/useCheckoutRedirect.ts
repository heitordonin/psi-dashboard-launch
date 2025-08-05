import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isValidPlan, ValidPlan } from '@/utils/planValidation';
import { toast } from 'sonner';

const PLAN_STORAGE_KEY = 'selectedPlan';

export const useCheckoutRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<ValidPlan | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  useEffect(() => {
    // Verificar parâmetro da URL
    const planParam = searchParams.get('plan');
    
    if (planParam && isValidPlan(planParam)) {
      setSelectedPlan(planParam);
      localStorage.setItem(PLAN_STORAGE_KEY, planParam);
    } else {
      // Verificar localStorage
      const storedPlan = localStorage.getItem(PLAN_STORAGE_KEY);
      if (storedPlan && isValidPlan(storedPlan)) {
        setSelectedPlan(storedPlan);
      }
    }
  }, [searchParams]);

  const executeCheckout = async () => {
    if (!selectedPlan || isProcessingCheckout) return;

    setIsProcessingCheckout(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { planSlug: selectedPlan }
      });

      if (error) throw error;

      if (data?.url) {
        // Limpar plano do storage após redirect bem-sucedido
        localStorage.removeItem(PLAN_STORAGE_KEY);
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast.error('Erro ao processar checkout. Tente novamente.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const clearSelectedPlan = () => {
    setSelectedPlan(null);
    localStorage.removeItem(PLAN_STORAGE_KEY);
  };

  return {
    selectedPlan,
    isProcessingCheckout,
    executeCheckout,
    clearSelectedPlan
  };
};