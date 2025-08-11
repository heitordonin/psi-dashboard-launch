import { useState } from 'react';
import { validatePaymentDateReceitaSaude } from '@/utils/receitaSaudeValidation';
import { useSubscription } from '@/hooks/useSubscription';

interface UsePaymentDateHandlerProps {
  onDateChange: (date: string) => void;
  onSubmitWithRetroactiveDate: () => void;
}

export function usePaymentDateHandler({ onDateChange, onSubmitWithRetroactiveDate }: UsePaymentDateHandlerProps) {
  const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState<string>('');
  const [hasRetroactiveWarning, setHasRetroactiveWarning] = useState(false);
  const { currentPlan } = useSubscription();

  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) {
      onDateChange('');
      setHasRetroactiveWarning(false);
      return;
    }

    const formattedDate = formatDateForDatabase(date);
    
    console.log('🔄 usePaymentDateHandler - Validando data de recebimento:', {
      formattedDate,
      currentPlan: currentPlan?.slug
    });
    
    // Verificar se é plano Psi Regular - apenas eles recebem o aviso de mês fechado
    if (currentPlan?.slug !== 'psi_regular') {
      console.log('✅ usePaymentDateHandler - Plano não é Psi Regular, permitindo sem validação:', formattedDate);
      onDateChange(formattedDate);
      setHasRetroactiveWarning(false);
      return;
    }
    
    const validation = validatePaymentDateReceitaSaude(formattedDate);
    
    if (!validation.isValid) {
      console.log('❌ usePaymentDateHandler - Data retroativa detectada para Psi Regular');
      setPendingDate(formattedDate);
      setShowRetroactiveDialog(true);
      setHasRetroactiveWarning(true);
    } else {
      console.log('✅ usePaymentDateHandler - Data válida');
      onDateChange(formattedDate);
      setHasRetroactiveWarning(false);
    }
  };

  const handleRetroactiveConfirm = () => {
    onDateChange(pendingDate);
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate('');
    onSubmitWithRetroactiveDate();
  };

  const handleRetroactiveCancel = () => {
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate('');
  };

  return {
    showRetroactiveDialog,
    pendingDate,
    hasRetroactiveWarning,
    handleDateChange,
    handleRetroactiveConfirm,
    handleRetroactiveCancel
  };
}