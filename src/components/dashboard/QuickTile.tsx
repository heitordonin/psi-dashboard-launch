
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
        "relative flex flex-col items-center justify-center p-3 bg-psiclo-secondary hover:bg-psiclo-primary text-white rounded-lg transition-colors w-[90px] h-[90px] md:w-[100px] md:h-[100px] flex-shrink-0",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {showNotification && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
      )}
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs text-center leading-tight">{label}</span>
    </button>
  );
}
