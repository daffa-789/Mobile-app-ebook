/**
 * @file scripts/health-check.js
 * @description Skrip otomasi uji kesehatan sistem terpadu (7/7 Quality Checklist).
 * Memverifikasi integritas kredensial environment (.env), konektivitas gateway pembayaran (Midtrans),
 * gateway notifikasi (WhatsApp/Fonnte), serta kueri database Supabase (users, books, transactions, events).
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { createClient } from '@supabase/supabase-js';
import {
  clientKeyNotice,
  environmentMismatch,
  isProductionFlag,
  keyEnvironment,
  mismatchRemediation,
} from '../server/lib/midtransKeys.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env') });

console.log(pc.bold(pc.cyan('\n🔍 PEMERIKSAAN KESEHATAN SISTEM (WAHIDIYAH BOOK)\n')));

let totalChecks = 0;
let passedChecks = 0;

function report(label, success, details = '') {
  totalChecks += 1;
  if (success) {
    passedChecks += 1;
    console.log(`  ${pc.green('✔')} ${pc.bold(label)} ${details ? pc.dim(`(${details})`) : ''}`);
  } else {
    console.log(`  ${pc.red('✖')} ${pc.bold(label)} ${details ? pc.yellow(`- ${details}`) : ''}`);
  }
}

// 1. Env variables check
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
report(
  'Supabase Config',
  Boolean(supabaseUrl && supabaseKey),
  supabaseUrl ? 'URL Terdeteksi' : 'Belum diisi di .env',
);

const midtransServer = process.env.MIDTRANS_SERVER_KEY;
const midtransClient = process.env.MIDTRANS_CLIENT_KEY;
const midtransProduction = isProductionFlag(process.env.MIDTRANS_IS_PRODUCTION);
const midtransMismatch = environmentMismatch({
  isProduction: midtransProduction,
  serverKey: midtransServer,
});
const midtransNotice = clientKeyNotice({ serverKey: midtransServer, clientKey: midtransClient });
/* Mode dibaca dari prefix kunci server, bukan dari flag: flag sendirian bisa
 * berkata "Sandbox" sementara yang terpasang kunci produksi.
 */
report(
  'Midtrans Gateway',
  Boolean(midtransServer && midtransClient) && !midtransMismatch,
  midtransMismatch
    ? `${midtransMismatch}. Perbaikan: ${mismatchRemediation(midtransProduction)}`
    : midtransServer
      ? `Mode: ${midtransProduction ? 'Production' : 'Sandbox'} (dari MIDTRANS_IS_PRODUCTION; prefiks kunci: ${keyEnvironment(midtransServer) || 'kosong'})${midtransNotice ? ` — catatan: ${midtransNotice}` : ''}`
      : 'Kunci sandbox belum diisi: ambil SB-Mid-server-… / SB-Mid-client-… di dashboard.sandbox.midtrans.com, lalu samakan di Environment Variables Vercel',
);

const waProvider = process.env.WHATSAPP_PROVIDER || 'fonnte';
const isWaConfigured = waProvider === 'demo' || Boolean(process.env.FONNTE_TOKEN);
report(
  'WhatsApp Gateway',
  isWaConfigured,
  `Provider: ${waProvider}${waProvider === 'demo' ? ' (Testing)' : ''}`,
);

// 2. Supabase Database Connection & Tables Check
async function checkDatabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.log(pc.red('\n  Koneksi database dilewati karena kredensial belum lengkap.\n'));
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check users table
    const { count: userCount, error: userErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    report('Tabel Users', !userErr, userErr ? userErr.message : `${userCount ?? 0} pengguna`);

    // Check books table
    const { count: bookCount, error: bookErr } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true });
    report('Tabel Books', !bookErr, bookErr ? bookErr.message : `${bookCount ?? 0} buku`);

    // Check transactions table
    const { count: txCount, error: txErr } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    report(
      'Tabel Transactions',
      !txErr,
      txErr ? txErr.message : `${txCount ?? 0} riwayat transaksi`,
    );

    // Check events table
    const { count: eventCount, error: eventErr } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    report('Tabel Events', !eventErr, eventErr ? eventErr.message : `${eventCount ?? 0} agenda`);
  } catch (err) {
    report('Koneksi Database', false, err.message);
  }
}

await checkDatabase();

console.log(pc.cyan('\n────────────────────────────────────────────────'));
if (passedChecks === totalChecks) {
  console.log(pc.bold(pc.green(`🎉 SEMUA SISTEM SIAP! (${passedChecks}/${totalChecks} Lolos)`)));
} else {
  console.log(
    pc.bold(
      pc.yellow(
        `⚠️  Ada konfigurasi yang memerlukan perhatian (${passedChecks}/${totalChecks} Lolos)`,
      ),
    ),
  );
}
console.log(pc.cyan('────────────────────────────────────────────────\n'));
