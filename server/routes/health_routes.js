import { Router } from 'express';
import { supabaseServer, isDatabaseHealthy } from '../db.js';
import { requireAdmin, requireAuth } from '../auth.js';
import { fail } from '../lib/http.js';
import { LISTEN_PORT } from '../config.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const dbHealth = await isDatabaseHealthy();
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'ok' : 'degraded',
    database: dbHealth.ok ? 'connected' : 'disconnected',
    databaseMessage: dbHealth.message || 'Database Supabase Cloud terhubung aktif',
    databaseDetail: dbHealth.detail || null,
    server: 'running',

    port: LISTEN_PORT,
    timestamp: new Date().toISOString(),
  });
});

// Unduhan langsung dari domain sendiri (same-origin). Jangan arahkan ke
// github.com: atribut HTML `download` diabaikan browser untuk URL cross-origin
// sehingga pengguna malah melihat halaman GitHub. Arsip rilis kanonik tetap di
// GitHub Release v0.1.3. Build JSC v0.1.2 sudah dihapus (force close 32-bit).
// Pemasangan di perangkat dengan build lama wajib uninstall karena tiap build
// EAS memakai sertifikat penandatanganan yang berbeda.
healthRouter.get('/download/apk', (req, res) => {
  res.redirect(302, '/unduh/wahidiyah-v0.1.3-hermes-32bit.apk');
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
