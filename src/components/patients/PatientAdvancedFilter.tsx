
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

export interface PatientFilters {
  patientId: string;
  cpfSearch: string;
}

interface PatientAdvancedFilterProps {
  onFilterChange: (filters: PatientFilters) => void;
  currentFilters: PatientFilters;
  patients: Array<{ id: string; full_name: string }>;
}

export const PatientAdvancedFilter = ({
  onFilterChange,
  currentFilters,
  patients
}: PatientAdvancedFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<PatientFilters>(currentFilters);

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      patientId: "",
      cpfSearch: ""
    };
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  const hasActiveFilters = currentFilters.patientId || currentFilters.cpfSearch;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex-1 sm:flex-none ${hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Filtros avançados</span>
          <span className="sm:hidden">Filtros</span>
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-600 text-white rounded-full w-2 h-2"></span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="patient-select">Paciente</Label>
            <Select
              value={tempFilters.patientId}
              onValueChange={(value) => setTempFilters({ ...tempFilters, patientId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os pacientes</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cpf-search">Buscar CPF</Label>
            <Input
              id="cpf-search"
              value={tempFilters.cpfSearch}
              onChange={(e) => setTempFilters({ ...tempFilters, cpfSearch: e.target.value })}
              placeholder="Digite o CPF para buscar"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
