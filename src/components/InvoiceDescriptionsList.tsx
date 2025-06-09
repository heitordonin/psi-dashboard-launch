
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Plus } from "lucide-react";
import type { InvoiceDescription } from "@/hooks/useInvoiceDescriptions";

interface InvoiceDescriptionsListProps {
  descriptions: InvoiceDescription[];
  isLoading: boolean;
  onEdit: (description: InvoiceDescription) => void;
  onDelete: (description: InvoiceDescription) => void;
  onCreateNew: () => void;
}

export const InvoiceDescriptionsList = ({
  descriptions,
  isLoading,
  onEdit,
  onDelete,
  onCreateNew
}: InvoiceDescriptionsListProps) => {
  return (
    <div className="space-y-4">
      <Button onClick={onCreateNew} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Nova Descrição
      </Button>

      {isLoading ? (
        <div className="text-center py-4">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {descriptions.map((description) => (
            <Card key={description.id}>
              <CardContent className="p-4">
                {description.subject && (
                  <h4 className="font-medium text-sm mb-2">{description.subject}</h4>
                )}
                <p className="text-sm text-gray-600 mb-3">{description.text}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(description)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(description)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {descriptions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma descrição cadastrada
            </div>
          )}
        </div>
      )}
    </div>
  );
};
