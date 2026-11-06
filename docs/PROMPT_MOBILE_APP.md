# MASTER PROMPT: PENGEMBANGAN MOBILE-APP (EXPO / REACT NATIVE)

> **Tujuan:** Replikasi 1:1 tampilan dan alur mobile-web Wahidiyah Book ke aplikasi mobile native menggunakan Expo SDK 58 & React Native.
> **Lokasi Pengerjaan:** Folder `mobile-app/`
> **Karakteristik Repositori:** Monorepo terpadu dengan **1 `package.json` dan 1 `node_modules` di root project**. Jangan membuat `package.json` baru di dalam folder `mobile-app/`.

---

## 1. PERAN & KONTEKS PROYEK
Anda adalah Senior Mobile Engineer spesialis **React Native & Expo**. Tugas Anda adalah membangun aplikasi mobile native Wahidiyah Book di dalam folder `mobile-app/` yang meniru **persis (1:1)** tampilan mobile web yang sudah ada di folder `src/`.

Aplikasi ini menggunakan:
- **Framework:** Expo SDK 58 (React Native 0.88, New Architecture)
- **Bahasa:** JavaScript + JSX
- **State Management:** React Context (meniru `src/context/AppContext.jsx`)
- **Penyimpanan Lokal:** `expo-secure-store` (token JWT) + `@react-native-async-storage/async-storage` (preferensi) + `expo-file-system` (buku unduhan offline)
- **EAS Project ID:** `7175b4fc-04f3-423b-a7fd-06a1ccff134c` (sudah ada di `app.json` root)
- **Backend API:** Express server lokal di `http://10.0.2.2:3001` (Android Emulator) atau IP LAN / domain live untuk testing

---

## 2. PANDUAN DESAIN (1:1 DARI WEB)
Tiru tema **"Editorial Elegan"** dari `component.json` dan `src/theme/`:
- **Warna Utama (Primary / Zamrud):** `#14523A` (Hover/Dark: `#0E3D2C`, Light: `#DCEDE4`)
- **Latar Belakang (Cream Warm):** `#FBF8F3` (Card/Surface: `#F7F2E9` atau `#FFFFFF` beraksen krem)
- **Aksen Emas (Gold):** `#B8860B` (Badge Pro, highlight, bintang rating)
- **Warna Teks (Ink):** `#141210` (Utama), `#5A544C` (Sekunder / Subtitle)
- **Hindari:** Putih murni `#FFFFFF` dingin di seluruh layar, gradien ungu/neon generic, atau bayangan yang terlalu tebal.

---

## 3. LAYAR YANG HARUS DIBANGUN (1:1 SESUAI WEB)

### A. Autentikasi (`/auth`, `/login`, `/register`)
- **Referensi Kode Web:** `src/features/auth/LoginScreen.jsx`, `RegisterScreen.jsx`, `AuthScreen.jsx`
- Form Login: Email/Username + Password, tombol "Ingat Saya", tombol Masuk, navigasi ke Lupa Password & Register.
- Form Register: Nama Lengkap, Email, Nomor WhatsApp, Password, Konfirmasi.
- Simpan `sessionToken` dan objek `user` ke SecureStore setelah login berhasil.

### B. Beranda & Katalog Buku (`/`, `/home`)
- **Referensi Kode Web:** `src/features/home/HomeScreen.jsx`, komponen kartu buku, carousel banner.
- Carousel banner agenda / pengumuman di bagian atas (ambil dari `/api/carousel`).
- Filter Kategori & Bar pencarian cepat buku (judul, penulis, kategori).
- Grid / List Kartu Buku: Cover buku, judul, badge "Pro" / "Gratis", tombol baca / detail.

### C. Pembaca Buku Native (`/reader`)
- **Referensi Kode Web:** `src/features/reader/PdfReaderScreen.jsx`
- Gunakan viewer native (misal `react-native-pdf` atau viewer dokumen yang kompatibel dengan New Architecture SDK 58).
- Fitur viewer: Nomor halaman, pinch-to-zoom, bookmark, mode layar penuh.
- Proteksi layar anti-screenshot (`expo-screen-capture`) saat membaca naskah buku.

### D. Fitur Offline & Unduhan Buku (Khusus Mobile)
- Kemampuan mengunduh file naskah (PDF/DOCX) via signed URL dari server ke private folder aplikasi (`FileSystem.documentDirectory`).
- Indikator status: "Tersedia Offline" jika file sudah ada di perangkat.
- Membuka file lokal tanpa membutuhkan koneksi internet.

### E. Kalender & Agenda (`/calendar`)
- **Referensi Kode Web:** `src/features/calendar/CalendarScreen.jsx`
- Menampilkan agenda bulanan, tanggal-tanggal kegiatan, dan detail acara dari endpoint `/api/events`.

### F. Profil & Pengaturan Akun (`/profile`)
- **Referensi Kode Web:** `src/features/profile/EditProfileScreen.jsx`, `SubscriptionHistoryScreen.jsx`
- Tampilan identitas akun, status langganan (Gratis atau Pro).
- Tab riwayat buku yang diunduh & pemakaian penyimpanan lokal (Storage Usage).
- Tombol Hapus Cache Unduhan dan tombol Logout.

### G. Status Langganan Pro (`/pro`)
- **Referensi Kode Web:** `src/features/subscription/ProScreen.jsx`
- Menampilkan benefit Pro.
- Catatan: Pembayaran QRIS tetap diarahkan ke browser/web (tampilkan tautan atau WebView eksternal untuk transaksi Midtrans).

---

## 4. STRUKTUR DIREKTORI DI `mobile-app/`
```
mobile-app/
├── assets/                  # Icon, splash screen, favicon
├── src/
│   ├── api/                 # Client API fetch (auth, books, events, dll)
│   ├── components/          # Reusable UI (Button, Card, Input, Header, Badge)
│   ├── context/             # AuthContext, BookContext
│   ├── navigation/          # AppNavigator (Native Stack & Bottom Tabs)
│   ├── screens/
│   │   ├── auth/            # LoginScreen, RegisterScreen
│   │   ├── home/            # HomeScreen, BookDetailScreen
│   │   ├── reader/          # ReaderScreen (PDF & Dokumen)
│   │   ├── calendar/        # CalendarScreen
│   │   └── profile/         # ProfileScreen, DownloadsScreen
│   ├── theme/               # Token warna, typography, dan spacing
│   └── utils/               # Storage helper, offline manager
├── App.js                   # Root Component
└── index.js                 # registerRootComponent(App)
```

---

## 5. INSTRUKSI EKSEKUSI
1. Periksa `mobile-app/App.js` dan pastikan navigasi serta layar utama terpasang.
2. Manfaatkan dependensi yang sudah terpasang di root `package.json`. Jika memerlukan paket tambahan Expo, jalankan `npx expo install <nama-paket>` dari root project.
3. Jalankan `npm run mobile:start` atau `npx expo config` untuk memverifikasi tidak ada error sintaks atau modul yang hilang.
