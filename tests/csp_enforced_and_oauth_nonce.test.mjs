/**
 * Regresi 12 November 2026 — nonce OIDC pada login browser + CSP enforced.
 *
 * Dua temuan yang dikunci:
 *  1. CSP_ENFORCE=1 TIDAK melindungi UI web: header Helmet hanya melekat pada
 *     respons Express (/api/*). Halaman statis Vercel butuh header sendiri,
 *     untuk SEMUA rute (bukan cuma "/" dan "/index.html"), tapi tidak boleh
 *     menimpa CSP hash milik halaman handoff Google di /api/*.
 *  2. Jalur native SDK v17 tidak bisa mengirim nonce tanpa APK baru, sedangkan
 *     jalur browser (URL disusun server) bisa — murni deploy Vercel.
 *
 * Semua perubahan di sini bersifat server/web: tanpa APK baru dan tanpa OTA.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CSP_DIRECTIVES } from '../server/config.js';
import { MOBILE_HANDOFF_HEADERS } from '../server/lib/googleHandoff.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));

/* Satu policy: vercel.json / vercel.admin.json wajib identik dengan direktif
 * Helmet, supaya halaman statis dan /api/* tidak punya aturan yang beda. */
const policyFromConfig = Object.entries(CSP_DIRECTIVES)
  .map(([directive, values]) => `${directive} ${values.join(' ')}`)
  .join('; ');

test('googleMobileStart menerbitkan nonce 128-bit dan menguncinya di state', () => {
  const src = read('server/controllers/auth_controller.js');
  const start = src.slice(
    src.indexOf('export async function googleMobileStart'),
    src.indexOf('const parseCookies'),
  );
  assert.match(start, /crypto\.randomBytes\(16\)/, 'nonce >= 128 bit dari CSPRNG');
  assert.match(start, /kind: 'oauth_state', platform: 'mobile', nonce/);
  assert.ok(!start.includes('Math.random'), 'nonce tidak boleh bisa diprediksi');

  const urlLine = start.split('\n').find((line) => line.includes('const url =')) || '';
  assert.match(urlLine, /&nonce=\$\{encodeURIComponent\(nonce\)\}/, 'nonce ikut ke Google');
  assert.match(urlLine, /prompt=select_account/, 'pemilih akun tidak boleh hilang');
  assert.match(start, /MOBILE_STATE_PREFIX \+ state/, 'state tetap ditandai mobile');
  /* Nonce hanya boleh hidup di payload state sekali pakai, bukan di respons
   * JSON yang bisa dibaca bebas sebelum redirect. */
  const responseLine = start.split('\n').find((line) => line.includes('res.json({')) || '';
  assert.ok(!responseLine.includes('nonce'), 'nonce tidak boleh dikirim terpisah ke klien');
});

test('callback mobile menolak state tanpa nonce; alur web tetap kompatibel', () => {
  const src = read('server/controllers/auth_controller.js');
  const callback = src.slice(src.indexOf('export async function googleCallback'));

  assert.match(callback, /let expectedNonce = null;/);
  assert.match(callback, /expectedNonce = typeof redeemed\.nonce === 'string'/);
  assert.match(
    callback,
    /if \(isMobile && !expectedNonce\)/,
    'state mobile tanpa nonce TIDAK boleh membuat pengecekan nonce terlewat',
  );
  assert.match(callback, /expectedNonce,\s*\}\);/, 'nonce diteruskan ke verifikasi id_token');
  assert.match(callback, /expectedState === rawState/, 'alur web berbasis cookie tetap utuh');
  assert.match(callback, /replyMobileHandoff\(res,/, 'kegagalan tetap kembali ke aplikasi');
});

test('pembanding nonce constant-time dan pengecekan bersifat opsional', () => {
  const service = read('server/services/auth/google_oauth_service.js');
  assert.match(service, /expectedNonce = ''/, 'alur web tanpa nonce tetap diterima');
  assert.match(service, /expectedNonce && !nonceMatches\(payload\.nonce, expectedNonce\)/);
  assert.match(service, /crypto\.timingSafeEqual/);

  /* Jalankan fungsi aslinya, bukan cuma cocokkan teks: VM memastikan perilaku
   * perbandingan (panjang beda, nilai beda, nilai hilang) benar-benar benar. */
  const fnSource = service.match(
    /const nonceMatches = (\(received, expected\) => \{[\s\S]*?\n\});/,
  )?.[1];
  assert.ok(fnSource, 'definisi nonceMatches ditemukan');
  const nonceMatches = vm.runInNewContext(`(${fnSource})`, { Buffer, crypto });
  assert.equal(nonceMatches('abc', 'abc'), true);
  assert.equal(nonceMatches('abd', 'abc'), false);
  assert.equal(nonceMatches('abcd', 'abc'), false);
  assert.equal(nonceMatches(undefined, 'abc'), false);
  assert.equal(nonceMatches('', ''), true);
});

test('CSP ditegakkan di produksi, report-only di dev, override tetap ada', () => {
  const reportOnlyFor = (overrides) => {
    const env = { ...process.env };
    for (const key of ['NODE_ENV', 'VERCEL', 'CSP_ENFORCE']) delete env[key];
    Object.assign(env, overrides);
    return (
      execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          "import { CSP_REPORT_ONLY } from './server/config.js'; process.stdout.write(String(CSP_REPORT_ONLY));",
        ],
        { cwd: ROOT, env, encoding: 'utf8' },
      ).trim() === 'true'
    );
  };

  assert.equal(reportOnlyFor({ NODE_ENV: 'production' }), false, 'produksi enforced');
  assert.equal(reportOnlyFor({ VERCEL: '1' }), false, 'Vercel dianggap produksi');
  assert.equal(reportOnlyFor({ NODE_ENV: 'development' }), true, 'lokal report-only');
  assert.equal(
    reportOnlyFor({ NODE_ENV: 'production', CSP_ENFORCE: '0' }),
    true,
    'CSP_ENFORCE=0 = jalur mundur cepat tanpa redeploy kode',
  );
  assert.equal(reportOnlyFor({ NODE_ENV: 'development', CSP_ENFORCE: '1' }), false);
});

test('vercel.json: CSP enforced untuk SEMUA rute UI, /api/* dikecualikan', () => {
  const vercel = json('vercel.json');
  const cspRules = vercel.headers.filter((rule) =>
    rule.headers.some((header) => header.key === 'Content-Security-Policy'),
  );
  assert.equal(cspRules.length, 1, 'tepat satu aturan CSP, bukan cuma / dan /index.html');

  const rule = cspRules[0];
  assert.equal(rule.source, '/((?!api/).*)');
  assert.equal(
    rule.headers.find((header) => header.key === 'Content-Security-Policy').value,
    policyFromConfig,
    'policy statis identik dengan direktif Helmet',
  );
  assert.ok(
    !rule.headers.some((header) => header.key === 'Content-Security-Policy-Report-Only'),
    'header harus enforced, bukan report-only',
  );
  assert.ok(rule.headers.some((header) => header.key === 'X-Content-Type-Options'));

  /* Bukti fungsional bahwa negative lookahead menutup rute SPA tapi tidak
   * menyentuh callback OAuth (yang punya CSP hash sendiri). */
  const matcher = new RegExp('^/((?!api/).*)$');
  for (const uiPath of ['/', '/index.html', '/login', '/auth/success', '/assets/app.js']) {
    assert.equal(matcher.test(uiPath), true, `${uiPath} harus terlindungi CSP`);
  }
  for (const apiPath of ['/api/health', '/api/auth/google/callback']) {
    assert.equal(matcher.test(apiPath), false, `${apiPath} tidak boleh ditimpa CSP-nya`);
  }
});

test('vercel.admin.json memakai policy enforced yang sama', () => {
  const vercel = json('vercel.admin.json');
  const rule = vercel.headers.find((item) =>
    item.headers.some((header) => header.key === 'Content-Security-Policy'),
  );
  assert.ok(rule, 'dashboard admin tidak boleh tanpa CSP');
  assert.equal(rule.source, '/((?!api/).*)');
  assert.equal(
    rule.headers.find((header) => header.key === 'Content-Security-Policy').value,
    policyFromConfig,
  );
});

test('halaman handoff Google tetap menimpa CSP global dengan hash sendiri', () => {
  assert.match(policyFromConfig, /script-src 'self'/);
  assert.ok(!policyFromConfig.includes('sha256-'), 'hash tidak boleh bocor ke policy global');
  assert.match(MOBILE_HANDOFF_HEADERS['Content-Security-Policy'], /script-src 'sha256-/);
  assert.equal(
    MOBILE_HANDOFF_HEADERS['Content-Security-Policy-Report-Only'],
    MOBILE_HANDOFF_HEADERS['Content-Security-Policy'],
  );
  assert.match(policyFromConfig, /img-src 'self' data: blob: https:\/\/\*\.supabase\.co/);
});

test('admin tidak punya skrip inline yang akan diblokir CSP enforced', () => {
  const html = read('admin-dashboard-web/index.html');
  const inline = html.match(/<script(?![^>]*\bsrc=)[^>]*>/gi) || [];
  assert.deepEqual(inline, [], "skrip inline diblokir oleh script-src 'self'");
  assert.match(html, /<script src="\/sw-cleanup\.js"><\/script>/);

  const cleaner = read('public/sw-cleanup.js');
  assert.match(cleaner, /getRegistrations/);
  assert.match(cleaner, /caches\s*\.keys\(\)/);
});

test('rilis 0.1.7 tetap memakai Hermes & runtime appVersion', () => {
  const appJson = json('app.json');
  assert.equal(appJson.expo.version, '0.1.7');
  assert.equal(appJson.expo.android.versionCode, 9);
  assert.deepEqual(appJson.expo.runtimeVersion, { policy: 'appVersion' });
});
