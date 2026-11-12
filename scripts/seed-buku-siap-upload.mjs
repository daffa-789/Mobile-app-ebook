/**
 * @file scripts/seed-buku-siap-upload.mjs
 * @description Mengunggah file PDF dan sampul dari project-resources/books/ready-to-upload
 * ke Supabase Storage (bucket 'buku') dan menyimpan metadatanya ke tabel 'books'.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import '../server/env.js';
import { supabaseServer } from '../server/db.js';
import { toWebp, toDataUrl } from '../server/lib/images.js';
import { countPdfPages } from '../server/lib/pdfPages.js';

const BUCKET_NAME = 'buku';
const BASE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../project-resources/books/ready-to-upload',
);

const booksToUpload = [
  {
    folder: '1-lembaran-sholawat-wahidiyah',
    pdfFile: 'sholawat-wahidiyah-arab-latin.pdf',
    coverFile: 'sampul.jpg',
    title: 'Lembaran Sholawat Wahidiyah',
    isLocked: false,
    defaultPages: 16,
  },
  {
    folder: '2-panduan-mujahadah-wahidiyah',
    pdfFile: 'panduan-mujahadah-usbuiyah-syahriyah.pdf',
    coverFile: 'sampul.jpg',
    title: 'Panduan Mujahadah Usbuiyah & Syahriyah',
    isLocked: false,
    defaultPages: 28,
  },
  {
    folder: '3-terjemah-hadits-arbain-nawawi',
    pdfFile: 'terjemah-hadits-arbain-nawawi.pdf',
    coverFile: 'sampul.jpg',
    title: "Hadits Arba'in An-Nawawiyah",
    isLocked: true,
    defaultPages: 48,
  },
];

const generateId = (prefix) => `${prefix}-${crypto.randomUUID().replace(/-/g, '')}`;

async function main() {
  console.log('🚀 Memulai pengunggahan buku dari:', BASE_DIR);

  for (const item of booksToUpload) {
    const folderPath = path.join(BASE_DIR, item.folder);
    const pdfPath = path.join(folderPath, item.pdfFile);
    const coverPath = path.join(folderPath, item.coverFile);

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ Berkas PDF tidak ditemukan: ${pdfPath}`);
      continue;
    }
    if (!fs.existsSync(coverPath)) {
      console.error(`❌ Berkas Sampul tidak ditemukan: ${coverPath}`);
      continue;
    }

    console.log(`\n📚 Memproses buku: "${item.title}"...`);

    // 1. Baca buffer PDF dan hitung halaman
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfSize = pdfBuffer.length;
    let pages = item.defaultPages;
    try {
      const calculatedPages = await countPdfPages(pdfBuffer);
      if (calculatedPages > 0) pages = calculatedPages;
    } catch (e) {
      console.warn(`  ⚠️ Tidak dapat menghitung halaman PDF otomatis, gunakan default: ${pages}`);
    }

    // 2. Baca dan proses cover ke WebP data URL
    const coverBuffer = fs.readFileSync(coverPath);
    const coverWebp = await toWebp(coverBuffer, {
      width: 600,
      quality: 80,
      fallbackMime: 'image/jpeg',
    });
    const coverDataUrl = toDataUrl(coverWebp.buffer, coverWebp.mime);

    // 3. Upload file PDF ke Supabase Storage bucket 'buku'
    const slug = item.folder.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const storagePath = `naskah/${slug}/${item.pdfFile}`;

    console.log(
      `  ⬆️ Mengunggah ${item.pdfFile} (${(pdfSize / 1024 / 1024).toFixed(2)} MB) ke ${BUCKET_NAME}/${storagePath}...`,
    );
    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error(`  ❌ Gagal mengunggah PDF ke storage:`, uploadError.message);
      continue;
    }

    // 4. Periksa apakah buku dengan judul sama sudah ada
    const { data: existing } = await supabaseServer
      .from('books')
      .select('id')
      .eq('title', item.title)
      .maybeSingle();

    const bookPayload = {
      title: item.title,
      pages,
      is_locked: item.isLocked,
      cover_url: coverDataUrl,
      content_url: `storage://${BUCKET_NAME}/${storagePath}`,
      content_name: item.pdfFile,
      content_extension: 'pdf',
      content_size: pdfSize,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      console.log(`  🔄 Memperbarui buku yang sudah ada (ID: ${existing.id})...`);
      const { error: updateError } = await supabaseServer
        .from('books')
        .update(bookPayload)
        .eq('id', existing.id);

      if (updateError) {
        console.error(`  ❌ Gagal memperbarui data buku:`, updateError.message);
      } else {
        console.log(`  ✅ Buku "${item.title}" berhasil diperbarui!`);
      }
    } else {
      const id = generateId('buku');
      console.log(`  ➕ Menambahkan baris baru ke tabel 'books' (ID: ${id})...`);
      const { error: insertError } = await supabaseServer.from('books').insert({
        id,
        ...bookPayload,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error(`  ❌ Gagal memasukkan baris buku:`, insertError.message);
      } else {
        console.log(`  ✅ Buku "${item.title}" berhasil ditambahkan ke database!`);
      }
    }
  }

  // 5. Cek ulang jumlah buku di katalog
  const { data: allBooks } = await supabaseServer
    .from('books')
    .select('id, title, pages, is_locked, content_size');
  console.log(`\n🎉 Selesai! Total buku di database sekarang: ${allBooks?.length || 0}`);
  console.table(allBooks);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
