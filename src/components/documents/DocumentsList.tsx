import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentItem } from './DocumentItem';
import { AdminDocument } from '@/types/adminDocument';
import { useAdminDocuments } from '@/hooks/useAdminDocuments';
import { toast } from 'sonner';
import { createSafeDateFromString } from '@/utils/dateUtils';

interface DocumentsListProps {
  documents: AdminDocument[];
}

export const DocumentsList = ({ documents }: DocumentsListProps) => {
  const { getDocumentUrl } = useAdminDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [competencyFilter, setCompetencyFilter] = useState<string>('all');

  // Get unique competencies for filter
  const competencies = useMemo(() => {
    const unique = Array.from(new Set(documents.map(doc => {
      const date = createSafeDateFromString(doc.competency);
      return date.toISOString().slice(0, 7); // YYYY-MM format
    }))).sort().reverse();
    
    return unique.map(comp => {
      const date = createSafeDateFromString(comp + '-01');
      return {
        value: comp,
        label: date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })
      };
    });
  }, [documents]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const docCompetency = createSafeDateFromString(doc.competency).toISOString().slice(0, 7);
      const matchesCompetency = competencyFilter === 'all' || docCompetency === competencyFilter;
      
      return matchesSearch && matchesStatus && matchesCompetency;
    });
  }, [documents, searchTerm, statusFilter, competencyFilter]);

  const handleViewDocument = async (filePath: string) => {
    try {
      const url = await getDocumentUrl(filePath);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error getting document URL:', error);
      toast.error('Erro ao abrir documento');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">A vencer</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Em atraso</SelectItem>
            </SelectContent>
          </Select>

          <Select value={competencyFilter} onValueChange={setCompetencyFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Competência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as competências</SelectItem>
              {competencies.map(comp => (
                <SelectItem key={comp.value} value={comp.value}>
                  {comp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {documents.length === 0 
              ? 'Nenhum documento recebido ainda.' 
              : 'Nenhum documento encontrado com os filtros aplicados.'
            }
          </div>
        ) : (
          filteredDocuments.map(document => (
            <DocumentItem
              key={document.id}
              document={document}
              onViewDocument={handleViewDocument}
            />
          ))
        )}
      </div>
    </div>
  );
};