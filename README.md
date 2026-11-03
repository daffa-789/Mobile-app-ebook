# Wahidiyah Book

Perpustakaan digital Wahidiyah dengan katalog dan pembaca PDF/DOCX, keanggotaan Pro, pembayaran QRIS Midtrans, panel admin, serta pengingat agenda.

## Mulai menjalankan

Prasyarat: Node.js 24.x, konfigurasi Supabase, dan file .env yang diisi sesuai daftar variabel di [Master Memory Workflow](./Master_Memory_Workflow.md#12-prasyarat--konfigurasi-lingkungan-env).

1. Pasang dependensi: **npm install**
2. Siapkan Supabase. **supabase_database/full_setup.sql** hanya untuk database baru atau reset yang disetujui; skrip ini menghapus tabel dan data yang ada.
3. Jalankan aplikasi lokal: **npm run dev**
4. Buka **http://localhost:3000** (mode produksi lokal: `npm start` di **http://localhost:5000**)

## Perintah utama

- **npm run dev** — jalankan aplikasi terpadu (Express backend + Vite frontend HMR) pada port 3000.
- **npm run build** — build frontend Vite ke direktori `dist/`.
- **npm run format** — rapikan seluruh kode dengan Prettier.
- **npm run format:check** — periksa kepatuhan format tanpa mengubah berkas.
- **npm run health** — periksa konfigurasi layanan (Supabase, Midtrans, WhatsApp, tabel database).
- **npm test** / **npm run check** — jalankan pemeriksaan kualitas format dan kesehatan sistem.
- **npm run check:full** — jalankan pemeriksaan kualitas lengkap beserta verifikasi kompilasi build.
- **npm run clean:ports** — bersihkan proses port 3000/5000 yang tertahan di background.
- **npm start** — jalankan aplikasi dalam mode produksi pada port 5000.

## Dokumentasi

**Master_Memory_Workflow.md** adalah satu-satunya memory teknis utama, mencakup arsitektur, desain, API, database, keamanan, konfigurasi, dan alur pengembangan. File ini hanya menjadi pintu masuk proyek. Panduan khusus admin tetap tersedia di [buku-siap-upload/PANDUAN-UPLOAD-ADMIN.md](./buku-siap-upload/PANDUAN-UPLOAD-ADMIN.md).
