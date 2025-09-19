import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ExpenseAdvancedFilter } from "./ExpenseAdvancedFilter";
import type { ExpenseFilters } from "@/hooks/useExpenseFilters";
import type { ExpenseCategory } from "@/types/expense";

interface ExpensesSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: ExpenseFilters;
  onFilterChange: (filters: ExpenseFilters) => void;
  categories: ExpenseCategory[];
}

export const ExpensesSearchFilter = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  categories
}: ExpensesSearchFilterProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por categoria, descrição, competência ou valor..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <ExpenseAdvancedFilter
            currentFilters={filters}
            onFilterChange={onFilterChange}
            categories={categories}
          />
        </div>
      </CardContent>
    </Card>
  );
};