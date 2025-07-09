import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Upload, FileText, Send } from "lucide-react";
import { DocumentUploadZone } from "@/components/admin/documents/DocumentUploadZone";
import { DocumentsUploadTable } from "@/components/admin/documents/DocumentsUploadTable";
import { useAdminDocumentUpload } from "@/hooks/useAdminDocumentUpload";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";

export default function AdminEnviarDocumentos() {
  const {
    uploadedFiles,
    users,
    isLoading,
    uploadFiles,
    updateDocument,
    deleteDocument,
    sendDocuments,
    sendSingleDocument,
    canSendDocuments
  } = useAdminDocumentUpload();

  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilesUpload = async (files: File[]) => {
    await uploadFiles(files);
  };

  const handleSendAllDocuments = async () => {
    await sendDocuments();
  };

  const completeDocuments = uploadedFiles.filter(doc => doc.isComplete);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <AdminDashboardHeader />
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Enviar Documentos</h1>
                <p className="text-muted-foreground">
                  Faça upload e gerencie documentos para envio aos usuários
                </p>
              </div>
              {completeDocuments.length > 0 && (
                <Button 
                  onClick={handleSendAllDocuments}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Todos ({completeDocuments.length})
                </Button>
              )}
            </div>

            <div className="space-y-6">
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
                      onSendSingle={sendSingleDocument}
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
                      <p>Quando os documentos estiverem completos, envie individualmente ou em lote</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}