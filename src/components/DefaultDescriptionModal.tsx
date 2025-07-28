
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Plus, FileText, Calendar } from "lucide-react";
import { useAuth } from '@/contexts/SupabaseAuthContext';

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

export const DefaultDescriptionModal = ({ 
  isOpen, 
  onClose, 
  onSelectDescription,
  onManageDescriptions 
}: DefaultDescriptionModalProps) => {
  const { user } = useAuth();

  const { data: descriptions = [], isLoading } = useQuery({
    queryKey: ['invoice-descriptions', user?.id],
    queryFn: async () => {
      console.log('DefaultDescriptionModal - Buscando descrições padrão para usuário:', user?.id);
      
      const { data, error } = await supabase
        .from('invoice_descriptions')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('DefaultDescriptionModal - Erro ao buscar descrições:', error);
        throw error;
      }
      
      console.log('DefaultDescriptionModal - Descrições encontradas:', data);
      return data as InvoiceDescription[];
    },
    enabled: isOpen && !!user,
    retry: 1
  });

  const handleSelectDescription = (description: InvoiceDescription) => {
    onSelectDescription(description.text);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Selecionar Descrição Padrão
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Escolha uma descrição ou crie uma nova
            </p>
            <Button onClick={onManageDescriptions} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Descrição
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando descrições...</p>
              </div>
            </div>
          ) : descriptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Nenhuma descrição cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira descrição padrão para agilizar o processo
              </p>
              <Button onClick={onManageDescriptions}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Descrição
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {descriptions.map((description) => (
                <Card 
                  key={description.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
                  onClick={() => handleSelectDescription(description)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
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
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {description.text}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Clique para selecionar
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
