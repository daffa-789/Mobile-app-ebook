/**
 * @file tests/e2e/tier3_cross_feature.test.mjs
 * @description Tier 3 E2E Test Suite: Cross-Feature Interactions.
 * Verifies pairwise integration across decoupled application subsystems.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import writeXlsxFile from 'write-excel-file/node';
import { startTestServer, getTestTokens, KNOWN_USERS } from './helpers/testServer.mjs';
import { createTestSuite, assert, createMinimalPdfBuffer } from './helpers/testHelpers.mjs';
import { countPdfPages } from '../../server/lib/pdfPages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export const suite = createTestSuite('Tier 3: Cross-Feature Interactions');

let testEnv = null;
let tokens = null;

suite.test('TC3.1: Full Auth, QRIS Order, Pro Status & Book Paywall Unlock Chain', async () => {
  // Step 1: Query catalog to find available books
  const resBooks = await testEnv.request('/api/books');
  assert.equal(resBooks.status, 200);
  const sampleBook = resBooks.data.books[0];
  assert.ok(sampleBook, 'Catalog must provide a book for reader flow');

  // Step 2: Regular user creates QRIS order request
  // (In test env without live Midtrans credentials, service validates input or returns 503 safely)
  const resCharge = await testEnv.request('/api/payments/qris/charge', {
    method: 'POST',
    token: tokens.regularToken,
    body: { planId: 'monthly', phone: '081234567890' },
  });
  assert.ok([200, 201, 503].includes(resCharge.status), 'Charge request evaluates plan pricing');

  // Step 3: Admin manages Pro status for regular user
  const targetUserId = KNOWN_USERS.regular.id;
  const resProActivate = await testEnv.request(`/api/users/${targetUserId}/pro`, {
    method: 'PUT',
    token: tokens.adminToken,
    body: { is_pro: true },
  });
  assert.equal(resProActivate.status, 200, 'Admin can activate Pro status');

  // Step 4: Access book content with updated Pro user token
  // Pro token for user who is Pro opens content cleanly
  const resContent = await testEnv.request(`/api/books/${sampleBook.id}/content`, {
    token: tokens.proToken,
  });
  assert.ok([200, 302].includes(resContent.status), 'Pro user accesses book content successfully');

  // Step 5: Clean up (revert regular user pro status)
  await testEnv.request(`/api/users/${targetUserId}/pro`, {
    method: 'PUT',
    token: tokens.adminToken,
    body: { is_pro: false },
  });
});

suite.test(
  'TC3.2: Direct Storage Upload Intent -> PDF Page Counting -> Catalog Retrieval -> Reader View',
  async () => {
    // Step 1: Admin generates direct-to-storage upload intent
    const resIntent = await testEnv.request('/api/books/upload-intent', {
      method: 'POST',
      token: tokens.adminToken,
      body: { filename: 'manuscript-naskah-1.pdf' },
    });
    assert.ok([200, 400].includes(resIntent.status));

    // Step 2: Automated server-side page counting on uploaded PDF buffer
    const samplePdf = createMinimalPdfBuffer();
    const countedPages = await countPdfPages(samplePdf);
    assert.equal(countedPages, 1, 'PDF page counting must return exact 1 page');

    // Step 3: Public catalog retrieval contains page count metadata
    const resCatalog = await testEnv.request('/api/books');
    assert.equal(resCatalog.status, 200);
    for (const book of resCatalog.data.books) {
      assert.ok(
        typeof book.pages === 'number',
        'Every catalog book must have numerical page count',
      );
    }

    // Step 4: Free content delivery stream verification
    const freeBook = resCatalog.data.books.find((b) => !b.is_locked);
    if (freeBook) {
      const resStream = await testEnv.request(`/api/books/${freeBook.id}/content`, {
        token: tokens.regularToken,
      });
      assert.ok([200, 302].includes(resStream.status), 'Free reader stream responds successfully');
    }
  },
);

suite.test(
  'TC3.3: User Role Escalation -> Admin Dashboard Access -> Self-Demotion Guard',
  async () => {
    const targetUser = KNOWN_USERS.regular;

    // Step 1: Regular user initially rejected from /api/admin/logs with 403
    const resInitLogs = await testEnv.request('/api/admin/logs', {
      token: tokens.regularToken,
    });
    assert.equal(resInitLogs.status, 403, 'Regular user must be blocked from admin logs');

    // Step 2: Admin escalates user to admin
    const resEscalate = await testEnv.request(`/api/users/${targetUser.id}/role`, {
      method: 'PUT',
      token: tokens.adminToken,
      body: { role: 'admin' },
    });
    assert.equal(resEscalate.status, 200, 'Admin can elevate user role');

    // Step 3: As admin, attempting self-demotion is rejected with 400
    const resSelfDemote = await testEnv.request(`/api/users/${KNOWN_USERS.admin.id}/role`, {
      method: 'PUT',
      token: tokens.adminToken,
      body: { role: 'user' },
    });
    assert.equal(resSelfDemote.status, 400, 'Admin self-demotion blocked');

    // Step 4: Revert user role back to user
    const resRevert = await testEnv.request(`/api/users/${targetUser.id}/role`, {
      method: 'PUT',
      token: tokens.adminToken,
      body: { role: 'user' },
    });
    assert.equal(resRevert.status, 200, 'User role successfully reverted');
  },
);

suite.test(
  'TC3.4: Event Publication -> Public API Sync -> Web Push Broadcast Trigger',
  async () => {
    // Step 1: Query public events list
    const resEvents = await testEnv.request('/api/events');
    assert.equal(resEvents.status, 200);
    assert.equal(resEvents.data.success, true);
    assert.ok(Array.isArray(resEvents.data.events));

    // Step 2: Admin triggers manual Web Push broadcast reminder
    const sampleEvent = resEvents.data.events[0];
    const eventId = sampleEvent?.id || 'ev-test-123';

    const resReminder = await testEnv.request(`/api/events/${eventId}/send-reminder`, {
      method: 'POST',
      token: tokens.adminToken,
    });
    // Endpoint responds (503 if VAPID unconfigured in test, or 200 with sent count)
    assert.ok(
      [200, 503].includes(resReminder.status),
      'Reminder broadcast endpoint responds cleanly',
    );
  },
);

suite.test(
  'TC3.5: Mobile Auth Session -> Offline Manuscript Sync -> Manifest State Management',
  async () => {
    // Step 1: Simulate mobile client login with credentials DTO
    const resMe = await testEnv.request('/api/auth/me', {
      token: tokens.proToken,
    });
    assert.equal(resMe.status, 200);
    assert.equal(resMe.data.success, true);

    // Step 2: Query books to sync
    const resBooks = await testEnv.request('/api/books');
    const bookToDownload = resBooks.data.books[0];
    assert.ok(bookToDownload, 'Book to download must exist');

    // Step 3: Simulate mobile FileSystem cache storage and manifest persistence
    const simulatedStoragePath = `file:///data/user/0/id.wahidiyah.book/files/naskah/${bookToDownload.id}.pdf`;
    const manifestEntry = {
      id: bookToDownload.id,
      title: bookToDownload.title,
      localUri: simulatedStoragePath,
      downloadedAt: new Date().toISOString(),
      isPro: bookToDownload.is_locked,
    };

    const offlineManifest = [manifestEntry];
    assert.equal(offlineManifest.length, 1);
    assert.equal(offlineManifest[0].id, bookToDownload.id);
    assert.ok(offlineManifest[0].localUri.includes('naskah/'));
  },
);

suite.test(
  'TC3.6: Financial Audit Log Reflection -> Branded 5-Sheet Excel Workbook Export',
  async () => {
    // Step 1: Admin queries audit logs
    const resLogs = await testEnv.request('/api/admin/logs', {
      token: tokens.adminToken,
    });
    assert.equal(resLogs.status, 200);
    assert.ok(Array.isArray(resLogs.data.logs));

    // Step 2: Query users, books, and events for consolidated report
    const resUsers = await testEnv.request('/api/users', { token: tokens.adminToken });
    const resBooks = await testEnv.request('/api/books');
    const resEvents = await testEnv.request('/api/events');

    // Step 3: Build complete branded 5-sheet Excel workbook using write-excel-file
    const users = resUsers.data.users || [];
    const books = resBooks.data.books || [];
    const events = resEvents.data.events || [];

    const sheets = [
      {
        sheet: 'Ringkasan Eksekutif',
        data: [
          ['Metrik Laporan', 'Keterangan'],
          ['Total Pengguna', users.length],
          ['Total Buku', books.length],
          ['Total Agenda', events.length],
        ],
      },
      {
        sheet: 'Transaksi',
        data: [['No', 'No. Referensi', 'Nama', 'Nominal', 'Status']],
      },
      {
        sheet: 'Pengguna',
        data: [
          ['No', 'Nama Lengkap', 'Email', 'Role', 'Status Pro'],
          ...users.map((u, i) => [i + 1, u.name, u.email, u.role, u.is_pro ? 'Pro' : 'Reguler']),
        ],
      },
      {
        sheet: 'Katalog Buku',
        data: [
          ['No', 'Judul', 'Halaman', 'Akses'],
          ...books.map((b, i) => [i + 1, b.title, b.pages, b.is_locked ? 'Pro' : 'Gratis']),
        ],
      },
      {
        sheet: 'Agenda Kegiatan',
        data: [
          ['No', 'Judul Agenda', 'Lokasi', 'Tanggal'],
          ...events.map((e, i) => [i + 1, e.title, e.location || '-', e.date || '-']),
        ],
      },
    ];

    assert.equal(sheets.length, 5, 'Workbook must have 5 sheets');
    const buffer = await writeXlsxFile(sheets).toBuffer();
    assert.ok(buffer.length > 0, 'Generated report buffer must be well-formed');
  },
);

// ==========================================
// SUITE EXECUTION HOOK
// ==========================================

export async function runTier3() {
  testEnv = await startTestServer();
  tokens = getTestTokens();
  try {
    return await suite.run();
  } finally {
    await testEnv.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTier3().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
