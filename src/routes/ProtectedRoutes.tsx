
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import PhoneVerificationGuard from '@/components/PhoneVerificationGuard';
import Dashboard from '@/pages/Dashboard';
import Patients from '@/pages/Patients';
import Payments from '@/pages/Payments';
import Expenses from '@/pages/Expenses';
import Profile from '@/pages/Profile';
import Plans from '@/pages/Plans';
import ReceitaSaudeControl from '@/pages/ReceitaSaudeControl';
import EmailLogs from '@/pages/EmailLogs';
import Referral from '@/pages/Referral';
import UpdatePhone from '@/pages/UpdatePhone';
import VerifyPhone from '@/pages/VerifyPhone';
import SupportTicket from '@/pages/SupportTicket';

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
  } />
];
