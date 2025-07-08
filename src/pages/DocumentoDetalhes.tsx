import React from 'react';
import { DocumentDetails } from '@/components/documents/DocumentDetails';
import { useSubscription } from '@/hooks/useSubscription';
import { Navigate } from 'react-router-dom';

const DocumentoDetalhes = () => {
  const { currentPlan } = useSubscription();

  // Redirect if not Psi Regular plan
  if (currentPlan && currentPlan.slug !== 'psi_regular') {
    return <Navigate to="/dashboard" replace />;
  }

  return <DocumentDetails />;
};

export default DocumentoDetalhes;