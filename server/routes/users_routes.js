/**
 * Route Layer — Pengguna.
 *
 * Ekstraksi DTO, middleware otorisasi, dan respons HTTP. Logika database ada di
 * `server/services/users_service.js`.
 */

import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth.js';
import { badRequest, internalErrorDetail, wrap } from '../lib/http.js';
import { parseBooleanFlag } from '../lib/validate.js';
import { logger } from '../logger.js';
import {
  createUser,
  deleteUser,
  listUsers,
  setUserPro,
  updateProfile,
  updateUserRole,
} from '../services/users_service.js';

export const usersRouter = Router();

// PUT /api/users/profile — Pembaruan profil pengguna mandiri (nama)
usersRouter.put('/users/profile', requireAuth, async (req, res) => {
  try {
    const { user, name } = await updateProfile({
      userId: req.user.id,
      name: req.body.name,
      authUser: req.authUser,
    });

    logger.data('PROFILE', 'Profil diperbarui', { id: req.user.id, name });

    res.json({ success: true, message: 'Profil berhasil diperbarui.', user });
  } catch (error) {
    if (error.statusCode === 400) return badRequest(res, error.message);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil.',
      error: internalErrorDetail(error),
    });
  }
});

// GET /api/users — Daftar seluruh pengguna sistem (Admin)
usersRouter.get(
  '/users',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    res.json({ success: true, users: await listUsers() });
  }),
);

// PUT /api/users/:id/role — Ubah peran/role pengguna (Admin)
usersRouter.put(
  '/users/:id/role',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const { role } = req.body;
    await updateUserRole({ actorId: req.user.id, id: req.params.id, role });
    res.json({ success: true, message: `Role pengguna berhasil diubah ke ${role}` });
  }),
);

// PUT /api/users/:id/pro — Ubah status keanggotaan Pro pengguna (Admin)
usersRouter.put(
  '/users/:id/pro',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const isPro = parseBooleanFlag(req.body.is_pro);
    await setUserPro({ id: req.params.id, isPro });
    res.json({
      success: true,
      message: `Status Pro pengguna berhasil ${isPro ? 'diaktifkan' : 'dinonaktifkan'}`,
    });
  }),
);

// POST /api/users — Tambah akun pengguna baru secara manual (Admin)
usersRouter.post(
  '/users',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const { name, email, role, is_pro, password } = req.body;
    const { userId, temporaryPassword } = await createUser({
      name,
      email,
      role,
      isPro: is_pro,
      password,
    });

    const created = { success: true, message: 'Pengguna berhasil ditambahkan', userId };
    if (temporaryPassword) created.temporaryPassword = temporaryPassword;
    res.status(201).json(created);
  }),
);

// DELETE /api/users/:id — Hapus akun pengguna (Admin)
usersRouter.delete(
  '/users/:id',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    await deleteUser({ actorId: req.user.id, id: req.params.id });
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  }),
);
