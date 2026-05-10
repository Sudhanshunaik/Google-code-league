/**
 * Supabase Client Configuration
 * 
 * Initialize the Supabase client for auth, database queries, and realtime.
 * Replace the placeholder values with your actual Supabase project credentials.
 * 
 * Find these in: Supabase Dashboard → Settings → API
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
