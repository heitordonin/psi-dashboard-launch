
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickTileProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  showNotification?: boolean;
}

export function QuickTile({ icon: Icon, label, onClick, disabled = false, showNotification = false }: QuickTileProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center p-4 bg-psiclo-secondary hover:bg-psiclo-primary text-white rounded-lg transition-colors min-h-[100px] min-w-[100px] md:w-[110px] md:h-[110px] flex-shrink-0 touch-manipulation focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {showNotification && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
      )}
      <Icon className="w-7 h-7 mb-2" />
      <span className="text-sm text-center leading-tight font-medium">{label}</span>
    </button>
  );
}
