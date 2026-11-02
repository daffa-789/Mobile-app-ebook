/**
 * Service Layer — Agenda Kegiatan.
 *
 * Menyimpan aturan bisnis agenda: normalisasi kolom, sinkronisasi slide
 * carousel, dan pengiriman notifikasi push. Route hanya menerjemahkan hasilnya
 * menjadi respons HTTP.
 */

import { supabaseServer } from '../db.js';
import { generateId } from '../auth.js';
import { createServiceError } from '../lib/errors.js';
import { clippedText, parseBooleanFlag, toDateYmd } from '../lib/validate.js';
import { logger } from '../logger.js';
import { sendEventAnnouncementNow, sendEventReminderNow } from '../lib/eventReminder.js';

const DEFAULT_TIME_START = '19:30';
const DEFAULT_TIME_END = '21:00';
const DEFAULT_CATEGORY = 'Mujahadah';
const DEFAULT_ORGANIZER = 'DPP PSW';

const TIME_PATTERN = /^\d{2}:\d{2}$/;

const toEventRow = (body = {}) => {
  const timeStart = TIME_PATTERN.test(String(body.time_start || ''))
    ? body.time_start
    : DEFAULT_TIME_START;
  const timeEnd = TIME_PATTERN.test(String(body.time_end || '')) ? body.time_end : DEFAULT_TIME_END;
  return {
    title: clippedText(body.title, 200).trim(),
    event_date: toDateYmd(body.event_date),
    time_start: timeStart,
    time_end: timeEnd,
    location: clippedText(body.location, 200).trim(),
    category: clippedText(body.category, 50).trim() || DEFAULT_CATEGORY,
    description: clippedText(body.description, 1000),
    organizer: clippedText(body.organizer, 150).trim() || DEFAULT_ORGANIZER,
  };
};

const isMissingColumn = (error, column) =>
  error?.code === '42703' || String(error?.message || '').includes(column);

const isMissingCarouselTable = (error) =>
  error?.code === '42P01' || String(error?.message || '').includes('carousel_slides');

const requireEventFields = (row) => {
  if (!row.title || !row.event_date || !row.location) {
    throw createServiceError('Judul, tanggal, dan lokasi wajib diisi', { statusCode: 400 });
  }
};

/* Pengingat H-1 dikirim segera setelah agenda disimpan, tetapi TIDAK boleh
   menggagalkan permintaan admin bila push service sedang bermasalah.
   Kalau jarak H-1 belum tiba (agenda masih jauh), fungsi ini tidak
   mengirim apa pun — penyapu berkala di server.js yang menyusul nanti. */
const trySendReminder = async (eventId) => {
  try {
    const result = await sendEventReminderNow(eventId);
    if (result.sent > 0) {
      logger.ok('PUSH', 'Pengingat H-1 langsung terkirim saat agenda disimpan', {
        agenda: eventId,
        perangkat: result.sent,
      });
    }
    return result;
  } catch (error) {
    logger.warn('PUSH', 'Pengingat H-1 gagal dikirim (agenda tetap tersimpan)', {
      agenda: eventId,
      pesan: error.message,
    });
    return null;
  }
};

const syncEventSlide = async (
  eventId,
  { title, eventDate, location, description, showInCarousel },
) => {
  const { data: existing } = await supabaseServer
    .from('carousel_slides')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (!showInCarousel) {
    if (!existing) return false;
    await supabaseServer.from('carousel_slides').delete().eq('event_id', eventId);
    return false;
  }

  if (existing) {
    await supabaseServer
      .from('carousel_slides')
      .update({
        title,
        description: description || location || '',
        event_date: eventDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    return true;
  }

  await supabaseServer.from('carousel_slides').insert({
    id: generateId('slide'),
    title,
    description: description || location || '',
    event_id: eventId,
    event_date: eventDate,
    is_active: true,
    sort_order: 0,
    starts_at: null,
    ends_at: null,
    image_url: null,
  });
  return true;
};

/**
 * Ambil daftar seluruh agenda kegiatan terurut berdasarkan tanggal terdekat.
 * @returns {Promise<Array>} Daftar baris agenda
 */
export async function listEvents() {
  const { data, error } = await supabaseServer
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Tambah agenda kegiatan baru, sinkronkan ke carousel dan kirim pengumuman Web Push jika diminta.
 * @param {Object} body - Data masukan agenda
 * @returns {Promise<{ eventId: string, carouselAdded: boolean, announcementSent: number, reminderSent: number }>}
 */
export async function createEvent(body = {}) {
  const row = toEventRow(body);
  requireEventFields(row);

  const showInCarousel = parseBooleanFlag(body.show_in_carousel);
  const id = generateId('evt');

  let insertError = null;
  const withFlag = await supabaseServer
    .from('events')
    .insert({ id, ...row, show_in_carousel: showInCarousel })
    .then(() => true)
    .catch((error) => {
      insertError = error;
      return false;
    });

  if (!withFlag) {
    if (!isMissingColumn(insertError, 'show_in_carousel')) throw insertError;
    const { error } = await supabaseServer.from('events').insert({ id, ...row });
    if (error) throw error;
  }

  let carouselAdded = false;
  if (showInCarousel) {
    try {
      carouselAdded = await syncEventSlide(id, {
        title: row.title,
        eventDate: row.event_date,
        location: row.location,
        description: row.description,
        showInCarousel: true,
      });
    } catch (slideError) {
      if (!isMissingCarouselTable(slideError)) throw slideError;
    }
  }

  const broadcastNotification =
    body.broadcast_notification === undefined || parseBooleanFlag(body.broadcast_notification);
  let announcementSent = 0;
  if (broadcastNotification) {
    try {
      const annResult = await sendEventAnnouncementNow(id);
      announcementSent = annResult?.sent || 0;
    } catch (annError) {
      logger.warn('PUSH', 'Gagal menyiarkan pengumuman agenda baru', {
        agenda: id,
        pesan: annError.message,
      });
    }
  }

  const reminder = await trySendReminder(id);

  return { eventId: id, carouselAdded, announcementSent, reminderSent: reminder?.sent || 0 };
}

/**
 * Perbarui data agenda kegiatan dan perbarui sinkronisasi slide carousel.
 * @param {{ id: string, body: Object }} params - ID agenda dan isi perubahan
 * @returns {Promise<{ reminderSent: number }>}
 */
export async function updateEvent({ id, body = {} }) {
  const row = toEventRow(body);
  requireEventFields(row);

  const showInCarousel = parseBooleanFlag(body.show_in_carousel);
  const patch = { ...row, show_in_carousel: showInCarousel };

  const { data, error } = await supabaseServer
    .from('events')
    .update(patch)
    .eq('id', id)
    .select('id')
    .then((result) =>
      isMissingColumn(result.error, 'show_in_carousel')
        ? supabaseServer.from('events').update(row).eq('id', id).select('id')
        : result,
    );

  if (error) throw error;
  if (!data?.length) throw createServiceError('Agenda tidak ditemukan', { statusCode: 404 });

  try {
    await syncEventSlide(id, {
      title: row.title,
      eventDate: row.event_date,
      location: row.location,
      description: row.description,
      showInCarousel,
    });
  } catch (slideError) {
    if (!isMissingCarouselTable(slideError)) throw slideError;
  }

  /* Tanggal bisa berubah menjadi "besok", jadi pengingat dicek ulang.
     `sendEventReminderNow` menolak mengirim dua kali lewat `reminder_sent_at`. */
  const reminder = await trySendReminder(id);

  return { reminderSent: reminder?.sent || 0 };
}

/**
 * Hapus agenda kegiatan berdasarkan ID.
 * @param {string} id - ID agenda
 */
export async function deleteEvent(id) {
  const { data, error } = await supabaseServer.from('events').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data?.length) throw createServiceError('Agenda tidak ditemukan', { statusCode: 404 });
}

/**
 * Pemicu manual pengiriman siaran/pengingat agenda tertentu lewat Web Push.
 * @param {{ id: string, type: string }} params - ID agenda dan tipe pengingat ('auto' | 'announcement' | 'reminder')
 * @returns {Promise<{ sent: number, failed?: number, skipped?: boolean, reason?: string, pruned?: number }>}
 */
export async function sendEventReminderManually({ id, type }) {
  const { data: event, error } = await supabaseServer
    .from('events')
    .select('id, title, event_date')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!event) throw createServiceError('Agenda tidak ditemukan', { statusCode: 404 });

  return sendEventReminderNow(id, { force: true, type });
}
