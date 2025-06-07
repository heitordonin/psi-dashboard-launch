
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/SupabaseAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import ReceitaSaudeControl from "./pages/ReceitaSaudeControl";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            } />
            <Route path="/pacientes" element={<Navigate to="/patients" replace />} />
            <Route path="/payments" element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            } />
            <Route path="/cobrancas" element={<Navigate to="/payments" replace />} />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="/despesas" element={<Navigate to="/expenses" replace />} />
            <Route path="/receita-saude" element={
              <ProtectedRoute>
                <ReceitaSaudeControl />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              </ProtectedRoute>
            } />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
