# Wahidiyah Book — Aplikasi Mobile (React Native + Expo)

Folder ini adalah aplikasi mobile terpisah dari web (`src/`), sesuai `Mobile-app plan.md`.
Prinsip: **tidak ada impor dari `src/` atau `server/`** — logika murni disalin ke `src/lib/` dengan tanda asal-usul.

## Menjalankan

```bash
cd mobile
npm install
npm start          # Metro bundler
npm run android    # atau install APK sideload dari folder App
```

## Konfigurasi API

`src/config.js` — URL absolut karena RN tidak punya origin (§5.1):

- development: `http://<IP-LAN-mesin-kamu>:5000/api` (HP dan laptop satu WiFi sama; `localhost` di HP bukan laptop).
- production: URL Vercel (`EXPO_PUBLIC_API_PROD_URL`).
- `usesCleartextTraffic: true` HANYA untuk build dev/preview di `app.json`; production wajib `false`.

## Struktur

- `src/theme.js` — token dari `component.json` (satu-satunya tempat hex).
- `src/api/` — `client.js` (padanan `src/lib/api.js` tanpa DOM), `auth.js`, `books.js`, `subscriptions.js`.
- `src/storage/` — SecureStore (token), kv (AsyncStorage), `downloads.js` (SQLite + berkas privat).
- `src/state/` — `AuthContext`, `BookContext`.
- `src/nav/` — `Root.js` (Stack Auth|App), `Tabs.js` (Beranda, Profil).
- `src/screens/` — Auth, VerifyEmail, ForgotPassword, Home, Reader (PDF/HTML), Downloads, Settings.
- Reader: PDF selalu ditulis ke berkas lokal dulu lalu dibuka dari URI (`react-native-pdf`); DOCX/TXT via WebView dari `/api/books/:id/html`.
- Anti-screenshot (`FLAG_SECURE`) aktif hanya saat ReaderScreen ter-mount; build `preview` bisa di-screenshot untuk skripsi.

## Batasan v1 (sadar, bukan bug)

- Tidak ada pembayaran QRIS di aplikasi — status Pro + tombol "Beli Pro lewat browser".
- Google OAuth ditunda (callback browser tidak bisa dipakai klien native).
- Progres baca hanya di perangkat (tidak ada endpoint sinkron).
- Unduhan terikat `(user_id, book_id)`; logout tidak menghapus unduhan; tenggang offline 30 hari.
- OTA ditandai opsional — v1 distribusi APK sideload lewat GitHub Releases.
