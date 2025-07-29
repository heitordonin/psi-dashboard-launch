
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { AdvancedFilterDialog } from "@/components/ui/advanced-filter-dialog";

export interface ReceitaSaudeFilters {
  patientId: string;
  startDate: string;
  endDate: string;
  status: string;
  minAmount: string;
  maxAmount: string;
  receiptStatus: string;
}

interface ReceitaSaudeAdvancedFilterProps {
  onFilterChange: (filters: ReceitaSaudeFilters) => void;
  currentFilters: ReceitaSaudeFilters;
  patients: Array<{ id: string; full_name: string }>;
}

export function ReceitaSaudeAdvancedFilter({ 
  onFilterChange, 
  currentFilters, 
  patients 
}: ReceitaSaudeAdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<ReceitaSaudeFilters>(currentFilters);

  const hasActiveFilters = Object.values(currentFilters).some(value => value !== "");

  const handleApplyFilters = () => {
    const processedFilters = {
      ...filters,
      patientId: filters.patientId === "__all" ? "" : filters.patientId,
      status: filters.status === "__all" ? "" : filters.status,
      receiptStatus: filters.receiptStatus === "__all" ? "" : filters.receiptStatus
    };
    onFilterChange(processedFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: ReceitaSaudeFilters = {
      patientId: "",
      startDate: "",
      endDate: "",
      status: "",
      minAmount: "",
      maxAmount: "",
      receiptStatus: ""
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  const triggerButton = (
    <Button variant="outline" className="whitespace-nowrap relative">
      <Filter className="w-4 h-4 mr-2" />
      Filtros
      {hasActiveFilters && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </Button>
  );

  return (
    <AdvancedFilterDialog
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Filtros Avançados"
      trigger={triggerButton}
      onApply={handleApplyFilters}
      onClear={handleClearFilters}
      hasActiveFilters={hasActiveFilters}
    >
      <div>
        <Label htmlFor="patient">Paciente</Label>
        <Select 
          value={filters.patientId || "__all"} 
          onValueChange={(value) => setFilters({ ...filters, patientId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os pacientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos os pacientes</SelectItem>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="startDate">Data início (pagamento)</Label>
        <Input
          id="startDate"
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="endDate">Data fim (pagamento)</Label>
        <Input
          id="endDate"
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="receiptStatus">Status do Recibo</Label>
        <Select 
          value={filters.receiptStatus || "__all"} 
          onValueChange={(value) => setFilters({ ...filters, receiptStatus: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Todos os status</SelectItem>
            <SelectItem value="issued">Recibo emitido</SelectItem>
            <SelectItem value="not_issued">Recibo não emitido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="minAmount">Valor mínimo</Label>
        <Input
          id="minAmount"
          type="number"
          value={filters.minAmount}
          onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
          placeholder="R$ 0,00"
        />
      </div>

      <div>
        <Label htmlFor="maxAmount">Valor máximo</Label>
        <Input
          id="maxAmount"
          type="number"
          value={filters.maxAmount}
          onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
          placeholder="R$ 0,00"
        />
      </div>
    </AdvancedFilterDialog>
  );
}
