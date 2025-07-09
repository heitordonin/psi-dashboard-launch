import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DocumentDetails } from '@/components/documents/DocumentDetails';
import { useSubscription } from '@/hooks/useSubscription';
import { Navigate } from 'react-router-dom';

const DocumentoDetalhes = () => {
  const { currentPlan } = useSubscription();

  // Redirect if not Psi Regular plan
  if (currentPlan && currentPlan.slug !== 'psi_regular') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            <DocumentDetails />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DocumentoDetalhes;