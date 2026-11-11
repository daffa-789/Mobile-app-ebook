/**
 * Regresi optimasi "update kecil tetap di 0.1.5":
 * 1. Header CSP enforced & report-only halaman handoff selaras.
 * 2. Saat aplikasi dibuka dan ada OTA, pengguna mendapat DUA pilihan jelas
 *    (perbarui / nanti), lewat modul terpisah — bukan logik bertumpuk di App.js.
 * 3. Kode mati dari iterasi sebelumnya benar-benar hilang.
 * 4. Tidak ada kenaikan versi / modul native baru.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MOBILE_HANDOFF_HEADERS } from '../server/lib/googleHandoff.js';

const ROOT_DIR = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT_DIR, relative), 'utf8');
const appSrc = read('mobile-app/App.js');
const authSrc = read('mobile-app/src/screens/AuthScreen.js');
const profileSrc = read('mobile-app/src/screens/ProfileScreen.js');
const otaLibSrc = read('mobile-app/src/lib/ota.js');
const hookSrc = read('mobile-app/src/hooks/useOtaUpdate.js');
const promptSrc = read('mobile-app/src/components/OtaUpdatePrompt.js');
const appConfig = JSON.parse(read('app.json'));

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
    for (const src of [appSrc, otaLibSrc, hookSrc, promptSrc]) {
      assert.ok(!src.includes('expo-clipboard') && !src.includes('expo-media-library'));
    }
  });

  await t.test('Lapisan OTA modular: lib murni, hook status, komponen UI', () => {
    assert.ok(
      otaLibSrc.includes('import * as Updates') && !otaLibSrc.includes('react-native'),
      'lib/ota.js tidak boleh bergantung pada React/UI',
    );
    for (const fn of [
      'isOtaSupported',
      'checkForOtaUpdate',
      'downloadOtaUpdate',
      'reloadWithOtaUpdate',
      'applyOtaUpdate',
      'OTA_CHECK_THROTTLE_MS',
    ]) {
      assert.ok(otaLibSrc.includes(fn), `lib/ota.js mengekspor ${fn}`);
    }
    assert.ok(hookSrc.includes("from '../lib/ota'"), 'hook memakai lapisan lib bersama');
    assert.ok(hookSrc.includes('AppState.addEventListener'));
    assert.ok(hookSrc.includes('dismissedRef'), '"nanti" hanya berlaku per sesi');
    assert.ok(hookSrc.includes('checkingRef'), 'pemeriksaan tidak tumpang tindih');
    assert.ok(
      !/from ['"]expo-updates['"]/.test(promptSrc),
      'komponen UI tidak boleh mengimpor expo-updates',
    );
  });

  await t.test('Dialog memberi dua pilihan eksplisit: perbarui atau tidak', () => {
    assert.ok(promptSrc.includes('<Modal'), 'dialog tampil saat aplikasi dibuka');
    assert.ok(promptSrc.includes('Pembaruan tersedia'));
    assert.ok(promptSrc.includes('Perbarui Sekarang'));
    assert.ok(promptSrc.includes('Nanti Saja'));
    assert.ok(promptSrc.includes('onRequestClose={onDismiss}'), 'tombol BACK = pilihan nanti');
    assert.ok(promptSrc.includes('Gagal Memuat Pembaruan'), 'kegagalan ada umpan balik');
    assert.ok(appSrc.includes('<OtaUpdatePrompt'), 'dialog dipasang di root aplikasi');
    assert.ok(appSrc.includes('useOtaUpdate()'));
    assert.ok(
      appSrc.includes('!authModalVisible && !activeBook && !showRiwayat'),
      'dialog tidak menimpa sheet login / reader',
    );
  });

  await t.test('App.js bebas logika OTA dan kode mati banner lama', () => {
    assert.ok(!appSrc.includes('otaBanner'), 'style banner lama dihapus');
    assert.ok(!appSrc.includes('otaReady'), 'state banner lama dihapus');
    assert.ok(!appSrc.includes('Updates.checkForUpdateAsync'), 'pemeriksaan pindah ke hook');
    assert.ok(!appSrc.includes('AppState'), 'AppState pindah ke hook');
    assert.ok(!appSrc.includes('import * as Updates'), 'App.js tidak mengimpor expo-updates');
  });

  await t.test('Pemeriksaan manual di Profil memakai helper yang sama', () => {
    assert.ok(profileSrc.includes('isOtaSupported'));
    assert.ok(profileSrc.includes('checkForOtaUpdate'));
    assert.ok(profileSrc.includes('downloadOtaUpdate'));
    assert.ok(profileSrc.includes('reloadWithOtaUpdate'));
    assert.ok(!profileSrc.includes('Updates.'), 'tidak ada duplikasi panggilan langsung');
  });

  await t.test('Kode mati AuthScreen dibuang', () => {
    assert.ok(!authSrc.includes('APP_CONFIG'), 'import APP_CONFIG tidak terpakai');
    assert.ok(!authSrc.includes('Ionicons'), 'import Ionicons tidak terpakai');
    assert.ok(!authSrc.includes('Linking.openURL('), 'fallback Linking tidak pernah tercapai');
    assert.ok(!/^\s+Linking,$/m.test(authSrc), 'import Linking tidak terpakai');
    assert.ok(!authSrc.includes('const isWeb'), 'konstanta isWeb selalu true');
    assert.ok(!authSrc.includes('statusBanner:'), 'style banner status sudah mati');
    assert.ok(!authSrc.includes('statusDot:'), 'style titik status sudah mati');
    assert.ok(!authSrc.includes('statusBannerText:'), 'style teks status sudah mati');
    assert.ok(authSrc.includes('window.location.href = authUrl'), 'redirect web tetap utuh');
  });

  await t.test('Tidak ada import ikon mati di layar lain', () => {
    for (const screen of [
      'ProScreen.js',
      'ReaderScreen.js',
      'SubscriptionHistoryScreen.js',
      'VerificationScreen.js',
    ]) {
      const src = read(`mobile-app/src/screens/${screen}`);
      assert.ok(!src.includes('Ionicons'), `${screen} masih mengimpor Ionicons yang tidak dipakai`);
    }
    const verification = read('mobile-app/src/screens/VerificationScreen.js');
    assert.ok(!verification.includes('useRef'), 'useRef tidak terpakai di VerificationScreen');
    /* App.js memang memakai Ionicons untuk ikon "sparkles" di bottom nav. */
    assert.ok(appSrc.includes('Ionicons'));
  });

  await t.test('Regresi login Google sebelumnya tidak ikut terhapus', () => {
    assert.ok(!authSrc.includes('googleWaiting'), 'status tunggu Google dihapus');
    assert.ok(!authSrc.includes('AppState'), 'listener foreground status tunggu dihapus');
    assert.ok(authSrc.includes('googleSessionRef'), 'penjaga sesi ganda tetap ada');
    assert.ok(authSrc.includes('res.timedOut'));
    assert.ok(appSrc.includes('setAuthModalVisible(false)'));
  });
});
