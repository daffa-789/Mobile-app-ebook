import { jsPDF } from 'jspdf';
import { formatRupiah } from './formatUtils.js';
import { resolveReceiptFields } from './receiptFields.js';

/* Lebar strip struk (mm). Sengaja selebar tanda terima supermarket, bukan A4:
   di layar HP dokumen A4 menampilkan banyak ruang kosong dan angka-angkanya
   justru kecil. */
const LEBAR = 80;
const MARGIN = 6;
const ISI = LEBAR - MARGIN * 2;

/* Label kiri, nilai rata kanan — sama untuk semua baris, termasuk nama dan email
   yang perlu dua baris: tiap barisnya tetap menempel ke tepi kanan. Lebar label
   22 mm cukup untuk "Paket Bulanan"/"WhatsApp" dan menyisakan 46 mm untuk nilai,
   sehingga alamat email muat satu baris. */
const LEBAR_LABEL = 22;
const LEBAR_NILAI = ISI - LEBAR_LABEL;

const UKURAN = { judul: 14, kecil: 7, teks: 8 };

/* Setiap garis putus-putus menempati pita dengan ruang sama di atas dan bawah,
   supaya ritme vertikal tidak ada yang menempel dan ada yang melebar. */
const TINGGI = { judul: 7, kecil: 3.7, teks: 4.5, aturan: 4.8 };

/* Courier adalah huruf mono: satu karakter = 0,6 em. Angka ini dipakai untuk
   memperkirakan jumlah baris SEBELUM dokumen dibuat, karena jsPDF 4 tidak punya
   setSize sehingga tinggi halaman harus sudah diketahui lebih dulu. */
const lebarSatuAksara = (pt) => pt * 0.3528 * 0.6;
const perkiraanBaris = (teks, pt, maks) =>
  Math.max(1, Math.ceil(String(teks).length / Math.floor(maks / lebarSatuAksara(pt))));

const susunBaris = (data) => {
  const { refNo, dateStr, planName, amount, adminFee, totalPaid, userName, userEmail, userPhone } =
    data;

  const baris = [
    { jenis: 'judul', teks: 'WAHIDIYAH BOOK' },
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
    { jenis: 'aturan' },
    { jenis: 'kecil', teks: 'Terima kasih sudah berlangganan' },
    { jenis: 'kecil', teks: 'Bantuan: support@bukuku.id' },
  );

  return baris;
};

/** Perkiraan tinggi satu baris, termasuk nilai panjang yang akan dibungkus. */
const tinggiBaris = (b) => {
  if (b.jenis === 'aturan') return TINGGI.aturan;
  if (b.jenis === 'judul') return TINGGI.judul;

  if (b.jenis === 'kecil') return TINGGI.kecil * perkiraanBaris(b.teks, UKURAN.kecil, ISI);

  return TINGGI.teks * perkiraanBaris(b.nilai, UKURAN.teks, LEBAR_NILAI);
};

/**
 * Unduh kwitansi bergaya struk: satu kolom sempit, huruf mono, garis putus-putus.
 * Nilainya diambil dari resolveReceiptFields, sama dengan angka yang tampil di
 * layar sukses pembayaran dan riwayat langganan.
 *
 * @param {object} details Rincian pembayaran (refNo, dateStr, planName, amount, adminFee, totalPaid)
 * @param {object} user Rincian pengguna (name, email, phone)
 */
export const downloadReceiptPdf = (details, user) => {
  const data = resolveReceiptFields(details, user);

  const baris = susunBaris(data);
  const tinggi = baris.reduce((t, b) => t + tinggiBaris(b), 0) + MARGIN + 4;

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
      doc.setTextColor(20, 82, 58);
      doc.text(b.teks, LEBAR / 2, y + 4.5, { align: 'center' });
      doc.setTextColor(32, 30, 26);
      y += TINGGI.judul;
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

  const cleanRef = String(data.refNo).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Kwitansi-Wahidiyah-${cleanRef}.pdf`);
};
