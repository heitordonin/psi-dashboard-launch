import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import type { ExpenseFilters } from "@/hooks/useExpenseFilters";
import type { ExpenseCategory } from "@/types/expense";

interface ExpenseAdvancedFilterProps {
  onFilterChange: (filters: ExpenseFilters) => void;
  currentFilters: ExpenseFilters;
  categories: ExpenseCategory[];
}

export function ExpenseAdvancedFilter({ 
  onFilterChange, 
  currentFilters, 
  categories 
}: ExpenseAdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<ExpenseFilters>(currentFilters);

  // Check if any filter is active
  const hasActiveFilters = currentFilters.categoryId || 
    currentFilters.startDate || 
    currentFilters.endDate || 
    currentFilters.isResidential || 
    currentFilters.competency ||
    currentFilters.minAmount || 
    currentFilters.maxAmount;

  const handleApplyFilters = () => {
    // Convert "__all" back to empty string for filtering logic
    const processedFilters = {
      ...tempFilters,
      categoryId: tempFilters.categoryId === "__all" ? "" : tempFilters.categoryId,
      isResidential: tempFilters.isResidential === "__all" ? "" : tempFilters.isResidential
    };
    onFilterChange(processedFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: ExpenseFilters = {
      categoryId: "",
      startDate: "",
      endDate: "",
      isResidential: "",
      competency: "",
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
            <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
            <Select 
              value={tempFilters.categoryId || "__all"} 
              onValueChange={(value) => setTempFilters({ ...tempFilters, categoryId: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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
            <Label htmlFor="residential" className="text-sm font-medium">Tipo Residencial</Label>
            <Select 
              value={tempFilters.isResidential || "__all"} 
              onValueChange={(value) => setTempFilters({ ...tempFilters, isResidential: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os tipos</SelectItem>
                <SelectItem value="true">Residencial</SelectItem>
                <SelectItem value="false">Não residencial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competency" className="text-sm font-medium">Competência</Label>
            <Input
              id="competency"
              value={tempFilters.competency}
              onChange={(e) => setTempFilters({ ...tempFilters, competency: e.target.value })}
              placeholder="MM/AAAA"
              className="w-full"
            />
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