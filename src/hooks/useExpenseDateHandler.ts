import { useState } from 'react';
import { validateExpenseDateReceitaSaude } from '@/utils/receitaSaudeValidation';

interface UseExpenseDateHandlerProps {
  onDateChange: (date: string) => void;
  onPopoverClose?: () => void;
}

export function useExpenseDateHandler({ onDateChange, onPopoverClose }: UseExpenseDateHandlerProps) {
  const [showRetroactiveDialog, setShowRetroactiveDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState<string>('');
  const [hasRetroactiveWarning, setHasRetroactiveWarning] = useState(false);

  const formatDateForDatabase = (date: Date): string => {
    // Use local timezone to avoid offset issues
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

    console.log('🔄 useExpenseDateHandler - Data recebida do calendário:', {
      originalDate: date,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      toISOString: date.toISOString(),
      toDateString: date.toDateString(),
    });

    const formattedDate = formatDateForDatabase(date);
    
    console.log('🔄 useExpenseDateHandler - Data formatada para database:', {
      formattedDate,
      originalDate: date
    });
    
    const validation = validateExpenseDateReceitaSaude(formattedDate);
    
    if (!validation.isValid) {
      console.log('❌ useExpenseDateHandler - Data retroativa detectada');
      setPendingDate(formattedDate);
      setShowRetroactiveDialog(true);
      setHasRetroactiveWarning(true);
    } else {
      console.log('✅ useExpenseDateHandler - Data válida, enviando:', formattedDate);
      onDateChange(formattedDate);
      setHasRetroactiveWarning(false);
      onPopoverClose?.();
    }
  };

  const handleRetroactiveConfirm = () => {
    onDateChange(pendingDate);
    setShowRetroactiveDialog(false);
    setHasRetroactiveWarning(false);
    setPendingDate('');
    onPopoverClose?.();
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