/* Naskah buku disimpan di Supabase Storage, bukan sebagai data URL di baris
 * database. Vercel menolak body function di atas 4,5 MB, sehingga berkas
 * dikirim peramban langsung ke penyimpanan lewat tanda unggah sekali-pakai
 * dan hanya URL-nya yang dicatat di kolom content_url.
 */

import { supabaseServer } from '../db.js';

export const CONTENT_BUCKET = 'buku';
export const CONTENT_PATH_PREFIX = 'naskah';
export const CONTENT_MAX_BYTES = 50 * 1024 * 1024;

const REF_PREFIX = `storage://${CONTENT_BUCKET}/`;
const READ_URL_TTL_SECONDS = 300;
const HEAD_PROBE_BYTES = 8192;

const bucket = () => supabaseServer.storage.from(CONTENT_BUCKET);

export const contentRef = (path) => `${REF_PREFIX}${path}`;

const isContentRef = (value) => typeof value === 'string' && value.startsWith(REF_PREFIX);

const pathOfRef = (value) => value.slice(REF_PREFIX.length);

export const createUploadTicket = async (path) => {
  const { data, error } = await bucket().createSignedUploadUrl(path, { upsert: true });
  if (error) throw error;
  return data;
};

export const objectInfo = async (path) => {
  const { data, error } = await bucket().info(path);
  if (error) return null;
  return data;
};

/* Pemeriksaan magic byte cukup pada beberapa kilobyte pertama, jadi isi
 * berkas tidak pernah ditelan ke dalam memori function.
 */
export const headBytes = async (path) => {
  const { data, error } = await bucket().createSignedUrl(path, READ_URL_TTL_SECONDS);
  if (error) return null;
  const response = await fetch(data.signedUrl, {
    headers: { range: `bytes=0-${HEAD_PROBE_BYTES - 1}` },
  });
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
};

/** URL baca sementara untuk referensi penyimpanan, atau nilai aslinya. */
export const resolveReadUrl = async (value) => {
  if (!isContentRef(value)) return value;
  const { data, error } = await bucket().createSignedUrl(pathOfRef(value), READ_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
};

/** Isi mentah untuk konversi Word/TXT, dari data URL, penyimpanan, atau URL luar. */
export const readContentBuffer = async (value) => {
  if (isContentRef(value)) {
    const { data, error } = await bucket().download(pathOfRef(value));
    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  }
  const match = /^data:[^;]+;base64,(.+)$/.exec(String(value));
  if (match) return Buffer.from(match[1], 'base64');
  const response = await fetch(value);
  if (!response.ok) throw new Error('Gagal mengambil isi berkas');
  return Buffer.from(await response.arrayBuffer());
};

export const removeContent = async (value) => {
  if (!isContentRef(value)) return;
  await bucket().remove([pathOfRef(value)]);
};
