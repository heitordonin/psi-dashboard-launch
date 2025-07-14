import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { VoiceInput } from "@/components/ui/voice-input";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Mic, Save } from "lucide-react";

interface EnhancedFormProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  isLoading?: boolean;
  submitText?: string;
  className?: string;
}

export function EnhancedForm({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  isLoading = false,
  submitText = "Salvar",
  className
}: EnhancedFormProps) {
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();

  const handleSubmit = () => {
    triggerHaptic('success');
    onSubmit?.();
  };

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={handleClose} title={title}>
        <div className={cn("landscape-form", className)}>
          <div className="form-step-content">
            {children}
          </div>
          
          <div className="landscape-actions">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 touch-target haptic-feedback"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 touch-target haptic-feedback"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : submitText}
            </Button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  // Desktop modal fallback
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className={cn(
        "bg-background border rounded-lg shadow-lg w-full max-w-md mx-4",
        "modal-content-landscape",
        className
      )}>
        {title && (
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        
        <div className="p-4">
          {children}
        </div>
        
        <div className="border-t p-4 flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Salvando...' : submitText}
          </Button>
        </div>
      </div>
    </div>
  );
}