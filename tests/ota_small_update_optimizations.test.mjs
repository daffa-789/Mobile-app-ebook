/**
 * Regresi optimasi "update kecil tetap di 0.1.5":
 * 1. Header CSP enforced & report-only halaman handoff selaras (tanpa warning palsu).
 * 2. Indikator pembaruan OTA tersedia di luar halaman Profil, tanpa mengubah
 *    versi aplikasi atau menambah modul native.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOBILE_HANDOFF_HEADERS } from '../server/lib/googleHandoff.js';

const ROOT_DIR = process.cwd();
const appSrc = fs.readFileSync(path.join(ROOT_DIR, 'mobile-app', 'App.js'), 'utf8');
const appConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'app.json'), 'utf8'));

test('Optimasi update kecil 0.1.5', async (t) => {
  await t.test('CSP enforced dan report-only identik', () => {
    assert.equal(
      MOBILE_HANDOFF_HEADERS['Content-Security-Policy-Report-Only'],
      MOBILE_HANDOFF_HEADERS['Content-Security-Policy'],
    );
    assert.match(MOBILE_HANDOFF_HEADERS['Content-Security-Policy'], /script-src 'sha256-/);
  });

  await t.test('Versi tidak naik dan tidak ada modul native baru', () => {
    assert.equal(appConfig.expo.version, '0.1.5');
    assert.equal(appConfig.expo.android.versionCode, 7);
    assert.deepEqual(appConfig.expo.runtimeVersion, { policy: 'appVersion' });
    assert.ok(!appSrc.includes('expo-clipboard'), 'tidak ada modul native baru');
    assert.ok(!appSrc.includes('expo-media-library'), 'tidak ada modul native baru');
  });

  await t.test('App.js memantau OTA dan menyediakan Muat Ulang global', () => {
    assert.ok(appSrc.includes("import * as Updates from 'expo-updates'"));
    assert.ok(appSrc.includes('AppState.addEventListener'), 'pantau saat kembali ke foreground');
    assert.ok(appSrc.includes('Updates.checkForUpdateAsync()'));
    assert.ok(appSrc.includes('Updates.fetchUpdateAsync()'));
    assert.ok(appSrc.includes('Updates.reloadAsync()'));
    assert.ok(appSrc.includes('__DEV__'), 'aman di mode development / Expo Go');
    assert.ok(appSrc.includes('Updates.isEnabled'), 'hanya jalan saat updates aktif');
    assert.ok(appSrc.includes('60000'), 'pemeriksaan di-throttle');
    assert.ok(appSrc.includes('otaDismissedRef'), 'penolakan banner tidak muncul berulang');
    assert.ok(appSrc.includes('Pembaruan kecil siap dipasang.'));
    assert.ok(appSrc.includes('Muat Ulang'));
    assert.ok(
      appSrc.includes('!authModalVisible && !activeBook && !showRiwayat'),
      'banner tidak mengganggu sheet login / reader',
    );
  });

  await t.test('Pemeriksaan manual di Profil tetap dipertahankan', () => {
    const profileSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'mobile-app', 'src', 'screens', 'ProfileScreen.js'),
      'utf8',
    );
    assert.ok(profileSrc.includes('Updates.checkForUpdateAsync()'));
    assert.ok(profileSrc.includes('Updates.reloadAsync()'));
  });
});
