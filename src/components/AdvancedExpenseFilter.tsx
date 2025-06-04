
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseCategory } from "@/types/expense";
import { Filter, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export interface ExpenseFilters {
  categoryId: string;
  startDate: string;
  endDate: string;
  isResidential: string;
  competency: string;
}

interface AdvancedExpenseFilterProps {
  onFilterChange: (filters: ExpenseFilters) => void;
  currentFilters: ExpenseFilters;
}

export const AdvancedExpenseFilter = ({ onFilterChange, currentFilters }: AdvancedExpenseFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<ExpenseFilters>(currentFilters);

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as ExpenseCategory[];
    }
  });

  const handleApplyFilter = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      categoryId: "",
      startDate: "",
      endDate: "",
      isResidential: "",
      competency: ""
    };
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setIsOpen(false);
  };

  const hasActiveFilters = currentFilters.categoryId || currentFilters.startDate || currentFilters.endDate || currentFilters.isResidential || currentFilters.competency;

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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="category-select">Categoria</Label>
            <Select
              value={tempFilters.categoryId}
              onValueChange={(value) => setTempFilters({ ...tempFilters, categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">Data inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={tempFilters.startDate}
                onChange={(e) => setTempFilters({ ...tempFilters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">Data final</Label>
              <Input
                id="end-date"
                type="date"
                value={tempFilters.endDate}
                onChange={(e) => setTempFilters({ ...tempFilters, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="residential-filter">Residencial</Label>
            <Select
              value={tempFilters.isResidential}
              onValueChange={(value) => setTempFilters({ ...tempFilters, isResidential: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="competency-input">Competência</Label>
            <Input
              id="competency-input"
              value={tempFilters.competency}
              onChange={(e) => setTempFilters({ ...tempFilters, competency: e.target.value })}
              placeholder="Digite a competência"
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
              onClick={handleApplyFilter}
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
