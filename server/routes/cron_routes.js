import crypto from 'node:crypto';
import { Router } from 'express';
import { settleExpiredMembership } from '../auth.js';
import { sweepDueReminders } from '../lib/eventReminder.js';
import { logger } from '../logger.js';

export const cronRouter = Router();

const isAuthorizedCronRequest = (authorization, secret = process.env.CRON_SECRET) => {
  if (typeof secret !== 'string' || secret.length < 16) return false;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return false;

  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
};

const handleDailyMaintenance = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 16) {
    return res
      .status(503)
      .json({ success: false, message: 'Jadwal pemeliharaan belum dikonfigurasi.' });
  }
  if (!isAuthorizedCronRequest(req.get('authorization'))) {
    return res.status(401).json({ success: false, message: 'Tidak diizinkan.' });
  }

  const results = await Promise.allSettled([sweepDueReminders(), settleExpiredMembership()]);
  const failures = results.filter((result) => result.status === 'rejected');

  if (failures.length) {
    logger.error('CRON', 'Pemeliharaan harian gagal sebagian', {
      errors: failures.map(({ reason }) => reason?.message || String(reason)),
    });
    return res.status(500).json({ success: false, message: 'Pemeliharaan harian gagal.' });
  }

  logger.info('CRON', 'Pemeliharaan harian selesai', {
    reminders: results[0].value,
    memberships: 'checked',
  });
  return res.json({ success: true, reminders: results[0].value, memberships: 'checked' });
};

cronRouter.get('/cron/daily-maintenance', handleDailyMaintenance);
