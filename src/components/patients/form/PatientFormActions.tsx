
import React from 'react';
import { Button } from '@/components/ui/button';

interface PatientFormActionsProps {
  onClose: () => void;
  isLoading: boolean;
}

export const PatientFormActions = ({ onClose, isLoading }: PatientFormActionsProps) => {
  return (
    <div className="flex gap-3 pt-4">
      <Button type="button" variant="outline" onClick={onClose} className="flex-1 touch-target">
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading} className="flex-1 touch-target">
        {isLoading ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
};
