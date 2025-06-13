
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import CadastroPaciente from '@/pages/CadastroPaciente';
import ResetPassword from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';
import { protectedRoutes } from './ProtectedRoutes';
import { adminRoutes } from './AdminRoutes';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/cadastro-paciente" element={<CadastroPaciente />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected Routes */}
      {protectedRoutes}
      
      {/* Admin Routes */}
      {adminRoutes}
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
