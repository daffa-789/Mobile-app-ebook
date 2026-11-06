/**
 * Modul pembuat pengingat agenda dan masa aktif langganan Pro.
 * Menghitung selisih hari kedaluwarsa keanggotaan dan menyusun notifikasi agenda harian.
 *
 * @module src/lib/reminders
 */

/* Helper di bawah ini bersifat internal modul — hanya dipakai oleh
   `buildReminders` dan fungsi lihat/simpan di berkas ini. Tidak di-export agar
   permukaan API modul tetap sempit dan jelas mana yang stabil untuk dipakai
   dari luar. */

import { getDisplayLocation } from '@lib/maps';

const PRO_REMINDER_THRESHOLD_DAYS = [7, 3, 1, 0];

const todayYmd = (now = new Date()) => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const daysBetweenYmd = (fromYmd, toYmd) => {
  const parse = (value) => {
    if (!value) return null;
    const match = String(value)
      .slice(0, 10)
      .match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const [, y, m, d] = match.map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  };
  const a = parse(fromYmd);
  const b = parse(toYmd);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

const daysUntilExpiry = (expiresAt, now = new Date()) => {
  if (!expiresAt) return null;
  const target = new Date(expiresAt);
  if (Number.isNaN(target.getTime())) return null;
  const targetYmd = [
    target.getFullYear(),
    String(target.getMonth() + 1).padStart(2, '0'),
    String(target.getDate()).padStart(2, '0'),
  ].join('-');
  return daysBetweenYmd(todayYmd(now), targetYmd);
};

const eventsToday = (events = [], now = new Date()) => {
  const today = todayYmd(now);
  return (events || []).filter((event) => String(event?.date || '').slice(0, 10) === today);
};

const proReminder = (user, now = new Date()) => {
  if (!user?.isPro) return null;
  const daysLeft = daysUntilExpiry(user.subscriptionExpiresAt, now);
  if (daysLeft === null) return null;

  if (daysLeft < 0) return null;
  if (!PRO_REMINDER_THRESHOLD_DAYS.includes(daysLeft)) return null;

  const severity =
    daysLeft === 0 ? 'urgent' : daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : 'info';
  return { daysLeft, expiresAt: user.subscriptionExpiresAt, severity };
};

export const buildReminders = ({ events = [], user = null, now = new Date() } = {}) => {
  const reminders = [];

  for (const event of eventsToday(events, now)) {
    reminders.push({
      id: `event:${event.id ?? event.title}`,
      kind: 'event',
      severity: 'info',
      title: 'Acara hari ini',
      message: event.title,
      detail: [event.time, getDisplayLocation(event.location)].filter(Boolean).join(' · '),
      date: event.date,
    });
  }

  const pro = proReminder(user, now);
  if (pro) {
    const { daysLeft } = pro;
    reminders.push({
      id: `pro:${String(pro.expiresAt).slice(0, 10)}`,
      kind: 'pro',
      severity: pro.severity,
      title: daysLeft === 0 ? 'Langganan Pro berakhir hari ini' : 'Langganan Pro akan berakhir',
      message:
        daysLeft === 0
          ? 'Masa aktif Pro Anda habis hari ini. Perpanjang agar akses kitab Pro tidak terputus.'
          : daysLeft === 1
            ? 'Masa aktif Pro Anda berakhir besok.'
            : `Masa aktif Pro Anda tersisa ${daysLeft} hari lagi.`,
      detail: '',
      date: String(pro.expiresAt).slice(0, 10),
    });
  }

  return reminders;
};

const REMINDER_SEEN_KEY = 'wahidiyah:reminders-seen';

export const markRemindersSeen = (
  ids = [],
  now = new Date(),
  storage = globalThis.localStorage,
) => {
  if (!storage) return;
  try {
    storage.setItem(REMINDER_SEEN_KEY, JSON.stringify({ [todayYmd(now)]: ids }));
  } catch {
    /* localStorage bisa diblokir (mode privat / kuota penuh) — abaikan diam-diam. */
  }
};

export const wereRemindersSeen = (
  ids = [],
  now = new Date(),
  storage = globalThis.localStorage,
) => {
  if (!storage || ids.length === 0) return false;
  try {
    const raw = storage.getItem(REMINDER_SEEN_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw);
    const seen = map?.[todayYmd(now)];
    if (!Array.isArray(seen)) return false;
    return ids.every((id) => seen.includes(id));
  } catch {
    return false;
  }
};
