
import { Route } from 'react-router-dom';
import AdminRoute from '@/components/AdminRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import PhoneVerificationGuard from '@/components/PhoneVerificationGuard';
import PainelPsiRegular from '@/pages/PainelPsiRegular';
import PainelMovimento from '@/pages/PainelMovimento';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminFinancials from '@/pages/AdminFinancials';
import PaymentConfig from '@/pages/PaymentConfig';
import AdminEnviarDocumentos from '@/pages/AdminEnviarDocumentos';
import AdminEditarDocumento from '@/pages/AdminEditarDocumento';
import SubscriptionMonitoring from '@/pages/SubscriptionMonitoring';
import PsicloBankConfiguracao from '@/pages/PsicloBankConfiguracao';
import PsicloBankGestao from '@/pages/PsicloBankGestao';
import PsicloBankCadastroConta from '@/pages/PsicloBankCadastroConta';
import PsicloBankExtrato from '@/pages/PsicloBankExtrato';

export const adminRoutes = [
  <Route key="painel-psi-regular" path="/admin" element={
    <AdminRoute>
      <PainelPsiRegular />
    </AdminRoute>
  } />,
  <Route key="painel-movimento" path="/admin/movimento" element={
    <AdminRoute>
      <PainelMovimento />
    </AdminRoute>
  } />,
  <Route key="admin-dashboard" path="/admin/dashboard" element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  } />,
  <Route key="admin-financials" path="/admin/financials" element={
    <AdminRoute>
      <AdminFinancials />
    </AdminRoute>
  } />,
  <Route key="payment-config" path="/payment-config" element={
    <AdminRoute>
      <PaymentConfig />
    </AdminRoute>
  } />,
  <Route key="admin-enviar-documentos" path="/admin/enviar-documentos" element={
    <AdminRoute>
      <AdminEnviarDocumentos />
    </AdminRoute>
  } />,
  <Route key="admin-editar-documento" path="/admin/documento/:id/editar" element={
    <AdminRoute>
      <AdminEditarDocumento />
    </AdminRoute>
  } />,
  <Route key="psiclo-bank-config" path="/psiclo-bank/configuracao" element={
    <AdminRoute>
      <ProtectedRoute>
        <PhoneVerificationGuard>
          <PsicloBankConfiguracao />
        </PhoneVerificationGuard>
      </ProtectedRoute>
    </AdminRoute>
  } />,
  <Route key="psiclo-bank-gestao" path="/psiclo-bank/gestao" element={
    <AdminRoute>
      <ProtectedRoute>
        <PhoneVerificationGuard>
          <PsicloBankGestao />
        </PhoneVerificationGuard>
      </ProtectedRoute>
    </AdminRoute>
  } />,
  <Route key="psiclo-bank-cadastro" path="/psiclo-bank/cadastro-conta" element={
    <AdminRoute>
      <ProtectedRoute>
        <PhoneVerificationGuard>
          <PsicloBankCadastroConta />
        </PhoneVerificationGuard>
      </ProtectedRoute>
    </AdminRoute>
  } />,
  <Route key="psiclo-bank-extrato" path="/psiclo-bank/extrato" element={
    <AdminRoute>
      <ProtectedRoute>
        <PhoneVerificationGuard>
          <PsicloBankExtrato />
        </PhoneVerificationGuard>
      </ProtectedRoute>
    </AdminRoute>
  } />,
  <Route key="subscription-monitoring" path="/admin/subscription-monitoring" element={
    <AdminRoute>
      <SubscriptionMonitoring />
    </AdminRoute>
  } />
];
