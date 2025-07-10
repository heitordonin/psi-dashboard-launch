export interface DraftDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  user_id?: string;
  competency?: string;
  due_date?: string;
  amount?: number;
  observations?: string;
  isComplete: boolean;
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
}