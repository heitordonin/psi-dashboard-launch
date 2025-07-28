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
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4', 
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const sizeClasses = {
    'default': 'w-14 h-14 text-base',
    'lg': 'w-16 h-16 text-lg'
  };

  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed z-[9999] rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "transition-all duration-200 hover:scale-110 active:scale-95",
        "touch-target-enhanced safe-area-bottom",
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