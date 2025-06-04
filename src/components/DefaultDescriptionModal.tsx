
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Trash2 } from "lucide-react";

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
  const { data: descriptions = [], isLoading } = useQuery({
    queryKey: ['invoice-descriptions'],
    queryFn: async () => {
      console.log('Buscando descrições padrão...');
      const { data, error } = await supabase
        .from('invoice_descriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao buscar descrições:', error);
        throw error;
      }
      console.log('Descrições encontradas:', data);
      return data as InvoiceDescription[];
    },
    enabled: isOpen
  });

  const handleSelectDescription = (description: InvoiceDescription) => {
    onSelectDescription(description.text);
    onClose();
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Descrição Padrão</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={onManageDescriptions} variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Gerenciar Descrições
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data de Criação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {descriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        Nenhuma descrição cadastrada. 
                        <br />
                        <Button 
                          variant="link" 
                          onClick={onManageDescriptions}
                          className="mt-2"
                        >
                          Clique aqui para criar uma descrição
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    descriptions.map((description) => (
                      <TableRow 
                        key={description.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSelectDescription(description)}
                      >
                        <TableCell className="font-medium">
                          {description.subject}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {truncateText(description.text, 60)}
                        </TableCell>
                        <TableCell>
                          {new Date(description.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
