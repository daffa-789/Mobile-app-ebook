# Rencana Aplikasi Mobile — `mobile/` (React Native + Expo)

**Status dokumen:** spesifikasi pengerjaan. Keputusan dan alasannya dicatat di `Master_Memory_Workflow.md` **§16.2** — berkas ini tidak mengulang alasan, hanya menerjemahkannya menjadi rancangan yang bisa dikerjakan tanpa menebak.
**Cakupan:** §1–16 lapisan produk & data (kontrak API, offline, proteksi, desain), §17–20 lapisan Android (config `app.json`, signing & versi, perilaku perangkat, akun & unduhan). Baca §17–20 sebelum menyentuh kode: di situlah build pertama biasanya gagal, bukan di logikanya.
**Tanggal:** 4 November 2026. Semua rujukan baris mengacu pada kondisi kode hari itu; kalau kode berubah, perbarui berkas ini (aturan yang sama dengan berkas induk).

---

## 1. Tujuan dan batas keras

**Tujuan (v1):**
1. Masuk/daftar akun yang sama dengan web (satu akun, dua permukaan).
2. Katalog buku.
3. Membaca buku (PDF dan DOCX/TXT) dengan viewer native.
4. Unduh buku ke perangkat agar **benar-benar terbaca offline**.
5. Layar Pengaturan berisi: identitas akun, daftar unduhan, penyimpanan terpakai, keluar, dan (opsional) tombol pembaruan.

**Non-tujuan v1 — jangan dikerjakan, masing-masing ada alasannya:**

| Jangan | Alasan |
|---|---|
| Panel admin, dashboard, ekspor Excel, kwitansi PDF | Tetap web. `recharts`/`exceljs`/`jspdf` tidak punya padanannya dan tidak dibutuhkan di HP. |
| Pembayaran QRIS di dalam aplikasi | Web tetap jalur pembayaran. Aplikasi mobile hanya menampilkan status Pro dan tautan "Beli lewat browser". Meniru `QrisPaymentCard` di RN adalah pekerjaan besar dengan nilai nol untuk riset. |
| Google OAuth | Jalur yang ada **browser-only**: `GET /api/auth/google/callback` memakai cookie state + redirect HTML (`server/controllers/auth_controller.js:227-310`). Perlu `expo-auth-session` + endpoint baru. Ditunda, bukan dibuang — lihat §14. |
| Web Push / notifikasi | Ditolak pemilik proyek; kolom `push_subscriptions` memang tidak ada di DB live. |
| iOS | Pemasangan ke iPhone butuh Apple Developer $99/tahun. Build-nya sendiri bisa dari cloud Expo. Ditunda. |
| Mengubah kode web agar "bisa dipakai RN" | Tidak ada. `mobile/` tidak boleh menimpor apa pun dari `src/` (alasan di §4). |

---

## 2. Prasyarat — diselesaikan sebelum baris kode pertama

| # | Prasyarat | Siapa | Kenapa mengikat |
|---|---|---|---|
| P1 | Kunci sandbox Midtrans (`SB-Mid-…`) masuk `.env` | Pemilik proyek | Tanpa ini alur bayar tidak bisa diuji sama sekali. Tidak wajib untuk v1 mobile (pembayaran di luar scope), tapi wajib sebelum Bab IV mengklaim hasil uji. |
| P2 | Keputusan M1: pulihkan tanda air + blokir klik kanan di reader **web**, atau turunkan klaim | Pemilik proyek | Menentukan apakah reader mobile harus ikut membangun tanda air (lihat §8.4). Kalau web memulihkan, mobile harus meniru atau penguji menemukan dua perilaku berbeda. |
| P3 | Perbaikan `remote.origin.fetch` single-branch, atau disiplin tidak pakai `git pull` | Pemilik proyek memutuskan | Dijelaskan di `Master_Memory_Workflow.md` §16.2 (bagian Jebakan Git). Branch lain tidak punya ref lacakan, `git pull` di branch mobile bisa berulah. |
| P4 | Izin `create-expo-app` (±1–2 GB `node_modules`) | Pemilik proyek | Satu-satunya langkah yang tidak bisa di-undo murah di mesin 16 GB. |
| P5 | **Dua HP Android nyata dari merek berbeda** (mis. Xiaomi + Samsung) | Pemilik proyek | Dua risiko terbesar (OTA pada APK sideload, `FLAG_SECURE` di atas native view) tidak bisa dibuktikan di emulator, dan perilaku `FLAG_SECURE`/hardware-overlay justru berbeda antar ROM (§10, §19). |
| P6 | Keystore release dibuat dan dibackup **dua tempat**, di luar repo | Pemilik proyek | Satu-satunya bagian yang tidak bisa dipulihkan. Kehilangan keystore = tidak bisa upgrade install = semua penguji uninstall = buku terunduh mereka hilang (§18). |
| P7 | Keputusan default §20 (logout tidak menghapus unduhan, buku terikat `user_id`, tenggang offline 30 hari) disahkan atau diganti | Pemilik proyek | Ini keputusan produk, bukan teknis, dan mengubah skema manifest sejak awal — lebih murah diputuskan sekarang daripada dibongkar setelah layar unduhan jadi. |

---

## 3. Bentuk aplikasi & sistem yang dipakai

**Expo SDK 58** (rilis 15 Oktober 2026, React Native 0.88) — bukan bare React Native CLI, bukan framework lain. Proyek tinggal di `mobile/` dengan `package.json` sendiri.

- Distribusi: **APK sideload** lewat GitHub Releases. Tidak ada Play Store, tidak ada akun developer.
- Update: OTA (`expo-updates`) **tetap opsional** — lihat §13 dan `Master_Memory_Workflow.md` §16.2 (bagian Yang dibatalkan).
- iOS: **ditunda**, bukan ditutup. Build-nya bisa dari cloud Expo; yang berbayar adalah memasangnya ke iPhone.

Sistem yang dipilih mengikuti arsitektur proyek ini, bukan mengikuti apa yang populer di ekosistem RN:

| Lapisan | Yang dipakai | Kenapa ini yang cocok dengan repo induk |
|---|---|---|
| Bahasa | JavaScript + JSX, **bukan TypeScript** | Repo induk sudah menolak TS (15.1, dan keputusan 3 Nov 2026). Tidak ada `tsconfig` di `src/`; memaksa TS di mobile menambah satu lapisan kesalahan baru tanpa keuntungan untuk dua aplikasi riset. |
| State | React Context: `state/AuthContext.js`, `state/BookContext.js` | Meniru `src/context/AppContext.jsx` + pola slice. Bukan Redux/Zustand/MobX — tidak ada satu pun di web. |
| Data | `fetch` tipis di `api/`, amplop `{ success, message }` | Padanan jujur dari `src/lib/api.js` dan `server/lib/http.js`. Tanpa axios, tanpa React Query/tanstack. |
| Styling | `StyleSheet` + `mobile/src/theme.js` hasil porting token | Melanjutkan aturan "satu sumber warna" (`component.json` → `src/lib/styles.js`). **Nativewind, Tamagui, NativeBase ditolak**: lapisan gaya baru yang tidak punya padanan di web, dan justru sumber kesalahan yang sedang kita hindari. |
| Navigasi | React Navigation (`native-stack` + `bottom-tabs`) | Web tetap `react-router`; tidak ada niat menyatukan keduanya. |
| Penyimpanan | `expo-secure-store` (token), `expo-sqlite` (manifest unduhan & progres), `@react-native-async-storage/async-storage` (nilai kecil) | Mengganti `localStorage`/`sessionStorage` web satu per satu, sesuai pemetaan §6. |
| Konvensi kode | komentar & pesan bahasa Indonesia, JSDoc `@file`/`@description` per modul, Prettier dijalankan dari dalam `mobile/` | Melanjutkan standardisasi JSDoc R74/R75 di web. `mobile/` sengaja dikecualikan dari tooling web (`.prettierignore` + `@source not`), jadi gayanya dijaga sendiri. |
| Verifikasi | `npm run build` + `npm run health` web + **probe di perangkat nyata**; tanpa test suite | Keputusan sadar repo ramping (15.1). Memasang vitest di mobile sama dengan menghidupkan kembali benda yang sudah dibuang. |
| Backend | **tidak berubah sedikit pun** | Mobile hanyalah klien kedua dari Express + Supabase + Midtrans yang sudah ada. |

### 3.1 Aturan versi

1. **Versi paket tidak pernah ditulis manual.** Selalu `npx expo install <paket>` supaya resolver SDK 58 yang memilih, lalu `npx expo install --fix` untuk merapikan yang tertinggal. Menulis angka dari memori adalah cara tercepat mendapat Metro error yang pesannya menyesatkan.
2. `mobile/package.json` dan `mobile/package-lock.json` ikut di-commit. Kalau keduanya berubah, itu hasil perintah di atas — bukan suntingan angka.
3. **SDK dikunci sebelum Probe A dan B dikerjakan.** Mengganti SDK setelah probe berarti mengulang keduanya — ±1 hari terbuang hanya karena menunda satu keputusan.
4. **Fallback resmi: SDK 57** (rilis 30 Juni 2026, React Native 0.86.2 — yang membawa perbaikan Hermes). Fallback ini diputuskan oleh hasil probe, bukan oleh dugaan.

### 3.2 Yang berubah dari SDK 53 ke SDK 58 dan menyentuh rencana ini

| Perubahan | Konsekuensi nyata ke proyek |
|---|---|
| Legacy architecture **dihapus sejak SDK 55** | Tidak ada lagi jalan mundur "matikan new arch kalau library rusak". Setiap library native, terutama `react-native-pdf`, wajib kompatibel New Architecture. |
| `expo-file-system` API baru (`File`/`Paths`) default sejak 54, celah fiturnya ditutup di 56 | §9.2 Probe A sekarang menguji **pengiriman header `Authorization` pada API baru**, bukan `downloadAsync` legacy. Kode scaffold yang masih memakai API lama harus ikut diperiksa. |
| React Native 0.79 → 0.88 | Lima loncatan SDK sekaligus; ini migrasi, bukan `npm update`. |
| Android Gradle Plugin 9 didukung, **R8 minification default di build release** | Library pihak ketiga yang memakai refleksi bisa patah **hanya di APK release** sementara dev/preview normal. §18 menambah langkah "tes APK release", dan itu bukan opsional. |
| iOS diarahkan ke iOS 27 | Tidak relevan — proyek ini Android-only dan iOS ditunda. |
| Nama layanan "EAS Build/Update" → "Expo Build/Expo Update" | §13 penamaan; perintah `eas ...` masih berlaku. |

### 3.3 Kondisi nyata saat ini (bukan rencana)

Scaffold **sudah ada** di `mobile/`: 38 berkas, ±1.825 baris, sembilan layar, dibangun di atas **Expo SDK 53** (React Native 0.79.2, React 19.0.0) di branch `mobile-app`. Jadi "pindah ke 58" bukan lagi edit dokumen — ia migrasi kode nyata, dan urutannya ada di §14 langkah 1a.

### Struktur folder

```
mobile/
  package.json
  app.json                  # name, slug, scheme, android.package, permissions, updates.url
  babel.config.js
  metro.config.js
  index.js                  # registerRootComponent
  src/
    theme.js                # token warna/typography/radius hasil porting (lihat §11)
    config.js               # API_BASE_URL, env per channel (production/preview)
    api/
      client.js             # padanan src/lib/api.js tanpa DOM (lihat §6)
      auth.js               # login, register, verify, resend, me, reset
      books.js              # list, detail, html, content-url, thumbnail
      subscriptions.js      # status pro + riwayat (untuk badge)
    storage/
      secureStore.js        # token (expo-secure-store)
      kv.js                 # preferensi & progres baca (AsyncStorage / SQLite)
      downloads.js          # manifest unduhan + berkas naskah (expo-file-system + SQLite)
    state/
      AuthContext.js         # sesi, restore, 401 -> logout
      BookContext.js         # katalog, pencarian, urut
    nav/
      Root.js                # Stack: Auth | App
      Tabs.js                # Bottom tab: Beranda, Koleksi(?), Profil
    screens/
      AuthScreen.js          # tab Masuk/Daftar, meniru aturan validasi §7.3
      VerifyEmailScreen.js
      ForgotPasswordScreen.js
      HomeScreen.js          # hero carousel + daftar buku
      CatalogScreen.js       # opsional: gabung ke HomeScreen kalau satu layar cukup
      ReaderScreen.js        # payung: pilih viewer per ekstensi + anti-screenshot
      PdfViewer.js
      HtmlViewer.js          # DOCX/TXT via WebView
      DownloadsScreen.js     # kelola unduhan + pemakaian penyimpanan
      SettingsScreen.js      # profil, unduhan, keluar, (tombol update opsional)
    components/
      BookCard.js
      ProBadge.js
      OfflineBanner.js       # penanda "tersimpan di perangkat"
      Toast.js               # padanan sonner yang paling sederhana
    lib/
      normalizeBook.js       # DIPORT dari src/lib/normalizers.js:81 (murni, tanpa DOM)
      normalizeUser.js       # DIPORT dari src/lib/normalizers.js:46
      phone.js               # DIPORT dari src/lib/phone.js (normalizePhone/displayPhone/isValidPhone)
      date.js                # dayjs: formatWIB dsb (murni)
      format.js              # formatRupiah
```

**Aturan impor:** `mobile/` **tidak boleh** mengimpor dari `src/`, `server/`, atau `shared/`. Yang boleh dipakai ulang adalah **logika yang disalin**, bukan modul yang diimpor — karena resolver Metro tidak sama dengan Vite dan satu file web yang menyentuh `window` akan meremehkan seluruh bundel RN. Kalau sebuah fungsi terbukti murni (kolom "murni" di §5), salin file-nya ke `mobile/src/lib/` dan tandai asal-usulnya di komentar satu baris.

---

## 4. Dependensi, dan apa yang menggantikan apa

Target: **Expo SDK 58**. Semua paket di bawah dipasang lewat `npx expo install` supaya resolvert yang memilih versi (aturan §3.1) — angka pada tabel ini adalah **nama paket, bukan versi**. Setelah instalasi, `npx expo install --fix` untuk merapikan yang tertinggal dari SDK lama.

| Kebutuhan | Paket | Catatan penting |
|---|---|---|
| Navigasi | `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs` | Jangan pakai `react-router`; ia untuk DOM. |
| Simpan token | `expo-secure-store` | Token **jangan** di AsyncStorage: perangkat root bisa membacanya. |
| Preferensi & progres | `@react-native-async-storage/async-storage` | Cukup untuk nilai kecil. |
| Manifest unduhan | `expo-sqlite` | Perlu query/pembuangan; AsyncStorage tidak cocok jadi indeks berkas. |
| Berkas naskah | `expo-file-system` | **Awas:** API lama (`downloadAsync(url, {file})`) berbeda dari API baru berbasis `File`/`Paths`. Baca dokumentasi versi SDK yang terpasang sebelum menulis satu baris. Yang wajib dipastikan: **pengiriman header `Authorization` saat men-download** (lihat §9.2). |
| Viewer PDF | `react-native-pdf` (+ `react-native-svg`/`react-native-fs` sesuai kebutuhan paketnya) | Pilih ini daripada `PdfRenderer` bawaan Android, yang menolak sebagian PDF. Wajib dites dengan tiga buku yang ada di DB, bukan PDF contoh. |
| Viewer DOCX/TXT | `react-native-webview` | Isi HTML sudah disanitasi server (`/api/books/:id/html`). Jangan menambahkan DOMPurify di HP. |
| Blokir screenshot | `expo-screen-capture` | Modul resmi. Lihat §10. |
| Ikon | `@expo/vector-icons` **atau** salin 6 nama lucide yang dipakai | Ikon yang harus ada: `home`, `calendar`, `sparkles`, `user-round`, `download`, `wifi-off`. Jangan memasang satu set ikon penuh "karena gampang". |
| Font | `expo-font` + `@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/fraunces`, `@expo-google-fonts/amiri` | Web memuat dari Google Fonts di `index.html:27-30`; di RN **tidak ada** `@font-face`, harus di-bundle. Amiri dibutuhkan kalau naskah memuat teks Arab. |
| Toast | `react-native-toast-message` atau komponent sendiri 30 baris | Jangan porting `sonner`. |
| OTA (opsional) | `expo-updates` | Hanya jika §13 jadi dikerjakan. |

### 4.1 Isi `mobile/package.json` hari ini (SDK 53) dan apa yang harus terjadi saat naik ke 58

Terverifikasi dari berkas pada 4 Nov 2026, bukan dari ingatan:

| Paket | Versi sekarang | Yang harus terjadi di SDK 58 |
|---|---|---|
| `expo` | ~53.0.27 | `npx expo install expo@^58` — ini langkah pertama, sisanya ikut |
| `react-native` | 0.79.2 | ikut ke 0.88 oleh resolver; **jangan** dipasang manual |
| `react` | 19.0.0 | ikut versi yang ditentukan template 58; jangan ditulis dari memori |
| `expo-file-system` | ~18.1.11 | naik; **cek apakah kode memakai API lama** (`FileSystem.downloadAsync`) — API baru `File`/`Paths` default sejak 54, dan §9.2 menguji opsi header di API baru itu |
| `expo-secure-store` | ~14.2.3 | naik |
| `expo-sqlite` | ~15.2.14 | naik; perhatikan perubahan API statement kalau manifest sudah ditulis |
| `expo-screen-capture` | ~8.0.10 | naik; **Probe B (§14 langkah 3) wajib diulang setelah naik**, karena perilakunya di atas native view adalah taruhannya |
| `react-native-pdf` | ^6.7.7 | **titik risiko terbesar.** Ini paket pihak ketiga, bukan paket Expo — resolver tidak menjamin kompatibilitas RN 0.88 + New Architecture + R8. Kalau ia gagal, fallback resmi §3.1 butir 4 (SDK 57), bukan menulis viewer sendiri |
| `react-native-webview` | 13.13.5 | naik |
| `@react-navigation/native-stack` | ^7.3.10 | naik |
| `expo-font` | ~13.3.2 | naik |
| `expo-updates` | belum ada | hanya dipasang kalau §13 jadi dikerjakan |

Setelah `npx expo install expo@^58`: jalankan Metro di **perangkat**, ulangi Probe A dan B, baru lanjut. Naik SDK tanpa mengulang dua probe itu berarti meninggalkan satu-satunya bagian rencana yang bisa membuktikan dirinya sendiri.

**Tidak dipakai di mobile:** `pdfjs-dist`, `dompurify`, `jspdf`, `exceljs`, `recharts`, `qrcode.react`, `@headlessui/react`, `sonner`, `canvas-confetti`, `mammoth` (konversi DOCX memang sudah terjadi di server), `clsx`/`tailwind-merge`, `tailwindcss`. Kalau ada yang mengusulkan **Nativewind** agar kelas Tailwind web bisa dipakai: **jangan di v1.** Kombinasi Nativewind + Tailwind v4 + Metro adalah sumber kesalahan yang persis yang sedang kita hindari; `StyleSheet` + `theme.js` lebih membosankan dan lebih sedikit bug.

---

## 5. Kontrak API yang dipakai mobile

Fakta yang sudah diverifikasi terhadap kode (per 4 Nov 2026):

### 5.1 Dasar

- Semua rute di bawah **`/api`** (`server/routes/index.js:14-27`).
- Web memakai path **relatif** (`src/lib/api.js:157`) — tidak ada `VITE_API_URL` sama sekali. Karena RN tidak punya origin, **mobile wajib mengkonfigurasi URL absolut** di `mobile/src/config.js`:
  - development: `http://<IP-LAN-mesin-kamu>:5000/api` (HP dan laptop harus di WiFi yang sama; `localhost` di HP bukan laptopmu — ini kesalahan paling klasik dan akan memakan 30 menit kalau tidak ditulis sekarang). **Dan HTTP polos ditolak Android secara bawaan:** tanpa `usesCleartextTraffic` di build dev (§17), yang kamu dapat bukan 404 melainkan kegagalan koneksi yang tidak menjelaskan apa pun.
  - preview/production: URL Vercel.
- **CORS tidak menghalangi mobile.** Kebijakan server menerima permintaan **tanpa header `Origin`**: `if (!origin || ALLOWED_ORIGINS.includes(origin))` di `server/middleware/security.js:26-31`. Jangan pernah membuang waktu menyelidiki CORS untuk RN.
- `FRONTEND_ORIGIN` hanya dipakai untuk redirect OAuth (`server/lib/origin.js`), **tidak** menjaring panggilan API.
- Batas badan JSON permintaan: **1 MB** (`security.js:35`). Tidak ada permintaan mobile yang mendekati ini.
- Sampul/isi berukuran besar **tidak lewat JSON**, jadi tidak tersandung batas itu.

### 5.2 Sesi

- Token = **JWT buatan aplikasi ini sendiri**, bukan token akses Supabase: `jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })`, default **12 jam** (`server/auth.js:168-169`).
- Dibawa sebagai `Authorization: Bearer <token>` (`server/auth.js:171-177`).
- **Tidak ada refresh token, tidak ada rotasi, tidak ada endpoint logout.** Kadaluarsa berarti login lagi. Keluar di web hanya menghapus localStorage (`src/context/AppContext.jsx:229-242`) — mobile melakukan hal yang sama: hapus SecureStore, kosongkan state.
- `GET /api/auth/me` → `{ success, user }` dipakai untuk memulihkan sesi saat aplikasi dibuka (pola yang sama dengan web).
- Bentuk `user` (`server/auth.js:95-109`): `{ id, name, email, role, login_method, is_pro, subscription_expires_at, phone, created_at }`.

### 5.3 Autentikasi

| Aksi | Metode & path | Permintaan | Respons |
|---|---|---|---|
| Masuk | `POST /api/auth/login` | `{ identifier, password }` | `200 { success, message, token, user }`; salah kredensial `401` |
| Daftar | `POST /api/auth/register` | `{ name, email, phone, password }` | **`202`** `{ success, email, phone, identifier, deliveryMethod, deliveredBy, message, devOtp? }` — **bukan** token |
| Verifikasi OTP | `POST /api/auth/verify-registration` | `{ identifier, code }` | `201 { success, message, token, user }` |
| Kirim ulang OTP | `POST /api/auth/resend-verification` | `{ method?, identifier, purpose }` | `200` |
| Lupa sandi | `POST /api/auth/request-password-reset` | `{ method?, email?, phone?/identifier? }` | `200` (anti-enumerasi: selalu berhasil) |
| Reset sandi | `POST /api/auth/reset-password` | `{ method?, email?/phone?/identifier?, code, password }` | `200 { success, message }` |

Aturan OTP yang harus ditiru UI-nya: 6 digit, TTL 10 menit, maks 5 percobaan, cooldown kirim ulang 60 detik (`server/lib/otp.js:13-15,59,96-124`). `EXPOSE_DEV_OTP=1` membuat `devOtp` ikut terkirim di non-produksi — **manfaatkan ini untuk mengetes layar verifikasi tanpa inbox.**

### 5.4 Buku dan isi

| Aksi | Metode & path | Catatan |
|---|---|---|
| Katalog | `GET /api/books?search=&sort=oldest\|newest\|title_asc\|title_desc` | Publik. Field: `id, title, pages, is_locked, cover_url, content_name, content_extension, content_size, created_at, updated_at` (`server/lib/constants.js:27-38`) + terkomputasi `has_thumbnail`, `has_content`. |
| Detail | `GET /api/books/:id` | |
| Sampul | `GET /api/books/:id/thumbnail` | Entah biner data URL atau **redirect** ke signed URL storage. `Image` RN mengikuti redirect. |
| Isi mentah | `GET /api/books/:id/content` | **Wajib Bearer.** `Content-Disposition: inline` untuk PDF, selainnya `attachment`; lalu biner data URL **atau redirect ke signed URL Supabase TTL 300 detik**. Inilah jalur unduhan offline. |
| HTML untuk DOCX/TXT | `GET /api/books/:id/html` | **Wajib Bearer.** `{ success, html, type }`; mammoth menjalankan konversi **di server**; PDF ditolak `400`. |
| Pro gating | ditegakkan **server** di kedua endpoint isi | Buku terkunci butuh Pro aktif, selain itu `403 { success:false, message:"Buku ini khusus pembaca Pro..." }`. Jangan menegakkan di UI saja. |

**Dua hal yang tidak ada, dan harus berhenti diandaikan:**
1. Field `author`/`category`/`subtitle` **tidak ada di respons API** — hanya ada di skema pembuatan admin. Kartu buku RN tidak boleh merancang slot untuknya.
2. `samplePages` adalah sisa lama; tidak ada satu pun jalur `/api` yang menghasilkannya dan `normalizeBook` tidak pernah memproduksinya. Jangan dipakai untuk pratinjau halaman.

### 5.5 Status Pro

- Sumber kebenaran: `hasActivePro` = `is_pro` benar **dan** `subscription_expires_at` di masa depan (null = anugerah admin, tetap aktif) — `server/auth.js:85-93`.
- Klien membacanya dari `GET /api/auth/me` → `user.is_pro`. Riwayat: `GET /api/subscriptions/my` → `{ success, subscriptions[] }` dengan `plan_name, price, status, expires_at, ref_code`.
- **Penting untuk unduhan offline:** Pro bisa kedaluwarsa **setelah** buku terlanjur diunduh. Kebijakan v1: unduhan yang sudah ada di perangkat **tidak dihapus otomatis** saat Pro mati, tapi layar Pengaturan menampilkan status; dan buku Pro baru tidak bisa diunduh tanpa status aktif. Tulis ini sebagai keputusan, bukan biarkan jadi bug yang tampak sendiri.

### 5.6 Limiter (mobile tidak boleh lebih agresif dari web)

- `POST /api/payments/qris/charge`: 20 / 5 menit / IP.
- `GET /api/payments/qris/:orderId/status`: 150 / 5 menit, **dikunci per `req.user.id`**.
- `GET .../qr.png`: 60 / menit / IP.
- Web mem-poll **3000 ms** (`src/features/payment/useQrisPayment.js:4,142`). Mobile tidak mem-poll sama sekali di v1 (tidak ada pembayaran) — jadi jangan menambah interval apa pun "buat jaga-jaga".
- **Tapi mobile wajib memanggil `POST /api/payments/qris/reconcile`** (Bearer, body `{}`) sekali setiap sesi aktif, dan sekali lagi saat aplikasi kembali ke foreground. Endpoint ini (R84) menagih ulang order pending milik pengguna sendiri; tanpanya pembayaran yang datang setelah layar bayar tertutup tidak pernah terdeteksi di platform mana pun. Bila responsnya `settled > 0`, panggil ulang `GET /api/auth/me` agar badge Pro ikut berubah.

### 5.7 Amplop kesalahan — seragam, dan ini yang dipakai untuk menulis UI

Semua galat: **`{ success: false, message }`** (+ `error` hanya di dev). Galat DB → **503** dengan `isDatabaseError: true`. Validasi zod → **400 dengan satu pesan manusia pertama saja**, tanpa array per-field (`firstIssueMessage`). Rute tak dikenal → `404 { success:false, message:'Endpoint API tidak ditemukan.' }`. Limiter → `{ success:false, message }`.

Konsekuensi UI: **tidak ada mapping field-level**. Jangan merancang inline-error per input; satu banner/dialog pesan sudah cukup dan itulah yang dilakukan web.

---

## 6. Lapisan data: apa yang bisa disalin, apa yang ditulis ulang

Hasil pemindaian `src/lib` + `src/context`:

| Modul web | Sifat | Aksi untuk mobile |
|---|---|---|
| `src/lib/normalizers.js` | murni | **Salin** `normalizeBook` (:81), `normalizeUser` (:46) |
| `src/lib/phone.js` | murni | **Salin** (`normalizePhone` memaksa prefiks `62`, `isValidPhone`) |
| `src/lib/date.js`, `formatUtils.js` | murni (dayjs, Intl) | **Salin dengan koreksi:** `formatUtils.js:1` membuat `new Intl.NumberFormat('id-ID')` di level modul dan ada 11 titik `toLocale*` di `src/` — `Intl` di Hermes hanya sebagian. Ganti dengan formatter manual, lihat §19 |
| `src/lib/api.js` | fetch murni **tapi** menyentuh `window.localStorage/sessionStorage/location` (:14,:31,:53,:78,:95) | **Tulis ulang** `client.js`: same logic, storage diganti SecureStore/kv, base URL absolut dari config |
| `src/lib/styles.js` | string kelas Tailwind | **Tidak disalin** — diambil **nilainya** saja ke `theme.js` (§11) |
| `src/lib/sanitizeHtml.js` | DOMPurify butuh `window` | **Tidak dipakai** — HTML sudah disanitasi server sebelum dikirim |
| `src/context/AppContext.jsx` | logika portabel, tapi `window.location` (:93), BroadcastChannel (:244-276), event fokus/visibility (:186-199) | **Tulis ulang** jadi `AuthContext` + `BookContext` |
| `src/context/slices/useCatalogSlice.js` | hampir murni (`/api/books`, `/api/events`, `/api/carousel`) | **Salin pola** ke `BookContext` |
| `useNavigationSlice.js` | `window.history` | **Buang**, diganti React Navigation |
| `usePaymentSlice.js` | pembayaran | **Tidak dipakai di v1** |
| `src/lib/excelExport.js`, `receiptPdf.js`, `maps.js`, `scrollPositionEvents.js`, `useDialogFocusTrap.js`, `withToast.js` | DOM-only | **Buang** |

### Pemetaan penyimpanan (kunci lama → rumah baru)

| Kunci web (localStorage/sessionStorage) | Isi | Rumah di RN | Kenapa |
|---|---|---|---|
| `buku-wahidiyah:auth-session` | `{ token, user }` | `expo-secure-store` (token) + state in-memory (user) | AsyncStorage tidak terenkripsi; jangan menyimpan JWT di sana |
| `last_read_page_<bookId>` | nomor halaman | SQLite/AsyncStorage per perangkat | Progres baca **tidak punya endpoint server** — lihat §12 |
| `buku-wahidiyah:pending-verification` | sesi OTP | state in-memory + AsyncStorage untuk pemulihan layar | |
| `buku-wahidiyah:intended-location`, `last-payment` | routing & hasil bayar web | **tidak ada padanannya** | tidak berlaku di mobile |
| `wb_pwa_dismissed`, `wahidiyah:reminders-seen` | PWA & reminder | **buang** | PWA tidak ada di RN; reminder agenda di luar scope v1 |

---

## 7. Rancangan layar

### 7.1 Alur

```
Buka aplikasi
  └─ ada token di SecureStore?
       ├─ ya → GET /api/auth/me
       │        ├─ 200 → Tabs (Beranda, Profil)
       │        └─ 401 → bersihkan token → AuthScreen
       └─ tidak → AuthScreen
AuthScreen (tab Masuk | Daftar)
  ├─ Masuk → token → Tabs
  └─ Daftar → 202 → VerifyEmailScreen (6 digit, cooldown 60s) → 201 token → Tabs
Tabs
  ├─ Beranda: hero carousel (opsional), daftar buku, banner "sedang offline"
  │    └─ ketuk buku → ReaderScreen
  ├─ Profil: identitas, status Pro, riwayat langganan, tautan "Beli Pro lewat browser",
  │          Unduhan, Pengaturan
ReaderScreen  (anti-screenshot aktif di sini saja)
```

### 7.2 Beranda / katalog

- Sumber data persis `useCatalogSlice`: `GET /api/books` (+`search`, `sort`), `GET /api/carousel`, `GET /api/events` bila agenda ikut.
- Kartu buku mengikuti `BookCard` web: rasio sampul **1:1.42**, PRO badge **hanya bila** `is_locked && !user.is_pro` (pola `HomeScreen.jsx:32-39` + `BookCard.jsx:51-58`).
- Baris tindakan kartu: **Baca** / **Unduh** / **Tersimpan** (dengan ukuran berkas). Jangan menambah tombol "Bagikan" — tidak ada sumber datanya dan bertentangan dengan §10.
- Offline: kalau permintaan gagal, tampilkan katalog **dari cache metadata** (SQLite/AsyncStorage, TTL 24 jam) dengan banner "Data mungkin sudah tidak terbaru". Web melakukan sebaliknya (network-first di `public/sw.js:104-123`) karena peramban tidak boleh basi; di HP, ketersediaan lebih berharga daripada kesegaran. Ini keputusan sadar, catat di Bab IV.

### 7.3 Aturan validasi yang harus sama persis dengan web

Dari `LoginForm.jsx` dan `RegisterForm.jsx`:
- Masuk: hanya email + sandi; klien cek tidak-kosong (:33) dan `password.length < 8` (:37).
- Daftar: `name` wajib (:38); email regex `^\S+@\S+\.\S+$` (:39); nomor WhatsApp digit-only **8–15** setelah pemisahan non-digit (:43-47, `PhoneInput.jsx:6` membatasi 15 digit dan menyimpan `62…` lewat `normalizePhone`); sandi ≥8 (:50); konfirmasi cocok (:51).
- `deliveryMethod` **hard-code `'email'`** (`RegisterForm.jsx:26`) → layar verifikasi mobile juga email-only. Jangan memasang UI pemilihan WhatsApp kalau backend tidak pernah mengirim ke sana saat pendaftaran.
- **Tidak ada kotak persetujuan syarat** di form mana pun (satu-satunya `paymentAgreed` ada di alur bayar). Kalau RN menambahkannya sendiri, itu perbedaan perilaku antar platform yang akan ditanyakan.

### 7.4 Profil / Pengaturan / Unduhan

- Profil: nama, email, `role`, badge Pro + `subscription_expires_at`, riwayat dari `/api/subscriptions/my`, tombol keluar.
- Unduhan: daftar buku terunduh (judul, halaman, ukuran, tanggal unduh), hapus per berkas, total pemakaian penyimpanan, dan tombol "perbarui" bila `updated_at` server lebih baru dari yang tersimpan.
- Pengaturan: versi aplikasi, mode offline-only (jika diaktifkan: aplikasi tidak memanggil jaringan), dan — hanya jika §13 jadi dikerjakan — tombol "Cek pembaruan".

---

## 8. Reader — inti dari proyek ini

### 8.1 Pemilihan viewer

Mengikuti `PdfReaderScreen.jsx:27-34`: ekstensi dari `content_extension` (fallback dari tipe konten), PDF={pdf}, DOCX={docx,doc,odt}, TEXT={txt,md,csv,rtf}. Di RN:

| Tipe | Sumber data | Renderer |
|---|---|---|
| PDF | **berkas lokal hasil unduhan** (§9) | `react-native-pdf` (pdfium), scroll vertikal kontinu seperti web |
| DOCX / TXT / md / csv / rtf | `GET /api/books/:id/html` | `WebView` dengan HTML hasil sanitasi server; CSS disuntik `user-select:none` agar setara `select-none` web |

**Kenapa berkas lokal, bukan stream langsung seperti web:** web memanggil `apiRequest(contentUrl)` lalu `blob()` (`PdfReaderScreen.jsx:211-215`) yang hidup di memori peramban. Di HP, satu PDF 20–50 MB di Base64/memori adalah jalan tercepat menuju crash Hermes. Jadi **selalu tulis dulu ke berkas, lalu buka dari URI berkas** — bahkan untuk buku yang tidak diminta diunduh.

### 8.2 Yang hilang dan harus diganti, satu per satu

| Fitur web | Pemadanan di RN |
|---|---|
| pdf.js worker + render `<canvas>` per halaman (`usePdfCanvasRenderer.js`) | Diganti total oleh `react-native-pdf` |
| `ResizeObserver`, `IntersectionObserver`, scroll-spy (`getBoundingClientRect`) | `onPageChanged` + `onLoadProgress` dari viewer |
| Zoom pinch (`usePdfPinchGesture.js`, `useAnchoredPinchZoom.js`) | `enablePinchZoom` viewer; kalau tidak ada, terima zoom-off untuk v1 dan tulis sebagai batas |
| Ctrl+wheel zoom, Fullscreen API | Tidak ada padanan; dibuang tanpa drama |
| Progres baca per halaman | Disimpan per perangkat (§12) |
| `403` → state `PRO_LOCKED` (:213) | Layar kunci khusus dengan tombol "Beli Pro" yang membuka browser (`Linking.openURL`) |

### 8.3 Batas yang harus diterima v1

- Tidak ada pencarian dalam naskah (butuh indeks teks; PDF gambar tidak punya).
- Tidak ada bookmark awan: progres baca **hanya di perangkat**, karena tidak ada endpoint untuknya. Kalau satu perangkat → dua perangkat membuatmu ingin sinkron, itu pekerjaan backend (§12).
- Buku yang belum diunduh tidak bisa dibaca tanpa jaringan.

### 8.4 Tanda air (bergantung keputusan P2)

Bila M1 dipulihkan di web, RN wajib meniru atau penguji menemukan dua perilaku: overlay nama+ID transaksi di atas halaman, tidak bisa disalin, dan — karena `FLAG_SECURE` sudah memblokir screenshot — tanda air di mobile berfungsi untuk **identifikasi** pembocor lewat foto layar, bukan pencegahan. Kalau P2 memilih menurunkan klaim, baris ini dihapus.

---

## 9. Offline: desain penyimpanan

### 9.1 Tata letak berkas

```
documentDirectory/                    # privat aplikasi; TIDAK terlihat file manager
  naskah/
    <bookId>.<ext>                    # mis. 7f3a....pdf
  reader.db                           # SQLite: tabel `unduhan`
```

**Aturan keras:** jangan pernah menulis ke `/Download`, `/Documents` publik, atau galeri. Alasannya ada di `Master_Memory_Workflow.md` §16.2 dan §10 berkas ini. Folder privat aplikasi juga otomatis hilang saat aplikasi dicabut, yang justru diinginkan untuk naskah terproteksi.

### 9.2 Mekanisme unduh (dan satu hal yang wajib di-probe lebih dulu)

Rantai: `GET /api/books/:id/content` dengan Bearer → **302 ke signed URL Supabase (TTL 300 detik)** → biner.

Probe yang harus dijalankan **sebelum** menulis layar unduh, karena seluruh fitur ini berdiri di atasnya: apakah API unduh `expo-file-system` pada versi SDK yang terpasang bisa mengirim **header `Authorization`** ke `/api/books/:id/content`. Kemungkinan hasilnya tiga:

1. **Bisa + mengikuti redirect** → selesai, satu panggilan.
2. **Header hilang saat redirect lintas-host** (perilaku standar HTTP client) → tetap aman, karena target redirect adalah signed URL yang publik; **tapi** permintaan pertama harus tetap menerima Bearer. Uji nyata, jangan simpulkan.
3. **Tidak bisa mengirim header sama sekali** → jangan pernah menaruh token di query string (token bocor ke log). Alternatif yang benar: endpoint baru di server yang mengembalikan signed URL ke klien (`GET /api/books/:id/content-url`, requireAuth, TTL 300 detik) lalu mobile mengunduh dari URL publik itu. Ini perubahan backend kecil dan sadar-ancaman: signed URL hanya memberi akses baca 5 menit ke satu objek, dan tetap di balik gerbang Pro karena hanya issued untuk pengguna yang lolos `hasActivePro`.

Aturannya juga: **unduhan dimulai segera setelah URL diambil** (TTL 300 detik), satu berkas per antrean, dengan indikator progres, dan **tidak memakai `Cache-Control` tersirat** — server sudah mengirim `no-store` untuk target redirect, jadi jangan mencoba mengakalinya.

### 9.3 Skema `reader.db`

```
tabel unduhan
  user_id                 TEXT NOT NULL   -- pemilik unduhan (lihat §20)
  book_id                 TEXT NOT NULL
  title                   TEXT
  file_uri                TEXT
  bytes                   INTEGER
  pages                   INTEGER          -- hasil hitungan server (R85), bukan ketikan admin
  content_extension       TEXT
  book_updated_at         TEXT             -- pembanding basi
  last_read_page          INTEGER          -- dipindah dari localStorage web
  downloaded_at           TEXT
  terakhir_terverifikasi  TEXT             -- untuk masa tenggang offline 30 hari (§20)
  PRIMARY KEY (user_id, book_id)
```

- **Deteksi basi:** admin bisa mengganti naskah (`content_url` berubah), jadi `book_updated_at` dibanding dengan katalog saat pengguna online; kalau beda, tandai "ada versi baru" di layar Unduhan — jangan diam-diam menimpa (kuota pengguna).
- **Pembuangan:** tidak ada auto-delete. Hapus hanya atas permintaan pengguna, plus tampilkan pemakaian penyimpanan. Kalau perangkat penuh, gagal dengan pesan jelas dan tawaran menghapus unduhan lama.
- **Integritas:** sebelum membuka, cek berkas ada dan ukurannya sama dengan `bytes`; kalau tidak, tandai rusak dan minta unduh ulang. PDF setengah terpotong adalah sumber bug yang paling membingungkan di perangkat lambat.

### 9.4 Perkiraan beban

`CONTENT_MAX_BYTES` = 50 MB (`server/lib/storage.js:11`). Tiga buku yang ada sekarang jauh di bawah itu, tapi rasio harus diuji dengan berkas terbesar, bukan rata-rata. Simpan juga total ukuran di layar Unduhan sebelum men-download, supaya pengguna memutuskan dengan informasi.

---

## 10. Anti-screenshot — spesifikasi pemasangan

- Modul: `expo-screen-capture`. Aktifkan `preventScreenCaptureAsync()` (= `FLAG_SECURE`) **hanya saat `ReaderScreen` ter-mount**, dan matikan di cleanup saat keluar. Hook `usePreventScreenCapture()` di satu titik: `screens/ReaderScreen.js`.
- Berlaku untuk **semua buku**, tanpa perbedaan gratis/Pro (keputusan 4 Nov 2026).
- Yang diblokir: screenshot, rekaman layar, dan thumbnail Recent Apps jadi blank — dan itu akan disalahpahami pengguna sebagai aplikasi error; siapkan teks bantu di layar reader.
- Izin: tidak perlu untuk memblokir di Android 14+. Deteksi (`useScreenshotListener`) di Android ≤13 butuh `READ_MEDIA_IMAGES`; opsional, tidak memblokir v1.
- **Hatch dev:** flag hanya aktif saat `channel === 'production'` (konstanta dari `app.json`/env, lihat `mobile/src/config.js`). Build `preview` harus bisa di-screenshot, tanpa itu tidak ada gambar Reader untuk Bab IV.
- **Probe wajib di HP nyata sebelum menerima desain ini:** perilaku `FLAG_SECURE` di atas **native view PDF** tidak terdokumentasi, dan sebagian ROM pernah menampilkan hitam untuk permukaan hardware-overlay. Kalau hasilnya hitam total, fallback yang benar adalah render halaman ke bitmap di memori lalu tampilkan sebagai `Image` — bukan melepas flag.
- Batas yang ditulis jujur di Bab IV: proteksi ini menaikkan biaya menyalin secara santai, tidak mencegah penyalinan bersungguh-sungguan (berkas di HP, foto layar dengan HP lain, perangkat root, dan penyalinan teks bila HTML di-WebView tanpa `user-select:none`).

---

## 11. Token desain hasil porting

Web menyetel gaya lewat kelas Tailwind + `component.json` yang diinjeksi `src/theme/themeInjector.js`. Mobile tidak memakai itu; yang dipindahkan adalah **nilainya**, ditulis manual ke `mobile/src/theme.js`:

```js
export const colors = {
  brand: { 50:'#F0F7F3', 100:'#E6F1EA', 500:'#1E6B4C', 700:'#14523A', 800:'#0E3D2C', 900:'#082D20' },
  gold:  { 300:'#E5C877', 500:'#B8860B', 700:'#7A5608' },
  cream: { 50:'#FBF8F3', 100:'#F7F2E9', 200:'#F0E8DA', 300:'#E4D9C6', 400:'#D2C2A8' },
  ink:   { 200:'#CFCAC2', 600:'#6B635B', 800:'#2A2521', 900:'#141210' },
  ui:    { bg:'#FBF8F3', card:'#FFFDFA', border:'#E4D9C6' },
  semantic: { success:'#216B4C', danger:'#A62F26', info:'#1E5B8C', warning:'#7A5608' },
};
export const radius = { button: 8, card: 10, modal: 12, input: 8 };
export const type = { body: 16, small: 14, caption: 13, micro: 12, title: 22, h2: 20 };
export const fonts = { sans: 'PlusJakartaSans', display: 'Fraunces', arabic: 'Amiri' };
```

- Tombol primer / tautan = `#14523A`, hover/tekan `#0E3D2C`. Web memakai gradien `135deg #14523A→#0E3D2C` untuk tombol auth — di RN versi gradien cukup disimulasikan satu warna gelap; jangan memasang librari gradien demi 4° warna.
- Bottom tab mengikuti `MobileBottomNav.jsx:15-44`: **Beranda** (`home`), **Kalender** (`calendar`, opsional v1), **Pro** (`sparkles` → di mobile jadi layar "status Pro + buka browser"), **Profil** (`user-round`). Gaya aktif: teks `brand.900`, latar `brand.100`, ikon sedikit membesar.
- Keamanan: `theme.js` adalah satu-satunya tempat warna hex di `mobile/`. Nilai angka diambil dari `component.json`, bukan dari ingatan — kalau `component.json` berubah, hanya berkas ini yang perlu disunting.

---

## 12. Progres baca: satu lubang yang harus kamu ketahui

Web menyimpan `last_read_page_<bookId>` di **localStorage per peramban** (`PdfReaderScreen.jsx:71,88`). Tidak ada endpoint untuk menyinkronkannya. Konsekuensinya: progres di HP tidak muncul di web, dan sebaliknya; ganti HP = progres hilang.

Tiga pilihan, priced:
1. **Biarkan device-only** (nol pekerjaan, tulis sebagai batasan penelitian). *Rekomendasi v1.*
2. **Endpoint sinkron** (`GET`/`PUT /api/users/reading-progress`, 2 kolom baru + 1 slice + 1 pemanggilan di dua klien): ±0,5 hari, dan ini juga memperbaiki web (pengguna yang membersihkan localStorage hari ini kehilangan progres tanpa tahu).
3. Simpan di AsyncStorage saja → sama dengan (1) tapi lebih rapuh.

---

## 13. Pembaruan aplikasi (opsional — menunggu keputusan)

Ditandai opsional di `Master_Memory_Workflow.md` §16.2 (baris OTA & halaman unduh, plus daftar yang dibatalkan). Kalau jadi dikerjakan, urutan kerjanya begini:

1. Buktikan lebih dulu bahwa **OTA bekerja pada APK sideload** — dokumentasi Expo tidak membahas distribusi di luar store, jadi ini asumsi, bukan fakta. Tes = satu APK dipasang, satu perubahan teks di-publish lewat branch update, lalu lihat apakah klien mendapatkannya.
2. Kalau terbukti: layar Pengaturan memuat tombol "Cek pembaruan" yang memanggil `checkForUpdateAsync()` → `fetchUpdateAsync()` → `reloadAsync()` (perilaku bawaan hanya menerapkan update pada launch berikutnya, jadi tombol tanpa `reloadAsync` akan terlihat bohong).
3. Kalau terdeteksi perubahan **native** (perbedaan `runtimeVersion`): unduh APK baru dari GitHub Releases dan panggil installer (`REQUEST_INSTALL_PACKAGES`).
4. Kuota gratis 1.000 pemakai aktif-per-bulan untuk update; tidak ada flag "update wajib" bawaan, jadi pemaksaan versi minimum adalah gerbang di sisi Express.

Kalau tidak jadi: satu APK, distribusi QR di meja UAT, instal ulang manual selama jendela pengujian.

---

## 14. Urutan pengerjaan, dengan titik bukti

Setiap langkah punya "titik bukti" — kalau belum lewat, jangan lanjut ke langkah berikutnya. Ini bagian yang paling mengurangi kesalahan, karena urutan ini disusun dari asumsi yang paling mungkin salah.

| # | Pekerjaan | Titik bukti | Estimasi |
|---|---|---|---|
| 0 | Prasyarat P1–P7 (termasuk keystore + backup, dua HP beda merek, keputusan §20) | Keystore ada di luar repo dan bisa dibuka; dua HP terdeteksi `adb devices`; `npm run health` 7/7 | — |
| **1a** | **Naikkan scaffold yang sudah ada dari SDK 53 ke SDK 58** (`npx expo install expo@^58`, lalu `npx expo install --fix`, lalu `npm install` di `mobile/`) | Metro start tanpa error resolusi paket, aplikasi lama masih terbuka di perangkat, `git diff` pada `mobile/package.json` seluruhnya hasil perintah — bukan angka yang diketik tangan | 0,5–1 hari |
| 1 | Scaffold Expo + `mobile/` berdiri + **`app.json` §17 lengkap** (package, cleartext dev, ikon, adaptive icon, permission) + penjaga build sudah ada | Metro start, layar kosong ter-render di **perangkat**, `npm run check` tetap hijau, ikon terlihat di launcher | 0,5 hari *(sudah dikerjakan scaffold 53 — tinggal verifikasi setelah 1a)* |
| 2 | **Probe A:** `/api/books/:id/content` — header/redirect/download pada **API `expo-file-system` baru** (lihat §9.2) | Satu PDF nyata dari DB tersimpan di folder privat dan terbuka | 0,5 hari |
| 3 | **Probe B:** `FLAG_SECURE` di atas native PDF view, di **dua** HP nyata | Screenshot diblokir **dan** isi naskah tetap terlihat (bukan hitam) | 0,5 hari |
| 4 | `client.js` + SecureStore + `AuthContext` | Login, restore sesi saat buka aplikasi, 401 → logout bersih | 1 hari |
| 5 | AuthScreen (Masuk/Daftar/Verifikasi OTP) | Daftar → 202 → OTP (pakai `EXPOSE_DEV_OTP=1`) → 201 → masuk | 1 hari |
| 6 | Katalog + kartu + sampul + status offline | Katalog tampil saat pesawat-mode dari cache; PRO badge benar | 1 hari |
| 7 | Reader PDF (berkas lokal) + progres + kunci 403 | Buku terbaca; keluar/masuk aplikasi melanjutkan halaman; buku terkunci tidak terbuka | 1,5 hari |
| 8 | DOCX/TXT via WebView | Satu DOCX nyata tampil benar, teks tidak bisa disalin | 1 hari |
| 9 | Unduhan + manifest SQLite (kunci `(user_id, book_id)`) + deteksi basi + hapus + tenggang 30 hari | Unduh, matikan jaringan, buka; ganti naskah di admin → "ada versi baru"; akun lain di HP yang sama tidak melihat unduhanmu | 1,5 hari |
| 10 | Profil/Pengaturan/Unduhan, hatch screenshot, banner offline | Semua keputusan UX di berkas ini punya wujud | 1 hari |
| 11 | **Lapisan perilaku perangkat (§19):** back handler reader melepas `FLAG_SECURE`, safe area, keyboard, `rupiah.js`/`tanggalWib.js` tanpa `Intl`, `accessibilityLabel` | Back dari reader tidak keluar aplikasi dan screenshot di layar lain kembali normal; "Rp 25.000" tampil benar di HP; form login tidak tertutup keyboard | 1 hari |
| 12 | Build APK `preview` (debug keystore) lalu `production` (release keystore); distribusi QR ke penguji | Install **upgrade** di atas versi sebelumnya berhasil tanpa uninstall (bukti `versionCode` & signing benar); nomor versi terlihat di Pengaturan | 0,5 hari |
| — | (opsional) OTA + tombol update | lihat §13 | 1–2 hari |
| — | (opsional) Halaman unduh | lihat `Master_Memory_Workflow.md` §16.2 | 1 hari |

Total v1 tanpa opsi: **±13 hari kerja** (±12 hari rencana + 0,5–1 hari untuk langkah 1a menaikkan scaffold yang sudah ada dari SDK 53 ke 58). Angka ini bukan janji — kalau Probe A jatuh ke kasus (3), tambahkan ±0,5 hari untuk endpoint `content-url` di server; kalau `react-native-pdf` belum kompatibel SDK 58, yang lebih murah adalah fallback ke SDK 57 (§3.1 butir 4), bukan menulis viewer PDF sendiri.

---

## 15. Risiko dan ketidakpastian

| Risiko | Kalau terjadi | Mitigasi yang sudah dirancang |
|---|---|---|
| OTA tidak bekerja pada APK sideload | Tidak ada pembaruan tanpa instal ulang | Sudah ditandai opsional (§13); distribusi manual tetap sah untuk penelitian |
| `FLAG_SECURE` membuat native PDF view hitam | Reader tidak bisa dibaca | Render halaman ke bitmap lalu tampilkan sebagai `Image` (§10) |
| API unduh `expo-file-system` tidak bisa kirim header | Offline tidak jalan seperti desain | Endpoint `content-url` (§9.2 kasus 3) |
| `react-native-pdf` menolak sebagian PDF naskah | Buku tertentu tidak terbuka | Uji dengan **semua** buku yang ada di DB di langkah 2, bukan PDF contoh |
| `/api/books/:id/html` untuk DOCX besar menembus batas respons function Vercel (4,5 MB) | Layar DOCX gagal hanya di produksi | Ukur dengan DOCX terbesar di DB; kalau tembus, tambahkan paginasi/`chunk` di server atau minta unduh berkas + konversi native |
| `content_size` tidak ada di beberapa baris lama | Ukuran di layar Unduhan `undefined` | `normalizeBook` sudah menormalkan nullable; tampilkan "—" bukan 0 KB |
| Token JWT 12 jam tanpa refresh | Pengguna terlempar ke login di tengah membaca | Sambut dengan pesan baik-baik, simpan halaman terakhir sebelum logout, pulihkan setelah masuk lagi. Jangan menulis refresh token "diam-diam" — server tidak punya endpointnya |
| Token di AsyncStorage | Pencurian sesi di perangkat root | `expo-secure-store` di §6, dan itu alasan kenapa `client.js` tidak boleh disalin apa adanya dari web |
| Progres baca tidak sinkron | Ditanyakan penguji/pengguna | Keputusan sadar §12, ditulis sebagai batasan |
| Keystore release hilang | Tidak ada jalur untuk memasang versi baru di atas versi lama; semua penguji harus uninstall dan kehilangan buku terunduh | Backup dua tempat, di luar repo, **sebelum** build pertama (§18). Ini satu-satunya kejadian tak terpulihkan di proyek ini |
| HTTP polos ditolak Android saat development | Semua request gagal dengan pesan yang tidak menjelaskan, dan waktu habis menyelidiki jaringan | `usesCleartextTraffic: true` khusus build dev/preview (§17); `false` di production |
| `Intl` Hermes jatuh ke locale `en-US` | "Rp 25.000" tampil sebagai "25,000" hanya di HP — tidak kelihatan saat dites di Node maupun web | Formatter manual `rupiah.js`/`tanggalWib.js` (§19); jangan port `formatUtils.js` apa adanya |
| Back fisik keluar aplikasi dari reader | `FLAG_SECURE` tertinggal menyala, atau halaman terakhir tidak sempat tersimpan | `BackHandler` dengan urutan simpan → lepas flag → pop (§19); dibuktikan di langkah 11 |
| Satu HP dipakai beberapa akun | Buku terunduh milik A terbuka untuk B | Manifest berkunci `(user_id, book_id)` + verifikasi ulang tiap 30 hari (§20) |
| `react-native-pdf` ^6.7.7 belum kompatibel RN 0.88 / New Architecture | Reader PDF mati total, dan itu inti aplikasi | Fallback resmi **SDK 57** (§3.1 butir 4). Jangan menulis viewer PDF sendiri, jangan mematikan new arch — keduanya lebih mahal |
| R8 minification (default release di SDK 58) mematahkan library refleksi | Reader berjalan normal di dev/preview, **hitam atau crash di APK release** yang dibagikan ke penguji | §18 butir 6: satu tes APK release di HP nyata sebelum distribusi; keep-rules terarah, bukan mematikan R8 |
| Branch `mobile-app` dan `main` berjalan terpisah | Kode mobile bicara ke API produksi yang sudah punya `/qris/reconcile` dan `pages` hasil hitungan, sementara checkout lokal masih lama — gejalanya "sudah diperbaiki tapi masih salah" | `git merge origin/main` secara rutin (bukan `git pull` — lihat §2 P3). Sudah dilakukan 4 Nov 2026 di `a437893` |

---

## 16. Definisi selesai v1

1. Aplikasi terpasang dari satu file APK, tanpa Play Store.
2. Pengguna yang sama bisa masuk di web **dan** di aplikasi, satu akun, satu status Pro.
3. Buku dapat dibaca offline penuh setelah diunduh; indikator "tersimpan" terlihat; penghapusan berhasil.
4. Screenshot dan rekaman layar diblokir **selama jendela buku terbuka**; build `preview` masih bisa di-screenshot untuk Bab IV.
5. Buku terkunci tidak dapat dibuka tanpa Pro, dan penegakkannya ada di server (bukan hanya UI).
6. Tidak ada satu pun kode `src/` web yang disentuh; `npm run build` dan `npm run check` web tetap hijau setelah seluruh pekerjaan mobile masuk.
7. Berkas ini dan `Master_Memory_Workflow.md` §16.2 sudah mencerminkan apa yang benar-benar terjadi, termasuk hal yang gagal.
8. Batas-batas (§8.3, §10, §12) tertulis di Bab IV sebagai batasan, bukan sebagai keberhasilan.
9. APK baru bisa **upgrade install** di atas APK lama tanpa uninstall dan tanpa kehilangan buku terunduh — bukti bahwa keystore dan `versionCode` dikelola dengan benar.
10. Tombol back fisik dari reader tidak keluar aplikasi, melepas `FLAG_SECURE`, dan halaman terakhir tersimpan.
11. Format rupiah dan tanggal WIB benar **di perangkat**, bukan hanya di Node (`Intl` tidak dipercaya, §19).
12. Buku terunduh tidak bisa dibuka akun lain di HP yang sama, dan logout tidak menghapusnya tanpa persetujuan (§20).

---

## 17. Konfigurasi Android & `app.json`

Lapisan ini tidak menyentuh logika aplikasi, tapi menentukan apakah aplikasinya bisa dipasang dan apakah request dev-mu sampai sama sekali.

```json
{
  "expo": {
    "name": "Wahidiyah Book",
    "slug": "wahidiyah-book",
    "scheme": "wahidiyahbook",
    "version": "1.0",
    "orientation": "portrait",
    "assetBundlePatterns": ["**/*"],
    "android": {
      "package": "id.wahidiyah.book",
      "versionCode": 1,
      "minSdkVersion": 24,
      "usesCleartextTraffic": true,
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon-foreground.png",
        "backgroundColor": "#FBF8F3"
      },
      "permissions": ["android.permission.INTERNET"]
    }
  }
}
```

| Butir | Aturan | Kenapa |
|---|---|---|
| `android.package` | **Dipilih sekali, tidak pernah berubah.** | Upgrade install menolak APK dengan `applicationId` berbeda — berubah berarti semua penguji harus uninstall dan kehilangan buku terunduhnya. Catatan: domain `wahidiyah.org` bukan milik proyek ini, jadi pakai `id.wahidiyah.book` (reverse-DNS id negara + nama) dan jangan klaim domain orang. |
| `usesCleartextTraffic` | Hanya boleh `true` di build `development`/`preview`. Production harus `false`. | **Ini jebakan №1 sesi pertama.** Android menolak HTTP polos sejak `targetSdk` 28, sementara rencana dev di §5.1 memakai `http://<IP-LAN>:5000/api`. Tanpa flag ini, semua request gagal dengan pesan yang tidak menjelaskan apa pun. Kalau versi SDK yang terpasang tidak mengekspos kunci ini, jangan mengarang — pakai config plugin `networkSecurityConfig`, dan cek dokumentasi SDK yang sedang terpasang. |
| `minSdkVersion` | 24 | Menutup hampir semua HP Android yang dipakai jamaah hari ini; di bawah itu tidak ada penguji. |
| `permissions` | Hanya `INTERNET`. `REQUEST_INSTALL_PACKAGES` **tidak dipasang** kecuali self-update APK (§13) jadi dikerjakan. | Meminta izin yang tidak dipakai menaikkan curiga penguji dan tidak memberi manfaat. |
| `scheme` | `wahidiyahbook` | Belum ada yang memakai (QRIS + polling tidak butuh deep link, Google OAuth ditunda). Ditetapkan sekarang supaya tidak berubah nanti. |
| Ikon & splash | `assets/` + `adaptiveIcon` wajib diisi | APK tanpa ikon terlihat seperti build gagal. Adaptive icon Android punya jebakan sendiri: foreground 108dp dengan 66dp aman di tengah, kalau tidak ikon terpotong bulat. |
| `targetSdkVersion` | **Ikut default build SDK 58, jangan di-override** | Override manual membuat APK tidak lolos kebijakan toko (kalau nanti naik) dan membuat aturan cleartext tidak sesuai yang diasumsikan §17. Nilai aktual dibaca dari hasil build, bukan ditebak. |
| `newArchEnabled` | Tidak perlu ditulis — **wajib** dan tidak bisa dimatikan sejak SDK 55 | Jangan pernah menulis `newArchEnabled: false` sebagai "jalan pintas" saat library bermasalah. Di SDK 58 itu bukan pilihan; yang benar adalah fallback SDK 57 atau ganti library. |

**Status nyata saat ini:** `mobile/app.json` hasil scaffold SDK 53 **sudah cocok** dengan tabel di atas — `package: id.wahidiyah.book`, `versionCode: 1`, `minSdkVersion: 24`, `usesCleartextTraffic: true`, `windowSoftInputMode: adjustResize`, `adaptiveIcon` dengan latar `#FBF8F3`, dan permission hanya `INTERNET`. Yang perlu diawasi saat naik ke 58 hanyalah `usesCleartextTraffic`: ia **harus `false`** di build production, dan nilai itu sekarang masih `true` di berkas.

## 18. Signing & kebijakan versi

**Ini satu-satunya bagian proyek yang tidak bisa dipulihkan kalau hilang.** Simpan dulu, baru bangun.

1. **Buat keystore release sekali, di luar repo:**
   ```
   keytool -genkeypair -v -keystore E:/keystore/wahidiyah-release.keystore \
     -alias wahidiyah -keyalg RSA -keysize 2048 -validity 10000
   ```
   `keytool` ikut JDK yang dipasang Android Studio. Jangan menaruhnya di `mobile/` — repo ini **public**; sebagai penjaga kedua, tambahkan `*.keystore` dan `mobile/**/*.keystore` ke `.gitignore`.
2. **Backup dua tempat** (mis. E: + cloud pribadi), dan sandi di password manager. Konsekuensi kehilangan keystore: tidak bisa lagi memasang versi baru di atas versi lama → setiap penguji harus uninstall → **semua buku terunduh hilang dari perangkat mereka**. Tidak ada jalur lain.
3. **Build debug memakai `~/.android/debug.keystore`** (dibuat otomatis) untuk probe awal; **jangan pernah distribute APK debug** ke penguji, karena berpindah dari debug ke release juga menuntut uninstall.
4. **`versionCode` naik +1 setiap APK yang dibagikan**, `versionName` mengikuti versi manusia. Android menolak install kalau `versionCode` lebih rendah, jadi tanpa aturan ini "coba versi baru" akan gagal diam-diam dan disalahpahami sebagai bug aplikasi.
5. Tampilkan keduanya di layar Setting (`expo-application` / `Constants.expoConfig`) — tanpa itu kamu tidak akan tahu versi mana yang terpasang di HP penguji saat mereka melapor.
6. **Tes APK `release`, bukan hanya `preview`/dev.** SDK 58 menyalakan **R8 minification secara default di build release**, dan R8 bisa mematahkan library pihak ketiga yang memakai refleksi — termasuk viewer PDF. Kegagalan jenis ini tidak muncul di Metro/dev, jadi satu langkah di akhir bukan formalitas: pasang APK release di HP nyata, buka satu buku, dan pastikan tidak hitam/error. Kalau R8 menjadi penyebabnya, pertahankan aturannya lewat `proguard-rules.pro` (keep rules untuk paket yang bersangkutan), jangan matikan R8 sekalian.

## 19. Perilaku perangkat yang tidak muncul di emulator default

| Aspek | Aturan |
|---|---|
| **Tombol back fisik** | Di `ReaderScreen`, `BackHandler` wajib: (1) simpan halaman terakhir, (2) **lepas `FLAG_SECURE`** lewat cleanup `usePreventScreenCapture`, (3) baru `navigation.pop()`. Kalau back keluar aplikasi tanpa unmount, flag bisa tertinggal menyala di layar berikutnya — dan screenshot debug-mu sendiri ikut terblokir, yang persis masalah yang sedang kita hindari di §10. |
| **Safe area** | Bottom tab, top bar reader, dan modal harus dibungkus `react-native-safe-area-context` (`useSafeAreaInsets`). Paketnya sudah ikut dipasang bersama React Navigation, jadi ini pemakaian, bukan dependensi baru. Tanpa itu, HP berponi menutupi tombol. |
| **Keyboard** | Form login/daftar pakai `KeyboardAvoidingView` dengan `behavior="padding"` di Android; `android:windowSoftInputMode="adjustResize"` (Expo mengatur ini, tapi verifikasi — kalau tidak, tombol "Masuk" tersembunyi di belakang keyboard dan itu terlihat seperti aplikasi rusak). |
| **`Intl` di Hermes hanya sebagian** | **Terverifikasi di kode ini:** `src/lib/formatUtils.js:1` membuat `new Intl.NumberFormat('id-ID')` di level modul, dan ada **11 titik `toLocale*`** di `src/`. Rencana §6 menyebut modul itu "murni, salin" — koreksi: jangan mengandalkan `Intl` untuk angka rupiah & tanggal WIB di Hermes, karena locale data bisa jatuh ke format `en-US` (`25,000` alih-alih `Rp 25.000`). Tulis `mobile/src/lib/rupiah.js` (pengelompokan ribuan manual dengan titik) dan `tanggalWib.js` (geser +7 jam, pola yang sama dipakai `server/lib/midtrans.js` untuk `jakartaOrderTime`). Kalau tetap ingin memakai `Intl`, buktikan lebih dulu di perangkat nyata, bukan di Node. |
| **Aksesibilitas** | Ikon-only button (bottom tab, toolbar reader) wajib `accessibilityLabel`; pakai `accessibilityRole` yang benar (button/link/image); target sentuh minimal 44dp. Ini bukan hiasan: dokumen induk (§4, §9) mengklaim 17 pasangan kontras WCAG AA, dan kalau Bab IV menyebut aksesibilitas, RN harus membayarnya sendiri — kelas kontras tidak ikut ter-porting dari CSS. |
| **Orientasi & status bar** | Portrait saja (sudah di `app.json`). Jangan biarkan zoom PDF memaksa landscape. |
| **Muat font sebelum render pertama** | `expo-font.loadAsync` di entry, tampilkan splash sampai selesai; tanpa itu teks berubah mendadak setelah 300 ms dan terlihat seperti bug. |

## 20. Akun, unduhan, dan perangkat yang dipakai bersama

Keputusan default di bawah **bisa diubah pemilik proyek**; yang penting jangan dibiarkan muncul sebagai bug di ruang sidang.

| Situasi | Perilaku yang direncanakan | Alasan |
|---|---|---|
| Pengguna **keluar (logout)** | Hapus token dari SecureStore + kosongkan state. **Buku terunduh TIDAK dihapus**, tapi terkunci ke `user_id` yang mengunduhnya. | Menghapus saat keluar menghukum kasus nyata di lapangan: satu HP dipakai beberapa jamaah, dan kuota mereka yang menanggung unduh ulang. Mengikat ke akun membuat pengguna lain di HP yang sama tidak bisa membuka naskah orang lain lewat aplikasi. |
| Membuka buku terkunci yang sudah terunduh, dalam keadaan offline | Boleh, dengan masa tenggang **30 hari** sejak `terakhir_terverifikasi` (kolom baru di manifest), lalu wajib online untuk verifikasi ulang `is_pro`. | Tanpa tenggang, fitur offline tidak ada artinya; tanpa batas, satu unduhan jadi langganan Pro seumur hidup. |
| Pro **kedaluwarsa** setelah buku terunduh | Tetap bisa dibaca; layar Unduhan menampilkan status "Pro berakhir". Jangan hapus diam-diam. | Konsisten dengan §5.5 dan tidak merusak janji offline. |
| Buku **dihapus admin** | Katalog mengembalikan 404 → kartu ditandai "tidak tersedia" + tawaran hapus berkas. Jangan pernah menghapus tanpa persetujuan. | Berkas lokal adalah salinan satu-satunya yang dimiliki pengguna saat offline; menghilangkannya tanpa kabar terasa seperti aplikasi rusak. |
| Dua akun di satu HP | Manifest unduhan **berkunci (user_id, book_id)**, bukan book_id saja. | Ini mengubah skema §9.3 — lihat catatan di bawah tabel itu. |

**Konsekuensi skema:** kolom `user_id` harus ikut di `tabel unduhan`, dan kunci utamanya jadi `(user_id, book_id)`. Tanpa ini, satu baris "sudah diunduh" berlaku untuk semua akun di perangkat itu.

**Batas yang harus diterima apa adanya:** semua ini tidak melindungi dari perangkat di-root atau berkas yang disalin lewat aplikasi pengelola file berwenang — folder privat aplikasi hanya tertutup bagi aplikasi lain, bukan bagi pemilik perangkat. Bab IV menuliskannya sebagai batas, bukan sebagai keberhasilan.

## 21. Daftar "jangan lakukan" (ditarik dari kesalahan yang paling mungkin)

1. **Jangan** mem-porting kelas Tailwind atau mengimpor `src/lib/styles.js`. Salin nilainya ke `theme.js`.
2. **Jangan** menaruh `mobile/` di branch jangka panjang tanpa merge; folder itu sudah mengisolasi, branch hanya membuat kerjaan tidak ter-deploy.
3. **Jangan** memakai WebView shell untuk "hemat" — itulah yang membuat offline gagal.
4. **Jangan** memuat PDF lewat Base64/blob seperti web; tulis ke berkas, buka dari URI berkas.
5. **Jangan** menaruh token di query string untuk mengakali header download.
6. **Jangan** menaruh naskah di `/Download` atau folder publik.
7. **Jangan** menyalakan `isProduction` otomatis dari prefix kunci (`Mid-server-…` = uang nyata).
8. **Jangan** merancang kartu buku dengan `author`/`category`/`subtitle`/`samplePages` — field itu tidak ada di API.
9. **Jangan** menambah interval polling apa pun "buat jaga-jaga" — limiter dihitung dari perilaku web.
10. **Jangan** memasang Google OAuth lewat callback browser yang ada sekarang; ia tidak bisa dipakai klien native.
11. **Jangan** menghapus unduhan diam-diam saat Pro kedaluwarsa.
12. **Jangan** mengimpor apa pun dari `src/` atau `server/` ke `mobile/`.
13. **Jangan** mengaktifkan `preventScreenCaptureAsync()` di seluruh aplikasi — kamu akan kehilangan screenshot debug dan gambar skripsi.
14. **Jangan** mengabaikan Probe A dan B dengan alasan "nanti juga jalan"; keduanya menentukan bentuk layar unduh dan reader, dan itu yang paling mahal dibongkar kalau telat.
15. **Jangan** menaruh `.keystore` di dalam repo — repo ini public, dan kehilangan keystore berarti semua penguji harus uninstall lalu kehilangan buku terunduhnya.
16. **Jangan** mengubah `android.package` setelah APK pertama dibagikan.
17. **Jangan** memakai `usesCleartextTraffic: true` di build production.
18. **Jangan** mengandalkan `Intl` Hermes untuk format rupiah/tanggal — lihat §19, ini sudah terverifikasi sebagai risiko nyata pada kode yang mau diport.
19. **Jangan** melepas `FLAG_SECURE` lewat jalan pintas (mis. flag global) saat screenshot Bab IV dibutuhkan — pakai build `preview`, supaya yang terpasang di HP penguji tetap terkunci.
20. **Jangan** menghapus buku terunduh saat logout atau saat Pro kedaluwarsa tanpa persetujuan pengguna — lihat §20.
21. **Jangan** menulis versi paket dengan tangan. `npx expo install` yang memilih; `npx expo install --fix` yang merapikan (§3.1).
22. **Jangan** mengganti SDK setelah Probe A/B lolos — menggantinya berarti mengulang keduanya.
23. **Jangan** menulis `newArchEnabled: false` sebagai jalan pintas saat library bermasalah; legacy architecture sudah dihapus sejak SDK 55 dan tidak bisa dinyalakan lagi.
24. **Jangan** membagikan APK yang hanya dites di dev/preview. R8 menyala default di release, dan kegagalan jenis itu tidak tampak sebelum dipasang di HP nyata (§18 butir 6).

---

## 22. Rujukan silang

- Keputusan dan alasan: `Master_Memory_Workflow.md` §16.2 (keputusan & alasan)
- Batasan penelitian sandbox + kalimat siap pakai Bab V: §11.4
- Riwayat R83: §15.13
- Batas distribusi APK: `reference-apk-distribution-limits` (GitHub Releases, bukan Vercel)
- Jebakan verifikasi Tailwind/Prettier: sudah dipasang di `.prettierignore` dan `src/index.css`
