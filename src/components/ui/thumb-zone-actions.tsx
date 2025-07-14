import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ThumbZoneActionsProps {
  children: ReactNode;
  className?: string;
}

export function ThumbZoneActions({ children, className }: ThumbZoneActionsProps) {
  return (
    <div className={cn("thumb-zone", className)}>
      <div className="thumb-actions">
        {children}
      </div>
    </div>
  );
}