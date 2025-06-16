
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// FALLBACK: Se as variáveis de ambiente não estão carregadas, usar valores diretos
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xwaxvupymmlbehlocyzt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3YXh2dXB5bW1sYmVobG9jeXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc1NzYsImV4cCI6MjA2NDU1MzU3Nn0.t3jxj74dZmzGzHiJJQL9-pgc2JT1KupqYma1JMMI8u8";

// Log para debug - verificar se as variáveis estão sendo carregadas
console.log('Environment check:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_PUBLISHABLE_KEY
});

// Initialize the Supabase client with the variables from the environment.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
