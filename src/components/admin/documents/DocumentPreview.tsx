import { useState } from "react";
import { FileText, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPreviewProps {
  fileUrl: string;
}

export const DocumentPreview = ({ fileUrl }: DocumentPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Visualização do Documento
        </h4>
        <Button variant="outline" size="sm" onClick={openInNewTab}>
          <ExternalLink className="w-3 h-3 mr-1" />
          Abrir em nova aba
        </Button>
      </div>

      <div className="flex-1 relative bg-muted/50 rounded-md overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Carregando PDF...</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center p-6">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div>
                <p className="font-medium text-destructive mb-2">
                  Erro ao carregar o PDF
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Não foi possível exibir o documento nesta visualização.
                </p>
                <Button onClick={openInNewTab} variant="outline" size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Tentar abrir em nova aba
                </Button>
              </div>
            </div>
          </div>
        )}

        <iframe
          src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-full border-0"
          title="PDF Preview"
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: hasError ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
};