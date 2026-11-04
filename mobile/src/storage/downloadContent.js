// Unduh dengan header Authorization (§9.2).
// expo-file-system (SDK 53+) API baru berbasis File/Paths — tulis lewat createDownloadTask
// dan teruskan header Bearer. Lalu pindahkan ke folder privat naskah/.
import * as FileSystem from 'expo-file-system';
import { getToken } from './secureStore';
import { ensureNaskahDir, NASKAH_DIR, upsertDownload } from './downloads';

export async function downloadBookToDevice({ userId, book, ext, onProgress }) {
  const token = await getToken();
  const url = `${book.contentUnsigned?.startsWith('http') ? book.contentUnsigned : ''}`;
  const absolute = url || `${book.__apiBase || ''}/books/${encodeURIComponent(book.id)}/content`;
  // Server: Content-Disposition inline (PDF) / attachment, lalu data URL ATAU redirect
  // ke signed URL Supabase TTL 300 detik. Data URL → fetch JSON tidak cocok; di sini
  // endpoint /content mengembalikan biner/redirect, jadi FileSystem menanganinya.
  await ensureNaskahDir();
  const fileName = `${book.id}.${(ext || 'pdf').replace('.', '')}`;
  const localUri = `${NASKAH_DIR()}${fileName}`;

  // API lama (SDK ≤53 di beberapa build): downloadAsync(url, fileUri, options).
  // API baru berbasis File/Paths belum stabil di semua versi; pakai pola yang
  // paling kompatibel dan selalu kirim header Authorization (§9.2).
  let result;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (typeof FileSystem.createDownloadResumable === 'function') {
    const resumable = FileSystem.createDownloadResumable(
      absolute,
      localUri,
      headers,
      (progress) => {
        if (onProgress && progress.totalBytesExpectedToWrite > 0) {
          onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
        }
      },
    );
    result = await resumable.downloadAsync();
  } else {
    result = await FileSystem.downloadAsync(absolute, localUri, headers);
  }
  if (!result || result.status >= 400) {
    const err = new Error('Unduhan gagal.');
    err.status = result?.status;
    throw err;
  }

  const info = await FileSystem.getInfoAsync(localUri);
  const now = new Date().toISOString();
  await upsertDownload({
    user_id: userId,
    book_id: book.id,
    title: book.title,
    file_uri: localUri,
    bytes: info.exists ? info.size : null,
    pages: book.pages,
    content_extension: (ext || '').replace('.', ''),
    book_updated_at: book.updatedAt || book.createdAt || null,
    last_read_page: 1,
    downloaded_at: now,
    terakhir_terverifikasi: now,
  });
  return { localUri, bytes: info.exists ? info.size : null };
}
