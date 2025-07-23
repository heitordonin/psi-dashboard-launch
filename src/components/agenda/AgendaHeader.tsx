import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";

interface AgendaHeaderProps {
  onNewAppointment: () => void;
}

export const AgendaHeader = ({ onNewAppointment }: AgendaHeaderProps) => {
  return (
    <>
      {/* Mobile Header */}
      <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-white hover:text-gray-200" />
            <div>
              <h1 className="text-lg font-semibold text-white">Agenda</h1>
              <p className="text-sm" style={{ color: '#03f6f9' }}>Gerencie seus agendamentos e sessões</p>
            </div>
          </div>
          <Button
            onClick={onNewAppointment}
            style={{ backgroundColor: '#ffffff', color: '#002472' }}
            className="hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </div>
      </div>
      
      {/* Desktop Header */}
      <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4 hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Agenda</h1>
              <p className="text-sm" style={{ color: '#03f6f9' }}>Gerencie seus agendamentos e sessões</p>
            </div>
          </div>
          <Button
            onClick={onNewAppointment}
            style={{ backgroundColor: '#ffffff', color: '#002472' }}
            className="hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>
    </>
  );
};