import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBook,
  normalizeEvent,
  normalizeSlide,
  normalizeSubscription,
  formatRupiah,
  formatPurchaseDate,
  htmlToPlainText,
  paginateText,
  buildReaderFallback,
} from '../mobile-app/src/lib/catalog.js';

test('Mobile Catalog Synchronization & Helpers Suite', async (t) => {
  await t.test('1. formatRupiah formats currency correctly', () => {
    assert.strictEqual(formatRupiah(25000), 'Rp 25.000');
    assert.strictEqual(formatRupiah(0), 'Rp 0');
    assert.strictEqual(formatRupiah('50000'), 'Rp 50.000');
  });

  await t.test('2. formatPurchaseDate handles ISO string and WIB suffix', () => {
    const formatted = formatPurchaseDate('2026-11-08T10:00:00.000Z');
    assert.ok(formatted.includes('WIB'), 'Must include WIB timezone');
    assert.ok(formatted.includes('2026'), 'Must include year 2026');
  });

  await t.test('3. htmlToPlainText converts HTML to clean readable text', () => {
    const sampleHtml = '<p>Bismillahir <b>Rahmanir</b> Rahim</p><p>Baris kedua &amp; ketiga.</p>';
    const plain = htmlToPlainText(sampleHtml);
    assert.strictEqual(plain, 'Bismillahir Rahmanir Rahim\n\nBaris kedua & ketiga.');
  });

  await t.test('4. paginateText divides long text into pages', () => {
    const paragraphs = [];
    for (let i = 1; i <= 10; i++) {
      paragraphs.push(`Paragraf ke-${i}: ${'Konten buku teks Wahidiyah '.repeat(20)}`);
    }
    const longText = paragraphs.join('\n\n');
    const pages = paginateText(longText, 500);

    assert.ok(pages.length > 1, `Must create multiple pages, created: ${pages.length}`);
    for (const page of pages) {
      assert.ok(page.length > 0, 'Every page must have content');
    }
  });

  await t.test('5. normalizeBook produces safe, honest fields and thumbnail URL', () => {
    const raw = {
      id: 'buku-test-1',
      title: 'Kitab Al-Hikam',
      author: 'Ibnu Athaillah',
      category: 'Tasawuf',
      pages_count: 120,
      is_locked: true,
      file_type: 'docx',
    };

    const book = normalizeBook(raw);
    assert.strictEqual(book.id, 'buku-test-1');
    assert.strictEqual(book.title, 'Kitab Al-Hikam');
    assert.strictEqual(book.author, 'Ibnu Athaillah');
    assert.strictEqual(book.is_locked, true);
    assert.ok(book.cover_url.includes('/books/buku-test-1/thumbnail'));
  });

  await t.test('6. normalizeBook provides fallbacks when fields are missing', () => {
    const emptyRaw = { id: 'buku-kosong' };
    const book = normalizeBook(emptyRaw);
    assert.strictEqual(book.title, 'Tanpa Judul');
    assert.strictEqual(book.author, 'Penyiar Sholawat Wahidiyah');
    assert.strictEqual(book.category, 'Kitab & Amalan');
    assert.strictEqual(book.is_locked, false);
  });

  await t.test('7. normalizeEvent sets dateDisplay and generates Google Maps query URL', () => {
    const rawEvent = {
      id: 'evt-1',
      title: 'Mujahadah Kubro',
      event_date: '2026-12-10',
      location: 'Pesantren Kedunglo, Kediri',
    };

    const ev = normalizeEvent(rawEvent);
    assert.strictEqual(ev.id, 'evt-1');
    assert.ok(ev.mapsUrl.includes('google.com/maps/search/'));
    assert.ok(ev.mapsUrl.includes('Kedunglo'));
    assert.ok(ev.dateDisplay.includes('2026'));
  });

  await t.test('8. normalizeSubscription formats amount and date nicely', () => {
    const rawSub = {
      id: 'sub-100',
      plan_name: 'Paket Bulanan',
      amount: 25000,
      status: 'success',
      created_at: '2026-11-08T08:00:00.000Z',
    };

    const sub = normalizeSubscription(rawSub);
    assert.strictEqual(sub.formattedAmount, 'Rp 25.000');
    assert.ok(sub.formattedDate.includes('WIB'));
  });

  await t.test('9. buildReaderFallback creates informative fallback content', () => {
    const book = {
      title: 'Panduan Sholawat',
      author: 'Penyiar Wahidiyah',
      category: 'Doa',
      description: 'Panduan lengkap membaca Sholawat.',
      file_type: 'pdf',
    };
    const fallback = buildReaderFallback(book);
    assert.ok(fallback.includes('JUDUL: Panduan Sholawat'));
    assert.ok(fallback.includes('PDF'));
  });
});
