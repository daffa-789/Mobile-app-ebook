# MASTER PROMPT: PENGEMBANGAN LANDING PAGE WEB (USER-FACING)

> **Tujuan:** Membangun / memisahkan antarmuka web publik dan landing page pengguna Wahidiyah Book ke dalam folder `landing-page/`.
> **Lokasi Pengerjaan:** Folder `landing-page/`
> **Karakteristik Repositori:** Monorepo terpadu dengan **1 `package.json` dan 1 `node_modules` di root project**. Seluruh dependensi (React, Vite, Tailwind, Lucide, dll.) sudah tersedia di root.

---

## 1. PERAN & KONTEKS PROYEK
Anda adalah Senior Frontend Web Engineer. Tugas Anda adalah menyusun landing page dan portal web publik untuk **Wahidiyah Book** di dalam folder `landing-page/` dengan mengambil referensi dari kode yang saat ini ada di `src/`.

Landing page ini mencakup:
- **Halaman Utama / Landing Page:** Hero section, keunggulan literatur Wahidiyah, sorotan buku unggulan, testimoni/kutipan, agenda kegiatan terdekat, dan ajakan berlangganan (CTA).
- **Katalog Buku Publik:** Pencarian buku, filter kategori naskah, pratinjau buku (preview bab pertama/sampul).
- **Alur Langganan & Pembayaran QRIS:** Layanan akun Pro dan integrasi pembayaran QRIS Midtrans Core API (meniru `src/features/payment/PaymentMethodScreen.jsx` & `PaymentConfirmScreen.jsx`).
- **Pusat Bantuan & Tentang Kami:** Informasi organisasi, panduan membaca, dan FAQ.

---

## 2. PANDUAN DESAIN (EDITORIAL ELEGAN)
Gunakan token desain dari `component.json`:
- **Gaya:** "Editorial Elegan" — Berwibawa, tenang, bernuansa perpustakaan klasik berkelas.
- **Warna Pokok:**
  - Background Utama: Krem Hangat (`#FBF8F3` / `#F7F2E9`)
  - Aksen Brand: Hijau Zamrud (`#14523A`, hover `#0E3D2C`)
  - Aksen Mewah: Emas Elegan (`#B8860B`)
  - Teks: Tinta Arang Gelap (`#141210`)
- **Tipografi:** Font Serif klasik untuk judul/heading (Cinzel / Playfair Display / Serif sistem), Sans-Serif bersih untuk teks bacaan.

---

## 3. HALAMAN & FITUR UTAMA

1. **Hero Section & Landing Header:**
   - Navigasi responsif (Beranda, Katalog, Agenda, Langganan Pro, Tentang, Masuk/Daftar).
   - Banner sambutan dengan tipografi khas dan CTA "Mulai Membaca".
2. **Katalog & Showcase Buku:**
   - Menampilkan buku gratis dan buku berstatus Pro.
   - Modal detail buku dengan sinopsis lengkap dan daftar bab.
3. **Penyajian Reader Web:**
   - Pratinjau membaca langsung di browser dengan dukungan PDF/DOCX (menggunakan `pdfjs-dist` / `docx-preview`).
4. **Alur Membership & Transaksi QRIS:**
   - Tabel perbandingan akun Gratis vs Pro.
   - Generate kode QRIS dinamis via Midtrans sandbox/production dan polling status verifikasi pembayaran.
5. **Autentikasi Pengguna:**
   - Form Login, Register, Verifikasi Email, Lupa Password via OTP WhatsApp / Email.

---

## 4. STRUKTUR DIREKTORI DI `landing-page/`
```
landing-page/
├── public/                  # Aset statis (logo, favicon, banner)
├── src/
│   ├── components/          # Navbar, Footer, BookCard, Hero, Testimonials
│   ├── pages/               # LandingPage, CatalogPage, ProPage, ReaderPage
│   ├── context/             # AuthContext, Cart/SubscriptionContext
│   ├── lib/                 # API client, formatters, styling utils
│   ├── App.jsx              # Routing & Shell
│   └── main.jsx             # Entry Point React
└── index.html               # Template HTML
```

---

## 5. INSTRUKSI EKSEKUSI
1. Manfaatkan kode sumber yang ada di `src/features/home`, `src/features/subscription`, `src/features/reader`, dan `src/features/payment` sebagai acuan langsung.
2. Gunakan single `package.json` dan `node_modules` di root (jalankan `npm run dev` atau konfigurasi script di root).
3. Pastikan tampilan 100% responsif baik di desktop, tablet, maupun layar smartphone.
