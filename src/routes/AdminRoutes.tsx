
import { Route } from 'react-router-dom';
import AdminRoute from '@/components/AdminRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import PhoneVerificationGuard from '@/components/PhoneVerificationGuard';
import Admin from '@/pages/Admin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminFinancials from '@/pages/AdminFinancials';
import PaymentConfig from '@/pages/PaymentConfig';
import PsicloBankConfiguracao from '@/pages/PsicloBankConfiguracao';
import PsicloBankGestao from '@/pages/PsicloBankGestao';
import PsicloBankCadastroConta from '@/pages/PsicloBankCadastroConta';
import PsicloBankExtrato from '@/pages/PsicloBankExtrato';

export const adminRoutes = [
  <Route key="admin" path="/admin" element={
    <AdminRoute>
      <Admin />
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
  } />
];
