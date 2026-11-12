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
import { createCatalogWarmup } from '@shared/catalogWarmup.js';

export const { takeWarmCatalogResponse } = createCatalogWarmup(apiJson, ['/api/books', '/api/events']);
