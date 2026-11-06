import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });
dotenv.config({ override: true });

const SUPABASE_PROJECT_URL = 'https://pfiowztxlbcclazpdsxe.supabase.co';

const resolveSupabaseCredentials = (env = process.env) => {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || SUPABASE_PROJECT_URL;
  const secretKey = String(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = String(env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (env.NODE_ENV === 'production' && !secretKey) {
    throw new Error(
      '[DB] SUPABASE_SECRET_KEY (atau SUPABASE_SERVICE_ROLE_KEY) wajib diset di produksi. Boot dihentikan: tanpa kunci server, seluruh INSERT/UPDATE diblokir RLS dan aplikasi hidup setengah-konfigurasi.',
    );
  }

  return { url, key: secretKey || anonKey, hasServiceRoleKey: Boolean(secretKey) };
};

const { url: supaUrl, key: supaKey, hasServiceRoleKey } = resolveSupabaseCredentials(process.env);

export const supabaseServer = supaUrl && supaKey ? createClient(supaUrl, supaKey) : null;

export async function testConnection() {
  if (!supabaseServer) {
    logger.error(
      'DB',
      'Supabase belum terkonfigurasi — set SUPABASE_URL & SUPABASE_SECRET_KEY di .env',
    );
    return false;
  }
  try {
    const { error } = await supabaseServer.from('users').select('id').limit(1);
    if (error) throw error;
    logger.ok('DB', 'Berhasil terhubung ke Supabase Cloud (Skripsi_Project)');
    if (!hasServiceRoleKey) {
      logger.warn(
        'DB',
        '⚠️ Backend berjalan dengan Anon Key karena SUPABASE_SECRET_KEY belum diisi di .env! Operasi INSERT/UPDATE akan diblokir oleh Row-Level Security (RLS).',
      );
    }
    return true;
  } catch (e) {
    logger.error('DB', 'Gagal terhubung ke Supabase', { reason: e.message });
    return false;
  }
}

export async function isDatabaseHealthy() {
  if (!supabaseServer) {
    return { ok: false, code: 'NO_CONFIG', message: 'Supabase belum terkonfigurasi.' };
  }
  try {
    const { error } = await supabaseServer.from('users').select('id').limit(1);
    if (error) throw error;
    return { ok: true, provider: 'supabase', message: 'Database Supabase Cloud terhubung aktif' };
  } catch (error) {
    return {
      ok: false,
      code: error.code || 'UNKNOWN',
      message: 'Koneksi Supabase tidak tersedia.',
    };
  }
}
