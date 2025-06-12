import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import PhoneVerificationGuard from '@/components/PhoneVerificationGuard';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Patients from '@/pages/Patients';
import Payments from '@/pages/Payments';
import Expenses from '@/pages/Expenses';
import Profile from '@/pages/Profile';
import Plans from '@/pages/Plans';
import Admin from '@/pages/Admin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminFinancials from '@/pages/AdminFinancials';
import PaymentConfig from '@/pages/PaymentConfig';
import ReceitaSaudeControl from '@/pages/ReceitaSaudeControl';
import EmailLogs from '@/pages/EmailLogs';
import Referral from '@/pages/Referral';
import NotFound from '@/pages/NotFound';
import UpdatePhone from '@/pages/UpdatePhone';
import VerifyPhone from '@/pages/VerifyPhone';
import PsicloBankConfiguracao from '@/pages/PsicloBankConfiguracao';
import PsicloBankGestao from '@/pages/PsicloBankGestao';
import PsicloBankCadastroConta from '@/pages/PsicloBankCadastroConta';
import PsicloBankExtrato from '@/pages/PsicloBankExtrato';
import CadastroPaciente from '@/pages/CadastroPaciente';
import SupportTicket from './pages/SupportTicket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
              <Route path="/update-phone" element={
                <ProtectedRoute>
                  <UpdatePhone />
                </ProtectedRoute>
              } />
              <Route path="/verify-phone" element={
                <ProtectedRoute>
                  <VerifyPhone />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <Dashboard />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/patients" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <Patients />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/payments" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <Payments />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <Expenses />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/receita-saude-control" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <ReceitaSaudeControl />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/email-logs" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <EmailLogs />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/plans" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <Plans />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/referral" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <Referral />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/psiclo-bank/configuracao" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <PsicloBankConfiguracao />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/psiclo-bank/gestao" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <PsicloBankGestao />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/psiclo-bank/cadastro-conta" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <PsicloBankCadastroConta />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route path="/psiclo-bank/extrato" element={
                <ProtectedRoute>
                  <PhoneVerificationGuard>
                    <PsicloBankExtrato />
                  </PhoneVerificationGuard>
                </ProtectedRoute>
              } />
              <Route 
                path="/suporte" 
                element={
                  <ProtectedRoute>
                    <SupportTicket />
                  </ProtectedRoute>
                } 
              />
              <Route path="/admin" element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } />
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/financials" element={
                <AdminRoute>
                  <AdminFinancials />
                </AdminRoute>
              } />
              <Route path="/payment-config" element={
                <AdminRoute>
                  <PaymentConfig />
                </AdminRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-center" />
          </div>
        </Router>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
