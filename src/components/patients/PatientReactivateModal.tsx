
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, User } from "lucide-react";

interface DeletedPatient {
  id: string;
  full_name: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
}

interface PatientReactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deletedPatient: DeletedPatient;
  isLoading?: boolean;
}

export const PatientReactivateModal: React.FC<PatientReactivateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  deletedPatient,
  isLoading = false
}) => {
  const documentNumber = deletedPatient.cpf || deletedPatient.cnpj || 'Não informado';
  const documentType = deletedPatient.cpf ? 'CPF' : 'CNPJ';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
            <RotateCcw className="w-5 h-5" />
            Paciente Excluído Encontrado
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 space-y-3">
            <p>
              Encontramos um paciente excluído com os mesmos dados que você está tentando cadastrar:
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{deletedPatient.full_name}</span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>{documentType}:</strong> {documentNumber}</p>
                {deletedPatient.email && (
                  <p><strong>Email:</strong> {deletedPatient.email}</p>
                )}
              </div>
            </div>

            <p>
              Deseja reativar este paciente com os novos dados informados? 
              Isso manterá todo o histórico de pagamentos associado.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="mt-0" onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Reativando...' : 'Reativar Paciente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
