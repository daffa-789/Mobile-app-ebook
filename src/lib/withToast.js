import { toast } from 'sonner';

/**
 * Jalankan aksi asinkron dan laporkan kegagalannya lewat toast — sekali panggil.
 *
 * Sebelumnya pola ini ditulis tangan 17 kali di seluruh aplikasi:
 *
 *   try {
 *     await simpanData();
 *     toast.success('Tersimpan.');
 *   } catch (err) {
 *     toast.error(err.message || 'Gagal menyimpan.');
 *   }
 *
 * Menjadi:
 *
 *   await withToast(() => simpanData(), 'Gagal menyimpan.', 'Tersimpan.');
 *
 * `fallbackMessage` dipakai HANYA bila `error.message` kosong, persis seperti
 * perilaku `err.message || '...'` yang digantikannya — jadi pesan galat asli
 * dari server tetap tampil utuh.
 *
 * `successMessage` boleh berupa fungsi `(value) => string` bila teksnya perlu
 * memuat hasil aksi (mis. jumlah baris & nama berkas ekspor).
 *
 * Mengembalikan `{ ok, value, error }` alih-alih melempar ulang: pemanggil
 * yang butuh tahu hasilnya bisa memeriksa `ok`, sementara pemanggil yang hanya
 * ingin toast bisa mengabaikannya. Ini menghindari `try/catch` kedua di luar.
 */
const resolveSuccess = (successMessage, value) =>
  typeof successMessage === 'function' ? successMessage(value) : successMessage;

/* Dua penutup di bawah ini dulunya tersalin tiga kali di dalam modul ini
   sendiri — sekali di `withToast`, dua kali di `withToastSync`. Bentuk hasilnya
   wajib identik karena pemanggil memeriksa `ok`. */

/** Tampilkan toast sukses (bila teksnya ada) dan kembalikan bentuk hasil. */
const succeed = (value, successMessage) => {
  const text = resolveSuccess(successMessage, value);
  if (text) toast.success(text);
  return { ok: true, value, error: null };
};

/** Tampilkan toast galat dan kembalikan bentuk hasil yang sama. */
const rejectWith = (error, fallbackMessage) => {
  toast.error(error?.message || fallbackMessage);
  return { ok: false, value: undefined, error };
};

export const withToast = async (action, fallbackMessage, successMessage) => {
  try {
    return succeed(await action(), successMessage);
  } catch (error) {
    return rejectWith(error, fallbackMessage);
  }
};

/**
 * Varian sinkron untuk aksi yang langsung menghasilkan nilai tanpa promise
 * (mis. ekspor Excel yang menghitung lalu memicu unduhan di memori).
 *
 * Menerima pula fungsi yang mengembalikan promise, sehingga pemanggil bisa
 * memakai `() => import('...').then(...)` untuk memuat modul secara malas
 * tanpa perlu menandai handler sebagai `async`.
 */
export const withToastSync = (action, fallbackMessage, successMessage) => {
  try {
    const value = action();
    if (value && typeof value.then === 'function') {
      return value.then(
        (resolved) => succeed(resolved, successMessage),
        (error) => rejectWith(error, fallbackMessage),
      );
    }
    return succeed(value, successMessage);
  } catch (error) {
    return rejectWith(error, fallbackMessage);
  }
};
