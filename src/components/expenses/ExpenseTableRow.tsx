import { formatCurrency } from "@/utils/priceFormatter";
import { Badge } from "@/components/ui/badge";
import { ExpenseActions } from "./ExpenseActions";
import type { ExpenseWithCategory } from "@/types/expense";

interface ExpenseTableRowProps {
  expense: ExpenseWithCategory;
  onEdit: (expense: ExpenseWithCategory) => void;
  onDelete: (expenseId: string) => void;
}

export function ExpenseTableRow({ expense, onEdit, onDelete }: ExpenseTableRowProps) {
  const effectiveAmount = expense.residential_adjusted_amount || expense.amount;
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {expense.expense_categories.name}
        </div>
        <div className="text-sm text-gray-500">
          {expense.expense_categories.code}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {expense.description || '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(effectiveAmount)}
        </div>
        {expense.residential_adjusted_amount && (
          <div className="text-xs text-gray-500">
            Original: {formatCurrency(expense.amount)}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(expense.payment_date).toLocaleDateString('pt-BR')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {expense.competency ? (
          <span className="text-sm text-gray-900">{expense.competency}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {expense.is_residential ? (
          <Badge variant="secondary">Residencial</Badge>
        ) : (
          <Badge variant="outline">Comercial</Badge>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <ExpenseActions 
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}