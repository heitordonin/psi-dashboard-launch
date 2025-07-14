import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, children, title, className }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background border-t border-border rounded-t-lg",
        "transform transition-transform duration-300 ease-out",
        "max-h-[90vh] overflow-hidden",
        // Safe area support
        "pb-[env(safe-area-inset-bottom)]",
        isOpen ? "translate-y-0" : "translate-y-full",
        className
      )}>
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-muted rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}