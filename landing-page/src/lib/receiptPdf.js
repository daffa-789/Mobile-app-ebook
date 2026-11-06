import { jsPDF } from 'jspdf';
import { formatRupiah } from './formatUtils.js';
import { resolveReceiptFields } from './receiptFields.js';

export const RECEIPT_CONSTANTS = {
  brandPrimary: '#14523A',
  headerText: 'PERPUSTAKAAN DIGITAL WAHIDIYAH',
  receiptTitle: 'TANDA BUKTI PEMBAYARAN',
};

const LEBAR = 80;
const MARGIN = 6;
const ISI = LEBAR - MARGIN * 2;
const LEBAR_LABEL = 22;
const LEBAR_NILAI = ISI - LEBAR_LABEL;

const UKURAN = { judul: 12, kecil: 7, teks: 8 };
const TINGGI = { judul: 6, kecil: 3.7, teks: 4.5, aturan: 4.8 };

const lebarSatuAksara = (pt) => pt * 0.3528 * 0.6;
const perkiraanBaris = (teks, pt, maks) =>
  Math.max(1, Math.ceil(String(teks).length / Math.floor(maks / lebarSatuAksara(pt))));

const susunBaris = (data) => {
  const { refNo, dateStr, planName, amount, adminFee, totalPaid, userName, userEmail, userPhone } =
    data;

  const baris = [
    { jenis: 'judul', teks: RECEIPT_CONSTANTS.headerText },
    { jenis: 'aturan' },
    { jenis: 'kecil', teks: RECEIPT_CONSTANTS.receiptTitle, tebal: true },
    { jenis: 'pasang', label: 'No Ref', nilai: String(refNo) },
    { jenis: 'pasang', label: 'Tanggal', nilai: String(dateStr) },
    { jenis: 'pasang', label: 'Kepada', nilai: userName },
    { jenis: 'pasang', label: 'Email', nilai: userEmail },
  ];

  if (userPhone) baris.push({ jenis: 'pasang', label: 'WhatsApp', nilai: userPhone });

  baris.push(
    { jenis: 'aturan' },
    { jenis: 'pasang', label: planName, nilai: formatRupiah(amount), tebal: true },
  );

  if (adminFee > 0) {
    baris.push({ jenis: 'pasang', label: 'Biaya admin', nilai: formatRupiah(adminFee) });
  }

  baris.push(
    { jenis: 'aturan' },
    { jenis: 'pasang', label: 'TOTAL', nilai: formatRupiah(totalPaid), tebal: true },
    { jenis: 'pasang', label: 'Metode', nilai: 'QRIS' },
    { jenis: 'aturan' },
    { jenis: 'kecil', teks: '*   L U N A S   *', tebal: true },
    { jenis: 'aturan' },
    { jenis: 'kecil', teks: 'Terima kasih telah bergabung di Wahidiyah Book' },
    { jenis: 'kecil', teks: 'Layanan Bantuan: support@bukuku.id' },
  );

  return baris;
};

const tinggiBaris = (b) => {
  if (b.jenis === 'aturan') return TINGGI.aturan;
  if (b.jenis === 'judul') return TINGGI.judul * perkiraanBaris(b.teks, UKURAN.judul, ISI);
  if (b.jenis === 'kecil') return TINGGI.kecil * perkiraanBaris(b.teks, UKURAN.kecil, ISI);
  return TINGGI.teks * perkiraanBaris(b.nilai, UKURAN.teks, LEBAR_NILAI);
};

export const generateReceiptPdf = (details, user) => {
  const data = resolveReceiptFields(details, user);
  const baris = susunBaris(data);
  const tinggi = baris.reduce((t, b) => t + tinggiBaris(b), 0) + MARGIN + 6;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [LEBAR, tinggi],
    compress: true,
  });

  doc.setFont('courier', 'normal');
  doc.setTextColor(32, 30, 26);

  let y = MARGIN + 1;
  const kanan = MARGIN + ISI;

  for (const b of baris) {
    if (b.jenis === 'aturan') {
      doc.setDrawColor(150, 145, 135);
      doc.setLineWidth(0.2);
      doc.setLineDash([1.4, 1.4], 0);
      const tengah = y + TINGGI.aturan / 2;
      doc.line(MARGIN, tengah, kanan, tengah);
      doc.setLineDash([], 0);
      y += TINGGI.aturan;
      continue;
    }

    doc.setFont('courier', b.tebal ? 'bold' : 'normal');

    if (b.jenis === 'judul') {
      doc.setFontSize(UKURAN.judul);
      doc.setTextColor(20, 82, 58); // #14523A Emerald Green
      const lines = doc.splitTextToSize(b.teks, ISI);
      lines.forEach((line) => {
        doc.text(line, LEBAR / 2, y + 4, { align: 'center' });
        y += TINGGI.judul;
      });
      doc.setTextColor(32, 30, 26);
      continue;
    }

    if (b.jenis === 'kecil') {
      doc.setFontSize(UKURAN.kecil);
      const barisTeks = doc.splitTextToSize(b.teks, ISI);
      doc.text(barisTeks, LEBAR / 2, y + 3, { align: 'center' });
      y += TINGGI.kecil * barisTeks.length;
      continue;
    }

    doc.setFontSize(UKURAN.teks);
    const barisNilai = doc.splitTextToSize(String(b.nilai), LEBAR_NILAI);
    barisNilai.forEach((nilai, i) => {
      if (i === 0) doc.text(b.label, MARGIN, y + 3);
      doc.text(nilai, kanan, y + 3, { align: 'right' });
      y += TINGGI.teks;
    });
  }

  return { doc, data };
};

export const downloadReceiptPdf = (details, user) => {
  const { doc, data } = generateReceiptPdf(details, user);
  const cleanRef = String(data.refNo).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Kwitansi-Wahidiyah-${cleanRef}.pdf`);
};
