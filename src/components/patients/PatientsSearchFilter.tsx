
import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { PatientAdvancedFilter, PatientFilters } from './PatientAdvancedFilter';
import type { Patient } from '@/types/patient';

interface PatientsSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: PatientFilters;
  onFilterChange: (filters: PatientFilters) => void;
  patients: Patient[];
}

export const PatientsSearchFilter = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  patients
}: PatientsSearchFilterProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ, email ou telefone..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <PatientAdvancedFilter
            currentFilters={filters}
            onFilterChange={onFilterChange}
            patients={patients}
          />
        </div>
      </CardContent>
    </Card>
  );
};
