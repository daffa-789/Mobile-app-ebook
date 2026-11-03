import { jsPDF } from 'jspdf';
import { formatRupiah } from './formatUtils.js';
import { resolveReceiptFields } from './receiptFields.js';

/**
 * Generator Kwitansi / Invoice Resmi Wahidiyah Book berstandar A4
 * Didesain dengan estetika modern, tipografi seimbang, dan keabsahan hukum transaksi digital.
 *
 * @param {Object} details Rincian pembayaran (refNo, dateStr, planName, amount, adminFee, totalPaid, etc)
 * @param {Object} user Rincian pengguna (name, email, phone)
 */
export const downloadReceiptPdf = (details, user) => {
  const { refNo, dateStr, planName, amount, adminFee, totalPaid, userName, userEmail, userPhone } =
    resolveReceiptFields(details, user);

  // Standar Format A4 Portrait (210 x 297 mm) untuk arsip resmi dan bukti transaksi
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174 mm

  // 1. Top Decorative Brand Bar (Deep Emerald & Gold Accent)
  doc.setFillColor(20, 82, 58); // #14523A
  doc.rect(0, 0, pageWidth, 5.5, 'F');

  doc.setFillColor(184, 134, 11); // Gold #B8860B
  doc.rect(0, 5.5, pageWidth, 1.2, 'F');

  // 2. Header Section
  let y = 22;

  // Left: Brand identity & Legal Entity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(20, 82, 58);
  doc.text('WAHIDIYAH BOOK', margin, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 85, 95);
  doc.text('Perpustakaan Digital Ajaran Sholawat Wahidiyah', margin, y);

  y += 4.5;
  doc.setFontSize(8);
  doc.setTextColor(115, 120, 130);
  doc.text('Platform Resmi Pembacaan & Pembelian Kitab Digital', margin, y);
  y += 4;
  doc.text('https://wahidiyah-book.vercel.app  •  support@bukuku.id', margin, y);

  // Right: Document title & Status Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(25, 30, 40);
  doc.text('KWITANSI RESMI', margin + contentWidth, 22, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 110, 125);
  doc.text('OFFICIAL PAYMENT RECEIPT', margin + contentWidth, 27, { align: 'right' });

  // Status Badge (Pill: Pembayaran Lunas)
  const badgeW = 62;
  const badgeH = 7.5;
  const badgeX = margin + contentWidth - badgeW;
  const badgeY = 30.5;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text('● PEMBAYARAN LUNAS (SETTLED)', badgeX + badgeW / 2, badgeY + 5.2, { align: 'center' });

  // 3. Subtle Divider Line
  y = 44;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  // 4. Two-Column Metadata Information Cards
  y += 7;
  const colW = (contentWidth - 6) / 2;
  const cardH = 37;

  // Box 1: Diterbitkan Kepada (Customer)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, colW, cardH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DITERBITKAN KEPADA (PELANGGAN):', margin + 6, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(userName, margin + 6, y + 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${userEmail}`, margin + 6, y + 21);
  if (userPhone) {
    doc.text(`No. WhatsApp: ${userPhone}`, margin + 6, y + 26.5);
    doc.text('Status Akun: Member Pro (Aktif 30 Hari)', margin + 6, y + 32);
  } else {
    doc.text('Status Akun: Member Pro (Aktif 30 Hari)', margin + 6, y + 26.5);
  }

  // Box 2: Rincian Transaksi
  const col2X = margin + colW + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, y, colW, cardH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RINCIAN TRANSAKSI & PEMBAYARAN:', col2X + 6, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Nomor Kwitansi:', col2X + 6, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(refNo), col2X + colW - 6, y + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Waktu Transaksi:', col2X + 6, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(String(dateStr), col2X + colW - 6, y + 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Metode Pembayaran:', col2X + 6, y + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 82, 58);
  doc.text('QRIS Midtrans Core API', col2X + colW - 6, y + 26, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Verifikasi Gateway:', col2X + 6, y + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Midtrans Payment Gateway (Live)', col2X + colW - 6, y + 32, { align: 'right' });

  // 5. Itemized Table
  y += cardH + 8;

  // Table Header
  doc.setFillColor(20, 82, 58);
  doc.roundedRect(margin, y, contentWidth, 8.5, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('NO', margin + 4, y + 5.8);
  doc.text('DESKRIPSI ITEM / LAYANAN', margin + 15, y + 5.8);
  doc.text('DURASI', margin + 104, y + 5.8);
  doc.text('TARIF', margin + 138, y + 5.8, { align: 'right' });
  doc.text('TOTAL', margin + contentWidth - 4, y + 5.8, { align: 'right' });

  // Row 1: Subscription Plan
  y += 8.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 15, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 15, margin + contentWidth, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('01', margin + 4, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(String(planName), margin + 15, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Akses Penuh Seluruh Kitab Digital & Dokumen Pengamalan Wahidiyah Pro',
    margin + 15,
    y + 11,
  );

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('30 Hari', margin + 104, y + 6.5);
  doc.text(formatRupiah(amount), margin + 138, y + 6.5, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(amount), margin + contentWidth - 4, y + 6.5, { align: 'right' });

  // Row 2: Gateway Admin Fee
  if (adminFee > 0) {
    y += 15;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 12, margin + contentWidth, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('02', margin + 4, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Biaya Administrasi & Transaksi Gateway QRIS', margin + 15, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('1x Transaksi', margin + 104, y + 7);
    doc.text(formatRupiah(adminFee), margin + 138, y + 7, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(adminFee), margin + contentWidth - 4, y + 7, { align: 'right' });
    y += 12;
  } else {
    y += 15;
  }

  // 6. Summary Breakdown Section (Right Aligned)
  y += 6;
  const summaryW = 86;
  const summaryX = margin + contentWidth - summaryW;

  // Subtotal line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Layanan:', summaryX, y);
  doc.text(formatRupiah(amount), margin + contentWidth, y, { align: 'right' });

  if (adminFee > 0) {
    y += 6;
    doc.text('Biaya Layanan Gateway:', summaryX, y);
    doc.text(formatRupiah(adminFee), margin + contentWidth, y, { align: 'right' });
  }

  // Highlighted Total Box
  y += 8;
  doc.setFillColor(20, 82, 58);
  doc.roundedRect(summaryX - 5, y - 5, summaryW + 5, 13, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL PEMBAYARAN:', summaryX, y + 3.5);

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(formatRupiah(totalPaid), margin + contentWidth, y + 3.8, { align: 'right' });

  // 7. Security & Official Gateway Stamp Box
  const secBoxY = y + 22;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, secBoxY, contentWidth, 26, 3, 3, 'FD');

  // Green check mark circle symbol
  doc.setFillColor(34, 197, 94);
  doc.circle(margin + 9.5, secBoxY + 13, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('V', margin + 8.2, secBoxY + 14.4);

  // Verification details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 83, 45);
  doc.text('BUKTI PEMBAYARAN SAH & DIVERIFIKASI SISTEM GATEWAY RESMI', margin + 19, secBoxY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  doc.text(
    'Dokumen ini merupakan tanda terima digital resmi yang sah menurut ketentuan UU ITE No. 11/2008 Pasal 5.',
    margin + 19,
    secBoxY + 13,
  );
  doc.text(
    `ID Transaksi / Merchant Order: ${refNo}   |   Status: Settlement Real Midtrans Validated`,
    margin + 19,
    secBoxY + 17.5,
  );
  doc.text(
    'Diterbitkan secara elektronik oleh Sistem Informasi Perpustakaan Digital Wahidiyah Book.',
    margin + 19,
    secBoxY + 22,
  );

  // 8. Terms & Notes
  y = secBoxY + 33;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CATATAN & KETENTUAN PENGGUNAAN:', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const notes = [
    '• Paket langganan Pro langsung aktif secara otomatis selama 30 hari kalender sejak transaksi berstatus lunas.',
    '• Hak akses mencakup seluruh literatur, audio Sholawat Wahidiyah, dan berkas kitab tanpa batasan halaman.',
    '• Apabila membutuhkan bantuan atau konfirmasi lebih lanjut, hubungi layanan dukungan kami di support@bukuku.id.',
  ];
  notes.forEach((note) => {
    doc.text(note, margin, y);
    y += 4.5;
  });

  // 9. Footer
  const footerY = pageHeight - 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, margin + contentWidth, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Buku Wahidiyah  •  Perpustakaan Digital Ajaran Sholawat Wahidiyah  •  https://wahidiyah-book.vercel.app',
    margin,
    footerY,
  );

  const printDate = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Dicetak: ${printDate} WIB`, margin + contentWidth, footerY, { align: 'right' });

  // Unduh dokumen PDF dengan nama berkas terstandarisasi
  const cleanRef = String(refNo).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Kwitansi-Wahidiyah-${cleanRef}.pdf`);
};
