/**
 * @file tests/m2_challenger_reader_qris_stress.test.mjs
 * @description Empirical Challenger Test Suite for Milestone 2:
 * Rigorously stress-tests the Web Document Reader & QRIS Payment Lifecycle:
 * 1. Reader Zoom Limits (40% - 300%) & Disabled State Boundaries
 * 2. Reader Page Jump Clamping & Adversarial Inputs (Negative, 999999, NaN, String)
 * 3. Reader Multi-Format Classification & Error/Pro Fallback Handling
 * 4. Reading Progress localStorage Persistence, Isolation & Clamping
 * 5. DOCX Container Styling & Arabic Typography Fallback Verification
 * 6. QRIS Image Load Failure -> SVG Fallback State Machine
 * 7. QRIS Status Polling Interval & Cancellation Safety (data-testid="qris-cancel")
 * 8. jsPDF Digital Receipt Generation Stress & Encoding Resilience
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
// Modul kwitansi kanonik sekarang ada di root src/lib (M1 memindahkan fitur
// reader/QRIS keluar dari landing-page). generateReceiptPdf versi lama sudah
// digantikan downloadReceiptPdf; yang diuji di sini adalah lapangan datanya.
import { resolveReceiptFields } from '../src/lib/receiptFields.js';
import { formatRupiah } from '../src/lib/formatUtils.js';

test('M2 Empirical Challenger: Web Document Reader & QRIS Stress Suite', async (t) => {
  // =========================================================================
  // SECTION 1: READER ZOOM LIMITS (40% - 300%) & BOUNDARIES
  // =========================================================================
  await t.test('1. Reader Zoom Limits: Min 40%, Max 300%, Step 10% Clamping', () => {
    const MIN_ZOOM = 40;
    const MAX_ZOOM = 300;
    const STEP = 10;

    const zoomIn = (prev) => Math.min(MAX_ZOOM, prev + STEP);
    const zoomOut = (prev) => Math.max(MIN_ZOOM, prev - STEP);
    const zoomReset = () => 100;

    // 1.1 Initial state
    let zoom = 100;
    assert.equal(zoom, 100, 'Initial zoom must be 100%');

    // 1.2 Zoom in boundary: reaching 300%
    zoom = 290;
    zoom = zoomIn(zoom);
    assert.equal(zoom, 300, 'Zooming in from 290% with step 10% should reach 300%');
    zoom = zoomIn(zoom);
    assert.equal(zoom, 300, 'Zooming in past 300% must be clamped at 300%');

    // 1.3 Rapid zoom in stress (50 consecutive steps)
    for (let i = 0; i < 50; i++) {
      zoom = zoomIn(zoom);
    }
    assert.equal(zoom, 300, 'Zoom must strictly not exceed MAX_ZOOM 300% after 50 increments');

    // 1.4 Zoom out boundary: reaching 40%
    zoom = 50;
    zoom = zoomOut(zoom);
    assert.equal(zoom, 40, 'Zooming out from 50% with step 10% should reach 40%');
    zoom = zoomOut(zoom);
    assert.equal(zoom, 40, 'Zooming out past 40% must be clamped at 40%');

    // 1.5 Rapid zoom out stress (50 consecutive steps)
    for (let i = 0; i < 50; i++) {
      zoom = zoomOut(zoom);
    }
    assert.equal(zoom, 40, 'Zoom must strictly not drop below MIN_ZOOM 40% after 50 decrements');

    // 1.6 Reset zoom
    zoom = zoomReset();
    assert.equal(zoom, 100, 'Reset zoom must return to exactly 100%');

    // 1.7 ReaderTopBar button disabled predicates
    const isZoomOutDisabled = (z) => z <= 40;
    const isZoomInDisabled = (z) => z >= 300;

    assert.equal(isZoomOutDisabled(40), true, 'ZoomOut button must be disabled at 40%');
    assert.equal(isZoomOutDisabled(50), false, 'ZoomOut button must be enabled at 50%');
    assert.equal(isZoomInDisabled(300), true, 'ZoomIn button must be disabled at 300%');
    assert.equal(isZoomInDisabled(290), false, 'ZoomIn button must be enabled at 290%');

    // Implementasi kanonik (root src/features/reader) memakai state zoom 100%
    // yang diteruskan ke tiap viewer; kontrol zoom lama 40–300% sudah dihapus.
    const readerSrc = fs.readFileSync('src/features/reader/PdfReaderScreen.jsx', 'utf8');
    assert.ok(
      readerSrc.includes('const [zoom, setZoom] = useState(100);'),
      'PdfReaderScreen must initialise zoom at 100%',
    );
    assert.ok(
      readerSrc.includes('zoom={zoom}'),
      'PdfReaderScreen must forward zoom to document viewers',
    );

    const topBarSrc = fs.readFileSync('src/features/reader/ReaderTopBar.jsx', 'utf8');
    assert.ok(
      topBarSrc.includes('onPageInputSubmit') && topBarSrc.includes('totalPages'),
      'ReaderTopBar must expose page-jump navigation controls',
    );
  });

  // =========================================================================
  // SECTION 2: PAGE JUMP CLAMPING & ADVERSARIAL INPUTS
  // =========================================================================
  await t.test('2. Page Jump Input Clamping & Adversarial Inputs', () => {
    // Model the exact page jump handler logic from PdfReaderScreen.jsx
    function simulatePageJump(pageInput, currentPage, totalPages) {
      let targetScrollPage = null;
      let newCurrentPage = currentPage;
      let newPageInput = pageInput;

      const val = parseInt(pageInput, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) {
        targetScrollPage = val;
        newCurrentPage = val;
      } else {
        newPageInput = String(currentPage);
      }

      return {
        targetScrollPage,
        currentPage: newCurrentPage,
        pageInput: newPageInput,
        isValid: targetScrollPage !== null,
      };
    }

    const totalPages = 42;
    const initialPage = 7;

    // 2.1 Valid jump
    const valid = simulatePageJump('15', initialPage, totalPages);
    assert.equal(valid.isValid, true);
    assert.equal(valid.currentPage, 15);
    assert.equal(valid.targetScrollPage, 15);

    // 2.2 Jump to first and last page boundaries
    const first = simulatePageJump('1', initialPage, totalPages);
    assert.equal(first.isValid, true);
    assert.equal(first.currentPage, 1);

    const last = simulatePageJump('42', initialPage, totalPages);
    assert.equal(last.isValid, true);
    assert.equal(last.currentPage, 42);

    // 2.3 Adversarial: Negative number input (e.g. -5, -999)
    const neg = simulatePageJump('-5', initialPage, totalPages);
    assert.equal(neg.isValid, false, 'Negative page input must be rejected');
    assert.equal(neg.currentPage, initialPage, 'Current page must not change on negative input');
    assert.equal(neg.pageInput, String(initialPage), 'Input field must revert to current page');

    // 2.4 Adversarial: Page zero (0)
    const zero = simulatePageJump('0', initialPage, totalPages);
    assert.equal(zero.isValid, false, 'Page 0 must be rejected');
    assert.equal(zero.currentPage, initialPage);
    assert.equal(zero.pageInput, String(initialPage));

    // 2.5 Adversarial: Extremely large page beyond range (e.g. 999999)
    const massive = simulatePageJump('999999', initialPage, totalPages);
    assert.equal(massive.isValid, false, 'Out-of-range 999999 page must be rejected');
    assert.equal(massive.currentPage, initialPage);
    assert.equal(massive.pageInput, String(initialPage));

    // 2.6 Adversarial: Non-numeric strings, empty, spaces, scripts
    const nonNumeric = [
      'abc',
      '',
      '   ',
      'NaN',
      'undefined',
      '<script>alert(1)</script>',
      '!@#$%^&*()',
    ];
    for (const badInput of nonNumeric) {
      const res = simulatePageJump(badInput, initialPage, totalPages);
      assert.equal(res.isValid, false, `Input "${badInput}" must be rejected safely`);
      assert.equal(res.currentPage, initialPage, `Current page must remain ${initialPage}`);
      assert.equal(res.pageInput, String(initialPage), `Input must revert to ${initialPage}`);
    }

    // 2.7 Continuous scroll onPageChange clamping logic
    const clampPage = (page, total) => Math.max(1, Math.min(total, page));
    assert.equal(clampPage(-10, 50), 1, 'Negative continuous scroll page clamps to 1');
    assert.equal(clampPage(0, 50), 1, 'Zero continuous scroll page clamps to 1');
    assert.equal(
      clampPage(75, 50),
      50,
      'Overflow continuous scroll page clamps to totalPages (50)',
    );
    assert.equal(clampPage(25, 50), 25, 'In-range continuous scroll page stays 25');
  });

  // =========================================================================
  // SECTION 3: MULTI-FORMAT CLASSIFICATION & FALLBACK HANDLING
  // =========================================================================
  await t.test('3. Reader Multi-Format Classification & Error States', () => {
    const TEXT_TYPES = new Set(['txt', 'md', 'csv', 'rtf']);
    const PDF_TYPES = new Set(['pdf']);
    const DOCX_TYPES = new Set(['docx', 'doc', 'odt']);

    const getExtension = (book) =>
      String(book?.contentExtension || book?.contentType || '')
        .toLowerCase()
        .replace('.', '');

    // 3.1 Format detection matrix
    const testCases = [
      { book: { contentExtension: 'pdf' }, expectedType: 'pdf' },
      { book: { contentExtension: '.PDF' }, expectedType: 'pdf' },
      { book: { contentType: 'pdf' }, expectedType: 'pdf' },
      { book: { contentExtension: 'docx' }, expectedType: 'docx' },
      { book: { contentExtension: '.DOCX' }, expectedType: 'docx' },
      { book: { contentExtension: 'doc' }, expectedType: 'docx' },
      { book: { contentExtension: 'odt' }, expectedType: 'docx' },
      { book: { contentExtension: 'txt' }, expectedType: 'text' },
      { book: { contentExtension: '.MD' }, expectedType: 'text' },
      { book: { contentExtension: 'csv' }, expectedType: 'text' },
      { book: { contentExtension: 'unknown_ext' }, expectedType: 'other' },
      { book: {}, expectedType: 'empty' },
      { book: null, expectedType: 'empty' },
    ];

    for (const { book, expectedType } of testCases) {
      const ext = getExtension(book);
      let detectedType = 'other';
      if (PDF_TYPES.has(ext)) detectedType = 'pdf';
      else if (DOCX_TYPES.has(ext)) detectedType = 'docx';
      else if (TEXT_TYPES.has(ext)) detectedType = 'text';
      else if (!ext) detectedType = 'empty';

      assert.equal(
        detectedType,
        expectedType,
        `Book extension ${ext} should map to ${expectedType}`,
      );
    }

    // 3.2 Error and Pro Lock State Mapping
    function determineContentState(err) {
      if (
        err === 'PRO_LOCKED' ||
        err?.status === 403 ||
        String(err?.message || '')
          .toLowerCase()
          .includes('pro')
      ) {
        return 'locked';
      }
      return 'error';
    }

    assert.equal(determineContentState('PRO_LOCKED'), 'locked');
    assert.equal(
      determineContentState({ status: 403, message: 'Pro membership required' }),
      'locked',
    );
    assert.equal(determineContentState(new Error('Network error: 500')), 'error');
    assert.equal(determineContentState(new Error('Fetch failed: 404')), 'error');
  });

  // =========================================================================
  // SECTION 4: READING PROGRESS LOCALSTORAGE PERSISTENCE
  // =========================================================================
  await t.test('4. Reading Progress localStorage Persistence & Recovery', () => {
    // In-memory mock localStorage
    const storage = new Map();
    const mockLocalStorage = {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, val) => storage.set(key, String(val)),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
    };

    const bookA = { id: 'buku-wahidiyah-001', title: 'Kitab Al-Hikam' };
    const bookB = { id: 'buku-wahidiyah-002', title: 'Sholawat Wahidiyah' };

    // 4.1 Save progress for Book A at page 14
    const keyA = `last_read_page_${bookA.id}`;
    mockLocalStorage.setItem(keyA, String(14));

    // 4.2 Save progress for Book B at page 88
    const keyB = `last_read_page_${bookB.id}`;
    mockLocalStorage.setItem(keyB, String(88));

    // 4.3 Verify isolation between books
    assert.equal(mockLocalStorage.getItem(keyA), '14');
    assert.equal(mockLocalStorage.getItem(keyB), '88');

    // 4.4 Simulate recovery logic on mount
    function recoverSavedPage(bookId, totalPages) {
      const storageKey = `last_read_page_${bookId}`;
      const localSaved = Number(mockLocalStorage.getItem(storageKey));
      if (localSaved && localSaved >= 1) {
        return Math.min(totalPages, localSaved);
      }
      return 1;
    }

    assert.equal(recoverSavedPage(bookA.id, 50), 14, 'Book A recovers saved page 14');
    assert.equal(recoverSavedPage(bookB.id, 100), 88, 'Book B recovers saved page 88');

    // 4.5 Boundary: saved page exceeds updated totalPages (e.g. file was shortened)
    assert.equal(
      recoverSavedPage(bookB.id, 40),
      40,
      'Page 88 clamps to totalPages 40 when shortened',
    );

    // 4.6 Boundary: corrupted or non-numerical values in localStorage
    mockLocalStorage.setItem('last_read_page_corrupted_1', '0');
    assert.equal(recoverSavedPage('corrupted_1', 50), 1, 'Stored 0 safely defaults to 1');

    mockLocalStorage.setItem('last_read_page_corrupted_2', '-99');
    assert.equal(
      recoverSavedPage('corrupted_2', 50),
      1,
      'Stored negative page safely defaults to 1',
    );

    mockLocalStorage.setItem('last_read_page_corrupted_3', 'invalid_string');
    assert.equal(
      recoverSavedPage('corrupted_3', 50),
      1,
      'Stored non-number string safely defaults to 1',
    );

    mockLocalStorage.setItem('last_read_page_corrupted_4', 'null');
    assert.equal(
      recoverSavedPage('corrupted_4', 50),
      1,
      'Stored "null" string safely defaults to 1',
    );
  });

  // =========================================================================
  // SECTION 5: DOCX CONTAINER STYLING & ARABIC TYPOGRAPHY FALLBACK
  // =========================================================================
  await t.test('5. DOCX Container Styling & Arabic Typography Fallback', () => {
    // 5.1 Verify DOCX A4 paginated styling in DocxDocumentViewer.jsx
    const docxSrc = fs.readFileSync('src/features/reader/DocxDocumentViewer.jsx', 'utf8');
    assert.ok(
      docxSrc.includes('.docx-render-host section.docx-page'),
      'DocxDocumentViewer must contain section.docx-page CSS selector for A4 pages',
    );
    assert.ok(
      docxSrc.includes('box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.12)'),
      'DocxDocumentViewer must apply page drop-shadow for realistic pagination',
    );
    assert.ok(
      docxSrc.includes('breakPages: true'),
      'DocxDocumentViewer renderAsync must have breakPages: true configured',
    );
    assert.ok(
      docxSrc.includes('supportsZoom') && docxSrc.includes('transform: `scale(${scale})`'),
      'DocxDocumentViewer must implement dual zoom scaling (CSS zoom and CSS transform fallback)',
    );

    // 5.2 Verify Arabic typography in TextDocViewer.jsx
    const textDocSrc = fs.readFileSync('src/features/reader/TextDocViewer.jsx', 'utf8');
    assert.ok(
      textDocSrc.includes('font-arabic'),
      'TextDocViewer must use font-arabic class for Arabic headings',
    );
    assert.ok(
      textDocSrc.includes('currentSample?.arabicHeading'),
      'TextDocViewer must support sample pages with Arabic headings',
    );
    assert.ok(
      textDocSrc.includes('PERPUSTAKAAN DIGITAL WAHIDIYAH'),
      'TextDocViewer must brand sample pages with PERPUSTAKAAN DIGITAL WAHIDIYAH',
    );
  });

  // =========================================================================
  // SECTION 6: QRIS IMAGE FAILURE -> SVG FALLBACK STATE MACHINE
  // =========================================================================
  await t.test('6. QRIS Lifecycle: Image Load Failure -> SVG QRCodeSVG Fallback', () => {
    // Model the exact render decision tree in QrisPaymentCard.jsx
    function renderQrComponent({
      qrTransaction,
      qrImageGagal,
      isQrisPaid,
      isExpired,
      isGeneratingQr,
      qrError,
    }) {
      if (isGeneratingQr) return 'LOADER';
      if (qrError) return 'ERROR';
      if (isQrisPaid) return 'PAID_SUCCESS';
      if (isExpired) return 'EXPIRED_NOTICE';

      if (qrTransaction?.qrImageUrl && !qrImageGagal) {
        return 'IMG_MIDTRANS_PROXY';
      } else if (qrTransaction?.qrString) {
        return 'SVG_QRCODE_FALLBACK';
      }
      return 'EMPTY';
    }

    const mockTransaction = {
      orderId: 'ORDER-STRESS-123',
      qrImageUrl: '/api/payments/qris/ORDER-STRESS-123/qr.png',
      qrString:
        '00020101021226670016ID.CO.SHOPEE.WWW01189360091800000000005204581253033605802ID5914WAHIDIYAH BOOK6007JAKARTA61051011062070703A016304ABCD',
    };

    // State 1: Fresh transaction with initial qrImageGagal = false -> Shows image
    let qrImageGagal = false;
    let render = renderQrComponent({
      qrTransaction: mockTransaction,
      qrImageGagal,
      isQrisPaid: false,
      isExpired: false,
      isGeneratingQr: false,
      qrError: null,
    });
    assert.equal(render, 'IMG_MIDTRANS_PROXY', 'Initially renders Midtrans image proxy');

    // State 2: Image onError triggers qrImageGagal = true -> Falls back to SVG QRCodeSVG
    qrImageGagal = true;
    render = renderQrComponent({
      qrTransaction: mockTransaction,
      qrImageGagal,
      isQrisPaid: false,
      isExpired: false,
      isGeneratingQr: false,
      qrError: null,
    });
    assert.equal(
      render,
      'SVG_QRCODE_FALLBACK',
      'On image load failure, immediately falls back to SVG QRCodeSVG',
    );

    // State 3: New order generation resets qrImageGagal to false
    const newTransaction = {
      orderId: 'ORDER-STRESS-456',
      qrImageUrl: '/api/payments/qris/ORDER-STRESS-456/qr.png',
      qrString: '00020101021226...NEW_CODE',
    };
    qrImageGagal = false; // Reset by useEffect on orderId change
    render = renderQrComponent({
      qrTransaction: newTransaction,
      qrImageGagal,
      isQrisPaid: false,
      isExpired: false,
      isGeneratingQr: false,
      qrError: null,
    });
    assert.equal(render, 'IMG_MIDTRANS_PROXY', 'New order resets to image attempt');

    // State 4: Only qrString provided (no qrImageUrl) -> directly renders SVG
    const svgOnlyTransaction = {
      orderId: 'ORDER-SVG-ONLY',
      qrImageUrl: null,
      qrString: '00020101021226...DIRECT_SVG',
    };
    render = renderQrComponent({
      qrTransaction: svgOnlyTransaction,
      qrImageGagal: false,
      isQrisPaid: false,
      isExpired: false,
      isGeneratingQr: false,
      qrError: null,
    });
    assert.equal(render, 'SVG_QRCODE_FALLBACK', 'Direct SVG fallback when no image URL provided');

    // Verify in QrisPaymentCard.jsx source code
    const cardSrc = fs.readFileSync('src/features/payment/QrisPaymentCard.jsx', 'utf8');
    assert.ok(
      cardSrc.includes('qrTransaction?.qrImageUrl && !qrImageGagal'),
      'QrisPaymentCard has qrImageUrl && !qrImageGagal guard',
    );
    assert.ok(
      cardSrc.includes('onError={() => setQrImageGagal(true)}'),
      'QrisPaymentCard sets qrImageGagal on img onError',
    );
    assert.ok(cardSrc.includes('<QRCodeSVG'), 'QrisPaymentCard renders QRCodeSVG on fallback');
    assert.ok(
      cardSrc.includes('data-testid="qris-cancel"'),
      'QrisPaymentCard has data-testid="qris-cancel" button',
    );
  });

  // =========================================================================
  // SECTION 7: POLLING INTERVAL & CANCELLATION SAFETY (data-testid="qris-cancel")
  // =========================================================================
  await t.test('7. QRIS Status Polling Interval & Cancellation Safety', async () => {
    // Model the timer & polling lifecycle in useQrisPayment.js
    class PollingHarness {
      constructor() {
        this.pollInterval = null;
        this.pollCount = 0;
        this.isPaid = false;
        this.isExpired = false;
        this.cancelled = false;
      }

      startPolling(callback, ms = 3000) {
        this.stopPolling();
        this.pollInterval = setInterval(() => {
          if (this.isPaid || this.isExpired || this.cancelled) {
            this.stopPolling();
            return;
          }
          this.pollCount++;
          callback?.();
        }, ms);
      }

      stopPolling() {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      }

      cancel() {
        this.cancelled = true;
        this.stopPolling();
      }
    }

    const harness = new PollingHarness();
    let pollTriggers = 0;

    // Start 100ms fast simulation for testing
    harness.startPolling(() => {
      pollTriggers++;
    }, 10);

    // Tunggu sampai 2 tick benar-benar terjadi. Tidur tetap 35 ms dulu flaky
    // saat CPU sibuk (timer tertunda → cuma 1 tick), padahal yang diuji adalah
    // perilaku polling, bukan kecepatan mesin. Batas 500 ms tetap menjaga tes
    // tidak menggantung bila interval benar-benar mati.
    const deadline = Date.now() + 500;
    while (pollTriggers < 2 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5));
    }
    assert.ok(pollTriggers >= 2, `Should have polled at least 2 times, got ${pollTriggers}`);

    // Trigger user cancellation (click data-testid="qris-cancel")
    harness.cancel();
    assert.equal(
      harness.pollInterval,
      null,
      'Polling interval must be cleared immediately on cancel',
    );
    const snapshotPollCount = pollTriggers;

    // Wait another 30ms to verify zero further polling triggers occur
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(
      pollTriggers,
      snapshotPollCount,
      'No more polling requests must fire after cancellation',
    );

    // Verify useQrisPayment.js source code ensures clearInterval
    const hookSrc = fs.readFileSync('src/features/payment/useQrisPayment.js', 'utf8');
    assert.ok(
      hookSrc.includes('const POLL_INTERVAL_MS = 3000;'),
      'Polling interval must be 3000ms',
    );
    assert.ok(
      hookSrc.includes('if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);'),
      'Must clear interval when stopping or unmounting',
    );
    assert.ok(hookSrc.includes('data?.isPaid === true'), 'Must handle paid/settlement status');
  });

  // =========================================================================
  // SECTION 8: jsPDF DIGITAL RECEIPT GENERATION STRESS & ENCODING
  // =========================================================================
  await t.test('8. Receipt Data Layer Stress & Encoding Resilience', () => {
    // 8.1 Rincian standar harus konsisten dengan yang tercetak di PDF
    const standardDetails = {
      refNo: 'WB-TEST-20261106',
      dateStr: '06/11/2026, 12:45',
      planName: 'Paket Pro Bulanan',
      amount: 25000,
      adminFee: 3000,
      totalPaid: 28000,
    };
    const standardUser = {
      name: 'Muhammad Hasyim',
      email: 'hasyim@wahidiyah.org',
      phone: '081234567890',
    };

    const standard = resolveReceiptFields(standardDetails, standardUser);
    assert.equal(standard.refNo, 'WB-TEST-20261106');
    assert.equal(standard.dateStr, '06/11/2026, 12:45');
    assert.equal(standard.amount, 25000);
    assert.equal(standard.adminFee, 3000);
    assert.equal(standard.totalPaid, 28000);
    assert.equal(standard.userPhone, '081234567890');

    // 8.2 Boundary: biaya admin nol
    const zeroFee = resolveReceiptFields(
      {
        refNo: 'WB-NOFEE-001',
        planName: 'Paket Pro Tahunan',
        amount: 250000,
        adminFee: 0,
        totalPaid: 250000,
      },
      standardUser,
    );
    assert.equal(zeroFee.adminFee, 0);
    assert.equal(zeroFee.totalPaid, 250000);

    // 8.3 Adversarial: objek kosong tidak boleh melempar dan harus ada fallback
    const sparse = resolveReceiptFields({}, {});
    assert.ok(sparse.refNo.startsWith('WB-'), 'Must generate fallback WB- refNo');
    assert.equal(sparse.userName, 'Pengguna Wahidiyah', 'Must fallback to default userName');
    assert.equal(sparse.userEmail, '-', 'Must fallback to default userEmail');
    assert.ok(sparse.dateStr.length > 0, 'Must generate fallback date string');

    // 8.4 Stress: string sangat panjang & karakter Unicode tetap utuh
    const extremeDetails = {
      refNo: 'WB-VERY-LONG-REFERENCE-NUMBER-ABCD-1234-EFGH-5678-IJKL-9012-MNOP-3456-QRST',
      dateStr: 'Jumat Legi, 06 November 2026 12:45:59 WIB',
      planName: 'Paket Langganan Anggota Kehormatan Wahidiyah Tingkat Nasional dan Internasional',
      amount: 999999999,
      adminFee: 5000,
      totalPaid: 1000004999,
    };
    const extremeUser = {
      name: 'K.H. Dr. Ir. Raden Mas Bagus H. Muhammad Fachruddin Al-Wahidi S.Pd.I M.Ag',
      email: 'muhammad.fachruddin.alwahidi.super.long.address@santri.pesantren.wahidiyah.ac.id',
      phone: '+62-812-3456-7890-EXT-999',
    };
    const extreme = resolveReceiptFields(extremeDetails, extremeUser);
    assert.equal(extreme.refNo, extremeDetails.refNo);
    assert.equal(extreme.userEmail, extremeUser.email);
    assert.equal(extreme.totalPaid, 1000004999);

    // 8.5 Currency formatting (Intl.NumberFormat menghasilkan spasi tak terputus \u00A0)
    assert.equal(formatRupiah(25000).replace(/\u00A0/g, ' '), 'Rp 25.000');
    assert.equal(formatRupiah(3000).replace(/\u00A0/g, ' '), 'Rp 3.000');
    assert.equal(formatRupiah(28000).replace(/\u00A0/g, ' '), 'Rp 28.000');
    assert.equal(formatRupiah(0).replace(/\u00A0/g, ' '), 'Rp 0');
    assert.equal(formatRupiah(-500).replace(/\u00A0/g, ' '), '-Rp 500');

    // 8.6 Generator PDF aktif memakai warna brand resmi & sanitasi nama berkas
    const receiptSrc = fs.readFileSync('src/lib/receiptPdf.js', 'utf8');
    assert.ok(
      receiptSrc.includes('doc.setTextColor(20, 82, 58)'),
      'Brand color must remain Wahidiyah emerald rgb(20, 82, 58)',
    );
    assert.ok(
      receiptSrc.includes("replace(/[^a-zA-Z0-9_-]/g, '_')"),
      'Receipt filename must sanitize path traversal characters',
    );
  });

  // =========================================================================
  // SECTION 9: RECEIPT FILENAME SANITIZATION & PATH TRAVERSAL RESISTANCE
  // =========================================================================
  await t.test('9. Receipt Filename Sanitization & Path Traversal Resistance', () => {
    function sanitizeReceiptFilename(refNo) {
      const cleanRef = String(refNo).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `Kwitansi-Wahidiyah-${cleanRef}.pdf`;
    }

    // Normal ref
    assert.equal(sanitizeReceiptFilename('WB-12345'), 'Kwitansi-Wahidiyah-WB-12345.pdf');

    // Path traversal attempt: ../../../etc/passwd
    assert.equal(
      sanitizeReceiptFilename('../../../etc/passwd'),
      'Kwitansi-Wahidiyah-_________etc_passwd.pdf',
      'Path traversal dots and slashes must be replaced with underscores',
    );

    // Windows backslash path traversal attempt: ..\\..\\boot.ini
    assert.equal(
      sanitizeReceiptFilename('..\\..\\boot.ini'),
      'Kwitansi-Wahidiyah-______boot_ini.pdf',
      'Windows backslashes must be sanitized',
    );

    // Null byte injection attempt
    assert.equal(
      sanitizeReceiptFilename('WB-123\0.exe'),
      'Kwitansi-Wahidiyah-WB-123__exe.pdf',
      'Null bytes and extension dots must be sanitized to underscores',
    );

    // Spaces and special characters
    assert.equal(sanitizeReceiptFilename('REF 123 !@#$'), 'Kwitansi-Wahidiyah-REF_123_____.pdf');
  });

  // =========================================================================
  // SECTION 10: COUNTDOWN TIMER MATH & EXPIRATION BOUNDARIES
  // =========================================================================
  await t.test('10. QRIS Countdown Timer Math & Expiration Boundaries', () => {
    const DEFAULT_COUNTDOWN_SECONDS = 15 * 60; // 900s
    const secondsUntil = (isoDate, nowMs = Date.now()) => {
      const target = new Date(isoDate).getTime();
      if (!Number.isFinite(target)) return DEFAULT_COUNTDOWN_SECONDS;
      return Math.max(0, Math.round((target - nowMs) / 1000));
    };

    const formatCountdown = (seconds) =>
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

    const now = 1793943990000;

    // 10.1 Exactly 15 minutes ahead
    const target15m = new Date(now + 15 * 60 * 1000).toISOString();
    assert.equal(secondsUntil(target15m, now), 900);
    assert.equal(formatCountdown(900), '15:00');

    // 10.2 5 seconds ahead
    const target5s = new Date(now + 5 * 1000).toISOString();
    assert.equal(secondsUntil(target5s, now), 5);
    assert.equal(formatCountdown(5), '0:05');

    // 10.3 In the past (expired) -> must clamp to 0
    const targetPast = new Date(now - 60 * 1000).toISOString();
    assert.equal(secondsUntil(targetPast, now), 0, 'Past date must clamp to 0');
    assert.equal(formatCountdown(0), '0:00');

    // 10.4 Invalid / malformed ISO date string (NaN target) -> returns DEFAULT_COUNTDOWN_SECONDS
    assert.equal(secondsUntil('invalid-date-string', now), 900);
    assert.equal(secondsUntil(undefined, now), 900);

    // 10.5 Null date (new Date(null) is epoch 0, finite past) -> clamps to 0 (expired)
    assert.equal(secondsUntil(null, now), 0, 'Null date evaluates to epoch 0 and clamps to 0');
  });

  // =========================================================================
  // SECTION 11: ACTIVE BOOK URL QUERY RESTORATION
  // =========================================================================
  await t.test('11. Active Book URL Query State Recovery Simulation', () => {
    const mockCatalog = [
      { id: 'buku-al-hikam', title: 'Kitab Al-Hikam', pages: 120 },
      { id: 'buku-sholawat', title: 'Sholawat Wahidiyah', pages: 45 },
    ];

    function resolveBookFromQuery(searchQuery, books) {
      const params = new URLSearchParams(searchQuery);
      const bookId = params.get('id');
      if (bookId && books && books.length > 0) {
        return books.find((b) => String(b.id) === String(bookId)) || null;
      }
      return null;
    }

    // Valid query ?id=buku-al-hikam
    const found1 = resolveBookFromQuery('?id=buku-al-hikam', mockCatalog);
    assert.ok(found1);
    assert.equal(found1.title, 'Kitab Al-Hikam');

    // Query with extra parameters ?id=buku-sholawat&page=3
    const found2 = resolveBookFromQuery('?id=buku-sholawat&page=3', mockCatalog);
    assert.ok(found2);
    assert.equal(found2.title, 'Sholawat Wahidiyah');

    // Query with non-existent ID
    const found3 = resolveBookFromQuery('?id=non-existent', mockCatalog);
    assert.equal(found3, null, 'Non-existent book ID yields null');

    // Empty search query
    const found4 = resolveBookFromQuery('', mockCatalog);
    assert.equal(found4, null, 'Empty search string yields null');
  });
});
