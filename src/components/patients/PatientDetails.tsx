import React from 'react';
import { Edit2, Mail, Phone, MapPin, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedSkeleton } from '@/components/ui/enhanced-skeleton';
import { formatCurrency } from '@/utils/priceFormatter';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types/patient';
import type { PaymentWithPatient } from '@/types/payment';

interface PatientDetailsProps {
  patient?: Patient;
  charges: PaymentWithPatient[];
  isLoading: boolean;
  onEditPatient: () => void;
}

export const PatientDetails = ({
  patient,
  charges,
  isLoading,
  onEditPatient
}: PatientDetailsProps) => {
  if (!patient) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <div className="text-gray-400 mb-4">
            <CreditCard className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600">
            Selecione um paciente na lista ao lado para ver seus detalhes
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter charges for this patient
  const patientCharges = charges.filter(charge => charge.patient_id === patient.id);
  
  // Separate pending and paid charges
  const pendingCharges = patientCharges.filter(charge => charge.status === 'pending');
  const paidCharges = patientCharges.filter(charge => charge.status === 'paid');
  
  // Calculate overdue charges
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCharges = pendingCharges.filter(charge => 
    new Date(charge.due_date) < today
  );
  
  // Calculate totals
  const totalPending = pendingCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const totalPaid = paidCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);
  const totalOverdue = overdueCharges.reduce((sum, charge) => sum + Number(charge.amount), 0);

  const documentLabel = patient.patient_type === 'company' ? 'CNPJ' : 'CPF';
  const documentValue = patient.patient_type === 'company' ? patient.cnpj : patient.cpf;

  const LoadingState = () => (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <EnhancedSkeleton variant="shimmer" className="h-8 w-48" />
        <EnhancedSkeleton variant="pulse" className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <EnhancedSkeleton variant="shimmer" className="h-24 rounded-lg" />
        <EnhancedSkeleton variant="pulse" className="h-24 rounded-lg" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="h-full">
        <LoadingState />
      </Card>
    );
  }

  const ChargeItem = ({ charge, isOverdue = false }: { charge: PaymentWithPatient; isOverdue?: boolean }) => (
    <div className={cn(
      "flex justify-between items-center p-3 rounded-lg border",
      isOverdue ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
    )}>
      <div className="flex-1">
        <p className={cn(
          "font-medium text-sm",
          isOverdue ? "text-red-900" : "text-gray-900"
        )}>
          {charge.description || 'Cobrança'}
        </p>
        <p className={cn(
          "text-xs",
          isOverdue ? "text-red-600" : "text-gray-600"
        )}>
          Vencimento: {new Date(charge.due_date).toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div className="text-right">
        <p className={cn(
          "font-semibold text-sm",
          isOverdue ? "text-red-700" : "text-gray-900"
        )}>
          {formatCurrency(charge.amount)}
        </p>
        {isOverdue && (
          <Badge variant="destructive" className="text-xs">
            Vencida
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
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
      </CardHeader>

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
                {(patient.street || patient.city) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>
                      {[patient.street, patient.street_number, patient.neighborhood, patient.city, patient.state]
                        .filter(Boolean)
                        .join(', ') || 'Não informado'}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Tipo: </span>
                  {patient.patient_type === 'individual' ? 'Pessoa Física' : 'Empresa'}
                </div>
                {patient.has_financial_guardian && (
                  <Badge variant="secondary" className="text-xs">
                    Possui responsável financeiro
                  </Badge>
                )}
                {patient.is_payment_from_abroad && (
                  <Badge variant="outline" className="text-xs">
                    Pagamento do exterior
                  </Badge>
                )}
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
                {totalOverdue > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Vencidas:</span>
                    <span className="font-semibold text-red-700">
                      {formatCurrency(totalOverdue)}
                    </span>
                  </div>
                )}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
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
                {pendingCharges.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Nenhuma cobrança pendente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Show overdue charges first */}
                    {overdueCharges.map((charge) => (
                      <ChargeItem key={charge.id} charge={charge} isOverdue />
                    ))}
                    {/* Then show regular pending charges */}
                    {pendingCharges
                      .filter(charge => !overdueCharges.includes(charge))
                      .map((charge) => (
                        <ChargeItem key={charge.id} charge={charge} />
                      ))}
                  </div>
                )}
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
                {paidCharges.length === 0 ? (
                  <div className="text-center py-6">
                    <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Nenhuma cobrança recebida
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paidCharges.map((charge) => (
                      <div 
                        key={charge.id}
                        className="flex justify-between items-center p-3 rounded-lg bg-green-50 border border-green-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-green-900">
                            {charge.description || 'Cobrança'}
                          </p>
                          <p className="text-xs text-green-600">
                            Pago em: {charge.paid_date ? new Date(charge.paid_date).toLocaleDateString('pt-BR') : 'Data não informada'}
                          </p>
                        </div>
                        <p className="font-semibold text-sm text-green-700">
                          {formatCurrency(charge.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};