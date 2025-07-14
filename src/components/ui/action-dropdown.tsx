
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
  deleteDisabled?: boolean;
  editDisabled?: boolean;
}

export function ActionDropdown({ 
  onEdit, 
  onDelete, 
  onMarkAsPaid, 
  showMarkAsPaid = false,
  deleteDisabled = false,
  editDisabled = false
}: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="touch-target">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border shadow-lg min-w-[140px] z-50">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit} disabled={editDisabled} className="min-h-[44px] px-4 text-base md:text-sm">
            Editar
          </DropdownMenuItem>
        )}
        {showMarkAsPaid && onMarkAsPaid && (
          <DropdownMenuItem onClick={onMarkAsPaid} className="min-h-[44px] px-4 text-base md:text-sm">
            Marcar como Pago
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem 
            onClick={onDelete} 
            className="text-red-600 min-h-[44px] px-4 text-base md:text-sm"
            disabled={deleteDisabled}
          >
            Excluir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
