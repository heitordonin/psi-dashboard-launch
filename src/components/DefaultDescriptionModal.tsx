
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Calendar } from "lucide-react";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useIsMobile } from "@/hooks/use-mobile";

interface InvoiceDescription {
  id: string;
  subject: string;
  text: string;
  owner_id: string;
  created_at: string;
}

interface DefaultDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDescription: (description: string) => void;
  onManageDescriptions: () => void;
}

const DescriptionItem = ({ 
  description, 
  onClick, 
  isMobile 
}: { 
  description: InvoiceDescription; 
  onClick: () => void; 
  isMobile: boolean; 
}) => {
  if (isMobile) {
    return (
      <div 
        className="flex flex-col p-4 border-b border-border last:border-b-0 cursor-pointer active:bg-muted/50 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm">
            {description.subject || "Sem assunto"}
          </h4>
          <span className="text-xs text-muted-foreground ml-2">
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
    );
  }

  return (
    <div 
      className="p-3 border border-border rounded-lg cursor-pointer hover:border-primary/30 hover:bg-muted/30 transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
          {description.subject || "Sem assunto"}
        </h4>
        <div className="flex items-center text-xs text-muted-foreground ml-2">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date(description.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          })}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {description.text}
      </p>
    </div>
  );
};

const LoadingState = ({ isMobile }: { isMobile: boolean }) => (
  <div className={`flex items-center justify-center ${isMobile ? 'py-8' : 'py-12'}`}>
    <div className="text-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-muted-foreground text-sm">Carregando descrições...</p>
    </div>
  </div>
);

const EmptyState = ({ 
  onManageDescriptions, 
  isMobile 
}: { 
  onManageDescriptions: () => void; 
  isMobile: boolean; 
}) => (
  <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
    <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 bg-muted rounded-full flex items-center justify-center`}>
      <FileText className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground`} />
    </div>
    <h3 className="font-medium mb-2">Nenhuma descrição cadastrada</h3>
    <p className="text-muted-foreground mb-4 text-sm">
      Crie sua primeira descrição padrão para agilizar o processo
    </p>
    <Button onClick={onManageDescriptions} size={isMobile ? "default" : "sm"}>
      <Plus className="w-4 h-4 mr-2" />
      Criar Primeira Descrição
    </Button>
  </div>
);

export const DefaultDescriptionModal = ({ 
  isOpen, 
  onClose, 
  onSelectDescription,
  onManageDescriptions 
}: DefaultDescriptionModalProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: descriptions = [], isLoading } = useQuery({
    queryKey: ['invoice-descriptions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_descriptions')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('DefaultDescriptionModal - Erro ao buscar descrições:', error);
        throw error;
      }
      
      return data as InvoiceDescription[];
    },
    enabled: isOpen && !!user,
    retry: 1
  });

  const handleSelectDescription = (description: InvoiceDescription) => {
    onSelectDescription(description.text);
    onClose();
  };

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Selecionar Descrição
              </DrawerTitle>
              <Button onClick={onManageDescriptions} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova
              </Button>
            </div>
          </DrawerHeader>
          
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <LoadingState isMobile={true} />
            ) : descriptions.length === 0 ? (
              <EmptyState onManageDescriptions={onManageDescriptions} isMobile={true} />
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                {descriptions.map((description) => (
                  <DescriptionItem
                    key={description.id}
                    description={description}
                    onClick={() => handleSelectDescription(description)}
                    isMobile={true}
                  />
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Selecionar Descrição
            </DialogTitle>
            <Button onClick={onManageDescriptions} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <LoadingState isMobile={false} />
          ) : descriptions.length === 0 ? (
            <EmptyState onManageDescriptions={onManageDescriptions} isMobile={false} />
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {descriptions.map((description) => (
                <DescriptionItem
                  key={description.id}
                  description={description}
                  onClick={() => handleSelectDescription(description)}
                  isMobile={false}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
