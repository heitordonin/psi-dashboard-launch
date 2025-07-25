
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

interface PaymentsHeaderProps {
  onAddPayment: () => void;
  totalPayments: number;
}

export const PaymentsHeader = ({ onAddPayment, totalPayments }: PaymentsHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-white hover:text-gray-200" />
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Cobranças</h1>
            <p className="text-sm" style={{ color: '#03f6f9' }}>
              Gerencie suas cobranças ({totalPayments} total)
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 md:flex-row md:gap-3">
          <Button
            onClick={() => navigate("/receita-saude-control")}
            variant="outline"
            style={{ backgroundColor: 'transparent', color: '#ffffff', borderColor: '#ffffff' }}
            className="hover:bg-white/10"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Receita Saúde
          </Button>
          
          <Button
            onClick={onAddPayment}
            style={{ backgroundColor: '#ffffff', color: '#002472' }}
            className="hover:bg-gray-100"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>
      </div>
    </div>
  );
};
