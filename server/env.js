// Central environment loader. E2E runs never load the production .env files.
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const isE2eEnvironment = process.env.E2E_TEST_MODE === '1';

export const DEFAULT_SUPABASE_URL = 'https://pfiowztxlbcclazpdsxe.supabase.co';

const configureE2eEnvironment = () => {
  const projectRef = String(process.env.E2E_SUPABASE_PROJECT_REF || '').trim();
  const supabaseUrl = String(process.env.E2E_SUPABASE_URL || '').trim();
  const secretKey = String(
    process.env.E2E_SUPABASE_SECRET_KEY || process.env.E2E_SUPABASE_SERVICE_ROLE_KEY || '',
  ).trim();
  const anonKey = String(process.env.E2E_SUPABASE_ANON_KEY || '').trim();

  if (!projectRef || !supabaseUrl || !secretKey) {
    throw new Error(
      '[E2E] Konfigurasi belum lengkap. Isi .env.e2e di root dengan URL, project ref, serta secret key dari project Supabase khusus tes.',
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error('[E2E] E2E_SUPABASE_URL bukan URL yang valid.');
  }

  const productionRef = new URL(DEFAULT_SUPABASE_URL).hostname.split('.')[0];
  if (projectRef === productionRef || parsedUrl.hostname === `${productionRef}.supabase.co`) {
    throw new Error('[E2E] Supabase project produksi ditolak. E2E wajib memakai project test terpisah.');
  }

  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.hostname !== `${projectRef}.supabase.co` ||
    parsedUrl.pathname !== '/' ||
    parsedUrl.search !== '' ||
    parsedUrl.hash !== '' ||
    !/^[a-z0-9-]{10,64}$/.test(projectRef)
  ) {
    throw new Error(
      '[E2E] URL harus HTTPS dan host-nya harus cocok dengan E2E_SUPABASE_PROJECT_REF.',
    );
  }

  process.env.SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_SECRET_KEY = secretKey;
  process.env.SUPABASE_PUBLISHABLE_KEY = anonKey;
  process.env.VITE_SUPABASE_URL = supabaseUrl;
  process.env.VITE_SUPABASE_ANON_KEY = anonKey;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.E2E_SUPABASE_URL;
  delete process.env.E2E_SUPABASE_PROJECT_REF;
  delete process.env.E2E_SUPABASE_SECRET_KEY;
  delete process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.E2E_SUPABASE_ANON_KEY;

  // E2E may exercise registration and payment routes, but must never contact
  // real payment, email, WhatsApp, OAuth, push, or cron services.
  for (const key of [
    'MIDTRANS_SERVER_KEY',
    'MIDTRANS_CLIENT_KEY',
    'VAPID_PRIVATE_KEY',
    'VAPID_PUBLIC_KEY',
    'VAPID_SUBJECT',
    'FONNTE_TOKEN',
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
    'GMAIL_SENDER',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_OAUTH_REDIRECT_URI',
    'CRON_SECRET',
  ]) {
    process.env[key] = '';
  }

  process.env.NODE_ENV = 'test';
  process.env.E2E_TEST_MODE = '1';
  process.env.JWT_SECRET = 'e2e-only-session-secret-never-use-in-production';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.MIDTRANS_IS_PRODUCTION = 'false';
  process.env.WHATSAPP_PROVIDER = 'demo';
  process.env.EXPOSE_DEV_OTP = '1';
  process.env.SERVE_STATIC = 'false';
  process.env.VITE_MIDDLEWARE = '0';
  process.env.VERCEL = '';
  process.env.PORT = '0';
  process.env.VITE_PORT = '0';
  process.env.CORS_ORIGINS = 'http://127.0.0.1';

  console.info(`[E2E] Menggunakan project Supabase test: ${projectRef}`);
};

if (isE2eEnvironment) {
  const e2eEnvPath = path.join(rootDir, '.env.e2e');
  if (fs.existsSync(e2eEnvPath)) {
    dotenv.config({ path: e2eEnvPath, override: true });
  }
  configureE2eEnvironment();
} else {
  dotenv.config({ path: path.join(rootDir, '.env'), override: true });
  dotenv.config({ path: path.join(here, '.env'), override: true });
  dotenv.config({ override: true });
}
