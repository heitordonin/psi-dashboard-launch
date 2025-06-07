
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface PaymentsHeaderProps {
  onNewPayment: () => void;
}

export const PaymentsHeader = ({ onNewPayment }: PaymentsHeaderProps) => {
  return (
    <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-white hover:text-gray-200" />
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Cobranças</h1>
            <p className="text-sm" style={{ color: '#03f6f9' }}>Gerencie suas cobranças</p>
          </div>
        </div>
        
        <Button
          onClick={onNewPayment}
          style={{ backgroundColor: '#ffffff', color: '#002472' }}
          className="hover:bg-gray-100"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>
    </div>
  );
};
