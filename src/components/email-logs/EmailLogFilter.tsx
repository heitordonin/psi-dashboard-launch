
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface EmailLogFilters {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface EmailLogFilterProps {
  filters: EmailLogFilters;
  onFilterChange: (filters: EmailLogFilters) => void;
}

export const EmailLogFilter = ({ filters, onFilterChange }: EmailLogFilterProps) => {
  const handleClearFilters = () => {
    onFilterChange({
      search: "",
      status: "",
      startDate: "",
      endDate: ""
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.startDate || filters.endDate;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por email ou paciente..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange({ ...filters, status: value === "all" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="Data inicial"
          value={filters.startDate}
          onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
        />

        <Input
          type="date"
          placeholder="Data final"
          value={filters.endDate}
          onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
        />
      </div>
    </div>
  );
};
