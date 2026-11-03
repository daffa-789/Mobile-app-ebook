import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabaseServer } from './db.js';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FILE_STORE_PATH = path.resolve(__dirname, '..', '.otp-dev-store.json');

let mode = 'unknown';
let initPromise = null;

const readFileStore = () => {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE_STORE_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFileStore = (rows) => {
  fs.writeFileSync(FILE_STORE_PATH, JSON.stringify(rows, null, 2), 'utf8');
};

const isMissingTableError = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return (
    text.includes('42p01') ||
    text.includes('pgrst205') ||
    text.includes('does not exist') ||
    text.includes('schema cache')
  );
};

export const initOtpStore = async () => {
  if (mode !== 'unknown') return mode;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { error } = await supabaseServer.from('email_verifications').select('id').limit(1);

      if (!error) {
        mode = 'table';
        logger.ok('OTP', 'Penyimpanan kode OTP siap (tabel email_verifications)');
        return mode;
      }

      if (!isMissingTableError(error)) {
        throw new Error(`Gagal memeriksa tabel email_verifications: ${error.message}`);
      }

      if (process.env.NODE_ENV !== 'development') {
        throw new Error(
          'Tabel email_verifications belum ada. Jalankan supabase_database/full_setup.sql ' +
            'di Supabase SQL Editor. (Cadangan berkas hanya aktif saat NODE_ENV=development, ' +
            'yaitu lewat `npm run dev`.)',
        );
      }

      mode = 'file';
      logger.warn(
        'OTP',
        'Tabel email_verifications belum ada — memakai penyimpanan berkas SEMENTARA',
        {
          berkas: '.otp-dev-store.json',
          catatan:
            'Hanya untuk pengembangan. Jalankan supabase_database/full_setup.sql agar permanen.',
        },
      );
      return mode;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

const ensureOtpStore = async () => {
  if (mode !== 'unknown') return mode;
  return await initOtpStore();
};

export const deleteOtpByEmailPurpose = async (email, purpose) => {
  await ensureOtpStore();
  if (mode === 'table') {
    await supabaseServer
      .from('email_verifications')
      .delete()
      .eq('email', email)
      .eq('purpose', purpose);
    return;
  }
  writeFileStore(readFileStore().filter((r) => !(r.email === email && r.purpose === purpose)));
};

export const insertOtp = async ({ email, purpose, codeHash, payload, expiresAt }) => {
  await ensureOtpStore();
  if (mode === 'table') {
    const { error } = await supabaseServer.from('email_verifications').insert({
      email,
      purpose,
      code_hash: codeHash,
      payload,
      expires_at: expiresAt,
    });
    if (error) throw error;
    return;
  }

  const rows = readFileStore();
  const nextId = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
  rows.push({
    id: nextId,
    email,
    purpose,
    code_hash: codeHash,
    payload: payload ?? null,
    attempts: 0,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });
  writeFileStore(rows);
};

export const findLatestOtp = async (email, purpose) => {
  await ensureOtpStore();
  if (mode === 'table') {
    const { data } = await supabaseServer
      .from('email_verifications')
      .select('id, code_hash, payload, attempts, expires_at, created_at')
      .eq('email', email)
      .eq('purpose', purpose)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || null;
  }

  const rows = readFileStore()
    .filter((r) => r.email === email && r.purpose === purpose)
    .sort((a, b) => Number(b.id) - Number(a.id));
  return rows[0] || null;
};

export const incrementOtpAttempts = async (id) => {
  await ensureOtpStore();
  if (mode === 'table') {
    const { data } = await supabaseServer
      .from('email_verifications')
      .select('attempts')
      .eq('id', id)
      .maybeSingle();
    await supabaseServer
      .from('email_verifications')
      .update({ attempts: (data?.attempts || 0) + 1 })
      .eq('id', id);
    return;
  }

  const rows = readFileStore();
  const row = rows.find((r) => Number(r.id) === Number(id));
  if (row) {
    row.attempts = (row.attempts || 0) + 1;
    writeFileStore(rows);
  }
};

export const deleteOtpById = async (id) => {
  await ensureOtpStore();
  if (mode === 'table') {
    await supabaseServer.from('email_verifications').delete().eq('id', id);
    return;
  }
  writeFileStore(readFileStore().filter((r) => Number(r.id) !== Number(id)));
};
