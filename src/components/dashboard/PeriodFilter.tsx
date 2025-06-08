
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CalendarDays } from "lucide-react";

interface PeriodFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const PeriodFilter = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: PeriodFilterProps) => {
  const [filterType, setFilterType] = useState<'current-month' | 'custom'>('current-month');

  const handleCurrentMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const startDateStr = firstDay.toISOString().split('T')[0];
    const endDateStr = lastDay.toISOString().split('T')[0];
    
    onStartDateChange(startDateStr);
    onEndDateChange(endDateStr);
    setFilterType('current-month');
  };

  const handleCustomPeriod = () => {
    setFilterType('custom');
  };

  const clearFilter = () => {
    onStartDateChange('');
    onEndDateChange('');
    setFilterType('current-month');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtro por Período</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter Type Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterType === 'current-month' ? 'default' : 'outline'}
              size="sm"
              onClick={handleCurrentMonth}
              className="flex items-center gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Este Mês
            </Button>
            <Button
              variant={filterType === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={handleCustomPeriod}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Período Personalizado
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
            >
              Limpar
            </Button>
          </div>

          {/* Custom Date Inputs */}
          {filterType === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Current Filter Display */}
          {(startDate || endDate) && (
            <div className="text-sm text-gray-600 mt-2">
              <strong>Período ativo:</strong> {startDate || 'Início'} até {endDate || 'Fim'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
