import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AdvancedFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  onApply: () => void;
  onClear: () => void;
  hasActiveFilters?: boolean;
}

export const AdvancedFilterDialog = ({
  isOpen,
  onOpenChange,
  title,
  trigger,
  children,
  onApply,
  onClear,
  hasActiveFilters = false
}: AdvancedFilterDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="advanced-filter-modal max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {children}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            onClick={onApply}
            className="flex-1"
          >
            Aplicar Filtros
          </Button>
          <Button 
            variant="outline" 
            onClick={onClear}
            className="flex-1"
            disabled={!hasActiveFilters}
          >
            Limpar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};