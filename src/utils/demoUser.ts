/**
 * Utilities for demo user functionality
 */

import { User } from '@supabase/supabase-js';

const DEMO_USER_EMAIL = 'suporte@psiclo.com.br';

/**
 * Checks if the current user is the demo user
 */
export const isDemoUser = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === DEMO_USER_EMAIL.toLowerCase();
};

/**
 * Checks if the current user email is the demo user
 */
export const isDemoUserByEmail = (email: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase() === DEMO_USER_EMAIL.toLowerCase();
};