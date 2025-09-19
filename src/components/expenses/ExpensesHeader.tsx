import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpensesHeaderProps {
  onAddExpense: () => void;
  totalExpenses: number;
}

export const ExpensesHeader = ({ onAddExpense, totalExpenses }: ExpensesHeaderProps) => {
  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
            <p className="text-sm text-gray-600">
              {totalExpenses} {totalExpenses === 1 ? 'despesa' : 'despesas'} registradas
            </p>
          </div>
          <Button 
            onClick={onAddExpense}
            className="touch-target"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </div>
      </div>
    </div>
  );
};