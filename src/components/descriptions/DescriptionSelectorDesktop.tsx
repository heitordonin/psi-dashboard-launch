import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoiceDescriptions } from "@/hooks/useInvoiceDescriptions";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Plus, Search, FileText, Calendar } from "lucide-react";

interface DescriptionSelectorDesktopProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDescription: (description: string) => void;
  onManageDescriptions: () => void;
}

export const DescriptionSelectorDesktop = ({ 
  isOpen, 
  onClose, 
  onSelectDescription,
  onManageDescriptions 
}: DescriptionSelectorDesktopProps) => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Selecionar Descrição
            </DialogTitle>
            <Button 
              onClick={handleManageDescriptions} 
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Gerenciar Descrições
            </Button>
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
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : descriptions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-2">Nenhuma descrição cadastrada</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                  Crie sua primeira descrição padrão para agilizar o preenchimento de cobranças
                </p>
                <Button onClick={handleManageDescriptions}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Descrição
                </Button>
              </div>
            </div>
          ) : filteredDescriptions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Nenhuma descrição encontrada para "{searchTerm}"</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-1 gap-3 pr-2">
                {filteredDescriptions.map((description) => (
                  <Card 
                    key={description.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20 group"
                    onClick={() => handleSelectDescription(description)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {description.subject || "Sem assunto"}
                        </h4>
                        <div className="flex items-center text-xs text-muted-foreground ml-3 flex-shrink-0">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(description.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {description.text}
                      </p>
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Usar esta descrição
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};