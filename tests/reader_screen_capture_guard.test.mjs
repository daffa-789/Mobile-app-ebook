/**
 * Regresi proteksi isi buku — rilis 0.1.9 (14 November 2026).
 *
 * `expo-screen-capture` menyalakan FLAG_SECURE hanya selama layar pembaca
 * terbuka. Keputusan pemilik: guard dipasang di level `ReaderScreen`, bukan
 * hanya cabang PDF, supaya format naskah yang ditambahkan kelak (DOCX/TXT)
 * otomatis terlindungi tanpa perubahan kode. Layar lain — AuthScreen, pemilih
 * akun Google, QRIS, Profil — sengaja tetap bisa difoto.
 *
 * Kita hanya MEMBLOKIR tangkapan layar. Tidak ada `addScreenshotListener`,
 * sehingga tidak dibutuhkan config plugin maupun izin `READ_MEDIA_IMAGES`
 * (izin galeri itu yang kena kebijakan Play Store).
 *
 * Ini modul native, jadi tidak boleh dikirim lewat OTA: versi/versionCode
 * wajib naik dan `runtimeVersion` mengikuti `appVersion`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const appJson = JSON.parse(read('app.json'));
const reader = () => read('mobile-app/src/screens/ReaderScreen.js');

test('expo-screen-capture terpasang pada versi yang dikunci SDK 58', () => {
  assert.equal(pkg.dependencies['expo-screen-capture'], '~58.0.6');
  const entry = lock.packages?.['node_modules/expo-screen-capture'];
  assert.ok(entry, 'package-lock.json wajib memuat modul native baru');
  assert.match(entry.version, /^58\./, 'versi harus mengikuti Expo SDK 58');
});

test('hanya memblokir: tanpa config plugin, tanpa izin galeri, tanpa deteksi', () => {
  const plugins = appJson.expo.plugins.map((entry) => (Array.isArray(entry) ? entry[0] : entry));
  assert.ok(
    !plugins.some((plugin) => String(plugin).includes('screen-capture')),
    'expo-screen-capture tidak membutuhkan config plugin',
  );

  const permissions = appJson.expo.android.permissions || [];
  for (const permission of ['READ_MEDIA_IMAGES', 'READ_EXTERNAL_STORAGE']) {
    assert.ok(
      !permissions.includes(permission),
      `${permission} tidak boleh diminta saat kita hanya memblokir tangkapan layar`,
    );
  }

  const src = reader();
  assert.ok(
    !/\b(?:addScreenshotListener|useScreenshotListener)\s*\(/.test(src),
    'jangan memasang deteksi screenshot (cukup blokir)',
  );
  assert.ok(
    !/import\s+\{[^}]*(?:addScreenshotListener|useScreenshotListener)/.test(src),
    'jangan mengimpor API deteksi screenshot',
  );
});

test('guard menyala di seluruh ReaderScreen, sebelum cabang khusus PDF', () => {
  const src = reader();
  assert.match(
    src,
    /import \{ usePreventScreenCapture \} from 'expo-screen-capture';/,
    'harus memakai hook resmi yang melepas proteksi saat unmount',
  );

  const hookCall = src.indexOf("usePreventScreenCapture('wahidiyah-reader');");
  const pdfBranch = src.indexOf('\n  if (isPdf) {\n');
  assert.ok(hookCall > 0, 'hook proteksi harus benar-benar dipanggil');
  assert.ok(pdfBranch > 0, 'cabang render PDF harus tetap ada');
  assert.ok(
    hookCall < pdfBranch,
    'guard harus dipasang sebelum cabang isPdf supaya DOCX/TXT ikut terlindungi',
  );
  assert.ok(
    !src.includes('preventScreenCaptureAsync('),
    'jangan reimplementasi pencegahan manual rawan cleanup',
  );
});

test('layar di luar pembaca tetap bebas difoto', () => {
  const screens = [
    'AuthScreen.js',
    'AuthModal.js',
    'HomeScreen.js',
    'CalendarScreen.js',
    'ProScreen.js',
    'ProfileScreen.js',
    'VerificationScreen.js',
    'SubscriptionHistoryScreen.js',
  ];
  for (const screen of screens) {
    const src = read(`mobile-app/src/screens/${screen}`);
    assert.ok(
      !src.includes('usePreventScreenCapture') && !src.includes('preventScreenCaptureAsync'),
      `${screen} tidak boleh terpasang FLAG_SECURE`,
    );
  }
});

test('pembaca PDF native dan Hermes V1 tidak boleh regresi', () => {
  const src = reader();
  const pdfBranch = src.slice(src.indexOf('\n  if (isPdf) {\n'));
  assert.match(pdfBranch, /trustAllCerts=\{false\}/, 'trust store sistem wajib dipakai');
  assert.match(pdfBranch, /source=\{\{ uri: pdfUrl \}\}/, 'PDF tetap dari signed URL');
  assert.ok(!pdfBranch.includes('expo-web-browser'), 'PDF tidak boleh dibuka di browser');
  assert.match(pdfBranch, /paddingTop: 24/, 'ruang atas bilah Kembali tidak boleh hilang');

  assert.equal(appJson.expo.jsEngine, undefined, 'JSC dilarang');
  const buildProps = appJson.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'expo-build-properties',
  );
  assert.notEqual(buildProps?.[1]?.android?.useHermesV1, false);
});

test('modul native menaikkan versi & runtime 0.1.9', () => {
  assert.equal(appJson.expo.version, '0.1.9');
  assert.equal(appJson.expo.android.versionCode, 11);
  assert.deepEqual(appJson.expo.runtimeVersion, { policy: 'appVersion' });
  assert.match(
    read('mobile-app/src/config/constants.js'),
    /export const APP_VERSION = '0\.1\.9'/,
    'versi di layar Profil harus sama dengan expo.version',
  );
});
