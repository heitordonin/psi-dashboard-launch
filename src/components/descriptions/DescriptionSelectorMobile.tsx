import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoiceDescriptions } from "@/hooks/useInvoiceDescriptions";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Plus, Search, FileText } from "lucide-react";

interface DescriptionSelectorMobileProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDescription: (description: string) => void;
  onManageDescriptions: () => void;
}

export const DescriptionSelectorMobile = ({ 
  isOpen, 
  onClose, 
  onSelectDescription,
  onManageDescriptions 
}: DescriptionSelectorMobileProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { descriptions, isLoading } = useInvoiceDescriptions(isOpen);

  const filteredDescriptions = descriptions.filter(desc => 
    desc.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (desc.subject && desc.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectDescription = (description: any) => {
    onSelectDescription(description.text);
    onClose();
  };

  const handleManageDescriptions = () => {
    onClose();
    onManageDescriptions();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[60vh] m-4 rounded-t-xl flex flex-col">
        <SheetHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Selecionar Descrição
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleManageDescriptions} 
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Descrição
              </Button>
              <Button 
                onClick={onClose}
                variant="ghost" 
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
          
          {descriptions.length > 0 && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar descrições..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : descriptions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-2">Nenhuma descrição</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Crie sua primeira descrição padrão para agilizar o processo
                </p>
                <Button onClick={handleManageDescriptions}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Descrição
                </Button>
              </div>
            </div>
          ) : filteredDescriptions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-muted-foreground">Nenhuma descrição encontrada</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-4">
                {filteredDescriptions.map((description) => (
                  <div
                    key={description.id}
                    onClick={() => handleSelectDescription(description)}
                    className="p-4 border border-border rounded-lg cursor-pointer active:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">
                        {description.subject || "Sem assunto"}
                      </h4>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {new Date(description.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description.text}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};