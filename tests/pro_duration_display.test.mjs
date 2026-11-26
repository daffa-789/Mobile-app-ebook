import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_PLAN } from '../shared/plans.js';
import {
  MS_PER_DAY,
  PRO_PLAN_DURATION_DAYS,
  getProDurationSummary,
} from '../mobile-app/src/lib/proMembership.js';

const ROOT_DIR = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');

test('Durasi masa langganan Pro mobile (sebelah Paket Bulanan)', async (t) => {
  await t.test('shared/plans.js dan proMembership.js memakai durasi default 30 hari', () => {
    assert.equal(DEFAULT_PLAN.durationDays, 30);
    assert.equal(PRO_PLAN_DURATION_DAYS, 30);
  });

  await t.test('getProDurationSummary: tamu dan pengguna non-Pro melihat Masa 30 hari', () => {
    const guest = getProDurationSummary({ isPro: false, user: null, now: 1_700_000_000_000 });
    assert.equal(guest.badgeLabel, 'Masa 30 hari');
    assert.equal(guest.detailTitle, null);
    assert.equal(guest.remainingDays, null);

    const freeUser = getProDurationSummary({
      isPro: false,
      user: { id: 'u-1', is_pro: false },
      now: 1_700_000_000_000,
    });
    assert.equal(freeUser.badgeLabel, 'Masa 30 hari');
    assert.equal(freeUser.detailTitle, null);
  });

  await t.test(
    'getProDurationSummary: pengguna Pro membandingkan tanggal beli & kedaluwarsa dengan format X hari lagi',
    () => {
      const now = Date.parse('2026-11-26T04:00:00.000Z');
      const thirtyDaysLater = new Date(now + 30 * MS_PER_DAY).toISOString();
      const summary30 = getProDurationSummary({
        isPro: true,
        user: { subscription_expires_at: thirtyDaysLater },
        now,
      });
      assert.equal(summary30.badgeLabel, '30 hari lagi');
      assert.equal(summary30.remainingDays, 30);
      assert.equal(summary30.detailTitle, null);
      assert.equal(summary30.expiresAtIso, thirtyDaysLater);

      // Contoh 20 hari lagi sesuai spesifikasi pengguna
      const twentyDaysLater = new Date(now + 20 * MS_PER_DAY).toISOString();
      const summary20 = getProDurationSummary({
        isPro: true,
        user: { subscription_expires_at: twentyDaysLater },
        now,
      });
      assert.equal(summary20.badgeLabel, '20 hari lagi');
      assert.equal(summary20.remainingDays, 20);

      const fractionalExpiry = new Date(now + 14 * MS_PER_DAY + 2 * 60 * 60 * 1000).toISOString();
      const summary15 = getProDurationSummary({
        isPro: true,
        user: { subscriptionExpiresAt: fractionalExpiry },
        now,
      });
      assert.equal(summary15.badgeLabel, '15 hari lagi');
      assert.equal(summary15.remainingDays, 15);

      const finalHours = new Date(now + 30 * 1000).toISOString();
      const summaryLastDay = getProDurationSummary({
        isPro: true,
        user: { subscription_expires_at: finalHours },
        now,
      });
      assert.equal(summaryLastDay.badgeLabel, '1 hari lagi');
      assert.equal(summaryLastDay.remainingDays, 1);
    },
  );

  await t.test(
    'getProDurationSummary: akun Pro tanpa subscription_expires_at membandingkan dari tanggal beli/pendaftaran',
    () => {
      const now = Date.parse('2026-11-26T04:00:00.000Z');
      const purchaseDate = new Date(now - 10 * MS_PER_DAY).toISOString();
      const computedFromCreated = getProDurationSummary({
        isPro: true,
        user: { is_pro: true, created_at: purchaseDate, subscription_expires_at: null },
        now,
      });
      assert.equal(computedFromCreated.badgeLabel, '20 hari lagi');
      assert.equal(computedFromCreated.remainingDays, 20);

      const defaultFallback = getProDurationSummary({
        isPro: true,
        user: { is_pro: true, subscription_expires_at: null },
        now,
      });
      assert.equal(defaultFallback.badgeLabel, '30 hari lagi');
      assert.equal(defaultFallback.remainingDays, 30);
    },
  );

  await t.test('ProScreen & AuthContext memasang badge durasi di sebelah Paket Bulanan', () => {
    const proSrc = read('mobile-app/src/screens/ProScreen.js');
    const authCtxSrc = read('mobile-app/src/context/AuthContext.js');

    assert.match(proSrc, /planHeaderRow[\s\S]*Paket Bulanan[\s\S]*durationSummary\.badgeLabel/);
    assert.match(proSrc, /getProDurationSummary\(\{/);
    assert.match(proSrc, /membershipInfoBox/);
    assert.ok(authCtxSrc.includes('entitlementNow,'), 'AuthContext mengekspor entitlementNow');
  });
});
