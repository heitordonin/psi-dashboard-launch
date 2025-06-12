
import React from 'react';
import { Button } from '@/components/ui/button';

interface PatientFormActionsProps {
  onClose: () => void;
  isLoading: boolean;
}

export const PatientFormActions = ({ onClose, isLoading }: PatientFormActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
};
