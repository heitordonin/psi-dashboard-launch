
import { useMemo, useState } from "react";
import type { PaymentWithPatient } from "@/types/payment";

export interface PaymentFilters {
  patientId: string;
  startDate: string;
  endDate: string;
  status: string;
  minAmount: string;
  maxAmount: string;
}

export const usePaymentFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<PaymentFilters>({
    patientId: "",
    startDate: "",
    endDate: "",
    status: "",
    minAmount: "",
    maxAmount: ""
  });

  const getFilteredPayments = (payments: PaymentWithPatient[]) => {
    return useMemo(() => {
      return payments.filter(payment => {
        const patientName = payment.patients?.full_name || '';
        const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             payment.patients?.cpf?.includes(searchTerm);
        
        const matchesPatientId = !filters.patientId || payment.patient_id === filters.patientId;
        const matchesStatus = !filters.status || payment.status === filters.status;
        
        const matchesDateRange = (() => {
          if (!filters.startDate && !filters.endDate) return true;
          const paymentDate = new Date(payment.due_date);
          const startDate = filters.startDate ? new Date(filters.startDate) : null;
          const endDate = filters.endDate ? new Date(filters.endDate) : null;
          
          if (startDate && paymentDate < startDate) return false;
          if (endDate && paymentDate > endDate) return false;
          return true;
        })();

        const matchesAmountRange = (() => {
          if (!filters.minAmount && !filters.maxAmount) return true;
          const amount = Number(payment.amount);
          const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
          const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;

          if (minAmount && amount < minAmount) return false;
          if (maxAmount && amount > maxAmount) return false;
          return true;
        })();

        return matchesSearch && matchesPatientId && matchesStatus && matchesDateRange && matchesAmountRange;
      });
    }, [payments, searchTerm, filters]);
  };

  const hasFilters = Boolean(
    searchTerm || 
    filters.status || 
    filters.patientId || 
    filters.startDate || 
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount
  );

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    getFilteredPayments,
    hasFilters
  };
};
