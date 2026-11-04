// Offline manifest SQLite + berkas naskah di folder privat (§9).
// Prinsip: TULIS KE BERKAS dulu lalu buka dari URI — jangan Base64/memori (anti-crash Hermes).
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { API_BASE_URL } from '../config';

const DB_NAME = 'reader.db';
let dbPromise = null;

async function db() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (instance) => {
      await instance.execAsync(`
        CREATE TABLE IF NOT EXISTS unduhan (
          user_id TEXT NOT NULL,
          book_id TEXT NOT NULL,
          title TEXT,
          file_uri TEXT,
          bytes INTEGER,
          pages INTEGER,
          content_extension TEXT,
          book_updated_at TEXT,
          last_read_page INTEGER,
          downloaded_at TEXT,
          terakhir_terverifikasi TEXT,
          PRIMARY KEY (user_id, book_id)
        );
      `);
      return instance;
    });
  }
  return dbPromise;
}

export const NASKAH_DIR = () => `${FileSystem.documentDirectory}naskah/`;

export async function ensureNaskahDir() {
  const dir = NASKAH_DIR();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

export async function listDownloads(userId) {
  const instance = await db();
  return instance.getAllAsync(
    'SELECT * FROM unduhan WHERE user_id = ? ORDER BY downloaded_at DESC',
    userId,
  );
}

export async function getDownload(userId, bookId) {
  const instance = await db();
  return instance.getFirstAsync(
    'SELECT * FROM unduhan WHERE user_id = ? AND book_id = ?',
    userId,
    bookId,
  );
}

export async function upsertDownload(row) {
  const instance = await db();
  await instance.runAsync(
    `INSERT INTO unduhan (user_id, book_id, title, file_uri, bytes, pages, content_extension,
       book_updated_at, last_read_page, downloaded_at, terakhir_terverifikasi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, book_id) DO UPDATE SET
       title=excluded.title, file_uri=excluded.file_uri, bytes=excluded.bytes,
       pages=excluded.pages, content_extension=excluded.content_extension,
       book_updated_at=excluded.book_updated_at, last_read_page=excluded.last_read_page,
       downloaded_at=excluded.downloaded_at, terakhir_terverifikasi=excluded.terakhir_terverifikasi`,
    row.user_id, row.book_id, row.title || null, row.file_uri || null, row.bytes || null,
    row.pages || null, row.content_extension || '', row.book_updated_at || null,
    row.last_read_page || 1, row.downloaded_at || null, row.terakhir_terverifikasi || null,
  );
}

export async function setLastReadPage(userId, bookId, page) {
  const instance = await db();
  await instance.runAsync(
    'UPDATE unduhan SET last_read_page = ? WHERE user_id = ? AND book_id = ?',
    page, userId, bookId,
  );
}

export async function removeDownload(userId, bookId) {
  const instance = await db();
  const row = await getDownload(userId, bookId);
  if (row?.file_uri) {
    try {
      const info = await FileSystem.getInfoAsync(row.file_uri);
      if (info.exists) await FileSystem.deleteAsync(row.file_uri, { idempotent: true });
    } catch { /* berkas sudah hilang — hapus barisnya saja */ }
  }
  await instance.runAsync('DELETE FROM unduhan WHERE user_id = ? AND book_id = ?', userId, bookId);
}

export async function totalBytes(userId) {
  const instance = await db();
  const row = await instance.getFirstAsync(
    'SELECT COALESCE(SUM(bytes), 0) AS total FROM unduhan WHERE user_id = ?',
    userId,
  );
  return Number(row?.total || 0);
}

// Integritas §9.3: cek berkas ada dan ukuran sama dengan bytes.
export async function verifyLocalFile(userId, bookId) {
  const row = await getDownload(userId, bookId);
  if (!row?.file_uri) return { ok: false, row: null };
  const info = await FileSystem.getInfoAsync(row.file_uri);
  if (!info.exists) return { ok: false, row, reason: 'missing' };
  if (row.bytes != null && Number(info.size) !== Number(row.bytes)) {
    return { ok: false, row, reason: 'size-mismatch' };
  }
  return { ok: true, row, info };
}
