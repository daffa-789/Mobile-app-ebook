import { DEFAULT_PLAN } from '../../../shared/plans.js';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const PRO_PLAN_DURATION_DAYS = Number(DEFAULT_PLAN?.durationDays) || 30;

/**
 * Menghitung ringkasan masa langganan Pro untuk ditampilkan di sebelah judul Paket Bulanan.
 * - Belum Pro: menampilkan durasi paket standar (`Masa 30 hari`).
 * - Pro: membandingkan tanggal beli dan tanggal kedaluwarsa langganan (`X hari lagi`, misal `20 hari lagi`).
 */
export function getProDurationSummary({ isPro, user, now = Date.now() } = {}) {
  if (!isPro) {
    return {
      badgeLabel: `Masa ${PRO_PLAN_DURATION_DAYS} hari`,
      detailTitle: null,
      durationDays: PRO_PLAN_DURATION_DAYS,
      remainingDays: null,
      expiresAtIso: null,
      isLifetime: false,
    };
  }

  const rawExpiresAt = user?.subscription_expires_at ?? user?.subscriptionExpiresAt ?? null;
  const hasExpiryValue =
    rawExpiresAt !== null && rawExpiresAt !== undefined && String(rawExpiresAt).trim() !== '';

  const nowMs = now instanceof Date ? now.getTime() : Number(now);

  let expiresAtMs = hasExpiryValue
    ? rawExpiresAt instanceof Date
      ? rawExpiresAt.getTime()
      : Date.parse(rawExpiresAt)
    : null;

  // Jika tanggal kedaluwarsa belum terisi langsung, hitung dari tanggal beli / pendaftaran (created_at) + durasi paket
  if (!Number.isFinite(expiresAtMs)) {
    const rawCreatedAt = user?.subscription_created_at ?? user?.created_at ?? null;
    const createdAtMs = rawCreatedAt ? Date.parse(rawCreatedAt) : null;
    if (Number.isFinite(createdAtMs)) {
      expiresAtMs = createdAtMs + PRO_PLAN_DURATION_DAYS * MS_PER_DAY;
    }
  }

  let remainingDays = PRO_PLAN_DURATION_DAYS;
  let expiresAtIso = null;

  if (Number.isFinite(expiresAtMs) && Number.isFinite(nowMs)) {
    expiresAtIso = new Date(expiresAtMs).toISOString();
    if (expiresAtMs > nowMs) {
      remainingDays = Math.max(1, Math.ceil((expiresAtMs - nowMs) / MS_PER_DAY));
    } else {
      remainingDays = 1;
    }
  }

  return {
    badgeLabel: `${remainingDays} hari lagi`,
    detailTitle: null,
    durationDays: PRO_PLAN_DURATION_DAYS,
    remainingDays,
    expiresAtIso,
    isLifetime: false,
  };
}
