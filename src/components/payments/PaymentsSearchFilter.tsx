
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentAdvancedFilter } from "@/components/payments/PaymentAdvancedFilter";
import type { PaymentFilters } from "@/hooks/usePaymentFilters";

interface Patient {
  id: string;
  full_name: string;
}

interface PaymentsSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: PaymentFilters;
  onFilterChange: (filters: PaymentFilters) => void;
  patients: Patient[];
}

export const PaymentsSearchFilter = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  patients
}: PaymentsSearchFilterProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por paciente, CPF, descrição, data ou valor..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <PaymentAdvancedFilter
            currentFilters={filters}
            onFilterChange={onFilterChange}
            patients={patients}
          />
        </div>
      </CardContent>
    </Card>
  );
};
