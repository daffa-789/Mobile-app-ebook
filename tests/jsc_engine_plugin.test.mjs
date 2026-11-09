import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appJson = require(path.join(root, 'app.json'));

/**
 * Regresi 9 November 2026 — "Mobile-app-ebook terus berhenti" di J7 Prime.
 *
 * Riwayat build yang diverifikasi dari biner APK:
 *   v0.1.0 / v0.1.1 / v0.1.2 (versionCode 3) -> Hermes (libhermesvm.so,
 *   bundel HBC c6 1f bc 03 ...), terbukti jalan di Android 9 armeabi-v7a.
 *   v0.1.2 (versionCode 4) -> JSC (libjsc.so, bundel JS polos) setelah plugin
 *   withJscEngine menyuntik hermesEnabled=false. Inilah satu-satunya build
 *   yang force close. Expo SDK 58 / RN 0.88 tidak lagi mendukung JSC, jadi
 *   mematikan Hermes merusak startup native.
 *
 * Tes ini mengunci agar plugin penonaktif Hermes tidak pernah terpasang lagi.
 * Nama berkas sengaja dipertahankan supaya riwayat regresi tetap tertelusur.
 */

test('app.json tidak mendaftarkan plugin yang mematikan Hermes', () => {
  const plugins = appJson.expo.plugins.map((entry) => (Array.isArray(entry) ? entry[0] : entry));
  assert.ok(
    !plugins.includes('./mobile-app/plugins/withJscEngine.cjs'),
    'plugin withJscEngine tidak boleh terdaftar di expo.plugins',
  );
  assert.ok(!plugins.some((entry) => /jsc/i.test(entry)), 'tidak ada plugin JSC yang boleh aktif');
});

test('konfigurasi Expo tidak memaksa jsEngine jsc atau hermesEnabled=false', () => {
  assert.notEqual(appJson.expo.jsEngine, 'jsc', 'jsEngine jsc tidak didukung SDK 58');
  const appConfig = fs.readFileSync(path.join(root, 'app.json'), 'utf8');
  assert.ok(!appConfig.includes('hermesEnabled'), 'app.json tidak boleh menonaktifkan Hermes');

  const easConfig = fs.readFileSync(path.join(root, 'eas.json'), 'utf8');
  assert.ok(!easConfig.includes('hermesEnabled'), 'eas.json tidak boleh menonaktifkan Hermes');
});

test('tidak ada config plugin aktif yang menyuntik hermesEnabled=false', () => {
  const pluginDir = path.join(root, 'mobile-app', 'plugins');
  if (!fs.existsSync(pluginDir)) return;

  for (const file of fs.readdirSync(pluginDir)) {
    const content = fs.readFileSync(path.join(pluginDir, file), 'utf8');
    assert.ok(
      !/hermesEnabled[\s\S]{0,80}['"]false['"]/.test(content),
      `${file} tidak boleh menyetel hermesEnabled=false`,
    );
  }
});

test('build tetap menyertakan armeabi-v7a + arm64-v8a untuk J7 Prime', () => {
  const buildProperties = appJson.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'expo-build-properties',
  );
  assert.ok(buildProperties, 'expo-build-properties harus tetap terdaftar');

  const archs = buildProperties[1]?.android?.buildArchs ?? [];
  assert.ok(archs.includes('armeabi-v7a'), '32-bit armeabi-v7a wajib ada');
  assert.ok(archs.includes('arm64-v8a'), '64-bit arm64-v8a wajib ada');
});

test('versionCode naik di atas build JSC v0.1.2 yang cacat (4)', () => {
  assert.ok(
    appJson.expo.android.versionCode > 4,
    'build perbaikan harus lebih baru dari versionCode 4 yang force close',
  );
});

test('semua jalur unduh menunjuk ke rilis Hermes terverifikasi, bukan artefak JSC', () => {
  const stableApkUrl =
    'https://github.com/daffa-789/Mobile-app-ebook/releases/download/v0.1.1/wahidiyah-v0.1.1.apk';
  const jscArtifact = 'xA4OBPWr4r68oBF-zo0p9olad0QSUX0bR4vsbf7pX-s.apk';
  const sources = {
    'landing-page': fs.readFileSync(
      path.join(root, 'landing-page', 'src', 'config', 'constants.js'),
      'utf8',
    ),
    server: fs.readFileSync(path.join(root, 'server', 'routes', 'health_routes.js'), 'utf8'),
    vercel: fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'),
  };

  for (const [name, content] of Object.entries(sources)) {
    assert.ok(content.includes(stableApkUrl), `${name} harus mengarah ke rilis stabil Hermes`);
    assert.ok(!content.includes(jscArtifact), `${name} tidak boleh menyebarkan APK JSC`);
    assert.ok(
      !content.includes('https://expo.dev/artifacts/eas/'),
      `${name} tidak boleh menunjuk artefak EAS yang belum terverifikasi di perangkat 32-bit`,
    );
  }

  const vercelConfig = JSON.parse(sources.vercel);
  for (const redirect of vercelConfig.redirects) {
    assert.equal(redirect.destination, stableApkUrl, `${redirect.source} harus ke APK stabil`);
  }
});
