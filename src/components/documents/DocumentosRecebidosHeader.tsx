import { FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

interface DocumentosRecebidosHeaderProps {
  totalDocuments: number;
}

export const DocumentosRecebidosHeader = ({ totalDocuments }: DocumentosRecebidosHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-white hover:text-gray-200" />
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>Documentos Recebidos</h1>
            <p className="text-sm" style={{ color: '#03f6f9' }}>
              Gerencie os documentos enviados pela administração ({totalDocuments} total)
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
          className="text-white hover:text-gray-200 hover:bg-white/10"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};