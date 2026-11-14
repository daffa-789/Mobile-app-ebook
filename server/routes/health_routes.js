import { Router } from 'express';
import { supabaseServer, isDatabaseHealthy } from '../db.js';
import { requireAdmin, requireAuth } from '../auth.js';
import { fail } from '../lib/http.js';
import { LISTEN_PORT, MIDTRANS_IS_PRODUCTION, MIDTRANS_SERVER_KEY } from '../config.js';
import { isMidtransConfigured } from '../lib/midtrans.js';
import { environmentMismatch, keyEnvironment, mismatchRemediation } from '../lib/midtransKeys.js';

export const healthRouter = Router();

/**
 * Status konfigurasi gateway TANPA pernah mengirim nilai kunci. Dipakai untuk
 * memastikan env Vercel sudah sama dengan `.env` lokal setelah deploy — selama
 * ini ketidakcocokan kunci/flag baru ketahuan saat pengguna menekan Bayar.
 */
const midtransHealth = () => {
  const mismatch = environmentMismatch({
    isProduction: MIDTRANS_IS_PRODUCTION,
    serverKey: MIDTRANS_SERVER_KEY,
  });

  let message = null;
  if (!isMidtransConfigured) {
    message = 'MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY belum diisi.';
  } else if (mismatch) {
    message = `${mismatch}. Perbaikan: ${mismatchRemediation(MIDTRANS_IS_PRODUCTION)}.`;
  }

  return {
    configured: isMidtransConfigured,
    /* Endpoint yang benar-benar dipakai mengikuti flag; prefiks kunci hanya
     * petunjuk dan tidak selalu bisa menentukan lingkungan (lihat midtransKeys). */
    mode: MIDTRANS_IS_PRODUCTION ? 'production' : 'sandbox',
    keyPrefix: keyEnvironment(MIDTRANS_SERVER_KEY),
    consistent: isMidtransConfigured && !mismatch,
    message,
  };
};

healthRouter.get('/health', async (req, res) => {
  const dbHealth = await isDatabaseHealthy();
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'ok' : 'degraded',
    database: dbHealth.ok ? 'connected' : 'disconnected',
    databaseMessage: dbHealth.message || 'Database Supabase Cloud terhubung aktif',
    databaseDetail: dbHealth.detail || null,
    server: 'running',
    midtrans: midtransHealth(),

    port: LISTEN_PORT,
    timestamp: new Date().toISOString(),
  });
});

// Unduhan langsung dari domain sendiri (same-origin). Jangan arahkan ke
// github.com: atribut HTML `download` diabaikan browser untuk URL cross-origin
// sehingga pengguna malah melihat halaman GitHub. Arsip rilis kanonik tetap di
// GitHub Release v0.1.5. Build JSC v0.1.2 sudah dihapus (force close 32-bit).
// APK v0.1.9 menyematkan reader PDF native + proteksi screenshot/rekam layar
// (FLAG_SECURE) di ReaderScreen. Sertifikat IDENTIK dengan 0.1.8
// (SHA-1 E6:89:5B:E7:CC:70:D2:5E:80:96:28:C5:49:81:8A:32:26:1D:8E:29),
// jadi pengguna 0.1.8 cukup memasang APK ini di atas versi lama (in-place),
// TANPA uninstall dan data lokal tetap ada. Sertifikat 0.1.1–0.1.7 berbeda
// (5F:F7:BC:CA:03:8F:EC:84:64:6E:EB:53:B5:43:13:62:51:C0:B3:B6), sehingga
// mereka tetap wajib uninstall dulu (INSTALL_FAILED_UPDATE_INCOMPATIBLE).
// Modul native TIDAK bisa dikirim lewat EAS Update: OTA hanya berlaku pada
// runtime 0.1.9, yaitu setelah APK 0.1.9 terpasang.
healthRouter.get('/download/apk', (req, res) => {
  res.redirect(302, '/unduh/wahidiyah-v0.1.9-hermes-32bit.apk');
});

healthRouter.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [
      { count: userCount },
      { count: subCount },
      { data: revenueRows },
      { count: bookCount },
      { count: transactionCount },
      { count: pendingCount },
      { data: recentTransactions },
    ] = await Promise.all([
      supabaseServer.from('users').select('*', { count: 'exact', head: true }),
      supabaseServer.from('users').select('*', { count: 'exact', head: true }).eq('is_pro', true),
      supabaseServer.from('transactions').select('total_paid').eq('status', 'success'),
      supabaseServer.from('books').select('*', { count: 'exact', head: true }),
      supabaseServer.from('transactions').select('*', { count: 'exact', head: true }),
      supabaseServer
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabaseServer
        .from('transactions')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const totalRevenue = (revenueRows || []).reduce(
      (acc, row) => acc + (Number(row.total_paid) || 0),
      0,
    );

    const mappedRecent = (recentTransactions || []).map((tx) => ({
      ...tx,
      userName: tx.users?.name,
      userEmail: tx.users?.email,
    }));

    res.json({
      success: true,
      stats: {
        totalUsers: userCount || 0,
        activeSubscriptions: subCount || 0,
        totalRevenue,
        totalBooks: bookCount || 0,
        totalTransactions: transactionCount || 0,
        pendingTransactions: pendingCount || 0,
      },
      recentTransactions: mappedRecent,
    });
  } catch (error) {
    fail(res, error);
  }
});
