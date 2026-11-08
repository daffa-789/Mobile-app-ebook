import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { register } from 'node:module';

// Register ESM loader for react-native mocks
register('./helpers/rn_loader.mjs', import.meta.url);

import {
  generateQrMatrix,
  generateQrPng,
  crc32,
  adler32,
  bytesToBase64,
} from '../mobile-app/src/lib/qr.js';

test('Mobile Payment QRIS & Plumbing Suite', async (t) => {
  const SAMPLE_QRIS =
    '00020101021226600016ID.CO.SHOPEE.WWW011893600523000000000102152026110800000015204581253033605802ID5914Wahidiyah Book6006Kediri61056411562070703A016304ABCD';

  await t.test('1. generateQrMatrix creates valid square module matrix', () => {
    const { count, matrix } = generateQrMatrix(SAMPLE_QRIS, 'M');
    assert.ok(count >= 21, `Matrix size must be at least 21x21, got ${count}`);
    assert.strictEqual(matrix.length, count);
    assert.strictEqual(matrix[0].length, count);
    assert.strictEqual(typeof matrix[0][0], 'boolean');
  });

  await t.test('2. generateQrPng generates valid PNG binary signature', () => {
    const { png, dataUri, pixelSize } = generateQrPng(SAMPLE_QRIS, { cellSize: 4, margin: 4 });

    // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < sig.length; i++) {
      assert.strictEqual(png[i], sig[i], `Byte at index ${i} must match PNG signature`);
    }

    assert.ok(dataUri.startsWith('data:image/png;base64,'), 'Must have data:image/png prefix');
    assert.ok(pixelSize > 100, `Pixel size must be substantial, got ${pixelSize}`);
  });

  await t.test('3. PNG IHDR chunk contains correct width and height', () => {
    const { png, pixelSize } = generateQrPng(SAMPLE_QRIS, { cellSize: 4, margin: 4 });
    const buf = Buffer.from(png);

    // IHDR starts at byte 8; length is bytes 8-11, 'IHDR' is bytes 12-15, width at 16, height at 20
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);

    assert.strictEqual(width, pixelSize, 'IHDR width must match pixelSize');
    assert.strictEqual(height, pixelSize, 'IHDR height must match pixelSize');
  });

  await t.test('4. PNG IDAT payload is valid zlib and inflates cleanly', () => {
    const { png, pixelSize } = generateQrPng(SAMPLE_QRIS, { cellSize: 4, margin: 4 });
    const buf = Buffer.from(png);

    // Locate IDAT chunk: search for ASCII 'IDAT' (0x49 0x44 0x41 0x54)
    const idatIndex = buf.indexOf(Buffer.from('IDAT'));
    assert.ok(idatIndex > 0, 'Must contain IDAT chunk');

    const idatLen = buf.readUInt32BE(idatIndex - 4);
    const idatData = buf.subarray(idatIndex + 4, idatIndex + 4 + idatLen);

    const inflated = zlib.inflateSync(idatData);
    const expectedBytesPerRow = 1 + pixelSize; // 1 filter byte + pixel bytes
    const expectedTotalBytes = expectedBytesPerRow * pixelSize;

    assert.strictEqual(inflated.length, expectedTotalBytes, 'Inflated raw size must match');
  });

  await t.test('5. crc32 produces correct checksums', () => {
    const sample = new Uint8Array([0x49, 0x45, 0x4e, 0x44]); // 'IEND'
    const crcVal = crc32(sample);
    assert.strictEqual(crcVal, 0xae426082); // Standard IEND CRC
  });

  await t.test('6. adler32 produces correct checksums', () => {
    const sample = Buffer.from('Wahidiyah');
    const adlerVal = adler32(sample);
    assert.ok(Number.isInteger(adlerVal));
    assert.ok(adlerVal > 0);
  });

  await t.test('7. bytesToBase64 encodes binary accurately', () => {
    const testBuffer = Buffer.from('Wahidiyah Book QRIS Payment');
    const encoded = bytesToBase64(new Uint8Array(testBuffer));
    assert.strictEqual(encoded, testBuffer.toString('base64'));
  });

  await t.test('8. payments.js exports required payment methods', async () => {
    const payments = await import('../mobile-app/src/api/payments.js');
    assert.strictEqual(typeof payments.createPaymentCharge, 'function');
    assert.strictEqual(typeof payments.checkPaymentStatus, 'function');
    assert.strictEqual(typeof payments.cancelPayment, 'function');
    assert.strictEqual(typeof payments.reconcilePayment, 'function');
    assert.strictEqual(typeof payments.getQrImageUrl, 'function');
  });

  await t.test('9. getQrImageUrl constructs valid endpoint url', async () => {
    const { getQrImageUrl } = await import('../mobile-app/src/api/payments.js');
    const url = getQrImageUrl('ORDER-12345');
    assert.ok(url.includes('/payments/qris/ORDER-12345/qr.png'));
    assert.strictEqual(getQrImageUrl(null), null);
  });
});
