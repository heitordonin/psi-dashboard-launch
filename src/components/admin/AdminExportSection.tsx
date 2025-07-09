import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from 'lucide-react';
import { useDataExport } from '@/hooks/useDataExport';

interface AdminExportSectionProps {
  showAllUsers: boolean;
  filteredUserId: string | null;
}

export const AdminExportSection = ({ showAllUsers, filteredUserId }: AdminExportSectionProps) => {
  const { exportPatients, exportPayments, exportExpenses, exportExpensesCarneLeao } = useDataExport();
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const handleExport = (type: 'patients' | 'payments' | 'expenses') => {
    const options = {
      format: 'csv' as const,
      userId: showAllUsers ? undefined : filteredUserId,
      ...(dateRange.start && dateRange.end && {
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      }),
    };

    switch (type) {
      case 'patients':
        exportPatients(options);
        break;
      case 'payments':
        exportPayments(options);
        break;
      case 'expenses':
        exportExpenses(options);
        break;
    }
  };

  const handleCarneLeaoExport = () => {
    const options = {
      format: 'csv' as const,
      userId: showAllUsers ? undefined : filteredUserId,
      ...(dateRange.start && dateRange.end && {
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      }),
    };

    exportExpensesCarneLeao(options);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Exportar Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="start-date">Data Início (opcional)</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="end-date">Data Fim (opcional)</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => handleExport('patients')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Pacientes
          </Button>
          <Button 
            onClick={() => handleExport('payments')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Cobranças
          </Button>
          <Button 
            onClick={() => handleExport('expenses')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Despesas
          </Button>
          <Button 
            onClick={handleCarneLeaoExport}
            variant="outline"
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200"
          >
            <Download className="w-4 h-4" />
            Exportar despesas para o Carnê Leão
          </Button>
        </div>

        {!showAllUsers && (
          <p className="text-sm text-muted-foreground mt-2">
            Os dados exportados serão filtrados para o usuário selecionado.
          </p>
        )}
      </CardContent>
    </Card>
  );
};