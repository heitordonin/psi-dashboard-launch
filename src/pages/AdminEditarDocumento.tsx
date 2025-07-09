import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { DocumentPreview } from "@/components/admin/documents/DocumentPreview";
import { DocumentEditForm } from "@/components/admin/documents/DocumentEditForm";
import { useAdminDocumentUpload } from "@/hooks/useAdminDocumentUpload";
import { toast } from "sonner";

export default function AdminEditarDocumento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { uploadedFiles, users, updateDocument } = useAdminDocumentUpload();
  
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // First try to find in current state
      const foundDoc = uploadedFiles.find(doc => doc.id === id);
      if (foundDoc) {
        setDocument(foundDoc);
      } else {
        // Try to get from sessionStorage as fallback
        const storedDoc = sessionStorage.getItem('editingDocument');
        if (storedDoc) {
          try {
            const parsedDoc = JSON.parse(storedDoc);
            if (parsedDoc.id === id) {
              setDocument(parsedDoc);
              return;
            }
          } catch (error) {
            console.error("Error parsing stored document:", error);
          }
        }
        toast.error("Documento não encontrado");
        navigate("/admin/enviar-documentos");
      }
    }
  }, [id, uploadedFiles, navigate]);

  const handleSave = async (formData: any) => {
    if (!document) return;
    
    setIsLoading(true);
    try {
      await updateDocument(document.id, formData);
      toast.success("Documento atualizado com sucesso!");
      navigate("/admin/enviar-documentos");
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Erro ao atualizar documento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/enviar-documentos");
  };

  if (!document) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Carregando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Documento</h1>
            <p className="text-muted-foreground">
              {document.fileName}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* PDF Preview */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pré-visualização do PDF
            </h3>
          </div>
          <div className="p-4 h-[calc(100%-60px)]">
            <DocumentPreview fileUrl={document.fileUrl} />
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Informações do Documento</h3>
          </div>
          <div className="p-4 h-[calc(100%-60px)] overflow-y-auto">
            <DocumentEditForm
              document={document}
              users={users}
              onSave={handleSave}
              onCancel={handleBack}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}