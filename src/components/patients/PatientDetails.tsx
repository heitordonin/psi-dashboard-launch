import React from 'react';
import { Edit2, Mail, Phone, MapPin, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedSkeleton } from '@/components/ui/enhanced-skeleton';
import { formatCurrency } from '@/utils/priceFormatter';
import { cn } from '@/lib/utils';
import { MobilePatientHeader } from './MobilePatientHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Patient } from '@/types/patient';
import type { PaymentWithPatient } from '@/types/payment';
interface PatientDetailsProps {
  patient?: Patient;
  charges: PaymentWithPatient[];
  isLoading: boolean;
  onEditPatient: () => void;
  onBack?: () => void;
}
export const PatientDetails = ({
  patient,
  charges,
  isLoading,
  onEditPatient,
  onBack
}: PatientDetailsProps) => {
  const isMobile = useIsMobile();
  if (!patient) {
    if (isMobile) {
      return null; // Don't show placeholder on mobile
    }
    return <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <div className="text-gray-400 mb-4">
            <CreditCard className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600">
            Selecione um paciente na lista ao lado para ver seus detalhes
          </p>
        </CardContent>
      </Card>;
  }

  // Filter charges for this patient
  const patientCharges = charges.filter(charge => charge.patient_id === patient.id);

  // Separate pending and paid charges
  const pendingCharges = patientCharges.filter(charge => charge.status === 'pending');
  const paidCharges = patientCharges.filter(charge => charge.status === 'paid');

  // Calculate overdue charges
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCharges = pendingCharges.filter(charge => new Date(charge.due_date) < today);

  // Calculate totals
  const totalPending = pendingCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const totalPaid = paidCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const totalOverdue = overdueCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const documentLabel = patient.patient_type === 'company' ? 'CNPJ' : 'CPF';
  const documentValue = patient.patient_type === 'company' ? patient.cnpj : patient.cpf;
  const truncateDescription = (description: string, maxLength: number = 12): string => {
    if (!description || description.length <= maxLength) return description || 'Sem descrição';
    return description.substring(0, maxLength) + '...';
  };
  const LoadingState = () => <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <EnhancedSkeleton variant="shimmer" className="h-8 w-48" />
        <EnhancedSkeleton variant="pulse" className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <EnhancedSkeleton variant="shimmer" className="h-24 rounded-lg" />
        <EnhancedSkeleton variant="pulse" className="h-24 rounded-lg" />
      </div>
    </div>;
  if (isLoading) {
    return <Card className="h-full">
        <LoadingState />
      </Card>;
  }
  const PendingChargesTable = ({
    charges
  }: {
    charges: PaymentWithPatient[];
  }) => <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-3 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
        <div>Descrição</div>
        <div className="text-center">Vencimento</div>
        <div className="text-right">Valor</div>
      </div>
      
      {/* Rows */}
      <div className="space-y-2">
        {charges.map(charge => {
        const isOverdue = new Date(charge.due_date) < new Date();
        return <div key={charge.id} className="grid grid-cols-3 gap-4 py-2 border-b border-border/50 hover:bg-muted/30 transition-colors">
              <div className={`text-sm ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                {truncateDescription(charge.description || '')}
              </div>
              <div className={`text-sm text-center ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                {new Date(charge.due_date).toLocaleDateString('pt-BR')}
              </div>
              <div className={`text-sm text-right font-medium ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                {formatCurrency(charge.amount)}
              </div>
            </div>;
      })}
      </div>
    </div>;
  const PaidChargesTable = ({
    charges
  }: {
    charges: PaymentWithPatient[];
  }) => <div className="space-y-3">
      {/* Header */}
      <div className={`grid gap-3 pb-2 border-b text-sm font-medium text-muted-foreground ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
        <div>Descrição</div>
        {!isMobile && <div className="text-center">Vencimento</div>}
        <div className="text-center">Pagamento</div>
        <div className="text-right">Valor</div>
      </div>
      
      {/* Rows */}
      <div className="space-y-2">
        {charges.map(charge => <div key={charge.id} className={`grid gap-3 py-2 border-b border-border/50 hover:bg-muted/30 transition-colors ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
            <div className="text-sm text-foreground">
              {truncateDescription(charge.description || '')}
            </div>
            {!isMobile && <div className="text-sm text-center text-muted-foreground">
                {new Date(charge.due_date).toLocaleDateString('pt-BR')}
              </div>}
            <div className="text-sm text-center text-muted-foreground">
              {charge.paid_date ? new Date(charge.paid_date).toLocaleDateString('pt-BR') : '-'}
            </div>
            <div className="text-sm text-right font-medium text-foreground">
              {formatCurrency(charge.amount)}
            </div>
          </div>)}
      </div>
    </div>;
  return <>
      {/* Mobile Header */}
      {isMobile && onBack && <MobilePatientHeader patient={patient} onBack={onBack} onEdit={onEditPatient} />}

      <Card className="h-full flex flex-col">
        {/* Desktop Header */}
        {!isMobile && <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{patient.full_name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {documentLabel}: {documentValue}
                </p>
              </div>
              <Button onClick={onEditPatient} size="sm" variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </CardHeader>}

      <CardContent className="flex-1 overflow-hidden space-y-6">
        {/* Patient Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-3">Informações Básicas</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{patient.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{patient.phone || 'Não informado'}</span>
                </div>
                {(patient.street || patient.city) && <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>
                      {[patient.street, patient.street_number, patient.neighborhood, patient.city, patient.state].filter(Boolean).join(', ') || 'Não informado'}
                    </span>
                  </div>}
                <div className="text-sm">
                  <span className="font-medium">Tipo: </span>
                  {patient.patient_type === 'individual' ? 'Pessoa Física' : 'Empresa'}
                </div>
                {patient.has_financial_guardian && <Badge variant="secondary" className="text-xs">
                    Possui responsável financeiro
                  </Badge>}
                {patient.is_payment_from_abroad && <Badge variant="outline" className="text-xs">
                    Pagamento do exterior
                  </Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-3">Resumo Financeiro</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">A receber:</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(totalPending)}
                  </span>
                </div>
                {totalOverdue > 0 && <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Vencidas:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(totalOverdue)}
                    </span>
                  </div>}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Recebido:</span>
                  <span className="font-semibold text-blue-700">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charges Sections */}
        <div className="grid grid-cols-1 gap-4 flex-1 overflow-hidden">
          {/* Pending Charges */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-base">Cobranças a Receber</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {pendingCharges.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="h-full overflow-y-auto px-6 pb-6">
                {pendingCharges.length === 0 ? <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Nenhuma cobrança pendente
                    </p>
                  </div> : <PendingChargesTable charges={[...overdueCharges, ...pendingCharges.filter(charge => !overdueCharges.includes(charge))]} />}
              </div>
            </CardContent>
          </Card>

          {/* Paid Charges */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <CardTitle className="text-base">Cobranças Recebidas</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {paidCharges.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="h-full overflow-y-auto px-6 pb-6">
                {paidCharges.length === 0 ? <div className="text-center py-6">
                    <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    
                  </div> : <PaidChargesTable charges={paidCharges} />}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      </Card>
    </>;
};