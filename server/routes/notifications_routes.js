/* Rute Web Push Notification — pengingat agenda H-1.
 *
 * Rute sengaja PUBLIK (tanpa requireAuth): notifikasi menyasar SEMUA
 * pengunjung, termasuk yang belum punya akun. Yang dilindungi bukan
 * identitas, melainkan bentuk data — lihat validasi ketat di bawah.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { badRequest, wrap } from '../lib/http.js';
import { isAllowedPushEndpoint } from '../lib/pushEndpoint.js';
import { isPushConfigured } from '../lib/pushGuards.js';
import {
  saveSubscription,
  removeSubscription,
  countActiveSubscriptions,
} from '../lib/pushSubscriptionStore.js';
import { VAPID_PUBLIC_KEY } from '../config.js';
import { clippedText } from '../lib/validate.js';

export const notificationsRouter = Router();

const MAX_KEY_LENGTH = 200;
const subscriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak perubahan langganan notifikasi. Coba lagi nanti.',
  },
});

const isValidKey = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= MAX_KEY_LENGTH &&
  /^[A-Za-z0-9_-]+=*$/.test(value);

notificationsRouter.get('/notifications/public-key', (req, res) => {
  res.json({
    success: true,
    enabled: isPushConfigured(),
    publicKey: isPushConfigured() ? VAPID_PUBLIC_KEY : null,
  });
});

notificationsRouter.post(
  '/notifications/subscribe',
  subscriptionRateLimit,
  wrap(async (req, res) => {
    if (!isPushConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Fitur notifikasi belum diaktifkan pada server ini.',
      });
    }

    const endpoint = req.body?.endpoint;
    const keys = req.body?.keys || {};

    if (!isAllowedPushEndpoint(endpoint)) {
      return badRequest(res, 'Endpoint langganan harus berasal dari layanan push yang didukung.');
    }

    if (!isValidKey(keys.p256dh) || !isValidKey(keys.auth)) {
      return badRequest(res, 'Kunci langganan perangkat tidak lengkap.');
    }

    const result = await saveSubscription({
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      userAgent: clippedText(req.get('user-agent'), 255),
    }).catch((error) => {
      /* Tabel belum dibuat (pemilik belum menjalankan blok PATCH) — balas 503
       dengan petunjuk, bukan 500 mentah. */
      if (error?.schemaMissing) {
        return { schemaMissing: true };
      }
      throw error;
    });

    if (result.schemaMissing) {
      return res.status(503).json({
        success: false,
        message: 'Penyimpanan langganan belum disiapkan di server. Hubungi pengelola aplikasi.',
      });
    }

    const total = await countActiveSubscriptions();

    res.status(result.created ? 201 : 200).json({
      success: true,
      message: 'Perangkat ini akan menerima pengingat agenda.',
      subscriptionId: result.id,
      subscribers: total,
    });
  }),
);

notificationsRouter.post(
  '/notifications/unsubscribe',
  subscriptionRateLimit,
  wrap(async (req, res) => {
    const endpoint = req.body?.endpoint;

    if (!isAllowedPushEndpoint(endpoint)) {
      return badRequest(res, 'Endpoint langganan tidak valid.');
    }

    await removeSubscription(endpoint);
    res.json({ success: true, message: 'Notifikasi untuk perangkat ini dimatikan.' });
  }),
);

notificationsRouter.get(
  '/notifications/status',
  wrap(async (req, res) => {
    if (!isPushConfigured()) {
      return res.json({ success: true, enabled: false, subscribers: 0 });
    }
    const subscribers = await countActiveSubscriptions();
    res.json({ success: true, enabled: true, subscribers });
  }),
);
