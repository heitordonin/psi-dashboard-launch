import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface FloatingActionButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'default' | 'lg';
}

export function FloatingActionButton({ 
  onClick, 
  children, 
  className,
  position = 'bottom-right',
  size = 'default'
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6', 
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  };

  const sizeClasses = {
    'default': 'w-14 h-14',
    'lg': 'w-16 h-16'
  };

  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed z-40 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        // Safe area support
        "mb-[env(safe-area-inset-bottom)]",
        positionClasses[position],
        sizeClasses[size],
        className
      )}
      size="icon"
    >
      {children}
    </Button>
  );
}