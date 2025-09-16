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
  return;
}