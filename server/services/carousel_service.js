/**
 * Service Layer — Carousel & Banner Beranda.
 *
 * Mengelola aturan bisnis slide (periode tayang aktif, normalisasi kolom,
 * urutan tampilan, konversi gambar ke WebP serta sanitasi MIME sniffing).
 *
 * @module server/services/carousel_service
 */

import { supabaseServer } from '../db.js';
import { generateId } from '../auth.js';
import { createServiceError } from '../lib/errors.js';
import { toDataUrl, toWebp } from '../lib/images.js';
import { sniffImageMime } from '../lib/sniff.js';
import {
  CAROUSEL_DESCRIPTION_MAX,
  CAROUSEL_FIELDS,
  CAROUSEL_IMAGE_QUALITY,
  CAROUSEL_IMAGE_WIDTH,
  CAROUSEL_TITLE_MAX,
} from '../lib/constants.js';
import { clippedText, parseBooleanFlag, toDateYmd, toRangedInt } from '../lib/validate.js';
import { todayWib } from '../lib/time.js';

const TABLE_MISSING_MESSAGE = 'Tabel carousel_slides belum dibuat.';
const TABLE_MISSING_SETUP_MESSAGE =
  'Tabel carousel_slides belum dibuat. Jalankan supabase_database/full_setup.sql di SQL Editor.';

const isMissingTable = (error) =>
  error?.code === '42P01' ||
  error?.code === 'PGRST205' ||
  String(error?.message || '').includes('carousel_slides');

const tableMissing = (message = TABLE_MISSING_MESSAGE) =>
  createServiceError(message, { statusCode: 503 });

/**
 * Penutup bersama untuk SEMUA tulis ke `carousel_slides`: tabel belum dibuat →
 * 503, tidak ada baris yang kena → 404 "Banner tidak ditemukan". Tiga jalur
 * tulis (ubah field, hapus, ganti gambar) sebelumnya menyalin blok ini utuh,
 * sehingga perubahan pesan/status harus dilakukan tiga kali.
 *
 * @param {{ data?: Array<object>, error?: object }} hasil - Hasil query Supabase
 */
const ensureSlideWritten = ({ data, error }) => {
  if (error) {
    if (isMissingTable(error)) throw tableMissing();
    throw error;
  }
  if (!data?.length) throw createServiceError('Banner tidak ditemukan', { statusCode: 404 });
};

const isWithinPeriod = (slide, today) =>
  (!slide.starts_at || slide.starts_at <= today) && (!slide.ends_at || slide.ends_at >= today);

const readSlideInput = (body = {}) => {
  const fields = {};
  const has = {};

  if (body.title !== undefined) {
    fields.title = clippedText(body.title, CAROUSEL_TITLE_MAX);
    has.title = true;
  }
  if (body.description !== undefined) {
    fields.description = clippedText(body.description, CAROUSEL_DESCRIPTION_MAX);
    has.description = true;
  }
  if (body.sort_order !== undefined) {
    fields.sort_order = toRangedInt(body.sort_order, { min: 0, max: 9999, fallback: 0 });
    has.sort_order = true;
  }
  if (body.is_active !== undefined) {
    fields.is_active = parseBooleanFlag(body.is_active);
    has.is_active = true;
  }
  if (body.event_date !== undefined) {
    fields.event_date = toDateYmd(body.event_date);
    has.event_date = true;
  }
  if (body.event_id !== undefined) {
    fields.event_id = clippedText(body.event_id, 50) || null;
    has.event_id = true;
  }
  for (const key of ['starts_at', 'ends_at']) {
    if (body[key] !== undefined) {
      fields[key] = toDateYmd(body[key]);
      has[key] = true;
    }
  }

  return { fields, has };
};

const isoToYmd = (value) => String(value ?? '').slice(0, 10) || null;

const toSlideResponse = (slide) => ({
  ...slide,
  is_active: Boolean(slide.is_active),
  sort_order: Number(slide.sort_order) || 0,
  event_date: isoToYmd(slide.event_date),
  starts_at: isoToYmd(slide.starts_at),
  ends_at: isoToYmd(slide.ends_at),
});

/**
 * Mengambil daftar slide aktif yang sedang berada dalam masa tayang untuk tampilan beranda publik.
 *
 * @returns {Promise<{ slides: Array<object>, carouselReady: boolean }>} Daftar slide aktif
 */
export async function listActiveSlides() {
  const { data, error } = await supabaseServer
    .from('carousel_slides')
    .select(CAROUSEL_FIELDS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTable(error)) return { slides: [], carouselReady: false };
    throw error;
  }

  const today = todayWib();
  const slides = (data || []).map(toSlideResponse).filter((slide) => isWithinPeriod(slide, today));

  return { slides, carouselReady: true };
}

/**
 * Mengambil seluruh daftar slide (aktif maupun nonaktif) untuk kebutuhan manajemen panel admin.
 *
 * @returns {Promise<{ slides: Array<object>, carouselReady: boolean }>} Daftar seluruh slide
 */
export async function listAllSlides() {
  const { data, error } = await supabaseServer
    .from('carousel_slides')
    .select(CAROUSEL_FIELDS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTable(error)) return { slides: [], carouselReady: false };
    throw error;
  }

  return { slides: (data || []).map(toSlideResponse), carouselReady: true };
}

/**
 * Menambahkan slide carousel baru.
 *
 * @param {object} [body={}] - Data formulir slide baru
 * @returns {Promise<string>} ID slide yang berhasil dibuat
 */
export async function createSlide(body = {}) {
  const { fields } = readSlideInput(body);
  if (!fields.title) {
    throw createServiceError('Judul banner wajib diisi', { statusCode: 400 });
  }
  if (fields.starts_at && fields.ends_at && fields.ends_at < fields.starts_at) {
    throw createServiceError('Tanggal selesai tidak boleh sebelum tanggal mulai', {
      statusCode: 400,
    });
  }

  const id = generateId('slide');
  const { error } = await supabaseServer.from('carousel_slides').insert({
    id,
    title: fields.title,
    description: fields.description ?? '',
    event_id: fields.event_id ?? null,
    event_date: fields.event_date ?? null,
    sort_order: fields.sort_order ?? 0,
    is_active: fields.is_active ?? true,
    starts_at: fields.starts_at ?? null,
    ends_at: fields.ends_at ?? null,
    image_url: null,
  });

  if (error) {
    if (isMissingTable(error)) throw tableMissing(TABLE_MISSING_SETUP_MESSAGE);
    throw error;
  }

  return id;
}

/**
 * Memperbarui data teks dan periode slide yang ada.
 *
 * @param {object} params - Parameter pembaruan
 * @param {string} params.id - ID slide
 * @param {object} [params.body={}] - Bidang yang diperbarui
 * @returns {Promise<void>}
 */
export async function updateSlide({ id, body = {} }) {
  const { fields, has } = readSlideInput(body);
  if (has.title && !fields.title) {
    throw createServiceError('Judul banner wajib diisi', { statusCode: 400 });
  }

  const startsAt = fields.starts_at;
  const endsAt = fields.ends_at;
  if (startsAt && endsAt && endsAt < startsAt) {
    throw createServiceError('Tanggal selesai tidak boleh sebelum tanggal mulai', {
      statusCode: 400,
    });
  }

  const patch = { ...fields, updated_at: new Date().toISOString() };
  ensureSlideWritten(
    await supabaseServer.from('carousel_slides').update(patch).eq('id', id).select('id'),
  );
}

/**
 * Menghapus slide carousel berdasarkan ID.
 *
 * @param {string} id - ID slide
 * @returns {Promise<void>}
 */
export async function deleteSlide(id) {
  ensureSlideWritten(
    await supabaseServer.from('carousel_slides').delete().eq('id', id).select('id'),
  );
}

/**
 * Mengunggah dan mengonversi berkas gambar slide menjadi format WebP terkompresi.
 * Menggunakan deteksi magic bytes (sniffing) untuk mitigasi eksploitasi MIME type.
 *
 * @param {object} params - Parameter gambar
 * @param {string} params.id - ID slide target
 * @param {Buffer} params.buffer - Buffer biner gambar yang diunggah
 * @returns {Promise<void>}
 */
export async function updateSlideImage({ id, buffer }) {
  if (!buffer?.length) {
    throw createServiceError('Tidak ada berkas gambar yang diterima', { statusCode: 400 });
  }

  /* Jenis gambar dari isi berkas, bukan `mimetype` kiriman klien (VULN-11). */
  const detectedMime = await sniffImageMime(buffer);
  if (!detectedMime) {
    throw createServiceError('Berkas bukan gambar PNG, JPG, WebP, atau GIF.', { statusCode: 415 });
  }

  const result = await toWebp(buffer, {
    width: CAROUSEL_IMAGE_WIDTH,
    quality: CAROUSEL_IMAGE_QUALITY,
    fallbackMime: detectedMime,
  });

  ensureSlideWritten(
    await supabaseServer
      .from('carousel_slides')
      .update({
        image_url: toDataUrl(result.buffer, result.mime),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id'),
  );
}
