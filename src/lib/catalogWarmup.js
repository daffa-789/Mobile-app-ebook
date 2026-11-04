/**
 * Warm-up fetch data katalog pada module scope.
 *
 * Sebelumnya `/api/books` baru ditembakkan di dalam `useEffect` katalog —
 * setelah seluruh bundel terunduh, ter-parse, dieksekusi, dan React ter-mount.
 * Pada jaringan lambat itu menambah ~0,5–1,5 s waktu mati di jalur kritis
 * LCP (elemen LCP = cover buku pertama, datanya berada di respons `/api/books`).
 *
 * Modul ini memicu ketiga API publik begitu bundel dieksekusi — berjalan
 * berbarengan dengan mounting React, bukan setelahnya.
 *
 * Kontrak pemakaian: janji hanya boleh dikonsumsi sekali (lihat
 * `takeWarmCatalogResponse`) oleh panggilan refresh PERTAMA di slice katalog.
 * Panggilan berikutnya (unggahan admin, pembayaran sukses, perubahan sesi)
 * mengambil data segar dengan `cache: 'no-store'` sehingga katalog selalu
 * mutakhir — perubahan yang dikelola admin tidak pernah kehilangan kesegaran.
 *
 * @module src/lib/catalogWarmup
 */

import { apiJson } from '@lib/api';

const warmup = {};

const warmCatalogEndpoint = (path) => {
  try {
    const promise = apiJson(path);
    /* rejection tidak boleh mengambang tanpa konsumen (mis. pengguna keluar
     * aplikasi sebelum slice mount), tetapi konsumen sesungguhnya yang
     * meng-`await` janji yang sama tetap menerima errornya. */
    promise.catch(() => {});
    warmup[path] = promise;
  } catch {
    /* Lingkungan tanpa fetch — abaikan, slice mengambil data jalur normal. */
  }
};

warmCatalogEndpoint('/api/books');
warmCatalogEndpoint('/api/events');
warmCatalogEndpoint('/api/carousel');

/**
 * Ambil janji warm-up untuk path (begitu saja), lalu tandai terkonsumsi.
 *
 * @param {string} path - Jalur API yang dipanggil saat warm-up
 * @returns {Promise<object>|null} Janji payload JSON, atau `null` bila sudah
 *   dikonsumsi / tak pernah dipicu
 */
export const takeWarmCatalogResponse = (path) => {
  const promise = warmup[path] ?? null;
  delete warmup[path];
  return promise;
};
