# Project: Wahidiyah Book Monorepo Optimization & Admin UI Redesign

## Architecture
The repository consists of four coordinated sub-projects plus root orchestration utilities:
1. `landing-page/`: Modern Vite 6 + React 19 single-page landing site with promotional sections and APK download CTAs.
2. `admin-dashboard-web/`: Vite 6 + React 19 + Tailwind v4 administrative dashboard managing books, users, agendas, carousels, and transaction logs with Supabase Cloud backend.
3. `mobile-app/`: Expo SDK 58 + React Native 0.88 mobile application providing reader, catalog, membership Pro, and calendar features.
4. `server/`: Node.js Express backend integrating Midtrans QRIS Core API, Supabase Cloud database, Gmail API OTP, and WhatsApp (Fonnte).
5. Root tooling: Shared Tailwind config, verification test suites (`tests/`), automation scripts (`scripts/dev.js`, `scripts/health-check.js`, `scripts/clean-ports.js`), and root PWA web app (`src/`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Purge orphaned files in `landing-page/src/` | Delete 80+ unused files across legacy components, context, data, features, lib, and theme folders | M1 | Survey 1 |
| 2 | Clean up `vite.config.landing.js` aliases | Remove unused path aliases (`@features`, `@ui`, `@lib`, `@data`, `@context`, `@theme`) | M1 | Survey 1 |
| 3 | Purge orphaned files in `admin-dashboard-web/` | Delete redundant `AdminDashboard.jsx`, 8 unreferenced UI components, and 5 dead lib helpers | M1 | Survey 1 & 3 |
| 4 | Purge orphaned files in `mobile-app/` | Delete unreferenced `DownloadsScreen.js` and `.claude/` config residue | M1 | Survey 1 |
| 5 | Clean up root dangling secrets | Remove dangling OAuth `client_secret_*.json` files | M1 | Survey 1 |
| 6 | Centralize APK download URL | Extract hardcoded APK download links from 6 landing UI files into `src/config/constants.js` with `VITE_APK_DOWNLOAD_URL` | M2 | Survey 2 |
| 7 | Create `.env.example` templates | Provide documented environment variable templates for root, `landing-page/`, `admin-dashboard-web/`, `mobile-app/`, and `server/` | M2 | Survey 2 |
| 8 | Centralize landing page config | Create `landing-page/src/config/constants.js` for API URLs, timeouts, and Google OAuth | M2 | Survey 2 |
| 9 | Centralize admin dashboard config | Create `admin-dashboard-web/src/config/constants.js` and extract Supabase / API fallback URLs | M2 | Survey 2 |
| 10 | Centralize mobile app config & add timeout | Create `mobile-app/src/config/constants.js`, extract API/OAuth configs, and add abort timeout to `client.js` | M2 | Survey 2 |
| 11 | Centralize server environment & update ports script | Document server secrets in `server/.env.example` and update `scripts/clean-ports.js` to release ports 3001 and 8081 | M2 | Survey 2 |
| 12 | Redesign Admin Dashboard Shell & Color Palette | Eliminate `#FFFFFF` pure white; adopt warm ivory `bg-[#FFFDFA]` (`ui.card`), `bg-cream-50`, emerald green (`brand`), and soft gold (`gold`) | M3 | Survey 3 |
| 13 | Responsive Sidebar & Navigation | Implement collapsible sidebar (expanded 256px, compact 72px, mobile drawer) with smooth transitions | M3 | Survey 3 |
| 14 | Modern Translucent Header | Header with `bg-cream-50/85 backdrop-blur-md`, breadcrumbs, live system status pill, and admin avatar | M3 | Survey 3 |
| 15 | Enhanced 4-Card Dynamic KPI Grid | 4-card metric grid with gradient icon containers, bold typography, conversion rates, and financial formatting | M3 | Survey 3 |
| 16 | Data Tables with Search & Filter Controls | Add live search and filter controls to Books Tab and Users Tab | M3 | Survey 3 |
| 17 | Polished Modals & Drag-and-Drop Dropzones | Redesign `BookModal` with clear dropzones, file size calculation, and upload status | M3 | Survey 3 |
| 18 | Data Flow & CRUD Hook Preservation | Retain 100% of custom hooks (`useAdminDashboardData`, `useAdminBookEditor`, `useAdminEventEditor`, `useAdminCarouselEditor`, Supabase signed storage uploads) with zero regressions | M3 | Survey 3 |
| 19 | Dual-Track Full Build & Test Verification | Run `build:landing`, `build:admin`, `build`, `health`, `format:check`, node test suites, and adversarial audit | M4 | Survey 1, 2, 3 |
| 20 | Final Victory Deployment & Git Sync | Commit all verified changes, verify 3 uploaded books in Supabase, push to git origin/main, and prepare Vercel deployment | M5 | User Follow-up |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Dead Code & Orphaned Files Cleanup | Purge unused files across `landing-page/`, `admin-dashboard-web/`, `mobile-app/`, and root; retain critical files (`Field.jsx`, `supabaseConfig.js`, `AdminLogin.jsx`, root `src/`) | none | DONE |
| M2 | Centralize Hardcoded Config & Env Variables | Create `.env.example` templates, `src/config/constants.js` across sub-projects, centralize APK URL, add mobile timeout, and update port cleanup | M1 | DONE |
| M3 | Admin Dashboard Modern UI Redesign | Rework `admin-dashboard-web` UI into modern minimalist Wahidiyah Book theme (emerald, gold, cream-50), responsive sidebar, KPI cards, table filters, polished modals | M2 | DONE |
| M4 | Full Build & Regression Gate Verification | Build all targets, run test suites, execute adversarial challenges and forensic integrity audit | M3 | DONE |
| M5 | Final Victory Deployment & Git Sync | Commit all verified changes, verify 3 uploaded books in Supabase, push to origin/main, and deploy Vercel production | M4 | IN_PROGRESS |

## Implementation Notes (M3 & M4)

- **M3 shell**: `admin-dashboard-web/src/features/admin/components/` berisi `AdminSidebar.jsx`
  (expanded 256px / compact 72px / drawer mobile), `AdminHeader.jsx` (translusen, breadcrumbs,
  status pill, avatar), dan `StatCard.jsx` (kartu KPI gradien). `App.jsx` tetap memegang seluruh
  hook `useAdminDashboardData`, `useAdminBookEditor`, `useAdminEventEditor`, dan alur ekspor Excel.
- **M3 tabs**: `OverviewTab` (4 KPI + rasio konversi + donut + ringkasan keuangan), `BooksTab`
  (pencarian + filter Gratis/Pro), `UsersTab` (pencarian + filter Admin/Pro/Reguler), `BookModal`
  (dropzone seret-lepas), `AdminLogin` (kartu ivory, aksen emas). Tidak ada `bg-white` murni.
- **Token warna**: shade `brand-950` (`#041C14`) ditambahkan ke `component.json`, `src/index.css`,
  dan `tailwind.config.js` karena dipakai gradien sidebar/kartu namun sebelumnya tidak terdefinisi.
- **M4 test debt**: tes usang yang merujuk fitur reader/QRIS yang dipindahkan ke root `src/`
  diperbarui (path, EAS project ID `ef5df259…`, konstanta APK terpusat, fokus trap).
  `scripts/clean-ports.js` kini memakai `netstat` + `tasklist` (bukan PowerShell) dengan retry,
  sehingga bebas port 3001/8081 deterministik di Windows.
- **Buku**: 3 judul dari `buku-siap-upload/` terverifikasi nyata di tabel `books` dan bucket
  `buku/naskah/` Supabase (lihat `scripts/seed-buku-siap-upload.mjs`).

## Code Layout
- `landing-page/`:
  - `src/App.jsx`, `src/main.jsx`, `src/index.css`
  - `src/components/layout/` (Navbar, Footer)
  - `src/components/sections/` (Hero, Features, Preview, InstallGuide, Faq, DownloadCta)
  - `src/config/constants.js` (Centralized config: APK URL, API, timeouts)
  - `.env.example`
- `admin-dashboard-web/`:
  - `src/App.jsx`, `src/main.jsx`, `src/index.css`
  - `src/features/admin/` (`OverviewTab`, `BooksTab`, `UsersTab`, `EventsTab`, `CarouselTab`, `LogsTab`, `BookModal`, `AdminLogin`)
  - `src/features/admin/components/` (`AdminSidebar`, `AdminHeader`, `StatCard`)
  - `src/components/ui/` (`Field.jsx`)
  - `src/config/constants.js` (Centralized config)
  - `src/lib/` (`api.js`, `supabaseConfig.js`, `excelExport.js`, `withToast.js`)
  - `.env.example`
- `mobile-app/`:
  - `App.js`, `index.js`, `app.json`
  - `src/screens/` (`HomeScreen`, `CalendarScreen`, `ProScreen`, `ProfileScreen`, `SubscriptionHistoryScreen`, `ReaderScreen`, `AuthScreen`, `AuthModal`)
  - `src/config/constants.js` (Centralized config)
  - `src/api/client.js` (HTTP client with timeout)
  - `.env.example`
- `server/`:
  - `server.js`, `app.js`, `config.js`, `db.js`, `auth.js`, `mailer.js`
  - `routes/`, `services/`, `controllers/`
  - `.env.example`
- Root:
  - `.env.example` (Master template)
  - `scripts/clean-ports.js` (Ports 3000, 5000, 3001, 8081)

## Interface Contracts
### `landing-page/src/config/constants.js`
- `export const APK_DOWNLOAD_URL = import.meta.env.VITE_APK_DOWNLOAD_URL || 'https://expo.dev/artifacts/eas/qdKRlQGtuS4qap2eylCUfl46_HuxOLHgo3p9tUPCQHs.apk'`
- `export const API_CONFIG = { baseUrl, fallbackOrigin, timeoutMs }`

### `admin-dashboard-web/src/config/constants.js`
- `export const API_CONFIG = { baseUrl, fallbackOrigin, timeoutMs }`
- `export const STORAGE_KEYS = { session, intendedLocation }`
- `export const MAPS_CONFIG = { searchBaseUrl, dirBaseUrl }`

### `mobile-app/src/config/constants.js`
- `export const API_CONFIG = { baseUrl, timeoutMs }`
- `export const OAUTH_CONFIG = { googleClientId, redirectUri, authUrl }`
- `export const APP_CONFIG = { supportEmail }`
