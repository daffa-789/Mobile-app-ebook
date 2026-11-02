/**
 * Route Layer — Carousel Beranda.
 *
 * Pendaftaran URL dan pembentukan respons; aturan bisnis ada di
 * `server/services/carousel_service.js`.
 */

import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';
import { uploadCarouselImage } from '../middleware/uploads.js';
import {
  createSlide,
  deleteSlide,
  listActiveSlides,
  listAllSlides,
  updateSlide,
  updateSlideImage,
} from '../services/carousel_service.js';

export const carouselRouter = Router();

// GET /api/carousel — Ambil slide banner carousel yang aktif untuk beranda
carouselRouter.get(
  '/carousel',
  wrap(async (req, res) => {
    const { slides, carouselReady } = await listActiveSlides();
    res.json({ success: true, slides, carouselReady });
  }),
);

// GET /api/carousel/all — Ambil seluruh slide banner carousel (Admin)
carouselRouter.get(
  '/carousel/all',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const { slides, carouselReady } = await listAllSlides();
    res.json({ success: true, slides, carouselReady });
  }),
);

// POST /api/carousel — Tambah slide banner carousel baru (Admin)
carouselRouter.post(
  '/carousel',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    const slideId = await createSlide(req.body);
    res.status(201).json({ success: true, message: 'Banner berhasil ditambahkan', slideId });
  }),
);

// PUT /api/carousel/:id — Perbarui metadata slide carousel (Admin)
carouselRouter.put(
  '/carousel/:id',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    await updateSlide({ id: req.params.id, body: req.body });
    res.json({ success: true, message: 'Banner berhasil diperbarui' });
  }),
);

// DELETE /api/carousel/:id — Hapus slide carousel (Admin)
carouselRouter.delete(
  '/carousel/:id',
  requireAuth,
  requireAdmin,
  wrap(async (req, res) => {
    await deleteSlide(req.params.id);
    res.json({ success: true, message: 'Banner berhasil dihapus' });
  }),
);

// POST /api/carousel/:id/image — Unggah berkas gambar banner slide carousel (Admin)
carouselRouter.post(
  '/carousel/:id/image',
  requireAuth,
  requireAdmin,
  uploadCarouselImage,
  wrap(async (req, res) => {
    await updateSlideImage({ id: req.params.id, buffer: req.file?.buffer });
    res.json({ success: true, message: 'Gambar banner berhasil diperbarui' });
  }),
);
