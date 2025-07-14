
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Users, Plus, Trash2 } from 'lucide-react';
import { EnhancedSkeleton } from '@/components/ui/enhanced-skeleton';
import { ThumbZoneActions } from '@/components/ui/thumb-zone-actions';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
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

// Patient Item Component with Swipe Gesture
const PatientItem = ({ patient, onEdit, onDelete }: { patient: Patient; onEdit: () => void; onDelete: () => void }) => {
  const { elementRef, isSwiped, resetSwipe } = useSwipeGesture({
    onSwipeRight: () => {
      onDelete();
      resetSwipe();
    },
    threshold: 60
  });

  const documentLabel = patient.patient_type === 'company' ? 'CNPJ' : 'CPF';
  const documentValue = patient.patient_type === 'company' ? patient.cnpj : patient.cpf;

  return (
    <div className="relative">
      {/* Swipe action background */}
      <div className="swipe-actions">
        <Trash2 className="w-5 h-5 text-white" />
      </div>
      
      <div 
        ref={elementRef}
        className={cn(
          "flex justify-between items-start p-5 md:p-4 hover:bg-gray-50 transition-colors touch-manipulation swipe-item",
          isSwiped && "swiped-right"
        )}
      >
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
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export const PatientsList = ({
  patients,
  isLoading,
  searchTerm,
  hasActiveFilters,
  onEditPatient,
  onDeletePatient,
  onNewPatient
}: PatientsListProps) => {
  const isMobile = useIsMobile();

  const LoadingState = () => (
    <Card>
      <CardContent className="p-0">
        <div className="mobile-spacing p-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <EnhancedSkeleton variant="shimmer" className="h-4 w-3/4" />
                  <EnhancedSkeleton variant="pulse" className="h-3 w-1/2" />
                  <EnhancedSkeleton variant="shimmer" className="h-3 w-2/3" />
                </div>
                <EnhancedSkeleton variant="bounce" className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <Card>
      <CardContent className="p-0">
        <div className="text-center py-8 mobile-spacing">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {searchTerm || hasActiveFilters
              ? 'Nenhum paciente encontrado com os filtros aplicados' 
              : 'Nenhum paciente cadastrado'
            }
          </p>
          {!isMobile && (
            <Button onClick={onNewPatient} variant="outline" className="touch-target">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar primeiro paciente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (patients.length === 0) {
    return (
      <>
        <EmptyState />
        {isMobile && (
          <ThumbZoneActions>
            <Button onClick={onNewPatient} className="flex-1 touch-target">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar primeiro paciente
            </Button>
          </ThumbZoneActions>
        )}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="interactive-list divide-y">
            {patients.map((patient) => (
              <PatientItem
                key={patient.id}
                patient={patient}
                onEdit={() => onEditPatient(patient)}
                onDelete={() => onDeletePatient(patient)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {isMobile && (
        <ThumbZoneActions>
          <Button onClick={onNewPatient} className="flex-1 touch-target">
            <Plus className="w-4 h-4 mr-2" />
            Novo Paciente
          </Button>
        </ThumbZoneActions>
      )}
    </>
  );
};
