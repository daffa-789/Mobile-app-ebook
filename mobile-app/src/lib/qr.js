import qrcode from 'qrcode-generator';

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Konversi Uint8Array / Buffer / array byte ke base64 string tanpa modul native.
 */
export function bytesToBase64(bytes) {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += B64_CHARS[(triplet >> 18) & 63];
    result += B64_CHARS[(triplet >> 12) & 63];
    result += i + 1 < len ? B64_CHARS[(triplet >> 6) & 63] : '=';
    result += i + 2 < len ? B64_CHARS[triplet & 63] : '=';
  }
  return result;
}

/**
 * Hitung CRC32 standar untuk blok PNG.
 */
export function crc32(bytes) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Hitung Adler32 checksum untuk zlib container.
 */
export function adler32(bytes) {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

/**
 * Buat chunk PNG: [4-byte length][4-byte type][data][4-byte crc].
 */
function createChunk(typeStr, dataBytes) {
  const len = dataBytes.length;
  const chunk = new Uint8Array(4 + 4 + len + 4);

  // Length (big-endian)
  chunk[0] = (len >>> 24) & 0xff;
  chunk[1] = (len >>> 16) & 0xff;
  chunk[2] = (len >>> 8) & 0xff;
  chunk[3] = len & 0xff;

  // Type
  chunk[4] = typeStr.charCodeAt(0);
  chunk[5] = typeStr.charCodeAt(1);
  chunk[6] = typeStr.charCodeAt(2);
  chunk[7] = typeStr.charCodeAt(3);

  // Data
  chunk.set(dataBytes, 8);

  // CRC32 over type + data
  const typeAndData = chunk.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  const crcOffset = 8 + len;
  chunk[crcOffset] = (crcVal >>> 24) & 0xff;
  chunk[crcOffset + 1] = (crcVal >>> 16) & 0xff;
  chunk[crcOffset + 2] = (crcVal >>> 8) & 0xff;
  chunk[crcOffset + 3] = crcVal & 0xff;

  return chunk;
}

/**
 * Hasilkan modul matriks QR dari teks payload EMVCo.
 */
export function generateQrMatrix(text, errorCorrectionLevel = 'M') {
  const qr = qrcode(0, errorCorrectionLevel);
  qr.addData(String(text || ''));
  qr.make();
  const count = qr.getModuleCount();
  const matrix = [];
  for (let r = 0; r < count; r++) {
    const row = [];
    for (let c = 0; c < count; c++) {
      row.push(qr.isDark(r, c));
    }
    matrix.push(row);
  }
  return { count, matrix };
}

/**
 * Hasilkan gambar PNG valid 100% murni JavaScript dari payload teks QRIS.
 */
export function generateQrPng(text, { cellSize = 4, margin = 4, errorCorrectionLevel = 'M' } = {}) {
  const { count, matrix } = generateQrMatrix(text, errorCorrectionLevel);
  const totalCells = count + margin * 2;
  const pixelSize = totalCells * cellSize;

  // Raw bitmap scanlines: 1 filter byte (0) per baris + pixel data (grayscale 8-bit)
  const rawBytes = new Uint8Array(pixelSize * (pixelSize + 1));
  let ptr = 0;

  for (let y = 0; y < pixelSize; y++) {
    rawBytes[ptr++] = 0; // Filter 0 (None)
    const cellY = Math.floor(y / cellSize) - margin;

    for (let x = 0; x < pixelSize; x++) {
      const cellX = Math.floor(x / cellSize) - margin;
      let isDark = false;
      if (cellY >= 0 && cellY < count && cellX >= 0 && cellX < count) {
        isDark = matrix[cellY][cellX];
      }
      rawBytes[ptr++] = isDark ? 0 : 255;
    }
  }

  // Bungkus dalam DEFLATE non-compressed blocks (BTYPE = 00)
  const maxBlock = 65535;
  const numBlocks = Math.ceil(rawBytes.length / maxBlock);
  // Header zlib (2) + blocks (5 + chunk) + Adler32 (4)
  const idatPayloadSize = 2 + numBlocks * 5 + rawBytes.length + 4;
  const idatPayload = new Uint8Array(idatPayloadSize);

  idatPayload[0] = 0x78; // CMF: Deflate, 32K window
  idatPayload[1] = 0x01; // FLG: FCHECK bits

  let idatPtr = 2;
  for (let i = 0; i < rawBytes.length; i += maxBlock) {
    const chunk = rawBytes.subarray(i, Math.min(i + maxBlock, rawBytes.length));
    const isLast = i + maxBlock >= rawBytes.length;

    idatPayload[idatPtr++] = isLast ? 0x01 : 0x00;
    const len = chunk.length;
    const nlen = ~len & 0xffff;

    idatPayload[idatPtr++] = len & 0xff;
    idatPayload[idatPtr++] = (len >>> 8) & 0xff;
    idatPayload[idatPtr++] = nlen & 0xff;
    idatPayload[idatPtr++] = (nlen >>> 8) & 0xff;

    idatPayload.set(chunk, idatPtr);
    idatPtr += chunk.length;
  }

  const adlerVal = adler32(rawBytes);
  idatPayload[idatPtr++] = (adlerVal >>> 24) & 0xff;
  idatPayload[idatPtr++] = (adlerVal >>> 16) & 0xff;
  idatPayload[idatPtr++] = (adlerVal >>> 8) & 0xff;
  idatPayload[idatPtr++] = adlerVal & 0xff;

  // IHDR chunk: width (4), height (4), bitDepth (1), colorType (1: 0=grayscale), comp (0), filter (0), interlace (0)
  const ihdrBytes = new Uint8Array(13);
  ihdrBytes[0] = (pixelSize >>> 24) & 0xff;
  ihdrBytes[1] = (pixelSize >>> 16) & 0xff;
  ihdrBytes[2] = (pixelSize >>> 8) & 0xff;
  ihdrBytes[3] = pixelSize & 0xff;

  ihdrBytes[4] = (pixelSize >>> 24) & 0xff;
  ihdrBytes[5] = (pixelSize >>> 16) & 0xff;
  ihdrBytes[6] = (pixelSize >>> 8) & 0xff;
  ihdrBytes[7] = pixelSize & 0xff;

  ihdrBytes[8] = 8; // 8 bit per sample
  ihdrBytes[9] = 0; // Color type 0 (Grayscale)
  ihdrBytes[10] = 0; // Compression
  ihdrBytes[11] = 0; // Filter
  ihdrBytes[12] = 0; // Interlace

  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = createChunk('IHDR', ihdrBytes);
  const idatChunk = createChunk('IDAT', idatPayload);
  const iendChunk = createChunk('IEND', new Uint8Array(0));

  const totalLength = sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const png = new Uint8Array(totalLength);

  let offset = 0;
  png.set(sig, offset);
  offset += sig.length;
  png.set(ihdrChunk, offset);
  offset += ihdrChunk.length;
  png.set(idatChunk, offset);
  offset += idatChunk.length;
  png.set(iendChunk, offset);

  const base64 = bytesToBase64(png);
  const dataUri = `data:image/png;base64,${base64}`;

  return {
    png,
    dataUri,
    pixelSize,
    count,
  };
}
