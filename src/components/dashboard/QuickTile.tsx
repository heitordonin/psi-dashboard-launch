
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickTileProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function QuickTile({ icon: Icon, label, onClick, disabled = false }: QuickTileProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-w-[90px] w-[90px] h-[90px] md:min-w-[80px] md:w-auto md:h-[80px] flex-shrink-0",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs text-center leading-tight">{label}</span>
    </button>
  );
}
