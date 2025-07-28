import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DescriptionTemplateItemProps {
  id: string;
  subject?: string;
  text: string;
  created_at: string;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DescriptionTemplateItem({
  subject,
  text,
  created_at,
  onSelect,
  onEdit,
  onDelete
}: DescriptionTemplateItemProps) {
  const displayTitle = subject || text.substring(0, 50) + (text.length > 50 ? '...' : '');
  const displayPreview = text.substring(0, 80) + (text.length > 80 ? '...' : '');

  return (
    <div className="group p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-3" onClick={onSelect}>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm leading-tight mb-1">
            {displayTitle}
          </h4>
          <p className="text-muted-foreground text-xs leading-relaxed mb-2">
            {displayPreview}
          </p>
          <span className="text-xs text-muted-foreground">
            {format(new Date(created_at), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
        
        <div className="flex items-center gap-1 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}