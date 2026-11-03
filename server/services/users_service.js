/**
 * Service Layer — Manajemen Pengguna dan Profil Akun.
 *
 * Mengelola manipulasi data tabel `users`, validasi hak akses administratif,
 * pembaruan status keanggotaan Pro, serta pembuatan dan penghapusan akun.
 *
 * @module server/services/users_service
 */

import crypto from 'crypto';
import { supabaseServer } from '../db.js';
import { generateId, hashPassword, normalizeEmail, toPublicUser } from '../auth.js';
import { createServiceError } from '../lib/errors.js';
import { ENDED_SUBSCRIPTION_STATUS } from '../lib/membership.js';
import { parseBooleanFlag } from '../lib/validate.js';

/**
 * Memperbarui nama lengkap profil pengguna yang sedang login.
 *
 * @param {object} params - Parameter pembaruan profil
 * @param {string} params.userId - ID pengguna target
 * @param {string} params.name - Nama lengkap baru
 * @param {object} params.authUser - Data pengguna terotentikasi saat ini
 * @returns {Promise<{ user: object, name: string }>} Data pengguna terbarui
 */
export async function updateProfile({ userId, name, authUser }) {
  if (!name || !name.trim()) {
    throw createServiceError('Nama lengkap wajib diisi.', { statusCode: 400 });
  }

  const { data: updatedUser, error } = await supabaseServer
    .from('users')
    .update({ name: name.trim() })
    .eq('id', userId)
    .select('*')
    .maybeSingle();
  if (error) throw error;

  return { user: toPublicUser(updatedUser || authUser), name: name.trim() };
}

/**
 * Mengambil seluruh daftar pengguna untuk tabel administrasi.
 *
 * @returns {Promise<Array<object>>} Daftar pengguna dalam representasi publik (tanpa hash password)
 */
export async function listUsers() {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((user) => toPublicUser(user));
}

/**
 * Memperbarui peran (role) pengguna (user / admin) dengan pencegahan pencabutan akses mandiri.
 *
 * @param {object} params - Parameter perubahan peran
 * @param {string} params.actorId - ID admin pelaku aksi
 * @param {string} params.id - ID pengguna target
 * @param {'user'|'admin'} params.role - Peran baru
 * @returns {Promise<void>}
 */
export async function updateUserRole({ actorId, id, role }) {
  if (id === actorId && role !== 'admin') {
    throw createServiceError('Anda tidak dapat mencabut hak akses admin akun sendiri.', {
      statusCode: 400,
    });
  }

  if (!['user', 'admin'].includes(role)) {
    throw createServiceError('Role harus user atau admin', { statusCode: 400 });
  }

  const { error } = await supabaseServer.from('users').update({ role }).eq('id', id);
  if (error) throw error;
}

/**
 * Mengubah status keanggotaan Pro pengguna secara manual oleh admin.
 *
 * @param {object} params - Parameter status Pro
 * @param {string} params.id - ID pengguna target
 * @param {boolean} params.isPro - Status keanggotaan baru
 * @returns {Promise<void>}
 */
export async function setUserPro({ id, isPro }) {
  const { error } = await supabaseServer
    .from('users')
    .update({ is_pro: isPro, subscription_expires_at: null })
    .eq('id', id);
  if (error) throw error;

  if (!isPro) {
    await supabaseServer
      .from('subscriptions')
      .update({ status: ENDED_SUBSCRIPTION_STATUS })
      .eq('user_id', id)
      .eq('status', 'Aktif');
  }
}

/**
 * Membuat akun pengguna baru secara manual melalui panel admin.
 *
 * @param {object} params - Data pengguna baru
 * @param {string} params.name - Nama lengkap
 * @param {string} params.email - Alamat email
 * @param {'user'|'admin'} [params.role='user'] - Peran akun
 * @param {boolean} [params.isPro=false] - Status Pro awal
 * @param {string} [params.password] - Password opsional (dibuat acak bila kosong)
 * @returns {Promise<{ userId: string, temporaryPassword: string|null }>} Hasil pembuatan akun
 */
export async function createUser({ name, email, role, isPro, password }) {
  if (!name || !email) {
    throw createServiceError('Nama dan email wajib diisi', { statusCode: 400 });
  }

  if (password && String(password).length < 8) {
    throw createServiceError('Password minimal 8 karakter', { statusCode: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  const { data: existing, error: lookupError } = await supabaseServer
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .limit(1);
  if (lookupError) throw lookupError;
  if (existing && existing.length > 0) {
    throw createServiceError('Email sudah terdaftar', { statusCode: 409 });
  }

  const temporaryPassword = password || crypto.randomBytes(6).toString('hex');
  const id = generateId('usr');

  const { error } = await supabaseServer.from('users').insert({
    id,
    name: name.trim(),
    email: normalizedEmail,
    password: await hashPassword(temporaryPassword),
    role: role === 'admin' ? 'admin' : 'user',
    login_method: 'email',
    is_pro: parseBooleanFlag(isPro),
  });
  if (error) throw error;

  return { userId: id, temporaryPassword: password ? null : temporaryPassword };
}

/**
 * Menghapus akun pengguna dari database (mencegah penghapusan akun admin sendiri).
 *
 * @param {object} params - Parameter penghapusan akun
 * @param {string} params.actorId - ID admin pelaku aksi
 * @param {string} params.id - ID pengguna target yang akan dihapus
 * @returns {Promise<void>}
 */
export async function deleteUser({ actorId, id }) {
  if (id === actorId) {
    throw createServiceError('Anda tidak dapat menghapus akun sendiri.', { statusCode: 400 });
  }

  const { data, error } = await supabaseServer.from('users').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data?.length) throw createServiceError('Pengguna tidak ditemukan', { statusCode: 404 });
}
