
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Users, Plus } from 'lucide-react';
import type { Patient } from '@/types/patient';

interface PatientsListProps {
  patients: Patient[];
  isLoading: boolean;
  searchTerm: string;
  hasActiveFilters: boolean;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patient: Patient) => void;
  onNewPatient: () => void;
}

export const PatientsList = ({
  patients,
  isLoading,
  searchTerm,
  hasActiveFilters,
  onEditPatient,
  onDeletePatient,
  onNewPatient
}: PatientsListProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando pacientes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchTerm || hasActiveFilters
                ? 'Nenhum paciente encontrado com os filtros aplicados' 
                : 'Nenhum paciente cadastrado'
              }
            </p>
            <Button onClick={onNewPatient} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar primeiro paciente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="interactive-list divide-y">
          {patients.map((patient) => {
            const documentLabel = patient.patient_type === 'company' ? 'CNPJ' : 'CPF';
            const documentValue = patient.patient_type === 'company' ? patient.cnpj : patient.cpf;
            
            return (
              <div key={patient.id} className="flex justify-between items-start p-5 md:p-4 hover:bg-gray-50 transition-colors touch-manipulation">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-medium text-base md:text-sm text-gray-900 truncate">{patient.full_name}</p>
                  <p className="text-sm md:text-xs text-gray-600 mt-2 md:mt-1">
                    {documentLabel}: {documentValue}
                  </p>
                  {patient.email && (
                    <p className="text-sm md:text-xs text-gray-600 mt-1">Email: {patient.email}</p>
                  )}
                  {patient.phone && (
                    <p className="text-sm md:text-xs text-gray-600 mt-1">Telefone: {patient.phone}</p>
                  )}
                  {patient.has_financial_guardian && (
                    <p className="text-sm md:text-xs text-green-600 mt-2 md:mt-1">Possui responsável financeiro</p>
                  )}
                  {patient.is_payment_from_abroad && (
                    <p className="text-sm md:text-xs text-blue-600 mt-1">Pagamento do exterior</p>
                  )}
                  <p className="text-sm md:text-xs text-gray-500 mt-2 md:mt-1 capitalize">
                    {patient.patient_type === 'individual' ? 'Pessoa Física' : 'Empresa'}
                  </p>
                </div>
                <ActionDropdown
                  onEdit={() => onEditPatient(patient)}
                  onDelete={() => onDeletePatient(patient)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
