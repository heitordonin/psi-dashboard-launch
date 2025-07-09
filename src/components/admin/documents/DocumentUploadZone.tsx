import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DocumentUploadZoneProps {
  onFilesUpload: (files: File[]) => Promise<void>;
  isDragOver: boolean;
  onDragStateChange: (isDragOver: boolean) => void;
  isLoading: boolean;
}

export const DocumentUploadZone = ({
  onFilesUpload,
  isDragOver,
  onDragStateChange,
  isLoading
}: DocumentUploadZoneProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setUploadProgress(0);
    await onFilesUpload(acceptedFiles);
  }, [onFilesUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    onDragEnter: () => onDragStateChange(true),
    onDragLeave: () => onDragStateChange(false),
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: isLoading
  });

  const hasErrors = fileRejections.length > 0;

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive || isDragOver
            ? "border-primary bg-primary/5 scale-105"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          hasErrors && "border-destructive bg-destructive/5",
          isLoading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <>
              <div className="animate-spin">
                <Upload className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Fazendo upload e processando OCR...</p>
                <Progress value={uploadProgress} className="w-48" />
                <p className="text-xs text-muted-foreground">
                  Os dados do DARF serão extraídos automaticamente
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive || isDragOver
                    ? "Solte os arquivos aqui"
                    : "Arraste arquivos PDF ou clique para selecionar"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Suporte para múltiplos arquivos PDF
                </p>
              </div>
              <Button type="button" variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Selecionar Arquivos
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File Rejection Errors */}
      {hasErrors && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Arquivos rejeitados:</span>
          </div>
          <ul className="space-y-1 text-sm">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name} className="text-muted-foreground">
                <span className="font-medium">{file.name}:</span>{" "}
                {errors.map(error => error.message).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};