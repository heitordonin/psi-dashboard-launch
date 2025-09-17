import { useState, useMemo } from "react";
import type { PaymentWithPatient } from "@/types/payment";

export type SortField = 'patient' | 'description' | 'status' | 'amount' | 'due_date' | 'paid_date';
export type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

export function useTableSorting(payments: PaymentWithPatient[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  });

  const sortedPayments = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return payments;
    }

    return [...payments].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'patient':
          aValue = a.patients?.full_name || '';
          bValue = b.patients?.full_name || '';
          break;
        case 'description':
          aValue = a.description || '';
          bValue = b.description || '';
          break;
        case 'status':
          // Custom status logic for overdue
          const getStatusOrder = (payment: PaymentWithPatient) => {
            if (payment.paid_date) return 3; // Paid
            const isOverdue = !payment.paid_date && new Date(payment.due_date) < new Date();
            if (isOverdue) return 1; // Overdue
            return 2; // Pending
          };
          aValue = getStatusOrder(a);
          bValue = getStatusOrder(b);
          break;
        case 'amount':
          aValue = Number(a.amount);
          bValue = Number(b.amount);
          break;
        case 'due_date':
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
          break;
        case 'paid_date':
          aValue = a.paid_date ? new Date(a.paid_date) : new Date(0);
          bValue = b.paid_date ? new Date(b.paid_date) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [payments, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        // Same field clicked - cycle through: asc -> desc -> null
        if (prevConfig.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prevConfig.direction === 'desc') {
          return { field: null, direction: null };
        } else {
          return { field, direction: 'asc' };
        }
      } else {
        // New field clicked - start with asc
        return { field, direction: 'asc' };
      }
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction;
  };

  return {
    sortedPayments,
    handleSort,
    getSortIcon,
    sortConfig
  };
}