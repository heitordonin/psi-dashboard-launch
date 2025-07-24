
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL environment variable is required');
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
}

// Log para debug - verificar se as variáveis estão sendo carregadas
console.log('Environment check:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_PUBLISHABLE_KEY
});

// Initialize the Supabase client with the variables from the environment.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
