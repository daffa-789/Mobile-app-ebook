/**
 * Regresi: callback Google untuk mobile TIDAK boleh lagi membalas 302 buta ke
 * skema custom. Chrome Custom Tab tidak bisa merender `mobileappebook://…`,
 * sehingga tab tetap tampil seperti halaman login Google dan pengguna harus
 * menutupnya manual padahal sesi sudah aktif.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  MOBILE_STATE_PREFIX,
  MOBILE_HANDOFF_HEADERS,
  MOBILE_HANDOFF_SCRIPT,
  buildMobileAuthUrls,
  buildMobileHandoffHtml,
} from '../server/lib/googleHandoff.js';

const ROOT_DIR = process.cwd();
const controllerSrc = fs.readFileSync(
  path.join(ROOT_DIR, 'server', 'controllers', 'auth_controller.js'),
  'utf8',
);

test('Handoff OAuth mobile: URL intent, HTML aman, dan callback tanpa 302 buta', async (t) => {
  await t.test('buildMobileAuthUrls membuat intent:// dan deep link yang sama', () => {
    const { deepLinkUrl, intentUrl } = buildMobileAuthUrls({
      scheme: 'mobileappebook',
      androidPackage: 'id.wahidiyah.book',
      path: 'auth/success',
      params: { code: 'abc_-123' },
    });
    assert.equal(deepLinkUrl, 'mobileappebook://auth/success?code=abc_-123');
    assert.equal(
      intentUrl,
      'intent://auth/success?code=abc_-123#Intent;scheme=mobileappebook;package=id.wahidiyah.book;end',
    );
    assert.throws(
      () => buildMobileAuthUrls({ scheme: '', androidPackage: 'x', path: 'auth/success' }),
      /belum lengkap/i,
    );
  });

  await t.test('Parameter pesan galat di-encode, bukan disuntikkan mentah', () => {
    const { deepLinkUrl, intentUrl } = buildMobileAuthUrls({
      scheme: 'mobileappebook',
      androidPackage: 'id.wahidiyah.book',
      path: 'auth/failure',
      params: { error: 'google_oauth', message: 'Akses ditolak & coba lagi; nanti' },
    });
    assert.ok(!deepLinkUrl.includes(' '), 'spasi harus ter-encode');
    assert.ok(!intentUrl.includes('Akses ditolak &'), 'karakter & harus ter-encode');
    assert.ok(intentUrl.includes('#Intent;scheme=mobileappebook;'));
    assert.ok(intentUrl.endsWith(';end'));
  });

  await t.test('Halaman sukses langsung membuka aplikasi tanpa teks ucapan login', () => {
    const { intentUrl, deepLinkUrl } = buildMobileAuthUrls({
      scheme: 'mobileappebook',
      androidPackage: 'id.wahidiyah.book',
      path: 'auth/success',
      params: { code: 'kode-rahasia' },
    });
    const html = buildMobileHandoffHtml({ status: 'success', intentUrl, deepLinkUrl });

    /* Pemilik minta tanpa "selamat telah login": sesi diperbarui otomatis di
     * aplikasi, jadi halaman handoff tidak boleh memajang ucapan apa pun. */
    assert.ok(
      !/Login berhasil|selamat|Akun Google Anda|terhubung/i.test(html),
      'tidak ada teks ucapan/Status "login berhasil"',
    );
    assert.ok(!html.includes('<h1') && !html.includes('<style'), 'tanpa kartu status/CSS');
    assert.match(html, /id="buka-aplikasi"/);
    assert.match(html, /Buka Aplikasi/);
    assert.match(html, /intent:\/\/auth\/success\?code=kode-rahasia/);
    assert.match(html, /mobileappebook:\/\/auth\/success\?code=kode-rahasia/);
    assert.ok(!html.includes('accounts.google.com'), 'tidak boleh menyerupai halaman Google');
    assert.ok(!html.includes('<script src'), 'tidak ada skrip eksternal');
    assert.ok(!html.includes('http://') && !html.includes('https://'), 'tidak ada aset eksternal');

    /* Meta refresh TIDAK boleh memuat URL intent yang bertitik koma: parser
     * meta refresh memotong pada ';'. Fallback tanpa JS memakai deep link. */
    const noscript = html.match(/<noscript>[\s\S]*?<\/noscript>/)?.[0] || '';
    assert.ok(noscript.includes('mobileappebook://'));
    assert.ok(!noscript.includes('intent://'));
  });

  await t.test('Halaman gagal menampilkan pesan yang sudah di-escape', () => {
    const { intentUrl, deepLinkUrl } = buildMobileAuthUrls({
      scheme: 'mobileappebook',
      androidPackage: 'id.wahidiyah.book',
      path: 'auth/failure',
      params: { error: 'google_oauth', message: 'Akses ditolak' },
    });
    const html = buildMobileHandoffHtml({
      status: 'failure',
      message: '<script>alert(1)</script> Akses ditolak',
      intentUrl,
      deepLinkUrl,
    });
    assert.match(html, /Login Google gagal/);
    assert.ok(!html.includes('<script>alert(1)</script>'), 'pesan wajib di-escape');
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /intent:\/\/auth\/failure/);
  });

  await t.test('Sesi Google langsung memperbarui aplikasi, tanpa layar ucapan', () => {
    const appSrc = fs.readFileSync(path.join(ROOT_DIR, 'mobile-app', 'App.js'), 'utf8');
    const authSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'mobile-app', 'src', 'screens', 'AuthScreen.js'),
      'utf8',
    );
    const ctxSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'mobile-app', 'src', 'context', 'AuthContext.js'),
      'utf8',
    );

    assert.match(appSrc, /\}, \[user\]\);/, 'effect [user] menyegarkan UI setelah login');
    assert.match(appSrc, /setAuthModalVisible\(false\)/, 'sheet login langsung ditutup');
    assert.match(ctxSrc, /setUser\(res\.user\)/, 'sesi Google mengisi user secara otomatis');
    assert.ok(
      !/selamat|login berhasil|Browser Google sedang terbuka|Menunggu konfirmasi Google/i.test(
        authSrc,
      ),
      'sheet auth bebas teks ucapan maupun teks status tunggu browser',
    );
    assert.ok(!authSrc.includes('googleWaiting'), 'status tunggu Google benar-benar dihapus');
  });

  await t.test('Hash CSP cocok persis dengan skrip yang dikirim', () => {
    const { intentUrl, deepLinkUrl } = buildMobileAuthUrls({
      scheme: 'mobileappebook',
      androidPackage: 'id.wahidiyah.book',
      path: 'auth/success',
      params: { code: 'x' },
    });
    const html = buildMobileHandoffHtml({ status: 'success', intentUrl, deepLinkUrl });
    const inline = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    assert.equal(inline, MOBILE_HANDOFF_SCRIPT, 'skrip inline harus identik dengan konstanta');
    const expected = crypto
      .createHash('sha256')
      .update(MOBILE_HANDOFF_SCRIPT, 'utf8')
      .digest('base64');
    assert.ok(MOBILE_HANDOFF_HEADERS['Content-Security-Policy'].includes(`sha256-${expected}`));
    assert.match(MOBILE_HANDOFF_HEADERS['Cache-Control'], /no-store/);
    assert.equal(MOBILE_HANDOFF_HEADERS['Referrer-Policy'], 'no-referrer');
    assert.match(MOBILE_HANDOFF_HEADERS['Content-Security-Policy'], /script-src 'sha256-/);
    /* Helmet memasang report-only `script-src 'self'` secara global. Tanpa
     * override, skrip inline yang sah tetap menimbulkan warning CSP palsu. */
    assert.equal(
      MOBILE_HANDOFF_HEADERS['Content-Security-Policy-Report-Only'],
      MOBILE_HANDOFF_HEADERS['Content-Security-Policy'],
      'policy report-only harus identik dengan policy enforced',
    );
  });

  await t.test('mobile-start selalu menampilkan pemilih akun & menandai state', () => {
    const startSrc = controllerSrc.slice(
      controllerSrc.indexOf('export async function googleMobileStart'),
      controllerSrc.indexOf('const parseCookies'),
    );
    const urlLine = startSrc.split('\n').find((line) => line.includes('const url =')) || '';
    assert.ok(urlLine, 'baris URL OAuth ditemukan');
    assert.ok(
      urlLine.includes('prompt=select_account'),
      'setelah logout Google tidak boleh memaksa akun terakhir ("Anda login kembali ke …")',
    );
    assert.ok(startSrc.includes('MOBILE_STATE_PREFIX + state'), 'state ditandai sebagai mobile');
  });

  await t.test('callback mobile memakai halaman handoff, bukan 302 ke skema custom', () => {
    const callbackSrc = controllerSrc.slice(
      controllerSrc.indexOf('export async function googleCallback'),
      controllerSrc.indexOf('/* Menukar kode sekali-pakai'),
    );
    assert.ok(callbackSrc.includes("status: 'success'"), 'jalur sukses memakai handoff');
    assert.ok(callbackSrc.includes("status: 'failure'"), 'jalur gagal memakai handoff');
    assert.ok(
      callbackSrc.includes('MOBILE_STATE_PREFIX'),
      'platform terbaca sebelum state ditebus',
    );
    assert.ok(callbackSrc.includes('stateToRedeem'), 'kode state dibersihkan sebelum ditebus');
    assert.ok(
      !callbackSrc.includes('res.redirect(`${scheme}://auth/success'),
      '302 ke skema custom tidak boleh kembali',
    );
    assert.ok(
      !callbackSrc.includes('res.redirect(\n        `${scheme}://auth/failure'),
      '302 kegagalan ke skema custom tidak boleh kembali',
    );
    assert.ok(callbackSrc.includes('replyMobileHandoff(res,'), 'controller memanggil helper');
    assert.equal(MOBILE_STATE_PREFIX, 'mob.');
  });

  await t.test('Jalur web tetap redirect ke /auth/success', () => {
    assert.ok(controllerSrc.includes("new URL('/auth/success', frontendOrigin)"));
    assert.ok(controllerSrc.includes("new URL('/login', frontendOrigin)"));
  });
});
