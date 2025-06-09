
import { useState } from "react";
import { PaymentFormWrapper } from "@/components/payments/PaymentFormWrapper";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { PaymentsSearchFilter } from "@/components/payments/PaymentsSearchFilter";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { PaymentsHeader } from "@/components/payments/PaymentsHeader";
import { usePaymentData } from "@/hooks/usePaymentData";
import { usePaymentFilters } from "@/hooks/usePaymentFilters";
import type { Payment } from "@/types/payment";

interface PaymentsContentProps {
  userId: string;
}

export const PaymentsContent = ({ userId }: PaymentsContentProps) => {
  const { patients, payments, paymentsLoading, deletePaymentMutation } = usePaymentData(userId);
  const { searchTerm, setSearchTerm, filters, setFilters, getFilteredPayments, hasFilters } = usePaymentFilters();
  
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  const filteredPayments = getFilteredPayments(payments);

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    setDeletePaymentId(paymentId);
  };

  const confirmDelete = () => {
    if (deletePaymentId) {
      deletePaymentMutation.mutate(deletePaymentId);
      setDeletePaymentId(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  const handleNewPayment = () => {
    setEditingPayment(null);
    setShowForm(true);
  };

  return (
    <>
      <PaymentsHeader onNewPayment={handleNewPayment} />
      
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6 overflow-x-hidden">
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
          hasFilters={hasFilters}
          onEdit={handleEditPayment}
          onDelete={handleDeletePayment}
          onNewPayment={handleNewPayment}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto mx-2">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4">
                {editingPayment ? 'Editar Cobrança' : 'Nova Cobrança'}
              </h2>
              <PaymentFormWrapper
                payment={editingPayment}
                onSave={handleFormClose}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={!!deletePaymentId}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={confirmDelete}
        title="Excluir Cobrança"
        description={`Tem certeza de que deseja excluir esta cobrança? Esta ação não pode ser desfeita.`}
        isLoading={deletePaymentMutation.isPending}
      />
    </>
  );
};
