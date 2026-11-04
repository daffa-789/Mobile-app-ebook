import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';
import { findPlan } from '../lib/constants.js';

export const subscriptionsRouter = Router();

subscriptionsRouter.get(
  '/subscriptions/my',
  requireAuth,
  wrap(async (req, res) => {
    const { data: subs, error: subError } = await supabaseServer
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (subError) throw subError;

    // Jika tabel subscriptions sudah memiliki data, gunakan langsung
    if (subs && subs.length > 0) {
      return res.json({ success: true, subscriptions: subs });
    }

    // Fallback: jika subscriptions kosong tetapi ada transaksi sukses di tabel transactions
    const { data: txs, error: txError } = await supabaseServer
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'success')
      .order('created_at', { ascending: false });

    if (txError) throw txError;

    const fallbackPlan = findPlan();
    const fallbackSubs = (txs || []).map((tx) => ({
      id: 'sub-' + tx.id.replace('tx-', ''),
      user_id: tx.user_id,
      plan_name: tx.plan_name || fallbackPlan?.name,
      price: tx.amount || fallbackPlan?.price || 0,
      status: 'Aktif',
      expires_at: tx.expires_at || null,
      ref_code: tx.ref_no ? 'REF-' + String(tx.ref_no).slice(-8) : '',
      created_at: tx.created_at,
    }));

    res.json({ success: true, subscriptions: fallbackSubs });
  }),
);
