import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth.js';
import { badRequest, fail, internalErrorDetail, replyAlreadyPro, wrap } from '../lib/http.js';
import { isOneOf } from '../lib/validate.js';
import { paymentRateLimiter } from '../middleware/security.js';
import {
  createManualTransaction,
  listTransactions,
  verifyTransaction,
} from '../services/transactions_service.js';

export const transactionsRouter = Router();

transactionsRouter.get(
  '/transactions',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const transactions = await listTransactions({ limit: req.query.limit });
    res.json({ success: true, transactions });
  }),
);

transactionsRouter.put(
  '/transactions/:id/verify',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const { action } = req.body;

    if (!isOneOf(action, ['approve', 'reject'])) {
      return badRequest(res, 'Aksi harus "approve" atau "reject".');
    }

    const result = await verifyTransaction({ id: req.params.id, action });

    if (result.outcome === 'idempotent') {
      return res.json({
        success: true,
        alreadyVerified: true,
        status: result.status,
        message: result.message,
      });
    }

    res.json({
      success: true,
      status: result.status,
      message: result.message,
    });
  }),
);

transactionsRouter.post('/transactions', paymentRateLimiter, requireAuth, async (req, res) => {
  try {
    const result = await createManualTransaction({ user: req.user, body: req.body || {} });

    if (result.outcome === 'already-pro') return replyAlreadyPro(res, result);

    res.status(202).json({
      success: true,
      pendingVerification: true,
      message:
        'Transaksi tercatat dan menunggu konfirmasi pembayaran. Paket Pro aktif setelah payment gateway mengonfirmasi pembayaran.',
      transaction: result.transaction,
      user: result.user,
    });
  } catch (error) {
    /* Harga paket tidak cocok dan sejenisnya adalah galat 4xx dari service;
       sisanya kegagalan penyimpanan → 500 dengan pesan khas endpoint ini. */
    if (error?.statusCode) return fail(res, error);

    res.status(500).json({
      success: false,
      message: 'Gagal memproses transaksi.',
      error: internalErrorDetail(error),
    });
  }
});
