import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Upload, FileText, Edit2, Trash2, Send } from "lucide-react";
import { DocumentUploadZone } from "@/components/admin/documents/DocumentUploadZone";
import { DocumentsUploadTable } from "@/components/admin/documents/DocumentsUploadTable";
import { useAdminDocumentUpload } from "@/hooks/useAdminDocumentUpload";

export default function AdminEnviarDocumentos() {
  const {
    uploadedFiles,
    users,
    isLoading,
    uploadFiles,
    updateDocument,
    deleteDocument,
    sendDocuments,
    canSendDocuments
  } = useAdminDocumentUpload();

  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilesUpload = async (files: File[]) => {
    await uploadFiles(files);
  };

  const handleSendDocuments = async () => {
    await sendDocuments();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-[#002472] border-b border-border/40">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger className="text-white hover:bg-white/10" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">Enviar Documentos</h1>
            <p className="text-sm text-blue-200 mt-1">
              Faça upload e gerencie documentos para envio aos usuários
            </p>
          </div>
          {uploadedFiles.length > 0 && (
            <Button 
              onClick={handleSendDocuments}
              disabled={!canSendDocuments || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Documentos ({uploadedFiles.length})
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Upload Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUploadZone
              onFilesUpload={handleFilesUpload}
              isDragOver={isDragOver}
              onDragStateChange={setIsDragOver}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Documents Table */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos Carregados ({uploadedFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentsUploadTable
                documents={uploadedFiles}
                users={users}
                onEdit={updateDocument}
                onDelete={deleteDocument}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {uploadedFiles.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Como usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">1</div>
                <p>Faça upload de múltiplos arquivos PDF usando drag & drop ou clicando na área de upload</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">2</div>
                <p>Para cada documento, clique em "Editar" para preencher as informações obrigatórias</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">3</div>
                <p>Quando todos os documentos estiverem completos, clique em "Enviar Documentos"</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}