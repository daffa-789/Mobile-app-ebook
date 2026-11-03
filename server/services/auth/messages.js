/**
 * Service Layer — Paket Otentikasi: pesan pengguna & respons seragam.
 *
 * Berkas ini menahan teks yang HARUS identik di beberapa jalur sekaligus,
 * sehingga pemecahan modul otentikasi tidak boleh menggandakannya:
 *  - `RESET_UNIFORM_*` dipakai controller untuk menjawab permintaan reset dari
 *    akun tak dikenal maupun akun Google. Beda isi = celah enumerasi akun.
 *  - `INVALID_CREDENTIALS_MESSAGE` vs `GOOGLE_ACCOUNT_MESSAGE` adalah satu-satunya
 *    pembeda yang boleh tampak saat login gagal.
 */

export const INVALID_CREDENTIALS_MESSAGE =
  'Email atau password belum sesuai. Jika Anda menggunakan akun Google, silakan klik tombol "Login dengan Google" di bawah.';

export const GOOGLE_ACCOUNT_MESSAGE =
  'Akun ini terdaftar lewat Google. Silakan klik tombol "Login dengan Google" di bawah.';

/* Respons seragam anti-enumerasi: permintaan reset untuk akun yang tidak
 * dikenal TIDAK boleh dibedakan dari akun yang benar-benar dikirimi kode. */
export const RESET_UNIFORM_RESPONSE = {
  success: true,
  message: 'Jika akun tersebut terdaftar, kode pemulihan telah dikirim dan berlaku 10 menit.',
};

export const RESET_UNIFORM_WA_RESPONSE = {
  success: true,
  method: 'whatsapp',
  message:
    'Jika nomor tersebut terdaftar, kode pemulihan telah dikirim ke WhatsApp dan berlaku 10 menit.',
};

/** Label masa berlaku OTP — dipakai pesan registrasi dan kirim ulang. */
export const OTP_VALIDITY_LABEL = 'berlaku 10 menit';

/** Pesan galat pertama dari hasil `safeParse` Zod. */
export const firstIssueMessage = (parsed) => parsed.error.issues[0]?.message || 'Input tidak valid';
