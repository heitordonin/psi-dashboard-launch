
import { useState } from 'react';
import { PaymentsHeader } from './PaymentsHeader';
import { PaymentsSearchFilter } from './PaymentsSearchFilter';
import { PaymentsList } from './PaymentsList';
import { PaymentFormWrapper } from './PaymentFormWrapper';
import { CreatePaymentWizard } from './CreatePaymentWizard';
import { usePaymentData } from '@/hooks/usePaymentData';
import { usePaymentFilters } from '@/hooks/usePaymentFilters';
import type { Payment } from '@/types/payment';

interface PaymentsContentProps {
  userId: string;
}

export const PaymentsContent = ({ userId }: PaymentsContentProps) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const { patients, payments, paymentsLoading, deletePaymentMutation } = usePaymentData(userId);
  const { searchTerm, setSearchTerm, filters, setFilters, getFilteredPayments, hasFilters } = usePaymentFilters();

  const filteredPayments = getFilteredPayments(payments);

  const handleAddPayment = () => {
    setShowCreateWizard(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowPaymentForm(true);
  };

  const handleClosePaymentForm = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  const handleCloseWizard = () => {
    setShowCreateWizard(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta cobrança?')) {
      deletePaymentMutation.mutate(paymentId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PaymentsHeader 
        onAddPayment={handleAddPayment}
        totalPayments={payments.length}
      />
      
      <div className="p-6 space-y-6">
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
          hasFilters={hasFilters}
        />
      </div>

      {/* Create Payment Wizard */}
      <CreatePaymentWizard
        isOpen={showCreateWizard}
        onClose={handleCloseWizard}
        onSuccess={handleCloseWizard}
      />

      {/* Edit Payment Form (existing modal) */}
      {showPaymentForm && editingPayment && (
        <PaymentFormWrapper
          payment={editingPayment}
          patients={patients}
          onClose={handleClosePaymentForm}
        />
      )}
    </div>
  );
};
