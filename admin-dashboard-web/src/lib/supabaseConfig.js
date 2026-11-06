const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

export const SUPABASE_URL =
  metaEnv.VITE_SUPABASE_URL ||
  procEnv.VITE_SUPABASE_URL ||
  procEnv.SUPABASE_URL ||
  'https://pdimjmbjutlzjdfjaqgt.supabase.co';

export const SUPABASE_ANON_KEY =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  procEnv.VITE_SUPABASE_ANON_KEY ||
  procEnv.SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('your-anon-key'),
);

if (!isSupabaseConfigured) {
  console.info(
    '%c[Supabase]%c Kredensial VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi di .env. Aplikasi saat ini dapat menggunakan mode Express/Local atau Anda dapat mengisi kredensial Supabase Anda di .env.',
    'color: #10b981; font-weight: bold;',
    'color: inherit;',
  );
}
