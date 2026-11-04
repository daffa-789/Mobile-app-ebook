import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { requireAdmin, requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';
import { ACTIVE_SUBSCRIPTION_STATUS } from '../lib/membership.js';

const MAX_LOG_LIMIT = 200;
const DEFAULT_LOG_LIMIT = 50;

export const adminRouter = Router();

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const formatRupiah = (value) => idrFormatter.format(Number(value || 0));

adminRouter.get(
  '/admin/logs',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || DEFAULT_LOG_LIMIT, MAX_LOG_LIMIT);
    const logs = [];

    const { data: subscriptions, error: subError } = await supabaseServer
      .from('subscriptions')
      .select('id, user_id, plan_name, status, price, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (subError) throw subError;

    (subscriptions || []).forEach((row) => {
      logs.push({
        type: 'subscription',
        action:
          row.status === ACTIVE_SUBSCRIPTION_STATUS
            ? 'Pembayaran berhasil'
            : `Status: ${row.status}`,
        detail: `${row.plan_name} - ${formatRupiah(row.price)}`,
        userId: row.user_id,
        timestamp: row.created_at,
      });
    });

    const { data: users, error: userError } = await supabaseServer
      .from('users')
      .select('id, name, email, login_method, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userError) throw userError;

    (users || []).forEach((row) => {
      logs.push({
        type: 'user',
        action: 'Pengguna terdaftar',
        detail: `${row.name} (${row.email}) via ${row.login_method || 'email'}`,
        userId: row.id,
        timestamp: row.created_at,
      });
    });

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, logs: logs.slice(0, limit) });
  }),
);
