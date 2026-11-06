import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL as supabaseUrl,
  SUPABASE_ANON_KEY as supabaseAnonKey,
  isSupabaseConfigured,
} from './supabaseConfig';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
