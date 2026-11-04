/* Deteksi jenis berkas dari isinya, bukan dari yang diklaim klien (VULN-11).
 *
 * `file-type` membaca signature biner dari buffer, sehingga `mimetype` dan
 * ekstensi berasal dari isi berkas dan tidak bisa dipalsukan lewat header.
 */

import { fileTypeFromBuffer } from 'file-type';

const looksLikeText = (buffer) => {
  const sample = buffer.subarray(0, 8192);
  if (sample.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(sample);
    return true;
  } catch {
    for (const byte of sample) {
      if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) return false;
    }
    return true;
  }
};

const ascii = (buffer, start, end) => buffer.toString('latin1', start, end);

/** Deteksi MIME gambar dari isi berkas lewat library, atau null bila bukan gambar. */
export const sniffImageMime = async (buffer) => {
  if (!buffer?.length) return null;
  try {
    const detected = await fileTypeFromBuffer(buffer);
    const mime = String(detected?.mime || '').toLowerCase();
    if (!mime.startsWith('image/')) return null;
    return detected.mime;
  } catch {
    return null;
  }
};

/** Deteksi tipe konten (mime + ekstensi) dari isi berkas lewat library, atau null. */
export const sniffContentType = async (buffer) => {
  if (!buffer?.length) return null;
  try {
    const detected = await fileTypeFromBuffer(buffer);
    return detected ?? null;
  } catch {
    return null;
  }
};

/** Apakah isi berkas benar-benar cocok dengan ekstensi konten yang diizinkan. */
export const matchesContentExtension = async (buffer, extension) => {
  if (!buffer?.length) return false;
  const ext = String(extension || '')
    .replace(/^\./, '')
    .toLowerCase();
  const sniffed = await sniffContentType(buffer);
  const sniffedExt = sniffed?.ext ?? '';

  switch (ext) {
    case 'pdf':
      return sniffedExt === 'pdf';
    case 'docx':
    case 'odt':
    case 'epub':
      /* Docx/odt/epub berbasis ZIP — file-type melaporkan ekstensi masing-masing. */
      return sniffedExt === 'zip' || sniffedExt === ext;
    case 'doc':
      return sniffedExt === 'cfb';
    case 'rtf':
      return sniffedExt === 'rtf' || ascii(buffer, 0, 5) === '{\\rtf';
    case 'txt':
    case 'md':
    case 'csv':
      return looksLikeText(buffer);
    default:
      return false;
  }
};

/** Deteksi MIME gambar dari data URL, tanpa mempercayai label di dalam URL-nya. */
export const sniffDataUrlImage = async (dataUrl) => {
  const match = /^data:[^;]+;base64,(.+)$/.exec(String(dataUrl || ''));
  if (!match) return null;
  try {
    const buffer = Buffer.from(match[1], 'base64');
    return await sniffImageMime(buffer);
  } catch {
    return null;
  }
};
