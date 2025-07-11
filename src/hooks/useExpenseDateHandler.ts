import { useState } from 'react';
import { validateExpenseDateReceitaSaude } from '@/utils/receitaSaudeValidation';

interface UseExpenseDateHandlerProps {
  onDateChange: (date: string) => void;
}

export function useExpenseDateHandler({ onDateChange }: UseExpenseDateHandlerProps) {
  const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState<string>('');
  const [hasRetroactiveWarning, setHasRetroactiveWarning] = useState(false);

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
    
    console.log('🔄 useExpenseDateHandler - Validando data de despesa:', {
      formattedDate
    });
    
    const validation = validateExpenseDateReceitaSaude(formattedDate);
    
    if (!validation.isValid) {
      console.log('❌ useExpenseDateHandler - Data retroativa detectada');
      setPendingDate(formattedDate);
      setShowRetroactiveDialog(true);
      setHasRetroactiveWarning(true);
    } else {
      console.log('✅ useExpenseDateHandler - Data válida');
      onDateChange(formattedDate);
      setHasRetroactiveWarning(false);
    }
  };

  const handleRetroactiveConfirm = () => {
    onDateChange(pendingDate);
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate('');
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