/**
 * @file scripts/fix-book-pages.js
 * @description Membandingkan kolom `pages` dengan jumlah halaman PDF yang
 * sebenarnya, lalu (hanya dengan `--terapkan`) menulis nilai yang benar.
 *
 * Bawaannya HANYA MEMBACA. Ini disengaja: kolom `pages` dipakai penampil
 * sebagai dasar progres baca, jadi angka yang salah terlihat seperti bug
 * aplikasi, bukan salah data.
 *
 * Pemakaian:
 *   node scripts/fix-book-pages.js              # laporan saja
 *   node scripts/fix-book-pages.js --terapkan   # tulis perbaikan
 */

import '../server/env.js';
import { supabaseServer } from '../server/db.js';
import { countPdfPages } from '../server/lib/pdfPages.js';
import { readContentBuffer } from '../server/lib/storage.js';

const terapkan = process.argv.includes('--terapkan');

const { data: books, error } = await supabaseServer
  .from('books')
  .select('id, title, pages, content_extension, content_url')
  .order('created_at');

if (error) {
  console.error('Gagal membaca katalog:', error.message);
  process.exit(1);
}

if (!books?.length) {
  console.log('Tidak ada buku di katalog.');
  process.exit(0);
}

console.log(
  terapkan
    ? '\nMode: MENULIS PERBAIKAN\n'
    : '\nMode: hanya membaca (tambah --terapkan untuk menulis)\n',
);

let perluDiperbaiki = 0;
let ditulis = 0;

for (const book of books) {
  const judul = String(book.title || book.id).slice(0, 34);

  if (book.content_extension !== 'pdf') {
    console.log(
      `lewat   | ${judul} | ${book.content_extension || 'tanpa berkas'} — halaman tidak dapat dihitung dari berkas`,
    );
    continue;
  }

  let actual = null;
  try {
    actual = await countPdfPages(await readContentBuffer(book.content_url));
  } catch (readError) {
    console.log(`gagal   | ${judul} | ${String(readError.message).slice(0, 60)}`);
    continue;
  }

  if (!actual) {
    console.log(`gagal   | ${judul} | PDF tidak terbaca (terlalu besar atau rusak)`);
    continue;
  }

  const tersimpan = Number(book.pages) || 0;
  if (tersimpan === actual) {
    console.log(`cocok   | ${judul} | ${actual} halaman`);
    continue;
  }

  perluDiperbaiki += 1;
  console.log(`BEDA    | ${judul} | kolom ${tersimpan} → berkas ${actual}`);

  if (terapkan) {
    const { error: writeError } = await supabaseServer
      .from('books')
      .update({ pages: actual })
      .eq('id', book.id);
    if (writeError) {
      console.log(`        | ↑ gagal menulis: ${writeError.message}`);
    } else {
      ditulis += 1;
    }
  }
}

console.log(
  terapkan
    ? `\nSelesai: ${ditulis} baris diperbaiki dari ${perluDiperbaiki} yang berbeda.`
    : `\nDitemukan ${perluDiperbaiki} baris yang berbeda. Jalankan dengan --terapkan untuk memperbaikinya.`,
);
