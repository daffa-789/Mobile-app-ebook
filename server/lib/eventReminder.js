/* Pengirim pengingat & pengumuman agenda via Web Push (eksekusi + penjadwal).

   Dijalankan dari empat tempat:
     1. Admin membuat/mengubah agenda yang jatuh tempo BESOK → langsung
        dikirim (server/services/events_service.js).
     2. Aksi siaran pengumuman pada panel agenda → `sendEventAnnouncementNow`.
     3. Penyapu berkala di server.js yang memeriksa agenda H-1 setiap 15 menit,
        sebagai jaring pengaman bila server mati saat jadwal kirim tiba.
     4. Endpoint cron harian (server/routes/cron_routes.js) → `sweepDueReminders`.

   Idempotensi dijaga kolom `events.reminder_sent_at`: satu agenda = satu kali
   kirim, berapa pun kali penjadwal berjalan.

   Penyimpanan langganan ada di `pushSubscriptionStore.js`; gerbang VAPID dan
   toleransi skema ada di `pushGuards.js` — keduanya dipakai modul lain juga. */

import { supabaseServer } from '../db.js';
import { logger } from '../logger.js';
import { PUSH_REMINDER_HOUR } from '../config.js';
import { todayWib } from './time.js';
import { sendWebPush } from './webpush.js';
import { isPushConfigured, vapidConfig, noteSchemaMissing } from './pushGuards.js';
import { deactivateSubscription } from './pushSubscriptionStore.js';

const addDaysYmd = (ymd, days) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const EVENT_ICON = '/icon-192.png';

const buildEventPayload = (event, { type = 'auto' } = {}) => {
  const tomorrow = addDaysYmd(todayWib(), 1);
  const eventYmd = String(event.event_date || '').slice(0, 10);
  const isTomorrow = eventYmd === tomorrow;

  const time = [event.time_start, event.time_end].filter(Boolean).join('–');

  let formattedDate = '';
  try {
    if (event.event_date) {
      const [y, m, d] = String(event.event_date).slice(0, 10).split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      formattedDate = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(dt);
    }
  } catch {}

  let title = '';
  let body = '';
  const isAnnouncement = type === 'announcement' || (!isTomorrow && type !== 'reminder');

  if (isAnnouncement) {
    title = `📢 Pengumuman Mujahadah: ${event.title}`;
    const parts = [
      formattedDate,
      time ? `Pukul ${time} WIB` : '',
      event.location ? `di ${event.location}` : '',
    ].filter(Boolean);
    body =
      parts.join(' · ') || 'Jadwal majelis baru telah diumumkan. Ketuk untuk melihat kalender.';
  } else {
    title = `⏰ Pengingat Besok: ${event.title}`;
    const parts = [
      time ? `Pukul ${time} WIB` : '',
      event.location ? `di ${event.location}` : '',
    ].filter(Boolean);
    body = parts.join(' · ') || 'Agenda majelis besok. Ketuk untuk membuka jadwal lengkap.';
  }

  return {
    title,
    body,
    icon: EVENT_ICON,
    badge: EVENT_ICON,
    tag: isAnnouncement ? `agenda-announcement-${event.id}` : `agenda-reminder-${event.id}`,
    url: '/calendar',
    kind: isAnnouncement ? 'event-announcement' : 'event-reminder',
  };
};

/* ── Kirim ke seluruh langganan ────────────────────────────────────────── */

const broadcastPush = async ({ payload, ttl = 24 * 60 * 60, urgency = 'normal' }) => {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, skipped: true, reason: 'vapid-not-configured' };
  }

  const { data: subs, error } = await supabaseServer
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('is_active', true);

  if (error) {
    if (noteSchemaMissing(error))
      return { sent: 0, failed: 0, skipped: true, reason: 'schema-missing' };
    throw error;
  }

  if (!subs?.length) return { sent: 0, failed: 0, skipped: false, reason: 'no-subscribers' };

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  /* Dikirim berurutan, bukan paralel: jumlah pelanggan skala kecil, dan
     push service dapat membalas 429 bila dihujani sekaligus. */
  for (const sub of subs) {
    try {
      const result = await sendWebPush({
        subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        vapid: vapidConfig(),
        ttl,
        urgency,
      });

      if (result.ok) {
        sent += 1;
      } else if (result.reason === 'gone') {
        await deactivateSubscription(sub.id);
        pruned += 1;
      } else {
        failed += 1;
        logger.warn('PUSH', 'Pengiriman notifikasi gagal', {
          status: result.status,
          sebab: result.reason,
        });
      }
    } catch (error) {
      failed += 1;
      logger.warn('PUSH', 'Pengiriman notifikasi error', { pesan: error.message });
    }
  }

  return { sent, failed, pruned, skipped: false };
};

/* ── Pengingat agenda ──────────────────────────────────────────────────── */

/** Kolom minimum yang dibutuhkan sebuah pesan push agenda. */
const EVENT_PUSH_COLUMNS = 'id, title, event_date, time_start, time_end, location';

/**
 * Muat satu baris agenda untuk pengiriman push, dengan toleransi skema.
 * `schemaMissing` sengaja dipisah dari `event: null` agar pemanggil tetap
 * bisa membedakan "tabel belum ada" (fitur dilewati tenang) dari
 * "agenda tidak ditemukan" — dua hal yang dilaporkan dengan `reason` berbeda.
 */
const loadEventRow = async (eventId, columns = EVENT_PUSH_COLUMNS) => {
  const { data: event, error } = await supabaseServer
    .from('events')
    .select(columns)
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    if (noteSchemaMissing(error)) return { event: null, schemaMissing: true };
    throw error;
  }
  return { event, schemaMissing: false };
};

/** Kirim PENGUMUMAN untuk SATU agenda ke seluruh perangkat jemaah yang aktif. */
export const sendEventAnnouncementNow = async (eventId) => {
  if (!isPushConfigured()) {
    return { sent: 0, skipped: true, reason: 'vapid-not-configured' };
  }

  const { event, schemaMissing } = await loadEventRow(eventId);
  if (schemaMissing) return { sent: 0, skipped: true, reason: 'schema-missing' };
  if (!event) return { sent: 0, skipped: true, reason: 'not-found' };

  const payload = buildEventPayload(event, { type: 'announcement' });
  const result = await broadcastPush({ payload });

  logger.ok('PUSH', 'Pengumuman agenda mujahadah berhasil disiarkan', {
    agenda: eventId,
    judul: event.title,
    terkirim: result.sent,
  });

  return result;
};

/** Kirim pengingat untuk SATU agenda, bila agendanya jatuh tempo besok (atau force). */
export const sendEventReminderNow = async (eventId, { force = false, type = 'auto' } = {}) => {
  if (!isPushConfigured()) {
    return { sent: 0, skipped: true, reason: 'vapid-not-configured' };
  }

  const { event, schemaMissing } = await loadEventRow(
    eventId,
    `${EVENT_PUSH_COLUMNS}, reminder_sent_at`,
  );
  if (schemaMissing) return { sent: 0, skipped: true, reason: 'schema-missing' };
  if (!event) return { sent: 0, skipped: true, reason: 'not-found' };

  if (!force && event.reminder_sent_at) {
    return { sent: 0, skipped: true, reason: 'already-sent' };
  }

  const tomorrow = addDaysYmd(todayWib(), 1);
  const eventYmd = String(event.event_date || '').slice(0, 10);
  if (eventYmd !== tomorrow && !force) {
    return { sent: 0, skipped: true, reason: 'not-due-tomorrow' };
  }

  const payloadType = type !== 'auto' ? type : eventYmd === tomorrow ? 'reminder' : 'announcement';
  const result = await broadcastPush({ payload: buildEventPayload(event, { type: payloadType }) });

  /* Tandai terkirim HANYA bila benar-benar ada yang menerima dan memang jadwal besok */
  if (result.sent > 0 && eventYmd === tomorrow) {
    const { error: markError } = await supabaseServer
      .from('events')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', eventId);
    /* Kolom penanda belum ada → notifikasi tetap terkirim, hanya tidak tercatat.
       Agendanya bisa terkirim ulang oleh penyapu berikutnya, jadi peringatkan. */
    if (markError) noteSchemaMissing(markError);
  }

  return result;
};

/**
 * Penyapu berkala: cari semua agenda H-1 yang belum dikirim pengingatnya.
 * Dipanggil saat boot dan setiap 15 menit setelahnya.
 */
export const sweepDueReminders = async () => {
  if (!isPushConfigured()) return { checked: 0, sent: 0, skipped: true };

  const tomorrow = addDaysYmd(todayWib(), 1);

  const { data: due, error } = await supabaseServer
    .from('events')
    .select('id, title')
    .eq('event_date', tomorrow)
    .is('reminder_sent_at', null);

  if (error) {
    if (noteSchemaMissing(error))
      return { checked: 0, sent: 0, skipped: true, reason: 'schema-missing' };
    throw error;
  }

  if (!due?.length) return { checked: 0, sent: 0, skipped: false };

  /* Jam kirim: agenda H-1 baru dinotifikasi setelah lewat PUSH_REMINDER_HOUR
     WIB, supaya notifikasi tidak datang tengah malam. */
  const nowWib = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());

  const [targetHour, targetMinute] = PUSH_REMINDER_HOUR.split(':').map(Number);
  const [nowHour, nowMinute] = nowWib.split(':').map(Number);
  const dueAt = targetHour * 60 + targetMinute;
  const nowAt = nowHour * 60 + nowMinute;

  /* Lewat tengah malam setelah jam kirim hari ini (mis. 23:00 > 08:00) tetap
     dianggap waktunya — pengingat menyusul, lebih baik daripada tidak sama sekali. */
  const afterWindow = nowAt >= dueAt;

  if (!afterWindow) return { checked: due.length, sent: 0, skipped: true, reason: 'before-window' };

  let sent = 0;
  for (const event of due) {
    try {
      const result = await sendEventReminderNow(event.id);
      if (result.sent > 0) sent += 1;
    } catch (error) {
      logger.warn('PUSH', 'Pengingat agenda gagal dikirim', {
        event: event.id,
        pesan: error.message,
      });
    }
  }

  if (sent > 0) logger.ok('PUSH', 'Pengingat agenda H-1 terkirim', { agenda: sent });
  return { checked: due.length, sent, skipped: false };
};

/** Loop penyapu — dijadwalkan dari server.js saat boot. */
export const startReminderScheduler = ({ intervalMs = 15 * 60 * 1000 } = {}) => {
  if (!isPushConfigured()) {
    logger.warn('PUSH', 'Notifikasi mati — kunci VAPID belum diisi di .env', {
      cara_mengaktifkan:
        'jalankan `node scripts/generate-vapid-keys.js`, tempel hasilnya ke .env, lalu restart',
    });
    return null;
  }

  const run = () => {
    sweepDueReminders().catch((error) => {
      logger.warn('PUSH', 'Penyapu pengingat gagal', { pesan: error.message });
    });
  };

  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();

  logger.ok('PUSH', 'Notifikasi Web Push aktif', {
    jam_kirim: `${PUSH_REMINDER_HOUR} WIB`,
    penyapu: `setiap ${Math.round(intervalMs / 60000)} menit`,
  });

  return timer;
};
