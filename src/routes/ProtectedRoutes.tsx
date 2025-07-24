
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import PhoneVerificationGuard from '@/components/PhoneVerificationGuard';
import Dashboard from '@/pages/Dashboard';
import Patients from '@/pages/Patients';
import Payments from '@/pages/Payments';
import Expenses from '@/pages/Expenses';
import Profile from '@/pages/Profile';
import Plans from '@/pages/Plans';
import Subscription from '@/pages/Subscription';
import ReceitaSaudeControl from '@/pages/ReceitaSaudeControl';
import EmailLogs from '@/pages/EmailLogs';
import Referral from '@/pages/Referral';
import UpdatePhone from '@/pages/UpdatePhone';
import VerifyPhone from '@/pages/VerifyPhone';
import SupportTicket from '@/pages/SupportTicket';
import DocumentosRecebidos from '@/pages/DocumentosRecebidos';
import DocumentoDetalhes from '@/pages/DocumentoDetalhes';
import CheckoutSuccess from '@/pages/CheckoutSuccess';

import Agenda from '@/pages/Agenda';
import AgendaConfiguracoes from '@/pages/AgendaConfiguracoes';
import AgendaSessoesDia from '@/pages/AgendaSessoesDia';

export const protectedRoutes = [
  <Route key="update-phone" path="/update-phone" element={
    <ProtectedRoute>
      <UpdatePhone />
    </ProtectedRoute>
  } />,
  <Route key="verify-phone" path="/verify-phone" element={
    <ProtectedRoute>
      <VerifyPhone />
    </ProtectedRoute>
  } />,
  <Route key="dashboard" path="/dashboard" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <Dashboard />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="patients" path="/patients" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <Patients />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="payments" path="/payments" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <Payments />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="expenses" path="/expenses" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <Expenses />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="receita-saude" path="/receita-saude-control" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <ReceitaSaudeControl />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="email-logs" path="/email-logs" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <EmailLogs />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="plans" path="/plans" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <Plans />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="subscription" path="/plans/subscription" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <Subscription />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="profile" path="/profile" element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  } />,
  <Route key="referral" path="/referral" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <Referral />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="suporte" path="/suporte" element={
    <ProtectedRoute>
      <SupportTicket />
    </ProtectedRoute>
  } />,
  <Route key="documentos-recebidos" path="/documentos-recebidos" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <DocumentosRecebidos />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="agenda" path="/agenda" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <Agenda />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="agenda-sessoes-dia" path="/agenda/sessoes-dia" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <AgendaSessoesDia />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="agenda-configuracoes" path="/agenda/configuracoes" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <AgendaConfiguracoes />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="documento-detalhes" path="/documento/:id" element={
    <ProtectedRoute>
      <PhoneVerificationGuard>
        <DocumentoDetalhes />
      </PhoneVerificationGuard>
    </ProtectedRoute>
  } />,
  <Route key="checkout-success" path="/checkout/success" element={
    <ProtectedRoute>
      <CheckoutSuccess />
    </ProtectedRoute>
  } />
];
