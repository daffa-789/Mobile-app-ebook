import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

/**
 * Regresi 11 November 2026 — kartu QRIS dibuat minimal atas permintaan pemilik:
 * hanya tombol "Salin Tautan" + popup "berhasil di salin" + tombol X pembatalan.
 * Semua petunjuk simulator, alamat simulator, unduh QR, "Saya Sudah Bayar",
 * dan "Batalkan / Buat Kode Baru" dihapus.
 *
 * Catatan penting: `Clipboard` dan `ToastAndroid` adalah modul bawaan React
 * Native yang SUDAH ada di APK 0.1.5, jadi penyalinan sungguhan tetap bisa
 * dikirim lewat OTA tanpa `expo-clipboard` / build APK baru.
 */

test('kartu QRIS minimal: hanya Salin Tautan dan tombol X', () => {
  const src = read('mobile-app/src/screens/ProScreen.js');

  assert.match(src, /Salin Tautan/, 'satu-satunya tombol aksi adalah Salin Tautan');
  assert.match(src, /onPress=\{handleCopyQrLink\}/, 'tombol terhubung ke handler salin');
  assert.match(src, /copyTextWithToast\(simulatorQrLink\)/, 'memakai helper clipboard bersama');
  assert.match(src, /accessibilityLabel="Salin tautan"/, 'tombol diberi label aksesibilitas');
  assert.match(src, /onPress=\{handleCancelOrder\}/, 'tombol X membatalkan tagihan');
  assert.match(src, /accessibilityLabel="Batalkan tagihan"/, 'X diberi label aksesibilitas');
  assert.match(src, /<Feather name="x"/, 'ikon X benar-benar dirender');
  assert.match(src, /handleCancelOrder = async/, 'pembatalan tetap membersihkan order di server');
  assert.match(src, /cancelPayment\(activeOrder\.orderId\)/, 'tagihan dibatalkan juga di server');
  assert.ok(!src.includes('Batalkan Tagihan'), 'X langsung membatalkan tanpa dialog konfirmasi');

  const dihapus = [
    'Simulator QRIS Midtrans',
    'Tempel tautan ini',
    'Tahan lama tautan',
    'simulator.sandbox.midtrans.com',
    'Pilih folder penyimpanan',
    'Saya Sudah Bayar',
    'Batalkan / Buat Kode Baru',
    'Bagikan / Salin Tautan',
    'Unduh QR (Simpan ke Galeri)',
    'QR Code Image Url',
    'Text selectable',
  ];
  for (const teks of dihapus) {
    assert.ok(!src.includes(teks), `teks "${teks}" tidak boleh muncul lagi`);
  }
  assert.ok(!src.includes('styles.simulatorBox'), 'kotak simulator lama dihapus');
  assert.ok(!src.includes('styles.downloadQrBtn'), 'tombol unduh QR dihapus');
  assert.ok(!src.includes('styles.checkStatusBtn'), 'tombol cek status manual dihapus');
  assert.ok(!src.includes('styles.cancelBtn'), 'tombol batalkan lama dihapus');
});

test('popup "berhasil di salin" memakai clipboard bawaan, bukan modul native baru', () => {
  const lib = read('mobile-app/src/lib/clipboard.js');
  const src = read('mobile-app/src/screens/ProScreen.js');

  assert.match(lib, /COPIED_MESSAGE = 'berhasil di salin'/, 'teks popup persis sesuai permintaan');
  assert.match(lib, /Clipboard\.setString\(value\)/, 'benar-benar menyalin ke papan klip');
  assert.match(lib, /ToastAndroid\.show\(COPIED_MESSAGE/, 'popup kecil native Android');
  assert.match(lib, /Alert\.alert\(COPIED_MESSAGE\)/, 'fallback popup di platform lain');
  assert.match(lib, /navigator\.clipboard\?\.writeText/, 'fallback aman untuk build web');
  assert.doesNotMatch(
    lib,
    /(?:from|require\()\s*['"]expo-clipboard['"]/,
    'tidak mengimpor modul native yang tidak ada di APK (komentar boleh menyebutnya)',
  );

  for (const modul of ['Share', 'Linking', 'Platform', 'bytesToBase64', 'reconcilePayment']) {
    assert.ok(!src.includes(modul), `${modul} sudah jadi kode mati dan harus hilang`);
  }
  assert.ok(!src.includes('expo-file-system'), 'unduh QR dihapus, modul SAF tidak dipakai lagi');
  assert.ok(!src.includes('isDownloadingQr'), 'state unduh QR dihapus');
  assert.ok(!src.includes('isChecking'), 'state cek status manual dihapus');
  assert.ok(!src.includes('paidSuccess'), 'state yang tidak pernah dibaca dihapus');
});

test('tautan simulator tetap URL gambar PNG, bukan payload EMVCo', () => {
  const src = read('mobile-app/src/screens/ProScreen.js');
  const linkBlock = src.slice(
    src.indexOf('const simulatorQrLink'),
    src.indexOf('const handleCopyQrLink'),
  );

  assert.match(
    linkBlock,
    /activeOrder\?\.qrMidtransUrl/,
    'utamakan URL PNG langsung dari Midtrans',
  );
  assert.match(
    linkBlock,
    /getQrImageUrl\(activeOrder\.orderId\)/,
    'proxy absolute URL sebagai cadangan',
  );
  assert.doesNotMatch(
    linkBlock,
    /qrString/,
    'payload EMVCo tidak boleh disajikan sebagai "QR Code Image Url"',
  );
});

test('server hanya mengirim URL internal Midtrans di mode sandbox', () => {
  const src = read('server/services/payment/order_service.js');

  const guards = src.match(/MIDTRANS_IS_PRODUCTION \? \{\} : \{ qrMidtransUrl/g) || [];
  assert.equal(guards.length, 2, 'jalur created dan reused wajib sama-sama dijaga flag produksi');
  assert.match(src, /midtrans_qr_url: qrUrl \|\| null/, 'URL tersimpan harus berasal dari qrUrl');
});

test('server menyusun URL gambar QR bila Midtrans hanya mengirim qr_string', () => {
  const src = read('server/services/payment/order_service.js');

  assert.match(
    src,
    /api\.sandbox\.midtrans\.com\/v2\/qris\//,
    'fallback harus memakai endpoint generate-qr-code yang terdokumentasi',
  );
  assert.match(
    src,
    /encodeURIComponent\(transactionId\)/,
    'transaction_id harus diamankan sebelum disisipkan ke URL',
  );
  assert.match(
    src,
    /const qrUrl = qrAction\?\.url \|\| sandboxQrFallback/,
    'actions[] tetap diprioritaskan',
  );
  assert.match(
    src,
    /!MIDTRANS_IS_PRODUCTION && qrString && transactionId/,
    'fallback hanya untuk sandbox dan hanya bila QR valid',
  );
});

test('modul native terlarang clipboard/media-library/sharing tetap tidak dipakai', () => {
  const pkg = JSON.parse(read('package.json'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const modul of ['expo-media-library', 'expo-sharing', 'expo-clipboard']) {
    assert.ok(!deps[modul], `${modul} tidak boleh ditambahkan tanpa build APK baru`);
  }
  assert.ok(deps['react-native'], 'clipboard bawaan berasal dari react-native');
});

test('PNG QR di layar valid dan base64-nya sama dengan byte aslinya', async () => {
  const { generateQrPng, bytesToBase64 } = await import('../mobile-app/src/lib/qr.js');
  const contoh =
    '00020101021226600016ID.CO.SHOPEE.WWW011893600523000000000102152026110800000015204581253033605802ID5914Wahidiyah Book6006Kediri61056411562070703A016304ABCD';
  const { dataUri, png } = generateQrPng(contoh, { cellSize: 8, margin: 4 });
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);

  assert.equal(base64, bytesToBase64(png), 'ekstraksi base64 dari dataUri harus benar');
  assert.equal(
    Buffer.from(base64, 'base64').subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    'gambar QR yang ditampilkan berupa PNG',
  );
  assert.ok(png.length > 1000, 'PNG berisi gambar, bukan berkas kosong');
});
