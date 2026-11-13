/**
 * Regresi reader PDF native — rilis 0.1.7 (13 November 2026).
 *
 * Sebelumnya PDF dibuka lewat `expo-web-browser` (Chrome Custom Tab). Penampil
 * sistem punya tombol unduh bawaan yang tidak bisa dihilangkan, dan reader lama
 * menampilkan teks sampel sehingga isi buku terasa tidak sesuai. Sekarang PDF
 * dirender `react-native-pdf` di dalam aplikasi: tanpa judul, tanpa tombol
 * unduh, tanpa A-/A+, halaman digulir vertikal dan bisa dicubit untuk zoom.
 *
 * Modul native baru tidak boleh lewat OTA, jadi versi/versionCode wajib naik
 * (runtimeVersion policy appVersion mengikuti expo.version).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const readerSrc = () => read('mobile-app/src/screens/ReaderScreen.js');

/** Ambil hanya cabang JSX khusus PDF, sebelum cabang pembaca teks. */
function pdfBranch() {
  const src = readerSrc();
  /* Harus baris penuh berindentasi 2 spasi: di dalam efek loadBookContent
   * juga ada `if (isPdf)` dengan indentasi 6 spasi yang bukan cabang render. */
  const start = src.indexOf('\n  if (isPdf) {\n');
  const end = src.indexOf(
    '  return (\n    <SafeAreaView style={styles.container}>\n      {/* Top Bar Reader */}',
  );
  assert.ok(start >= 0, 'cabang PDF harus ada');
  assert.ok(end > start, 'cabang pembaca teks harus tetap ada untuk buku non-PDF');
  return src.slice(start, end);
}

test('PDF dirender komponen native react-native-pdf, bukan penampil sistem', () => {
  const src = readerSrc();
  assert.match(src, /import Pdf from 'react-native-pdf'/);
  assert.match(src, /<Pdf\b/);
  assert.ok(!src.includes('expo-web-browser'), 'expo-web-browser tidak boleh dipakai lagi');
  assert.ok(!src.includes('openBrowserAsync'), 'Chrome Custom Tab tidak boleh dibuka lagi');
  assert.ok(!src.includes('Buka PDF'), 'tidak ada lagi tombol buka PDF');

  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.dependencies['react-native-pdf'], 'react-native-pdf wajib terdaftar');
  assert.ok(pkg.dependencies['react-native-blob-util'], 'react-native-blob-util wajib terdaftar');
});

test('layar PDF tanpa judul, tombol unduh, dan kontrol ukuran huruf', () => {
  const branch = pdfBranch();
  for (const forbidden of [
    'book.title',
    'book.author',
    'handleToggleDownload',
    'downloadBtn',
    'fontControls',
    'increaseFont',
    'decreaseFont',
    'styles.bookTitle',
  ]) {
    assert.ok(!branch.includes(forbidden), `${forbidden} tidak boleh muncul di layar PDF`);
  }
  /* Pembaca teks (DOCX/TXT) tetap punya kontrol huruf — dipakai tes F27. */
  assert.ok(readerSrc().includes('setFontSize'));
});

test('buku digulir vertikal dan bisa dicubit untuk zoom', () => {
  const branch = pdfBranch();
  assert.match(branch, /horizontal=\{false\}/, 'gulir vertikal');
  assert.match(branch, /enablePaging=\{false\}/, 'halaman mengalir, tidak paging satu-satu');
  assert.match(branch, /fitPolicy=\{0\}/, 'lebar halaman mengikuti layar');
  assert.match(branch, /minScale=\{1\}/);
  assert.match(branch, /maxScale=\{5\}/);
  assert.match(branch, /source=\{\{ uri: pdfUrl \}\}/, 'sumber harus PDF asli dari content-url');
});

test('konten PDF tetap diambil dari endpoint terproteksi /content-url', () => {
  const src = readerSrc();
  assert.match(src, /\/api\/books\/\$\{encodeURIComponent\(book\.id\)\}\/content-url/);
  const routes = read('server/routes/books_routes.js');
  const routeStart = routes.indexOf("'/books/:id/content-url'");
  assert.ok(routeStart >= 0, 'endpoint content-url harus tetap ada');
  assert.match(routes.slice(routeStart, routeStart + 260), /requireAuth/);
});

test('modul native baru menaikkan versi & versionCode (tidak boleh lewat OTA lama)', () => {
  const appJson = JSON.parse(read('app.json'));
  assert.equal(appJson.expo.version, '0.1.7');
  assert.equal(appJson.expo.android.versionCode, 9);
  assert.deepEqual(appJson.expo.runtimeVersion, { policy: 'appVersion' });
  assert.equal(appJson.expo.jsEngine, undefined, 'Hermes V1 tidak boleh dimatikan');
  assert.match(read('mobile-app/src/config/constants.js'), /export const APP_VERSION = '0\.1\.7'/);
});
