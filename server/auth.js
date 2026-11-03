import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabaseServer } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || '';

const resolveJwtSecret = (env = process.env) => {
  const configured = String(env.JWT_SECRET ?? '').trim();
  if (configured) return configured;
  if (env.NODE_ENV === 'production') {
    throw new Error(
      '[AUTH] JWT_SECRET wajib diset di produksi dengan nilai acak minimal 32 karakter. Boot dihentikan agar token sesi tidak dapat dipalsukan.',
    );
  }
  return crypto.randomBytes(32).toString('hex');
};

const activeJwtSecret = resolveJwtSecret(process.env);

if (!JWT_SECRET) {
  console.warn(
    '\x1b[33m[AUTH] ⚠️  JWT_SECRET belum diset — memakai secret acak yang berganti tiap proses, sehingga semua sesi development hangus saat server restart. Set JWT_SECRET di server/.env.\x1b[0m',
  );
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const BCRYPT_ROUNDS = 12;

export const normalizeEmail = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const MAX_ID_LENGTH = 50;

export const generateId = (prefix) => {
  const id = `${prefix}-${crypto.randomUUID().replace(/-/g, '')}`;
  if (id.length > MAX_ID_LENGTH) {
    throw new RangeError(`ID "${id}" melebihi batas VARCHAR(${MAX_ID_LENGTH})`);
  }
  return id;
};

const toIsoOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const hashPassword = (password) => bcrypt.hash(String(password), BCRYPT_ROUNDS);

export const verifyPassword = async (plainPassword, storedHash) => {
  const plain = String(plainPassword ?? '');
  const stored = String(storedHash ?? '');

  if (!stored || !plain) return false;

  if (!/^\$2[aby]\$/.test(stored)) return false;
  try {
    return await bcrypt.compare(plain, stored);
  } catch {
    return false;
  }
};

const effectiveIsPro = (user) => {
  return Boolean(
    user?.is_pro === true ||
    user?.is_pro === 1 ||
    user?.is_pro === '1' ||
    user?.is_pro === 'true' ||
    user?.isPro === true,
  );
};

/**
 * Kebenaran langganan Pro (VULN-12): flag is_pro saja tidak cukup — kolom
 * subscription_expires_at harus ada di masa depan. Batas ketat: tepat sama
 * dengan `now` sudah dianggap berakhir.
 *
 * Masa berlaku kosong berarti pemberian manual oleh admin (PUT
 * /api/users/:id/pro menyetel is_pro tanpa tanggal), jadi tetap aktif;
 * jalur itu yang menjaga admin tidak terkunci dari kontennya sendiri.
 */
export const hasActivePro = (user, now = new Date()) => {
  if (!effectiveIsPro(user)) return false;
  const raw = user.subscription_expires_at ?? user.subscriptionExpiresAt ?? null;
  if (raw === null || raw === undefined || raw === '') return true;
  const expiresAt = new Date(raw);
  if (Number.isNaN(expiresAt.getTime())) return false;
  const nowMs = now instanceof Date ? now.getTime() : typeof now === 'number' ? now : Date.now();
  return expiresAt.getTime() > nowMs;
};

export const toPublicUser = (user, now = new Date()) => {
  const isPro = hasActivePro(user, now);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    login_method: user.login_method || 'email',
    is_pro: isPro,

    subscription_expires_at: toIsoOrNull(user.subscription_expires_at),
    phone: user.phone || null,
    created_at: toIsoOrNull(user.created_at),
  };
};

export const loadMembershipUser = async (userId) => {
  try {
    const { data: supaUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return supaUser || null;
  } catch {
    return null;
  }
};

export const settleExpiredMembership = async (userId = null) => {
  const nowIso = new Date().toISOString();
  try {
    let subQuery = supabaseServer
      .from('subscriptions')
      .update({ status: 'Berakhir' })
      .eq('status', 'Aktif')
      .not('expires_at', 'is', null)
      .lt('expires_at', nowIso);
    if (userId) subQuery = subQuery.eq('user_id', userId);
    const { error: subscriptionError } = await subQuery;
    if (subscriptionError) throw subscriptionError;

    let userQuery = supabaseServer
      .from('users')
      .update({ is_pro: false, subscription_expires_at: null })
      .not('subscription_expires_at', 'is', null)
      .lt('subscription_expires_at', nowIso);
    if (userId) userQuery = userQuery.eq('id', userId);
    const { error: userError } = await userQuery;
    if (userError) throw userError;
  } catch (error) {
    console.warn('[DB] Penegakan kedaluwarsa langganan dilewati:', error.message);
    throw error;
  }
};

export const TRANSACTION_PENDING_STATUS = 'pending';
const TRANSACTION_SUCCESS_STATUS = 'success';

const verificationTargetStatus = (action) =>
  action === 'approve' ? TRANSACTION_SUCCESS_STATUS : 'rejected';

export const decideTransactionVerification = (currentStatus, action) => {
  const targetStatus = verificationTargetStatus(action);
  if (currentStatus === TRANSACTION_PENDING_STATUS) {
    return { kind: 'apply', targetStatus };
  }
  if (currentStatus === targetStatus) {
    return { kind: 'idempotent', status: currentStatus };
  }
  return { kind: 'conflict', status: currentStatus, targetStatus };
};

export const createSessionToken = (user) =>
  jwt.sign({ sub: user.id }, activeJwtSecret, { expiresIn: JWT_EXPIRES_IN });

const getBearerToken = (authorization = '') => {
  const [scheme, token] = String(authorization).split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : null;
};

export const requireAuth = async (req, res, next) => {
  const token = getBearerToken(req.get('authorization'));
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Sesi masuk tidak ditemukan. Silakan masuk kembali.' });
  }

  try {
    const payload = jwt.verify(token, activeJwtSecret);
    const row = await loadMembershipUser(payload.sub);

    if (!row) {
      return res
        .status(401)
        .json({ success: false, message: 'Akun tidak lagi tersedia. Silakan masuk kembali.' });
    }

    req.authUser = row;
    req.user = toPublicUser(row);
    return next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: 'Sesi masuk telah berakhir. Silakan masuk kembali.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res
      .status(403)
      .json({ success: false, message: 'Akses ini hanya tersedia untuk administrator.' });
  }
  return next();
};
