
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionDropdownProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkAsPaid?: () => void;
  showMarkAsPaid?: boolean;
}

export function ActionDropdown({ 
  onEdit, 
  onDelete, 
  onMarkAsPaid, 
  showMarkAsPaid = false 
}: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            Editar
          </DropdownMenuItem>
        )}
        {showMarkAsPaid && onMarkAsPaid && (
          <DropdownMenuItem onClick={onMarkAsPaid}>
            Marcar como Pago
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            Excluir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
