
import { useState } from "react";
import { usePaymentData } from "@/hooks/usePaymentData";
import { usePaymentFilters } from "@/hooks/usePaymentFilters";
import { PaymentsHeader } from "./PaymentsHeader";
import { PaymentFormWrapper } from "./PaymentFormWrapper";
import { PaymentsList } from "./PaymentsList";
import { PaymentsSearchFilter } from "./PaymentsSearchFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Payment } from "@/types/payment";

interface PaymentsContentProps {
  userId: string;
}

export const PaymentsContent = ({ userId }: PaymentsContentProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const { payments, paymentsLoading, deletePaymentMutation, patients } = usePaymentData(userId);
  
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    getFilteredPayments,
    hasFilters
  } = usePaymentFilters();

  const filteredPayments = getFilteredPayments(payments);

  const handleSavePayment = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleNewPayment = () => {
    setEditingPayment(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  return (
    <div className="w-full p-6 space-y-6">
      <PaymentsHeader 
        onAddPayment={handleNewPayment}
        totalPayments={payments.length}
      />

      <PaymentsSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilters}
        patients={patients}
      />

      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? 'Editar Cobrança' : 'Nova Cobrança'}
            </DialogTitle>
          </DialogHeader>
          <PaymentFormWrapper 
            payment={editingPayment}
            onSave={handleSavePayment}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <PaymentsList 
        payments={filteredPayments}
        isLoading={paymentsLoading}
        onDeletePayment={deletePaymentMutation.mutate}
        onEditPayment={handleEditPayment}
        hasFilters={hasFilters}
      />
    </div>
  );
};
