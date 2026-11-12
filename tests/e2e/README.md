# Menjalankan E2E dengan Supabase test

Suite E2E memakai layanan Supabase sungguhan, tetapi wajib diarahkan ke project khusus E2E. Suite akan menolak project produksi dan tidak membaca `.env` utama.

## Persiapan satu kali

1. Buat project Supabase terpisah khusus E2E. Jangan salin data produksi atau gunakan project staging yang dipakai bersama QA.
2. Pada project yang masih kosong, jalankan `supabase_database/full_setup.sql` melalui SQL Editor Supabase. Skrip itu menghapus dan membuat ulang tabel, jadi jangan jalankan pada project yang sudah menyimpan data.
3. Buat `.env.e2e` langsung di root repo. Isi URL, project ref, dan secret API key dari project tes tersebut. Key ini melewati RLS, jadi simpan hanya di `.env.e2e` lokal dan jangan pernah commit atau kirim melalui chat. Key lama `service_role` juga diterima.

## Menjalankan suite

Jalankan `npm run test:e2e`. Sebelum setiap tier, suite meng-upsert tiga akun, dua buku, satu agenda, dan satu slide khusus E2E. Perubahan role/Pro pada akun tersebut dikembalikan ke kondisi awal saat tier berikutnya dimulai.

Tes pembayaran, email, WhatsApp, OAuth, push, dan cron dinonaktifkan di proses E2E. QRIS diharapkan menjawab sebagai gateway tidak tersedia; tidak ada transaksi sungguhan yang dibuat.

`.env.e2e` sudah tercakup oleh aturan `.env*` di `.gitignore`; jangan commit kredensial project tes.
