
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export interface PaymentFilters {
  patientId: string;
  startDate: string;
  endDate: string;
  status: string;
}

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
  const [filters, setFilters] = useState<PaymentFilters>(currentFilters);

  const handleApplyFilters = () => {
    // Convert "__all" back to empty string for filtering logic
    const processedFilters = {
      ...filters,
      patientId: filters.patientId === "__all" ? "" : filters.patientId,
      status: filters.status === "__all" ? "" : filters.status
    };
    onFilterChange(processedFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: PaymentFilters = {
      patientId: "",
      startDate: "",
      endDate: "",
      status: ""
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label htmlFor="startDate">Data início (vencimento)</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="endDate">Data fim (vencimento)</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={filters.status || "__all"} 
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleClearFilters} variant="outline" className="flex-1">
              Limpar
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
