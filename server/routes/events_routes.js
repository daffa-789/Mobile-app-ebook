/**
 * Route Layer — Agenda Kegiatan.
 *
 * Pendaftaran URL, middleware, dan penerjemahan hasil service menjadi HTTP.
 * Logika penyimpanan dan notifikasi ada di `server/services/events_service.js`.
 */

import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';
import {
  createEvent,
  deleteEvent,
  listEvents,
  sendEventReminderManually,
  updateEvent,
} from '../services/events_service.js';

export const eventsRouter = Router();

// GET /api/events — Daftar agenda kegiatan publik
eventsRouter.get(
  '/events',
  wrap(async (req, res) => {
    res.json({ success: true, events: await listEvents() });
  }),
);

// POST /api/events — Tambah agenda kegiatan baru (Admin)
eventsRouter.post(
  '/events',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const { eventId, carouselAdded, announcementSent, reminderSent } = await createEvent(req.body);

    res.status(201).json({
      success: true,
      message: carouselAdded
        ? 'Jadwal berhasil ditambahkan dan masuk ke carousel.'
        : 'Jadwal berhasil ditambahkan',
      eventId,
      carouselAdded,
      announcementSent,
      reminderSent,
    });
  }),
);

// PUT /api/events/:id — Perbarui data agenda kegiatan (Admin)
eventsRouter.put(
  '/events/:id',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const { reminderSent } = await updateEvent({ id: req.params.id, body: req.body });
    res.json({ success: true, message: 'Agenda berhasil diperbarui', reminderSent });
  }),
);

// DELETE /api/events/:id — Hapus agenda kegiatan (Admin)
eventsRouter.delete(
  '/events/:id',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    await deleteEvent(req.params.id);
    res.json({ success: true, message: 'Jadwal kegiatan berhasil dihapus' });
  }),
);

// POST /api/events/:id/send-reminder — Kirim siaran manual pengingat agenda via Web Push (Admin)
eventsRouter.post(
  '/events/:id/send-reminder',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const type = req.body?.type || req.query?.type || 'auto';
    const result = await sendEventReminderManually({ id: req.params.id, type });

    if (result.skipped && result.reason === 'vapid-not-configured') {
      return res.status(503).json({
        success: false,
        message: 'Notifikasi belum diaktifkan — kunci VAPID belum diisi di .env.',
      });
    }

    if (result.sent === 0) {
      return res.json({
        success: true,
        sent: 0,
        message: result.pruned
          ? 'Tidak ada perangkat aktif — langganan lama dibersihkan.'
          : 'Belum ada perangkat yang mengaktifkan notifikasi.',
      });
    }

    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed || 0,
      message: `Pengumuman agenda berhasil disiarkan ke ${result.sent} perangkat.`,
    });
  }),
);
