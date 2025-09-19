import { ExpenseTableRow } from "./ExpenseTableRow";
import { ExpenseActions } from "./ExpenseActions";
import { useExpenseTableSorting, type ExpenseSortField } from "@/hooks/useExpenseTableSorting";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/priceFormatter";
import type { ExpenseWithCategory } from "@/types/expense";

interface ExpenseTableProps {
  expenses: ExpenseWithCategory[];
  onEdit: (expense: ExpenseWithCategory) => void;
  onDelete: (expenseId: string) => void;
}

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  const { sortedExpenses, handleSort, getSortIcon } = useExpenseTableSorting(expenses);

  const renderSortButton = (field: ExpenseSortField, label: string) => {
    const sortIcon = getSortIcon(field);
    
    return (
      <button
        onClick={() => handleSort(field)}
        className={cn(
          "group inline-flex items-center space-x-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 focus:outline-none focus:text-gray-700",
          sortIcon && "text-gray-700"
        )}
      >
        <span>{label}</span>
        <span className="ml-2 flex-none rounded">
          {sortIcon === 'asc' && <ArrowUp className="w-3 h-3" />}
          {sortIcon === 'desc' && <ArrowDown className="w-3 h-3" />}
          {!sortIcon && <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
        </span>
      </button>
    );
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Nenhuma despesa encontrada</div>
        <div className="text-gray-400 text-sm mt-2">
          Use os filtros ou crie uma nova despesa
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  {renderSortButton('category', 'Categoria')}
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  {renderSortButton('amount', 'Valor')}
                </th>
                <th scope="col" className="px-6 py-3 text-left">
                  {renderSortButton('payment_date', 'Data Pagamento')}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedExpenses.map(expense => (
                <ExpenseTableRow
                  key={expense.id}
                  expense={expense}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile version - simplified cards */}
      <div className="sm:hidden">
        <ul className="divide-y divide-gray-200">
          {sortedExpenses.map(expense => {
            const effectiveAmount = expense.residential_adjusted_amount || expense.amount;
            
            return (
              <li key={expense.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {expense.expense_categories.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(effectiveAmount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(expense.payment_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <ExpenseActions 
                      expense={expense}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      layout="compact"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}