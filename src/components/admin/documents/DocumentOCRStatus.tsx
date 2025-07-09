import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RotateCcw, Loader } from "lucide-react";

interface DocumentOCRStatusProps {
  isProcessingOCR?: boolean;
  ocrExtracted?: {
    cpf?: string;
    competency?: string;
    due_date?: string;
    amount?: number;
    confidence: {
      cpf: number;
      competency: number;
      due_date: number;
      amount: number;
    };
  };
  onReprocessOCR?: () => void;
}

export const DocumentOCRStatus = ({ 
  isProcessingOCR, 
  ocrExtracted, 
  onReprocessOCR 
}: DocumentOCRStatusProps) => {
  if (isProcessingOCR) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader className="w-4 h-4 animate-spin" />
        <span>Processando OCR...</span>
      </div>
    );
  }

  if (!ocrExtracted) {
    return null;
  }

  const extractedFields = Object.entries(ocrExtracted.confidence)
    .filter(([_, confidence]) => confidence > 0)
    .map(([field, confidence]) => ({ field, confidence }));

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'cpf': return 'CPF';
      case 'competency': return 'Competência';
      case 'due_date': return 'Vencimento';
      case 'amount': return 'Valor';
      default: return field;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">OCR Processado</span>
        {onReprocessOCR && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReprocessOCR}
            className="h-6 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reprocessar
          </Button>
        )}
      </div>
      
      {extractedFields.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {extractedFields.map(({ field, confidence }) => (
            <Badge 
              key={field} 
              variant="secondary" 
              className={`text-xs ${getConfidenceColor(confidence)}`}
            >
              {getFieldLabel(field)} ({Math.round(confidence * 100)}%)
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhum campo foi reconhecido automaticamente
        </p>
      )}
    </div>
  );
};