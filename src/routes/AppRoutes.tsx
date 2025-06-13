
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import CadastroPaciente from '@/pages/CadastroPaciente';
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
      
      {/* Protected Routes */}
      {protectedRoutes}
      
      {/* Admin Routes */}
      {adminRoutes}
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
