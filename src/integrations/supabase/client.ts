
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Read the environment variables provided by Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// CRITICAL: Validate that the environment variables are loaded.
// This prevents the app from running with a missing or invalid configuration.
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("CRITICAL ERROR: Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not defined. Please check your .env file or deployment settings.");
}

// Initialize the Supabase client with the variables from the environment.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
