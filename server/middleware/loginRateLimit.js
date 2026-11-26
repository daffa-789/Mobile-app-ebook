import { createHmac, randomBytes } from 'node:crypto';
import { ipKeyGenerator } from 'express-rate-limit';
import { supabaseServer } from '../db.js';
import { logger } from '../logger.js';

const IP_WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_FAILED_ATTEMPTS = 30;
const ACCOUNT_WINDOW_MS = 60 * 60 * 1000;
const MAX_ACCOUNT_FAILED_ATTEMPTS = 20;

// Production has a stable JWT secret. Local development gets an ephemeral key,
// so raw IP addresses are never written to the distributed rate-limit table.
const HMAC_SECRET = process.env.JWT_SECRET || randomBytes(32);

const createBucketKey = (scope, value) => {
  return createHmac('sha256', HMAC_SECRET).update(`auth-login:${scope}:${value}`).digest('hex');
};

const incrementBucket = async (bucketKey, windowMs) => {
  const { data, error } = await supabaseServer.rpc('increment_api_rate_limit', {
    p_bucket_key: bucketKey,
    p_window_ms: windowMs,
  });
  if (error) throw error;

  const bucket = Array.isArray(data) ? data[0] : null;
  const hitCount = Number(bucket?.total_hits);
  const resetAt = new Date(bucket?.reset_time);
  if (!Number.isFinite(hitCount) || Number.isNaN(resetAt.getTime())) {
    throw new Error('Rate-limit RPC returned an invalid result.');
  }
  return { hitCount, resetAt };
};

const decrementBucket = async (bucketKey, windowMs) => {
  const { error } = await supabaseServer.rpc('decrement_api_rate_limit', {
    p_bucket_key: bucketKey,
    p_window_ms: windowMs,
  });
  if (error) throw error;
};

export async function loginRateLimiter(req, res, next) {
  const ip = ipKeyGenerator(String(req.ip || 'unknown'));
  const ipBucketKey = createBucketKey('ip', ip);
  const rawIdentifier = req.body?.email ?? req.body?.identifier;
  const identifier = String(rawIdentifier || '')
    .trim()
    .toLowerCase()
    .slice(0, 320);
  const accountBucketKey = identifier ? createBucketKey('account', identifier) : null;
  let ipIncremented = false;
  let accountIncremented = false;

  try {
    const ipBucket = await incrementBucket(ipBucketKey, IP_WINDOW_MS);
    ipIncremented = true;

    if (ipBucket.hitCount > MAX_IP_FAILED_ATTEMPTS) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((ipBucket.resetAt.getTime() - Date.now()) / 1000),
      );
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: 'Terlalu banyak percobaan masuk. Coba lagi setelah beberapa menit.',
        retryAfterSeconds,
      });
    }

    const buckets = [{ key: ipBucketKey, windowMs: IP_WINDOW_MS }];
    if (accountBucketKey) {
      const accountBucket = await incrementBucket(accountBucketKey, ACCOUNT_WINDOW_MS);
      accountIncremented = true;
      buckets.push({ key: accountBucketKey, windowMs: ACCOUNT_WINDOW_MS });

      if (accountBucket.hitCount > MAX_ACCOUNT_FAILED_ATTEMPTS) {
        await decrementBucket(ipBucketKey, IP_WINDOW_MS);
        ipIncremented = false;
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((accountBucket.resetAt.getTime() - Date.now()) / 1000),
        );
        res.setHeader('Retry-After', String(retryAfterSeconds));
        return res.status(429).json({
          success: false,
          message: 'Terlalu banyak percobaan masuk untuk akun ini. Coba lagi nanti.',
          retryAfterSeconds,
        });
      }
    }

    // The controller awaits this before sending any non-credential-failure
    // response, so successful logins do not consume the failure allowance.
    let released = false;
    res.locals.releaseLoginRateLimit = async () => {
      if (released) return;
      await Promise.all(buckets.map(({ key, windowMs }) => decrementBucket(key, windowMs)));
      released = true;
    };

    return next();
  } catch (error) {
    const cleanup = [];
    if (ipIncremented) cleanup.push(decrementBucket(ipBucketKey, IP_WINDOW_MS));
    if (accountIncremented && accountBucketKey) {
      cleanup.push(decrementBucket(accountBucketKey, ACCOUNT_WINDOW_MS));
    }
    await Promise.allSettled(cleanup);
    logger.error('RATE_LIMIT', 'Pemeriksaan batas login gagal', { code: error?.code });
    return res.status(503).json({
      success: false,
      message: 'Layanan masuk sedang sibuk. Coba lagi sebentar.',
    });
  }
}
