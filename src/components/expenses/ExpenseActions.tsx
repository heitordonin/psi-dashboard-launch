import { Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExpenseWithCategory } from "@/types/expense";

interface ExpenseActionsProps {
  expense: ExpenseWithCategory;
  onEdit: (expense: ExpenseWithCategory) => void;
  onDelete: (expenseId: string) => void;
  layout?: 'default' | 'compact';
}

export function ExpenseActions({ 
  expense, 
  onEdit, 
  onDelete, 
  layout = 'default' 
}: ExpenseActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`h-8 w-8 p-0 ${layout === 'compact' ? 'h-6 w-6' : ''}`}
        >
          <span className="sr-only">Abrir menu</span>
          <MoreVertical className={`h-4 w-4 ${layout === 'compact' ? 'h-3 w-3' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(expense)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDelete(expense.id)} 
          className="text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}