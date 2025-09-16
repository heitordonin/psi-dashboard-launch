import React from 'react';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedSkeleton } from '@/components/ui/enhanced-skeleton';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types/patient';
interface PatientSidebarProps {
  patients: Patient[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPatientId?: string;
  onPatientSelect: (patient: Patient) => void;
  onNewPatient: () => void;
}
export const PatientSidebar = ({
  patients,
  isLoading,
  searchTerm,
  onSearchChange,
  selectedPatientId,
  onPatientSelect,
  onNewPatient
}: PatientSidebarProps) => {
  // Sort patients alphabetically
  const sortedPatients = [...patients].sort((a, b) => a.full_name.localeCompare(b.full_name));
  const LoadingState = () => <div className="space-y-3 p-4">
      {[...Array(8)].map((_, index) => <div key={index} className="space-y-2">
          <EnhancedSkeleton variant="shimmer" className="h-4 w-full" />
          <EnhancedSkeleton variant="pulse" className="h-3 w-2/3" />
        </div>)}
    </div>;
  const EmptyState = () => <div className="text-center p-6">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 mb-4">
        {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
      </p>
      <Button onClick={onNewPatient} size="sm">
        Cadastrar Paciente
      </Button>
    </div>;
  const PatientItem = ({
    patient
  }: {
    patient: Patient;
  }) => {
    const isSelected = selectedPatientId === patient.id;
    const documentValue = patient.patient_type === 'company' ? patient.cnpj : patient.cpf;
    return <div className={cn("p-3 cursor-pointer rounded-lg transition-colors border", isSelected ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-white hover:bg-gray-50 border-gray-200")} onClick={() => onPatientSelect(patient)}>
        <div className="space-y-1">
          <p className={cn("font-medium text-sm truncate", isSelected ? "text-primary" : "text-gray-900")}>
            {patient.full_name}
          </p>
          <p className="text-xs text-gray-600">
            {patient.patient_type === 'company' ? 'CNPJ' : 'CPF'}: {documentValue}
          </p>
        </div>
      </div>;
  };
  return <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pacientes</CardTitle>
          
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar por nome ou CPF/CNPJ..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto">
          {isLoading ? <LoadingState /> : sortedPatients.length === 0 ? <EmptyState /> : <div className="space-y-2 p-4">
              {sortedPatients.map(patient => <PatientItem key={patient.id} patient={patient} />)}
            </div>}
        </div>
      </CardContent>
    </Card>;
};