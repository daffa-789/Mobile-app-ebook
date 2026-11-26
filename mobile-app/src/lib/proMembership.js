import { DEFAULT_PLAN } from '../../../shared/plans.js';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const PRO_PLAN_DURATION_DAYS = Number(DEFAULT_PLAN?.durationDays) || 30;

/**
 * Menghitung ringkasan masa langganan Pro untuk ditampilkan di sebelah judul Paket Bulanan.
 * - Belum Pro: menampilkan durasi paket standar (`Masa 30 hari`).
 * - Pro berbatas waktu: menghitung sisa hari aktif (`Sisa X hari`) dari `subscription_expires_at`.
 * - Pro manual tanpa kedaluwarsa: menampilkan status aktif permanen.
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

  if (!hasExpiryValue) {
    return {
      badgeLabel: 'Aktif permanen',
      detailTitle: 'Akses Member Pro aktif tanpa batas waktu',
      durationDays: PRO_PLAN_DURATION_DAYS,
      remainingDays: null,
      expiresAtIso: null,
      isLifetime: true,
    };
  }

  const expiresAtMs =
    rawExpiresAt instanceof Date ? rawExpiresAt.getTime() : Date.parse(rawExpiresAt);
  const nowMs = now instanceof Date ? now.getTime() : Number(now);

  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs) || expiresAtMs <= nowMs) {
    return {
      badgeLabel: `Masa ${PRO_PLAN_DURATION_DAYS} hari`,
      detailTitle: null,
      durationDays: PRO_PLAN_DURATION_DAYS,
      remainingDays: 0,
      expiresAtIso: null,
      isLifetime: false,
    };
  }

  const remainingDays = Math.max(1, Math.ceil((expiresAtMs - nowMs) / MS_PER_DAY));

  return {
    badgeLabel: `Sisa ${remainingDays} hari`,
    detailTitle: `Sisa masa aktif: ${remainingDays} hari (paket ${PRO_PLAN_DURATION_DAYS} hari)`,
    durationDays: PRO_PLAN_DURATION_DAYS,
    remainingDays,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
    isLifetime: false,
  };
}
