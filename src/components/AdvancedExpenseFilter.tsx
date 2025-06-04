
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

interface AdvancedExpenseFilterProps {
  onFilterChange: (filters: {
    categories: string[];
    startDate: string;
    endDate: string;
  }) => void;
  currentFilters: {
    categories: string[];
    startDate: string;
    endDate: string;
  };
}

export const AdvancedExpenseFilter = ({ onFilterChange, currentFilters }: AdvancedExpenseFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentFilters.categories);
  const [startDate, setStartDate] = useState(currentFilters.startDate);
  const [endDate, setEndDate] = useState(currentFilters.endDate);

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

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApplyFilter = () => {
    onFilterChange({
      categories: selectedCategories,
      startDate,
      endDate,
    });
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setStartDate("");
    setEndDate("");
    onFilterChange({
      categories: [],
      startDate: "",
      endDate: "",
    });
    setIsOpen(false);
  };

  const hasActiveFilters = currentFilters.categories.length > 0 || currentFilters.startDate || currentFilters.endDate;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filtros Avançados
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {currentFilters.categories.length + (currentFilters.startDate ? 1 : 0) + (currentFilters.endDate ? 1 : 0)}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Categories Multi-select */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Categorias</Label>
            <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Período</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">Data inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">Data final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleApplyFilter} className="flex-1">
              Aplicar Filtros
            </Button>
            <Button onClick={handleClearFilters} variant="outline">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
