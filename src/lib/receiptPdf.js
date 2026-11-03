import { jsPDF } from 'jspdf';
import { formatRupiah } from './formatUtils.js';
import { resolveReceiptFields } from './receiptFields.js';

/* Lebar strip struk (mm). Sengaja selebar tanda terima supermarket, bukan A4:
   di layar HP dokumen A4 menampilkan banyak ruang kosong dan angka-angkanya
   justru kecil. */
const LEBAR = 80;
const MARGIN = 6;
const ISI = LEBAR - MARGIN * 2;
const LEBAR_NILAI = ISI * 0.48;

/* Indentasi nilai panjang yang dicetak di barisnya sendiri. */
const INDENT = 6;

const UKURAN = { judul: 13, kecil: 7.5, teks: 8 };
const TINGGI = { judul: 6.5, kecil: 3.9, teks: 4.4, aturan: 3.6 };

/* Courier adalah huruf mono: satu karakter = 0,6 em. Angka ini dipakai untuk
   memperkirakan jumlah baris SEBELUM dokumen dibuat, karena jsPDF 4 tidak punya
   setSize sehingga tinggi halaman harus sudah diketahui lebih dulu. */
const lebarSatuAksara = (pt) => pt * 0.3528 * 0.6;
const perkiraanBaris = (teks, pt, maks) =>
  Math.max(1, Math.ceil(String(teks).length / Math.floor(maks / lebarSatuAksara(pt))));

const susunBaris = (data, printDate) => {
  const { refNo, dateStr, planName, amount, adminFee, totalPaid, userName, userEmail, userPhone } =
    data;

  const baris = [
    { jenis: 'judul', teks: 'WAHIDIYAH BOOK' },
    { jenis: 'kecil', teks: 'Perpustakaan Digital Sholawat Wahidiyah' },
    { jenis: 'kecil', teks: 'https://wahidiyah-book.vercel.app' },
    { jenis: 'aturan' },
    { jenis: 'kecil', teks: 'KWITANSI PEMBAYARAN', tebal: true },
    { jenis: 'pasang', label: 'No', nilai: String(refNo) },
    { jenis: 'pasang', label: 'Tanggal', nilai: String(dateStr) },
    { jenis: 'pasang', label: 'Kepada', nilai: userName },
    { jenis: 'pasang', label: 'Email', nilai: userEmail },
  ];

  if (userPhone) baris.push({ jenis: 'pasang', label: 'WhatsApp', nilai: userPhone });

  baris.push(
    { jenis: 'aturan' },
    { jenis: 'pasang', label: planName, nilai: formatRupiah(amount), tebal: true },
    { jenis: 'kiri', teks: '30 Hari' },
  );

  if (adminFee > 0) {
    baris.push({ jenis: 'pasang', label: 'Biaya gateway', nilai: formatRupiah(adminFee) });
  }

  baris.push(
    { jenis: 'aturan' },
    { jenis: 'pasang', label: 'TOTAL', nilai: formatRupiah(totalPaid), tebal: true },
    { jenis: 'pasang', label: 'Bayar', nilai: 'QRIS' },
    { jenis: 'aturan' },
    { jenis: 'kecil', teks: '*   L U N A S   *', tebal: true },
    { jenis: 'kecil', teks: 'Terverifikasi gateway Midtrans' },
    { jenis: 'kecil', teks: 'Sah menurut UU ITE 11/2008 Ps. 5' },
    { jenis: 'aturan' },
    { jenis: 'kecil', teks: 'Terima kasih sudah berlangganan' },
    { jenis: 'kecil', teks: `Dicetak ${printDate} WIB` },
    { jenis: 'kecil', teks: 'Bantuan: support@bukuku.id' },
  );

  return baris;
};

/** Perkiraan tinggi satu baris, termasuk nilai panjang yang akan dibungkus. */
const tinggiBaris = (b) => {
  if (b.jenis === 'aturan') return TINGGI.aturan;
  if (b.jenis === 'judul') return TINGGI.judul;
  if (b.jenis === 'kiri') return TINGGI.kecil;

  if (b.jenis === 'kecil') return TINGGI.kecil * perkiraanBaris(b.teks, UKURAN.kecil, ISI);

  const satuBaris = perkiraanBaris(b.nilai, UKURAN.teks, LEBAR_NILAI) === 1;
  return satuBaris
    ? TINGGI.teks
    : TINGGI.teks * (1 + perkiraanBaris(b.nilai, UKURAN.teks, ISI - INDENT));
};

/**
 * Unduh kwitansi bergaya struk: satu kolom sempit, huruf mono, garis putus-putus.
 * Nilainya sama dengan pratinjau di PaymentReceiptModal karena keduanya memakai
 * resolveReceiptFields.
 *
 * @param {object} details Rincian pembayaran (refNo, dateStr, planName, amount, adminFee, totalPaid)
 * @param {object} user Rincian pengguna (name, email, phone)
 */
export const downloadReceiptPdf = (details, user) => {
  const data = resolveReceiptFields(details, user);

  const printDate = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const baris = susunBaris(data, printDate);
  const tinggi = baris.reduce((t, b) => t + tinggiBaris(b), 0) + MARGIN + 4;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [LEBAR, tinggi],
    compress: true,
  });

  doc.setFont('courier', 'normal');
  doc.setTextColor(32, 30, 26);

  let y = MARGIN + 2;
  const kanan = MARGIN + ISI;

  for (const b of baris) {
    if (b.jenis === 'aturan') {
      doc.setDrawColor(150, 145, 135);
      doc.setLineWidth(0.2);
      doc.setLineDash([1.2, 1.2], 0);
      doc.line(MARGIN, y + 1.2, kanan, y + 1.2);
      doc.setLineDash([], 0);
      y += TINGGI.aturan;
      continue;
    }

    doc.setFont('courier', b.tebal ? 'bold' : 'normal');

    if (b.jenis === 'judul') {
      doc.setFontSize(UKURAN.judul);
      doc.setTextColor(20, 82, 58);
      doc.text(b.teks, LEBAR / 2, y + 4.5, { align: 'center' });
      doc.setTextColor(32, 30, 26);
      y += TINGGI.judul;
      continue;
    }

    if (b.jenis === 'kiri') {
      doc.setFontSize(UKURAN.kecil);
      doc.setTextColor(90, 86, 78);
      doc.text(b.teks, MARGIN, y + 3);
      doc.setTextColor(32, 30, 26);
      y += TINGGI.kecil;
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
    const nilai = String(b.nilai);
    const muatSebaris = doc.splitTextToSize(nilai, LEBAR_NILAI).length === 1;

    if (muatSebaris) {
      doc.text(b.label, MARGIN, y + 3, { maxWidth: ISI - LEBAR_NILAI });
      doc.text(nilai, kanan, y + 3, { align: 'right' });
      y += TINGGI.teks;
      continue;
    }

    /* Nilai panjang (nama, email) tidak dipotong di tengah kata: label jalan
       sendiri, lalu nilainya satu baris penuh rata kiri dengan indentasi. */
    doc.text(b.label, MARGIN, y + 3);
    y += TINGGI.teks;
    const barisNilai = doc.splitTextToSize(nilai, ISI - INDENT);
    doc.text(barisNilai, MARGIN + INDENT, y + 3);
    y += TINGGI.teks * barisNilai.length;
  }

  const cleanRef = String(data.refNo).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Kwitansi-Wahidiyah-${cleanRef}.pdf`);
};
