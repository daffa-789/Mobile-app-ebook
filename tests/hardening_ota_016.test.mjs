/**
 * Regresi hardening 11 November 2026 (rilis 0.1.6).
 *
 * Semua perbaikan di sini SENGAJA berupa JS murni / konfigurasi server,
 * sehingga bisa dikirim lewat OTA + deploy Vercel tanpa build APK baru.
 * Tes terakhir mengunci daftar modul native terlarang. Sejak rilis 0.1.9
 * proyek sengaja menambah `expo-screen-capture` (modul native sah) dengan
 * konsekuensi versi/versionCode naik — aturan lama itu tidak berlaku lagi.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSecureOauthState, safeDecodeUriComponent } from '../mobile-app/src/lib/authUrl.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('state OAuth memakai CSPRNG, bukan Math.random', () => {
  const lib = read('mobile-app/src/lib/authUrl.js');
  assert.ok(!lib.includes('Math.random'), 'helper tidak boleh memakai PRNG yang bisa diprediksi');
  assert.match(lib, /randomUUID|getRandomValues/);

  const first = createSecureOauthState();
  const second = createSecureOauthState();
  assert.ok(typeof first === 'string' && first.length >= 32, 'state memiliki >= 128 bit entropi');
  assert.notEqual(first, second, 'dua state tidak boleh sama');

  const screen = read('mobile-app/src/screens/AuthScreen.js');
  assert.ok(!screen.includes('Math.random'), 'AuthScreen tidak boleh lagi memakai Math.random');
  assert.match(screen, /createSecureOauthState\(\)/);
  assert.match(screen, /; Secure/, 'cookie state diberi flag Secure pada HTTPS');
  assert.match(screen, /window\.location\.href = authUrl/, 'redirect web tetap utuh');
});

test('decode URI aman pada input rusak', () => {
  assert.equal(safeDecodeUriComponent('Akses%20ditolak'), 'Akses ditolak');
  assert.doesNotThrow(() => safeDecodeUriComponent('%E0%A4%A'));
  assert.equal(safeDecodeUriComponent('%E0%A4%A'), '%E0%A4%A');
  assert.equal(safeDecodeUriComponent(undefined, 'fallback'), 'fallback');

  for (const file of ['mobile-app/App.js', 'mobile-app/src/context/AuthContext.js']) {
    const src = read(file);
    assert.match(src, /safeDecodeUriComponent\(/, `${file} memakai helper decode aman`);
    assert.ok(
      !/(?<!safe)decodeURIComponent\(/.test(src.replace(/safeDecodeUriComponent/g, '')),
      `${file} tidak boleh memanggil decodeURIComponent mentah`,
    );
  }
});

test('sesi browser Google diserialisasi dan konfigurasi native tidak melempar', () => {
  const src = read('mobile-app/src/context/AuthContext.js');
  assert.match(src, /browserSessionRef/);
  assert.match(src, /if \(browserSessionRef\.current\)/, 'tab kedua dicegah');
  assert.match(src, /sessionPromise\.then\(releaseSession, releaseSession\)/);
  assert.match(
    src,
    /configureGoogleNative\(\)\.catch/,
    'configure tidak boleh unhandled rejection',
  );
});

test('pembatalan QRIS menunggu server dan polling tidak tumpang tindih', () => {
  const src = read('mobile-app/src/screens/ProScreen.js');
  assert.match(src, /await cancelPayment\(activeOrder\.orderId\)/, 'tunggu konfirmasi server');
  assert.match(src, /startPollingStatus\(activeOrder\.orderId\)/, 'gagal batal → polling dilanjut');
  assert.match(src, /pollBusyRef/);
  assert.ok(!src.includes('import { theme }'), 'impor theme mati dibuang');
  for (const file of ['mobile-app/App.js', 'mobile-app/src/screens/ProfileScreen.js']) {
    assert.ok(!read(file).includes('import { theme }'), `${file} bebas impor theme mati`);
  }
});

test('fallback API rilis memakai HTTPS, dev tetap emulator', () => {
  const src = read('mobile-app/src/config/constants.js');
  assert.match(src, /IS_RELEASE_BUILD/);
  assert.match(src, /https:\/\/mobile-app-ebook\.vercel\.app\/api/);
  assert.ok(!src.includes('mobile-app-expo-sooty.vercel.app'), 'domain lama dihapus');
  assert.match(src, /10\.0\.2\.2:5000/, 'fallback emulator dev tetap ada');
});

test('server: idToken dibatasi umurnya, endpoint native dibatasi lajunya', () => {
  const service = read('server/services/auth/google_oauth_service.js');
  assert.match(service, /MAX_ID_TOKEN_AGE_SECONDS/);
  assert.match(service, /payload\.iat/);
  assert.match(
    service,
    /verifyIdToken\(\{ idToken, audience: clientId \}\)/,
    'verifikasi inti utuh',
  );

  const middleware = read('server/middleware/security.js');
  assert.match(middleware, /googleAuthRateLimiter/);
  const app = read('server/app.js');
  assert.match(app, /'\/api\/auth\/google\/native'/);
  assert.match(app, /'\/api\/auth\/google\/mobile-start'/);
  assert.match(app, /googleAuthRateLimiter\)/);
  /* Rute tetap tipis — limiter tidak boleh mengubah deklarasi router. */
  assert.match(
    read('server/routes/auth_routes.js'),
    /authRouter\.post\('\/google\/native', wrap\(googleNative\)\)/,
  );

  assert.match(read('server/config.js'), /process\.env\.VERCEL \? 1/, 'trust proxy di Vercel');
});

test('komentar versi sudah mengikuti 0.1.8', () => {
  const health = read('server/routes/health_routes.js');
  assert.ok(!health.includes('APK v0.1.5 menyematkan'), 'komentar APK lama dibuang');
  assert.ok(!health.includes('versionCode 7'), 'versionCode lama dibuang');
  assert.match(health, /v0\.1\.8/);
  const landing = read('landing-page/src/config/constants.js');
  assert.ok(!landing.includes('Rilis v0.1.5 memakai Hermes'), 'komentar landing diperbarui');
  assert.match(landing, /v0\.1\.8/);
});

test('rilis 0.1.9: modul native terlarang tetap tidak dipakai', () => {
  const appJson = JSON.parse(read('app.json'));
  assert.equal(appJson.expo.version, '0.1.9');
  assert.equal(appJson.expo.android.versionCode, 11);
  assert.deepEqual(appJson.expo.runtimeVersion, { policy: 'appVersion' });
  assert.equal(appJson.expo.jsEngine, undefined, 'Hermes tidak boleh dimatikan');

  const mobileFiles = [
    'mobile-app/App.js',
    'mobile-app/src/screens/AuthScreen.js',
    'mobile-app/src/screens/ProScreen.js',
    'mobile-app/src/screens/ProfileScreen.js',
    'mobile-app/src/context/AuthContext.js',
    'mobile-app/src/config/constants.js',
    'mobile-app/src/lib/authUrl.js',
  ];
  for (const file of mobileFiles) {
    const src = read(file);
    for (const modul of ['expo-clipboard', 'expo-media-library', 'expo-sharing']) {
      assert.ok(!src.includes(`from '${modul}'`), `${file} tidak boleh menambah modul native`);
    }
  }
});
