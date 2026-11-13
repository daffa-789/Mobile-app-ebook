/**
 * Modul ekspor laporan spreadsheet Excel (.xlsx) interaktif untuk admin.
 * Memformat lembar kerja multi-halaman dengan styling tema brand Wahidiyah Book (hijau & cream),
 * zebra-striping, format angka mata uang otomatis, dan penyesuaian lebar kolom responsif.
 *
 * Memakai `write-excel-file` (aktif dirawat 2026) menggantikan `exceljs` yang
 * rilis terakhirnya 2024 dan membawa rantai dependensi usang: glob@7, inflight,
 * fstream, rimraf@2, lodash.isequal.
 *
 * @module src/lib/excelExport
 */

import writeXlsxFile from 'write-excel-file/browser';
import { formatWIB } from '@lib/date';
import { formatRupiah } from '@lib/formatUtils';
import { DEFAULT_PLAN } from '@lib/plans';

const BRAND_GREEN = '#14523A';
const CREAM_LIGHT = '#FBF8F3';
const BORDER_GRAY = '#E2E8F0';
const BRAND_BORDER = '#1F6D4F';

const getFileDateSuffix = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const headerCell = (text) => ({
  value: text,
  fontFamily: 'Calibri',
  fontSize: 11,
  fontWeight: 'bold',
  textColor: '#FFFFFF',
  backgroundColor: BRAND_GREEN,
  align: 'center',
  alignVertical: 'center',
  wrap: true,
  borderColor: BRAND_BORDER,
  borderStyle: 'thin',
});

const bodyCell = (value, isEvenRow, extra = {}) => ({
  value: value ?? '',
  fontFamily: 'Calibri',
  fontSize: 10,
  alignVertical: 'center',
  borderColor: BORDER_GRAY,
  borderStyle: 'thin',
  ...(isEvenRow ? { backgroundColor: CREAM_LIGHT } : {}),
  ...extra,
});

const formulaCell = (value, isEvenRow) => ({
  type: 'Formula',
  value,
  fontFamily: 'Calibri',
  fontSize: 10,
  fontWeight: 'bold',
  alignVertical: 'center',
  borderColor: BORDER_GRAY,
  borderStyle: 'thin',
  ...(isEvenRow ? { backgroundColor: CREAM_LIGHT } : {}),
});

/** Susun satu sheet: header + baris data + lebar kolom otomatis. */
const buildSheet = (sheet, headers, rows) => {
  const columns = headers.map((header, columnIndex) => {
    let maxLen = String(header).length;
    for (const row of rows) {
      const cell = row[columnIndex];
      const raw = cell && typeof cell === 'object' ? cell.value : cell;
      if (raw !== null && raw !== undefined) maxLen = Math.max(maxLen, String(raw).length);
    }
    return { width: Math.min(Math.max(maxLen + 4, 12), 48) };
  });

  const data = [
    headers.map(headerCell),
    ...rows.map((row, rowIndex) =>
      row.map((cell) => {
        /* Baris 1 = header, jadi baris data pertama bernomor 2 (genap). */
        const isEvenRow = (rowIndex + 2) % 2 === 0;
        if (cell && typeof cell === 'object' && cell.type === 'Formula') {
          return formulaCell(cell.value, isEvenRow);
        }
        return bodyCell(cell, isEvenRow);
      }),
    ),
  ];

  return { sheet, columns, data };
};

const saveBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const exportFullReportToExcel = async ({
  users = [],
  transactions = [],
  books = [],
  events = [],
}) => {
  const successTx = transactions.filter((t) => t.status === 'success');
  const totalRevenue = successTx.reduce((acc, curr) => acc + Number(curr.totalPaid || 0), 0);
  const proCount = users.filter((u) => Boolean(u.isPro)).length;

  const sheets = [];

  // 1. Ringkasan Eksekutif
  sheets.push(
    buildSheet(
      'Ringkasan Eksekutif',
      ['Metrik Laporan', 'Keterangan'],
      [
        ['Nama Aplikasi', 'Perpustakaan Digital Wahidiyah'],
        ['Tanggal Cetak Laporan', formatWIB(new Date(), { withSeconds: true })],
        ['Zona Waktu', 'WIB (Asia/Jakarta, UTC+7)'],
        ['Total Pengguna Terdaftar', `${users.length} akun`],
        ['Pengguna Member Pro Aktif', `${proCount} akun`],
        ['Pengguna Reguler', `${Math.max(users.length - proCount, 0)} akun`],
        ['Total Judul Buku', `${books.length} judul`],
        ['Total Agenda Kegiatan', `${events.length} agenda`],
        ['Total Transaksi Sukses', `${successTx.length} transaksi`],
        ['Total Pendapatan Tervalidasi', formatRupiah(totalRevenue)],
      ],
    ),
  );

  // 2. Transaksi
  if (transactions.length > 0) {
    const rows = transactions.map((t, idx) => [
      idx + 1,
      t.refNo || '-',
      t.userName || '-',
      t.userEmail || '-',
      t.planName || DEFAULT_PLAN.title,
      Number(t.amount || 0),
      Number(t.adminFee || 0),
      Number(t.totalPaid || 0),
      t.paymentMethod || 'QRIS',
      t.status === 'success' ? 'Berhasil' : t.status === 'pending' ? 'Menunggu' : 'Ditolak',
      formatWIB(t.createdAt),
      t.verifiedAt ? formatWIB(t.verifiedAt) : '-',
    ]);

    const lastIdx = transactions.length + 1;
    rows.push([
      '',
      '',
      '',
      '',
      'TOTAL',
      { type: 'Formula', value: `=SUM(F2:F${lastIdx})` },
      { type: 'Formula', value: `=SUM(G2:G${lastIdx})` },
      { type: 'Formula', value: `=SUM(H2:H${lastIdx})` },
      '',
      '',
      '',
      '',
    ]);

    sheets.push(
      buildSheet(
        'Transaksi',
        [
          'No',
          'No. Referensi',
          'Nama Pembeli',
          'Email Pembeli',
          'Paket',
          'Nominal (Rp)',
          'Biaya Admin (Rp)',
          'Total Bayar (Rp)',
          'Metode',
          'Status',
          'Tanggal Transaksi',
          'Tanggal Verifikasi',
        ],
        rows,
      ),
    );
  }

  // 3. Pengguna
  if (users.length > 0) {
    sheets.push(
      buildSheet(
        'Pengguna',
        [
          'No',
          'Nama Lengkap',
          'Email',
          'Role',
          'Metode Masuk',
          'Status Pro',
          'Masa Aktif Pro',
          'Terdaftar Pada',
        ],
        users.map((u, idx) => [
          idx + 1,
          u.name || '-',
          u.email || '-',
          u.role === 'admin' ? 'Administrator' : 'User',
          u.loginMethod === 'google' ? 'Google' : 'Email',
          u.isPro ? 'Pro' : 'Reguler',
          u.subscriptionExpiresAt ? formatWIB(u.subscriptionExpiresAt) : '-',
          formatWIB(u.createdAt),
        ]),
      ),
    );
  }

  // 4. Katalog Buku
  if (books.length > 0) {
    sheets.push(
      buildSheet(
        'Katalog Buku',
        ['No', 'Judul', 'Penulis', 'Kategori', 'Akses', 'Halaman', 'Format', 'Nama File'],
        books.map((b, idx) => [
          idx + 1,
          b.title || '-',
          b.author || '-',
          b.category || 'Umum',
          b.isLocked ? 'Pro' : 'Gratis',
          b.totalPages || b.pages || 0,
          (b.contentExtension || b.contentType || 'PDF').toUpperCase(),
          b.contentName || '-',
        ]),
      ),
    );
  }

  // 5. Agenda
  if (events.length > 0) {
    sheets.push(
      buildSheet(
        'Agenda',
        ['No', 'Judul', 'Tanggal', 'Waktu', 'Lokasi', 'Kategori', 'Penyelenggara'],
        events.map((e, idx) => [
          idx + 1,
          e.title || '-',
          e.date || '-',
          e.time || '-',
          e.location || '-',
          e.category || 'Umum',
          e.organizer || '-',
        ]),
      ),
    );
  }

  const fileName = `Laporan_Lengkap_Perpustakaan_Wahidiyah_${getFileDateSuffix()}.xlsx`;
  const blob = await writeXlsxFile(sheets, { fontFamily: 'Calibri', fontSize: 10 }).toBlob();
  saveBlob(blob, fileName);
  return { fileName, sheetsCount: sheets.length };
};
