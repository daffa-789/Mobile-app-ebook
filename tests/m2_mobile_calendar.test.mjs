/**
 * @file tests/m2_mobile_calendar.test.mjs
 * @description Uji unit helper kalender mobile-app (`mobile-app/src/lib/calendar.js`)
 * dan penjaga agar layar Agenda tidak kembali memakai bulan yang di-hardcode.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DAY_HEADERS,
  DAY_NAMES,
  daysInMonth,
  eventDaysInMonth,
  formatEventDate,
  formatFullDate,
  leadingBlankCells,
  monthLabel,
  parseIsoDate,
  shiftMonth,
  toIsoDate,
} from '../mobile-app/src/lib/calendar.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Helper kalender mobile-app', async (t) => {
  await t.test('1. Panjang bulan mengikuti tahun kabisat', () => {
    assert.strictEqual(daysInMonth(2026, 1), 28, 'Februari 2026 = 28 hari');
    assert.strictEqual(daysInMonth(2024, 1), 29, 'Februari 2024 = 29 hari (kabisat)');
    assert.strictEqual(daysInMonth(2026, 10), 30, 'November 2026 = 30 hari');
    assert.strictEqual(daysInMonth(2026, 11), 31, 'Desember 2026 = 31 hari');
  });

  await t.test('2. Grid selalu dimulai dari kolom Senin', () => {
    // 1 Nov 2026 jatuh pada Ahad → 6 sel kosong sebelum tanggal 1.
    assert.strictEqual(leadingBlankCells(2026, 10), 6);
    // 1 Jun 2026 jatuh pada Senin → tanpa sel kosong.
    assert.strictEqual(leadingBlankCells(2026, 5), 0);
    // 1 Agu 2026 jatuh pada Sabtu → 5 sel kosong.
    assert.strictEqual(leadingBlankCells(2026, 7), 5);
  });

  await t.test('3. Konversi tanggal ISO bolak-balik', () => {
    assert.strictEqual(toIsoDate(2026, 10, 8), '2026-11-08');
    assert.strictEqual(toIsoDate(2026, 0, 1), '2026-01-01');
    assert.deepStrictEqual(parseIsoDate('2026-11-08'), {
      year: 2026,
      monthIndex: 10,
      day: 8,
    });
    assert.deepStrictEqual(parseIsoDate('2026-11-08T19:30:00+07:00'), {
      year: 2026,
      monthIndex: 10,
      day: 8,
    });
  });

  await t.test('4. Tanggal tidak valid ditolak, bukan digeser', () => {
    assert.strictEqual(parseIsoDate('2026-02-30'), null, '30 Februari tidak ada');
    assert.strictEqual(parseIsoDate('2026-13-01'), null, 'Bulan ke-13 tidak ada');
    assert.strictEqual(parseIsoDate('2026-11-00'), null, 'Hari ke-0 tidak ada');
    assert.strictEqual(parseIsoDate('bukan tanggal'), null);
    assert.strictEqual(parseIsoDate(undefined), null);
  });

  await t.test('5. Pindah bulan menyeberang tahun dengan benar', () => {
    assert.deepStrictEqual(shiftMonth({ year: 2026, month: 10 }, 1), { year: 2026, month: 11 });
    assert.deepStrictEqual(shiftMonth({ year: 2026, month: 11 }, 1), { year: 2027, month: 0 });
    assert.deepStrictEqual(shiftMonth({ year: 2026, month: 0 }, -1), { year: 2025, month: 11 });
    assert.deepStrictEqual(shiftMonth({ year: 2026, month: 10 }, -12), { year: 2025, month: 10 });
  });

  await t.test('6. Label tanggal memakai bahasa Indonesia', () => {
    assert.strictEqual(monthLabel(2026, 10), 'November 2026');
    assert.strictEqual(formatEventDate('2026-10-29'), '29 OKT 2026');
    assert.strictEqual(formatEventDate('2026-06-01'), '1 JUN 2026');
    assert.strictEqual(formatFullDate('2026-11-08'), 'Ahad, 8 November 2026');
    assert.strictEqual(formatEventDate(''), '', 'Tanggal kosong tidak menghasilkan label');
    assert.strictEqual(formatFullDate(null), '');
  });

  await t.test('7. Titik agenda hanya untuk bulan yang ditampilkan', () => {
    const events = [
      { id: 'evt-1', event_date: '2026-10-29' },
      { id: 'evt-2', event_date: '2026-11-01' },
      { id: 'evt-3', event_date: '2026-11-08T19:30:00+07:00' },
      { id: 'evt-4', event_date: null },
      { id: 'evt-5' },
    ];

    const november = eventDaysInMonth(events, 2026, 10);
    assert.deepStrictEqual(
      [...november].sort((a, b) => a - b),
      [1, 8],
    );

    const oktober = eventDaysInMonth(events, 2026, 9);
    assert.deepStrictEqual([...oktober], [29]);

    assert.deepStrictEqual([...eventDaysInMonth([], 2026, 10)], []);
    assert.deepStrictEqual([...eventDaysInMonth(null, 2026, 10)], []);
  });

  await t.test('8. Header hari konsisten dengan tata letak Senin-Ahad', () => {
    assert.strictEqual(DAY_HEADERS.length, 7);
    assert.strictEqual(DAY_HEADERS[0], 'Sen');
    assert.strictEqual(DAY_HEADERS[6], 'Ahd');
    assert.strictEqual(DAY_NAMES.length, 7);
    assert.strictEqual(DAY_NAMES[0], 'Ahad');
  });
});

test('Layar Agenda mobile tidak lagi mengunci bulan tertentu', () => {
  const screenPath = path.join(ROOT_DIR, 'mobile-app/src/screens/CalendarScreen.js');
  const source = fs.readFileSync(screenPath, 'utf8');

  assert.ok(!source.includes('November 2026'), 'Judul bulan tidak boleh di-hardcode');
  assert.ok(!source.includes('2026-11-'), 'Pencocokan tanggal tidak boleh di-hardcode');
  assert.ok(!source.includes('NOVEMBER_DAYS'), 'Grid hari harus dihitung dari bulan aktif');
  assert.ok(!source.includes('EMPTY_START_DAYS'), 'Sel kosong harus dihitung dari bulan aktif');
  assert.ok(source.includes('shiftMonth'), 'Tombol navigasi bulan harus berfungsi');
  assert.ok(source.includes('eventDaysInMonth'), 'Titik agenda harus diturunkan dari data');
});
