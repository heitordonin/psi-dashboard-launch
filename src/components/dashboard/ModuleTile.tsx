
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ModuleTileProps {
  icon: LucideIcon;
  color: "indigo" | "green" | "purple";
  label: string;
  to: string;
}

const colorClasses = {
  indigo: "bg-psiclo-accent/10 text-psiclo-primary hover:bg-psiclo-accent/20",
  green: "bg-green-100 text-green-600 hover:bg-green-200",
  purple: "bg-purple-100 text-purple-600 hover:bg-purple-200"
};

export function ModuleTile({ icon: Icon, color, label, to }: ModuleTileProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        "flex flex-col items-center justify-center p-4 md:p-6 rounded-xl transition-all duration-200 min-h-[80px] md:min-h-[100px] hover:scale-105 active:scale-95 w-full",
        colorClasses[color]
      )}
    >
      <Icon className="w-6 h-6 md:w-8 md:h-8 mb-2" />
      <span className="text-sm font-medium text-center">{label}</span>
    </button>
  );
}
