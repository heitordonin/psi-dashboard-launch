
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import CadastroPaciente from '@/pages/CadastroPaciente';
import ResetPassword from '@/pages/ResetPassword';
import DirectCheckout from '@/pages/DirectCheckout';
import PostCheckoutSignup from '@/pages/PostCheckoutSignup';
import LandingPage from '@/pages/LandingPage';
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
      
      {/* Checkout Routes */}
      <Route path="/checkout" element={<DirectCheckout />} />
      <Route path="/post-checkout-signup" element={<PostCheckoutSignup />} />
      
      {/* Landing Page */}
      <Route path="/landing" element={<LandingPage />} />
      
      {/* Protected Routes */}
      {protectedRoutes}
      
      {/* Admin Routes */}
      {adminRoutes}
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
