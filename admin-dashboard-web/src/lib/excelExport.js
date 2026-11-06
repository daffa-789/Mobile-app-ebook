/**
 * Modul ekspor laporan spreadsheet Excel (.xlsx) interaktif untuk admin.
 * Memformat lembar kerja multi-halaman dengan styling tema brand Wahidiyah Book (hijau & cream),
 * zebra-striping, format angka mata uang otomatis, dan penyesuaian lebar kolom responsif.
 *
 * @module src/lib/excelExport
 */

import ExcelJS from 'exceljs';
import { formatWIB } from '@lib/date';
import { formatRupiah } from '@lib/formatUtils';
import { DEFAULT_PLAN } from '@lib/plans';

const BRAND_GREEN = 'FF14523A';
const CREAM_LIGHT = 'FFFBF8F3';
const BORDER_GRAY = 'FFE2E8F0';

const getFileDateSuffix = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const applySheetStyling = (worksheet) => {
  worksheet.views = [{ showGridLines: true }];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_GREEN } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: BRAND_GREEN } },
      bottom: { style: 'medium', color: { argb: BRAND_GREEN } },
      left: { style: 'thin', color: { argb: 'FF1F6D4F' } },
      right: { style: 'thin', color: { argb: 'FF1F6D4F' } },
    };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.height = 22;
    const isEven = rowNumber % 2 === 0;

    row.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10 };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREAM_LIGHT } };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_GRAY } },
        bottom: { style: 'thin', color: { argb: BORDER_GRAY } },
        left: { style: 'thin', color: { argb: BORDER_GRAY } },
        right: { style: 'thin', color: { argb: BORDER_GRAY } },
      };
      cell.alignment = { vertical: 'middle', ...cell.alignment };
    });
  });

  worksheet.columns.forEach((column) => {
    let maxLen = column.header ? String(column.header).length : 10;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const cellLen = cell.value ? String(cell.value).length : 0;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    column.width = Math.min(Math.max(maxLen + 4, 12), 48);
  });
};

const saveWorkbook = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
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
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Perpustakaan Digital Wahidiyah';
  workbook.created = new Date();

  // 1. Ringkasan Eksekutif
  const wsSummary = workbook.addWorksheet('Ringkasan Eksekutif');
  wsSummary.columns = [
    { header: 'Metrik Laporan', key: 'metric', width: 32 },
    { header: 'Keterangan', key: 'value', width: 45 },
  ];

  const successTx = transactions.filter((t) => t.status === 'success');
  const totalRevenue = successTx.reduce((acc, curr) => acc + Number(curr.totalPaid || 0), 0);
  const proCount = users.filter((u) => Boolean(u.isPro)).length;

  const summaryRows = [
    { metric: 'Nama Aplikasi', value: 'Perpustakaan Digital Wahidiyah' },
    { metric: 'Tanggal Cetak Laporan', value: formatWIB(new Date(), { withSeconds: true }) },
    { metric: 'Zona Waktu', value: 'WIB (Asia/Jakarta, UTC+7)' },
    { metric: 'Total Pengguna Terdaftar', value: `${users.length} akun` },
    { metric: 'Pengguna Member Pro Aktif', value: `${proCount} akun` },
    { metric: 'Pengguna Reguler', value: `${Math.max(users.length - proCount, 0)} akun` },
    { metric: 'Total Judul Buku', value: `${books.length} judul` },
    { metric: 'Total Agenda Kegiatan', value: `${events.length} agenda` },
    { metric: 'Total Transaksi Sukses', value: `${successTx.length} transaksi` },
    { metric: 'Total Pendapatan Tervalidasi', value: formatRupiah(totalRevenue) },
  ];

  summaryRows.forEach((r) => wsSummary.addRow(r));
  applySheetStyling(wsSummary);

  // 2. Transaksi
  if (transactions.length > 0) {
    const wsTx = workbook.addWorksheet('Transaksi');
    wsTx.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'No. Referensi', key: 'refNo', width: 20 },
      { header: 'Nama Pembeli', key: 'userName', width: 24 },
      { header: 'Email Pembeli', key: 'userEmail', width: 28 },
      { header: 'Paket', key: 'planName', width: 18 },
      { header: 'Nominal (Rp)', key: 'amount', width: 16 },
      { header: 'Biaya Admin (Rp)', key: 'adminFee', width: 16 },
      { header: 'Total Bayar (Rp)', key: 'totalPaid', width: 18 },
      { header: 'Metode', key: 'paymentMethod', width: 16 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Tanggal Transaksi', key: 'createdAt', width: 22 },
      { header: 'Tanggal Verifikasi', key: 'verifiedAt', width: 22 },
    ];

    transactions.forEach((t, idx) => {
      wsTx.addRow({
        no: idx + 1,
        refNo: t.refNo || '-',
        userName: t.userName || '-',
        userEmail: t.userEmail || '-',
        planName: t.planName || DEFAULT_PLAN.title,
        amount: Number(t.amount || 0),
        adminFee: Number(t.adminFee || 0),
        totalPaid: Number(t.totalPaid || 0),
        paymentMethod: t.paymentMethod || 'QRIS',
        status:
          t.status === 'success' ? 'Berhasil' : t.status === 'pending' ? 'Menunggu' : 'Ditolak',
        createdAt: formatWIB(t.createdAt),
        verifiedAt: t.verifiedAt ? formatWIB(t.verifiedAt) : '-',
      });
    });

    const lastIdx = transactions.length + 1;
    const totalRow = wsTx.addRow({
      no: '',
      refNo: '',
      userName: '',
      userEmail: '',
      planName: 'TOTAL',
      amount: { formula: `SUM(F2:F${lastIdx})` },
      adminFee: { formula: `SUM(G2:G${lastIdx})` },
      totalPaid: { formula: `SUM(H2:H${lastIdx})` },
      paymentMethod: '',
      status: '',
      createdAt: '',
      verifiedAt: '',
    });
    totalRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
    });

    applySheetStyling(wsTx);
  }

  // 3. Pengguna
  if (users.length > 0) {
    const wsUsers = workbook.addWorksheet('Pengguna');
    wsUsers.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Lengkap', key: 'name', width: 26 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Role', key: 'role', width: 16 },
      { header: 'Metode Masuk', key: 'loginMethod', width: 18 },
      { header: 'Status Pro', key: 'isPro', width: 18 },
      { header: 'Masa Aktif Pro', key: 'expiresAt', width: 22 },
      { header: 'Terdaftar Pada', key: 'createdAt', width: 22 },
    ];

    users.forEach((u, idx) => {
      wsUsers.addRow({
        no: idx + 1,
        name: u.name || '-',
        email: u.email || '-',
        role: u.role === 'admin' ? 'Administrator' : 'User',
        loginMethod: u.loginMethod === 'google' ? 'Google' : 'Email',
        isPro: u.isPro ? 'Pro' : 'Reguler',
        expiresAt: u.subscriptionExpiresAt ? formatWIB(u.subscriptionExpiresAt) : '-',
        createdAt: formatWIB(u.createdAt),
      });
    });

    applySheetStyling(wsUsers);
  }

  // 4. Katalog Buku
  if (books.length > 0) {
    const wsBooks = workbook.addWorksheet('Katalog Buku');
    wsBooks.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Judul', key: 'title', width: 30 },
      { header: 'Penulis', key: 'author', width: 22 },
      { header: 'Kategori', key: 'category', width: 16 },
      { header: 'Akses', key: 'isLocked', width: 18 },
      { header: 'Halaman', key: 'pages', width: 14 },
      { header: 'Format', key: 'format', width: 14 },
      { header: 'Nama File', key: 'contentName', width: 24 },
    ];

    books.forEach((b, idx) => {
      wsBooks.addRow({
        no: idx + 1,
        title: b.title || '-',
        author: b.author || '-',
        category: b.category || 'Umum',
        isLocked: b.isLocked ? 'Pro' : 'Gratis',
        pages: b.totalPages || b.pages || 0,
        format: (b.contentExtension || b.contentType || 'PDF').toUpperCase(),
        contentName: b.contentName || '-',
      });
    });

    applySheetStyling(wsBooks);
  }

  // 5. Agenda
  if (events.length > 0) {
    const wsEvents = workbook.addWorksheet('Agenda');
    wsEvents.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Judul', key: 'title', width: 30 },
      { header: 'Tanggal', key: 'date', width: 16 },
      { header: 'Waktu', key: 'time', width: 18 },
      { header: 'Lokasi', key: 'location', width: 28 },
      { header: 'Kategori', key: 'category', width: 16 },
      { header: 'Penyelenggara', key: 'organizer', width: 20 },
    ];

    events.forEach((e, idx) => {
      wsEvents.addRow({
        no: idx + 1,
        title: e.title || '-',
        date: e.date || '-',
        time: e.time || '-',
        location: e.location || '-',
        category: e.category || 'Umum',
        organizer: e.organizer || '-',
      });
    });

    applySheetStyling(wsEvents);
  }

  const fileName = `Laporan_Lengkap_Perpustakaan_Wahidiyah_${getFileDateSuffix()}.xlsx`;
  await saveWorkbook(workbook, fileName);
  return { fileName, sheetsCount: workbook.worksheets.length };
};
