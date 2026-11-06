# MASTER PROMPT: PENGEMBANGAN ADMIN DASHBOARD WEB

> **Tujuan:** Membangun / memisahkan panel dashboard administrator Wahidiyah Book ke dalam folder `admin-dashboard-web/`.
> **Lokasi Pengerjaan:** Folder `admin-dashboard-web/`
> **Karakteristik Repositori:** Monorepo terpadu dengan **1 `package.json` dan 1 `node_modules` di root project**. Semua library chart (`recharts`), data export (`exceljs`), icon (`lucide-react`), dan UI framework sudah terpasang di root.

---

## 1. PERAN & KONTEKS PROYEK
Anda adalah Senior Frontend & Dashboard Engineer. Tugas Anda adalah memisahkan dan membangun panel **Admin Dashboard Web** untuk pengelola perpustakaan digital Wahidiyah Book di dalam folder `admin-dashboard-web/`.

Panel ini merujuk langsung pada implementasi yang sudah ada di:
- **Komponen Utama:** `src/features/admin/AdminDashboard.jsx`
- **Tab Overview (Statistik & Grafik):** `src/features/admin/OverviewTab.jsx`
- **Manajemen Buku:** `src/features/admin/BooksTab.jsx` & `BookModal.jsx`
- **Manajemen Pengguna:** `src/features/admin/UsersTab.jsx`
- **Manajemen Agenda/Kegiatan:** `src/features/admin/EventsTab.jsx`
- **Manajemen Banner/Carousel:** `src/features/admin/CarouselTab.jsx`
- **Log Sistem & Riwayat Transaksi:** `src/features/admin/LogsTab.jsx`
- **Backend Endpoint:** `server/routes/admin_routes.js` (Express Server di Port 3001)

---

## 2. PANDUAN DESAIN (ADMIN ELEGAN & FUNGSIONAL)
- **Tema:** Tetap konsisten dengan "Editorial Elegan" namun dioptimalkan untuk produktivitas dashboard desktop & tablet:
  - Sidebar navigasi: Hijau Zamrud gelap (`#0E3D2C` / `#14523A`) dengan teks krem/putih lembut.
  - Kartu Ringkasan (Cards): Latar krem terang (`#FBF8F3` / `#F0E8DA`) beraksen border emas tipis (`#D4AF4F`).
  - Tabel Data: Header kontras, baris zebra striping halus, badge status transaksi (Hijau: Berhasil, Kuning: Menunggu, Merah: Gagal/Kedaluwarsa).
  - Visualisasi Grafik: Memakai warna Zamrud dan Emas untuk diagram chart pendapatan & pembaca aktif (`recharts`).

---

## 3. FITUR-FITUR PANEL ADMIN

### A. Tab Overview / Ringkasan (`/admin` atau `/admin/overview`)
- **Metric Cards:** Total Pengguna, Pengguna Pro Aktif, Total Judul Buku, Total Pendapatan Bulan Ini.
- **Grafik Tren:** Pertumbuhan pengguna dan transaksi per bulan (`Recharts`).
- **Daftar Transaksi Terakhir:** 5 transaksi QRIS terbaru dengan status real-time.

### B. Tab Manajemen Buku (`/admin/books`)
- **Tabel Katalog:** Cover thumbnail, judul buku, kategori, jumlah pembaca, status (Gratis/Pro).
- **Modal Tambah / Edit Buku (`BookModal.jsx`):**
  - Upload berkas cover (JPG/PNG).
  - Upload berkas naskah (PDF/DOCX) langsung ke Supabase Storage.
  - Input metadata: Judul, pengarang, deskripsi, jumlah halaman, dan toggle status Pro.
- **Aksi Cepat:** Hapus buku, ubah status publish, unduh naskah.

### C. Tab Manajemen Pengguna (`/admin/users`)
- **Tabel Pengguna:** Avatar, Nama, Email, Nomor WhatsApp, Role (`user` / `admin`), Masa Aktif Pro.
- **Pencarian & Filter:** Filter berdasarkan role dan status langganan.
- **Aksi Pengguna:** Promosikan ke admin, reset masa aktif pro, atau nonaktifkan akun.

### D. Tab Agenda & Kegiatan (`/admin/events`)
- Pengelolaan tanggal-tanggal mujahadah/haul dan kegiatan besar Wahidiyah.
- Tambah, edit jadwal, dan unggah pamflet acara yang langsung sinkron ke kalender pengguna mobile dan web.

### E. Tab Carousel / Banner Beranda (`/admin/carousel`)
- Mengunggah banner gambar promosi atau informasi pengumuman untuk beranda aplikasi.
- Atur urutan tayang (re-order) dan toggle aktif/nonaktif.

### F. Tab Riwayat Transaksi & Log Audit (`/admin/logs`)
- Daftar lengkap transaksi QRIS Midtrans dengan ID Pesanan, nominal, nama pengguna, dan waktu bayar.
- Fitur Ekspor ke Excel (`.xlsx`) menggunakan `exceljs`.
- Log aktivitas sistem (upload buku, perubahan role, verifikasi akun).

---

## 4. STRUKTUR DIREKTORI DI `admin-dashboard-web/`
```
admin-dashboard-web/
├── public/                  # Aset statis & logo admin
├── src/
│   ├── components/          # Sidebar, Navbar, StatCard, DataTable, Modal, Badges
│   ├── features/
│   │   ├── overview/        # OverviewTab & Charts
│   │   ├── books/           # BooksTab & BookModal
│   │   ├── users/           # UsersTab & UserRoleDialog
│   │   ├── events/          # EventsTab & EventForm
│   │   ├── carousel/        # CarouselTab
│   │   └── logs/            # LogsTab & ExportExcel
│   ├── hooks/               # useAdminData, useBookEditor, useEventEditor
│   ├── lib/                 # api client (dengan session token admin), formatters
│   ├── App.jsx              # Admin Routing & Layout Shell
│   └── main.jsx             # Entry Point React
└── index.html               # Template HTML
```

---

## 5. INSTRUKSI EKSEKUSI
1. Pindahkan atau referensikan logika dari `src/features/admin/` ke dalam arsitektur `admin-dashboard-web/`.
2. Gunakan single `package.json` dan `node_modules` di root project.
3. Pastikan otorisasi admin (`AdminRoute`) terlindungi: hanya pengguna dengan `role === 'admin'` yang dapat membuka antarmuka ini.
