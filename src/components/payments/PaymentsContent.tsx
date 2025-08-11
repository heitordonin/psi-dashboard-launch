
import { useState } from 'react';
import { PaymentsHeader } from './PaymentsHeader';
import { PaymentsSearchFilter } from './PaymentsSearchFilter';
import { PaymentsList } from './PaymentsList';
import { CreatePaymentWizard } from './CreatePaymentWizard';
import { usePaymentData } from '@/hooks/usePaymentData';
import { usePaymentFilters } from '@/hooks/usePaymentFilters';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Payment } from '@/types/payment';

interface PaymentsContentProps {
  userId: string;
}

export const PaymentsContent = ({ userId }: PaymentsContentProps) => {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const queryClient = useQueryClient();

  const { patients, payments, paymentsLoading, deletePaymentMutation } = usePaymentData(userId);
  const { searchTerm, setSearchTerm, filters, setFilters, getFilteredPayments, hasFilters } = usePaymentFilters();

  const filteredPayments = getFilteredPayments(payments);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['payments', userId] });
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setShowCreateWizard(true);
  };

  const handleEditPayment = (payment: Payment) => {
    // Check if payment is blocked by receita saude receipt
    if (payment.receita_saude_receipt_issued) {
      toast.error('Não é possível editar uma cobrança com recibo emitido. Desmarque no Controle Receita Saúde para permitir alterações.');
      return;
    }
    
    setEditingPayment(payment);
    setShowCreateWizard(true);
  };

  const handleCloseWizard = () => {
    setShowCreateWizard(false);
    setEditingPayment(null);
  };

  const handleDeletePayment = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    
    // Check if payment is blocked by receita saude receipt
    if (payment?.receita_saude_receipt_issued) {
      toast.error('Não é possível excluir uma cobrança com recibo emitido. Desmarque no Controle Receita Saúde para permitir alterações.');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta cobrança?')) {
      deletePaymentMutation.mutate(paymentId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 touch-pan-y">
      <PaymentsHeader 
        onAddPayment={handleAddPayment}
        totalPayments={payments.length}
      />
      
      <div className="p-4 md:p-6 space-y-6 pb-safe">
        <PaymentsSearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFilterChange={setFilters}
          patients={patients}
        />

        <PaymentsList
          payments={filteredPayments}
          isLoading={paymentsLoading}
          onDeletePayment={handleDeletePayment}
          onEditPayment={handleEditPayment}
          onAddPayment={handleAddPayment}
          onRefresh={handleRefresh}
          hasFilters={hasFilters}
          isWizardOpen={showCreateWizard}
        />
      </div>

      <CreatePaymentWizard
        isOpen={showCreateWizard}
        onClose={handleCloseWizard}
        onSuccess={handleCloseWizard}
        patients={patients}
        paymentToEdit={editingPayment}
      />
    </div>
  );
};
