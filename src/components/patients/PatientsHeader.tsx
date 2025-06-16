
import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Plus } from 'lucide-react';

interface PatientsHeaderProps {
  onNewPatient: () => void;
}

export const PatientsHeader = ({ onNewPatient }: PatientsHeaderProps) => {
  return (
    <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-white hover:text-gray-200" />
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Pacientes</h1>
            <p className="text-sm" style={{ color: '#03f6f9' }}>Gerencie seus pacientes</p>
          </div>
        </div>
        
        <Button
          onClick={onNewPatient}
          style={{ backgroundColor: '#ffffff', color: '#002472' }}
          className="hover:bg-gray-100"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>
    </div>
  );
};
