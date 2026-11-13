/**
 * Regresi rilis 0.1.6 — pemilih akun Google native tanpa browser.
 *
 * Menambah SDK native itu BUKAN perubahan JS biasa: `classes.dex` ikut berubah,
 * sehingga versi/versionCode/runtimeVersion wajib naik. Tes ini mengunci
 * seluruh rantai: dependensi + config plugin → helper native → AuthContext →
 * endpoint server yang memverifikasi idToken → daftar endpoint bebas sesi.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('SDK Google Sign-In native tetap terdaftar pada rilis 0.1.7', () => {
  const appJson = JSON.parse(read('app.json'));
  const pkg = JSON.parse(read('package.json'));

  assert.equal(appJson.expo.version, '0.1.7');
  assert.equal(appJson.expo.android.versionCode, 9);
  assert.deepEqual(appJson.expo.runtimeVersion, { policy: 'appVersion' });
  assert.ok(pkg.dependencies['@react-native-google-signin/google-signin']);
  const plugins = appJson.expo.plugins.map((entry) => (Array.isArray(entry) ? entry[0] : entry));
  assert.ok(plugins.includes('@react-native-google-signin/google-signin'));
  assert.ok(plugins.includes('expo-build-properties'), 'Hermes V1 & 32-bit tidak boleh hilang');
});

test('helper native memaksa pemilih akun dan aman di platform non-Android', () => {
  const src = read('mobile-app/src/lib/googleNative.js');

  assert.match(src, /Platform\.OS !== 'android'/, 'web/iOS tidak boleh memuat SDK native');
  assert.match(src, /await import\('@react-native-google-signin\/google-signin'\)/);
  assert.match(src, /GoogleSignin\.configure\(/);
  assert.match(src, /webClientId: OAUTH_CONFIG\.googleClientId/);
  assert.match(src, /GoogleSignin\.hasPlayServices\(/);
  /* Kunci utama permintaan pemilik: akun terakhir tidak boleh dipaksa. */
  assert.match(src, /GoogleSignin\.signOut\(\)/, 'signOut sebelum signIn memunculkan daftar akun');
  assert.match(src, /GoogleSignin\.signIn\(\)/);
  assert.match(src, /getTokens\(\)/, 'cadangan idToken bila tidak ada di respons');
  assert.match(src, /SIGN_IN_CANCELLED/);
  assert.match(src, /PLAY_SERVICES_NOT_AVAILABLE/);
  const signOutAt = src.indexOf('GoogleSignin.signOut()');
  const signInAt = src.indexOf('GoogleSignin.signIn()');
  assert.ok(signOutAt > 0 && signOutAt < signInAt, 'signOut harus terjadi sebelum signIn');
});

test('AuthContext memakai native dulu, browser hanya sebagai fallback', () => {
  const src = read('mobile-app/src/context/AuthContext.js');

  assert.match(src, /const startGoogleLogin = async/);
  assert.match(src, /signInWithGoogleNative\(\)/);
  assert.match(src, /if \(native\.fallback\) return startGoogleMobile\(\)/);
  assert.match(src, /\/api\/auth\/google\/native/);
  assert.match(src, /setUser\(res\.user\)/, 'sesi langsung ter-update tanpa teks ucapan');
  assert.match(src, /configureGoogleNative\(\)/);
  assert.match(src, /const startGoogleMobile =/, 'jalur browser lama tetap ada untuk web');
});

test('server memverifikasi idToken sebelum menerbitkan sesi', () => {
  const controller = read('server/controllers/auth_controller.js');
  const routes = read('server/routes/auth_routes.js');
  const service = read('server/services/auth/google_oauth_service.js');
  const client = read('mobile-app/src/api/client.js');

  assert.match(controller, /export async function googleNative/);
  assert.match(controller, /verifyGoogleIdToken\(\{ idToken, clientId \}\)/);
  assert.match(controller, /findOrCreateGoogleUser\(/);
  assert.match(controller, /replySession\(/);
  assert.match(routes, /authRouter\.post\('\/google\/native', wrap\(googleNative\)\)/);
  assert.match(service, /export async function verifyGoogleIdToken/);
  assert.match(service, /verifyIdToken\(\{ idToken, audience: clientId \}\)/);
  assert.match(service, /payload\?\.email_verified/);
  assert.match(client, /'\/api\/auth\/google\/native'/);
});
