
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from "@/components/ui/tooltip"

import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyPhone from './pages/VerifyPhone';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import ReceitaSaudeControl from './pages/ReceitaSaudeControl';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminFinancials from './pages/AdminFinancials';
import PaymentConfig from './pages/PaymentConfig';
import Referral from './pages/Referral';
import NotFound from './pages/NotFound';
import EmailLogs from './pages/EmailLogs';
import { AuthProvider } from './contexts/SupabaseAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PhoneVerificationGuard from './components/PhoneVerificationGuard';
import Plans from "@/pages/Plans";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/verify-phone"
                element={
                  <ProtectedRoute>
                    <VerifyPhone />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <Dashboard />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <Patients />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <Payments />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <Expenses />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receita-saude-control"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <ReceitaSaudeControl />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plans"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <Plans />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/email-logs"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <EmailLogs />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <Profile />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <PhoneVerificationGuard>
                        <Admin />
                      </PhoneVerificationGuard>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <PhoneVerificationGuard>
                        <AdminDashboard />
                      </PhoneVerificationGuard>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/financials"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <PhoneVerificationGuard>
                        <AdminFinancials />
                      </PhoneVerificationGuard>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-config"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <PhoneVerificationGuard>
                        <PaymentConfig />
                      </PhoneVerificationGuard>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/referral"
                element={
                  <ProtectedRoute>
                    <PhoneVerificationGuard>
                      <Referral />
                    </PhoneVerificationGuard>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
