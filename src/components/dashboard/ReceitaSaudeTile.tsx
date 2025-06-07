
import { Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function ReceitaSaudeTile() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/receita-saude")}
      className={cn(
        "flex flex-col items-center justify-center p-4 md:p-6 rounded-xl transition-all duration-200 min-h-[80px] md:min-h-[100px] hover:scale-105 active:scale-95 w-full",
        "bg-blue-100 text-blue-600 hover:bg-blue-200"
      )}
    >
      <Receipt className="w-6 h-6 md:w-8 md:h-8 mb-2" />
      <span className="text-sm font-medium text-center">Controle Receita Saúde</span>
    </button>
  );
}
