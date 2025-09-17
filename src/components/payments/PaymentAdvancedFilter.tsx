
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import type { PaymentFilters } from "@/hooks/usePaymentFilters";

interface PaymentAdvancedFilterProps {
  onFilterChange: (filters: PaymentFilters) => void;
  currentFilters: PaymentFilters;
  patients: Array<{ id: string; full_name: string }>;
}

export function PaymentAdvancedFilter({ 
  onFilterChange, 
  currentFilters, 
  patients 
}: PaymentAdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<PaymentFilters>(currentFilters);

  // Check if any filter is active
  const hasActiveFilters = currentFilters.patientId || 
    currentFilters.startDate || 
    currentFilters.endDate || 
    currentFilters.status || 
    currentFilters.minAmount || 
    currentFilters.maxAmount;

  const handleApplyFilters = () => {
    // Convert "__all" back to empty string for filtering logic
    const processedFilters = {
      ...tempFilters,
      patientId: tempFilters.patientId === "__all" ? "" : tempFilters.patientId,
      status: tempFilters.status === "__all" ? "" : tempFilters.status
    };
    onFilterChange(processedFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: PaymentFilters = {
      patientId: "",
      startDate: "",
      endDate: "",
      status: "",
      minAmount: "",
      maxAmount: ""
    };
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset temp filters to current filters when opening
      setTempFilters(currentFilters);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex-1 sm:flex-none relative whitespace-nowrap ${hasActiveFilters ? 'bg-primary/10 border-primary text-primary' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Filtros avançados</span>
          <span className="sm:hidden">Filtros</span>
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <div className="border-b p-6">
          <DialogTitle className="text-lg font-semibold">Filtros Avançados</DialogTitle>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patient" className="text-sm font-medium">Paciente</Label>
            <Select 
              value={tempFilters.patientId || "__all"} 
              onValueChange={(value) => setTempFilters({ ...tempFilters, patientId: value })}
            >
              <SelectTrigger className="w-full">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">Data início</Label>
              <Input
                id="startDate"
                type="date"
                value={tempFilters.startDate}
                onChange={(e) => setTempFilters({ ...tempFilters, startDate: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">Data fim</Label>
              <Input
                id="endDate"
                type="date"
                value={tempFilters.endDate}
                onChange={(e) => setTempFilters({ ...tempFilters, endDate: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select 
              value={tempFilters.status || "__all"} 
              onValueChange={(value) => setTempFilters({ ...tempFilters, status: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount" className="text-sm font-medium">Valor mínimo</Label>
              <Input
                id="minAmount"
                type="number"
                step="0.01"
                min="0"
                value={tempFilters.minAmount}
                onChange={(e) => setTempFilters({ ...tempFilters, minAmount: e.target.value })}
                placeholder="0,00"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAmount" className="text-sm font-medium">Valor máximo</Label>
              <Input
                id="maxAmount"
                type="number"
                step="0.01"
                min="0"
                value={tempFilters.maxAmount}
                onChange={(e) => setTempFilters({ ...tempFilters, maxAmount: e.target.value })}
                placeholder="0,00"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="border-t p-6 flex gap-3">
          <Button onClick={handleClearFilters} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1">
            Aplicar Filtros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
