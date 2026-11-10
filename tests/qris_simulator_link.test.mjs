import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

/**
 * Regresi 10 November 2026 — "qrisnya dikasih link untuk dipaste di simulator".
 *
 * Kolom simulator Midtrans (https://simulator.sandbox.midtrans.com/v2/qris/index)
 * bernama "QR Code Image Url": isinya WAJIB URL gambar PNG dari respons charge,
 * bukan payload EMVCo `qr_string`. Sebelumnya ProScreen.js sudah menghitung
 * `simulatorQrLink` dan `handleShareQrLink`, tetapi tidak pernah merendernya —
 * pengguna hanya melihat gambar QR tanpa tautan yang bisa disalin.
 *
 * Tes ini mengunci tiga hal: tautan tampil di dalam kartu QRIS aktif, bisa
 * dipilih/dibagikan tanpa modul native baru (aman dikirim lewat OTA), dan
 * server hanya membocorkan URL internal Midtrans pada mode sandbox.
 */

test('kartu QRIS mobile merender tautan simulator yang bisa disalin', () => {
  const src = read('mobile-app/src/screens/ProScreen.js');

  assert.match(
    src,
    /styles\.simulatorBox/,
    'kotak simulator harus dirender, bukan cuma didefinisikan',
  );
  assert.match(
    src,
    /<Text selectable style=\{styles\.simulatorLink\}>/,
    'tautan wajib selectable (tahan lama → salin)',
  );
  assert.match(src, /\{simulatorQrLink\}/, 'teks yang ditampilkan harus tautan, bukan qrString');
  assert.match(src, /onPress=\{handleShareQrLink\}/, 'tombol Bagikan harus terhubung ke handler');
  assert.match(src, /Bagikan \/ Salin Tautan/, 'label tombol harus jelas');
  assert.match(
    src,
    /simulator\.sandbox\.midtrans\.com\/v2\/qris\/index/,
    'alamat simulator harus ditampilkan',
  );
  assert.match(src, /QR Code Image Url/, 'petunjuk harus menyebut nama kolom simulator yang benar');

  const boxAt = src.indexOf('styles.simulatorBox');
  const sectionAt = src.indexOf('{activeOrder ? (');
  const checkAt = src.indexOf('styles.checkStatusBtn');
  assert.ok(
    sectionAt >= 0 && boxAt > sectionAt,
    'kotak tautan harus berada di dalam kartu QRIS aktif',
  );
  assert.ok(checkAt > boxAt, 'kotak tautan harus tampil sebelum tombol cek status');
});

test('tautan simulator memakai URL gambar, bukan payload EMVCo, dan aman untuk OTA', () => {
  const src = read('mobile-app/src/screens/ProScreen.js');
  const linkBlock = src.slice(
    src.indexOf('const simulatorQrLink'),
    src.indexOf('const handleShareQrLink'),
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
  assert.match(src, /Share,/, 'Share dari core React Native dipakai untuk menyalin/membagikan');
  assert.doesNotMatch(
    src,
    /(?:from|require\()\s*['"]expo-clipboard['"]/,
    'modul native baru tidak boleh diimpor (tidak bisa lewat OTA)',
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
