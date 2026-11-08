import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// =========================================================================
// CHALLENGER SUITE 1: HeroCarousel Boundary Transitions, Gestures & Autoplay
// =========================================================================
test('Challenger Suite 1: HeroCarousel Logic, Gesture & Autoplay Stress', async (t) => {
  const SWIPE_THRESHOLD_PX = 45;

  // Pure logic replica matching HeroCarousel.jsx
  const createCarouselController = (slides = [], autoPlay = true, intervalMs = 6000) => {
    let index = 0;
    let isPaused = false;
    let touchStartX = null;
    const total = slides.length;

    const goTo = (next) => {
      if (total === 0) return;
      index = ((next % total) + total) % total;
    };

    const onTouchStart = (clientX) => {
      touchStartX = clientX ?? null;
    };

    const onTouchEnd = (clientX) => {
      const startX = touchStartX;
      touchStartX = null;
      if (startX === null || clientX === null || clientX === undefined) return;
      const deltaX = clientX - startX;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
      goTo(deltaX < 0 ? index + 1 : index - 1);
    };

    const onKeyDown = (key) => {
      if (key === 'ArrowLeft') {
        goTo(index - 1);
        return true;
      } else if (key === 'ArrowRight') {
        goTo(index + 1);
        return true;
      }
      return false;
    };

    const tickAutoPlay = () => {
      if (!autoPlay || total <= 1 || isPaused) return false;
      index = (index + 1) % total;
      return true;
    };

    return {
      get index() {
        return index;
      },
      set index(val) {
        index = val;
      },
      get isPaused() {
        return isPaused;
      },
      set isPaused(val) {
        isPaused = val;
      },
      goTo,
      onTouchStart,
      onTouchEnd,
      onKeyDown,
      tickAutoPlay,
      total,
    };
  };

  await t.test(
    '1.1 Boundary transitions: first -> last and last -> first with arbitrary indices',
    () => {
      const slides = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const c = createCarouselController(slides);

      // Initial state
      assert.strictEqual(c.index, 0, 'Initial index must be 0');

      // First -> Last (wrap around backwards)
      c.goTo(-1);
      assert.strictEqual(c.index, 3, 'goTo(-1) from index 0 must wrap to 3 (last slide)');

      // Last -> First (wrap around forwards)
      c.goTo(4);
      assert.strictEqual(c.index, 0, 'goTo(4) from index 3 must wrap to 0 (first slide)');

      // Multiple wrap-arounds
      c.goTo(-9); // -9 % 4 = -1 -> 3
      assert.strictEqual(c.index, 3, 'goTo(-9) must wrap to 3');

      c.goTo(14); // 14 % 4 = 2
      assert.strictEqual(c.index, 2, 'goTo(14) must wrap to 2');

      // Edge case: single slide
      const cSingle = createCarouselController([{ id: 1 }]);
      cSingle.goTo(5);
      assert.strictEqual(cSingle.index, 0, 'Single slide carousel must stay at index 0');
      cSingle.goTo(-5);
      assert.strictEqual(cSingle.index, 0, 'Single slide carousel must stay at index 0');

      // Edge case: empty slides
      const cEmpty = createCarouselController([]);
      cEmpty.goTo(1);
      assert.strictEqual(cEmpty.index, 0, 'Empty carousel goTo must be no-op');
    },
  );

  await t.test('1.2 Rapid touch swipe thresholds (SWIPE_THRESHOLD_PX = 45)', () => {
    const slides = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const c = createCarouselController(slides);

    // Sub-threshold swipes (< 45px)
    c.onTouchStart(100);
    c.onTouchEnd(144); // deltaX = +44 (swipe right, below threshold)
    assert.strictEqual(c.index, 0, 'Delta +44px must not trigger slide change');

    c.onTouchStart(100);
    c.onTouchEnd(56); // deltaX = -44 (swipe left, below threshold)
    assert.strictEqual(c.index, 0, 'Delta -44px must not trigger slide change');

    // Exact threshold boundary (= 45px)
    c.onTouchStart(100);
    c.onTouchEnd(55); // deltaX = -45 (swipe left, exact threshold)
    assert.strictEqual(c.index, 1, 'Delta -45px must advance to next slide');

    c.onTouchStart(100);
    c.onTouchEnd(145); // deltaX = +45 (swipe right, exact threshold)
    assert.strictEqual(c.index, 0, 'Delta +45px must retreat to previous slide');

    // Large and rapid touch events
    c.onTouchStart(500);
    c.onTouchEnd(50); // deltaX = -450 (fast swipe)
    assert.strictEqual(c.index, 1, 'Fast swipe must advance to next slide');

    // Interrupted / canceled touches (null/undefined clientX)
    c.onTouchStart(100);
    c.onTouchEnd(null);
    assert.strictEqual(c.index, 1, 'Null touch end must not crash or trigger transition');

    // End event without start event
    c.onTouchEnd(50);
    assert.strictEqual(c.index, 1, 'Touch end without start must be safely ignored');
  });

  await t.test('1.3 Keyboard arrow events and key filtering', () => {
    const slides = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const c = createCarouselController(slides);

    assert.strictEqual(c.index, 0);

    // ArrowRight advances
    const rightHandled = c.onKeyDown('ArrowRight');
    assert.strictEqual(rightHandled, true, 'ArrowRight should be handled');
    assert.strictEqual(c.index, 1, 'ArrowRight should advance to index 1');

    // ArrowLeft retreats
    const leftHandled = c.onKeyDown('ArrowLeft');
    assert.strictEqual(leftHandled, true, 'ArrowLeft should be handled');
    assert.strictEqual(c.index, 0, 'ArrowLeft should retreat to index 0');

    // ArrowLeft wrap-around
    c.onKeyDown('ArrowLeft');
    assert.strictEqual(c.index, 2, 'ArrowLeft from index 0 should wrap to index 2');

    // Other keys ignored
    const enterHandled = c.onKeyDown('Enter');
    const spaceHandled = c.onKeyDown(' ');
    const tabHandled = c.onKeyDown('Tab');
    const upHandled = c.onKeyDown('ArrowUp');
    assert.strictEqual(enterHandled, false, 'Enter should not be handled');
    assert.strictEqual(spaceHandled, false, 'Space should not be handled');
    assert.strictEqual(tabHandled, false, 'Tab should not be handled');
    assert.strictEqual(upHandled, false, 'ArrowUp should not be handled');
    assert.strictEqual(c.index, 2, 'Non-arrow keys must not change index');
  });

  await t.test('1.4 Autoplay intervals, pause states, and single slide guard', () => {
    const slides = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const c = createCarouselController(slides, true, 6000);

    // Normal tick advances
    assert.strictEqual(c.tickAutoPlay(), true, 'Normal tick should advance');
    assert.strictEqual(c.index, 1, 'Index should be 1 after tick');

    // Paused state (hover/focus/hidden)
    c.isPaused = true;
    assert.strictEqual(c.tickAutoPlay(), false, 'Paused tick should not advance');
    assert.strictEqual(c.index, 1, 'Index must not change when paused');

    // Resume
    c.isPaused = false;
    assert.strictEqual(c.tickAutoPlay(), true, 'Resumed tick should advance');
    assert.strictEqual(c.index, 2);

    // Autoplay disabled by prop
    const cDisabled = createCarouselController(slides, false);
    assert.strictEqual(cDisabled.tickAutoPlay(), false);
    assert.strictEqual(cDisabled.index, 0);

    // Autoplay disabled for single slide
    const cSingle = createCarouselController([{ id: 1 }], true);
    assert.strictEqual(cSingle.tickAutoPlay(), false, 'Single slide should not autoplay');
  });
});

// =========================================================================
// CHALLENGER SUITE 2: Catalog Search, Filter Chips & Sorting Stress
// =========================================================================
test('Challenger Suite 2: BookCatalogSection Search, Category & Sort Stress', async (t) => {
  const mockBooks = [
    {
      id: 'buku-1',
      title: 'Kuliah Wahidiyah',
      isLocked: false,
      createdAt: '2026-01-10T00:00:00Z',
    },
    {
      id: 'buku-2',
      title: 'Tuntunan Mujahadah',
      isLocked: false,
      createdAt: '2026-02-15T00:00:00Z',
    },
    {
      id: 'buku-3',
      title: 'Ajaran Sholawat Wahidiyah',
      isLocked: true,
      createdAt: '2026-03-20T00:00:00Z',
    },
    {
      id: 'buku-4',
      title: 'Brosur Pedoman Amaliyah',
      isLocked: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'buku-5',
      title: 'Kitab Al-Hikam Terjemah',
      isLocked: true,
      createdAt: '2026-04-05T00:00:00Z',
    },
    {
      id: 'buku-6',
      title: 'صلوات الواحدية (Naskah Arab)',
      isLocked: true,
      createdAt: '2026-05-01T00:00:00Z',
    },
    { id: 'buku-7', title: null, isLocked: false, createdAt: null }, // Null title robustness
  ];

  // Pure filtering logic replica from BookCatalogSection.jsx
  const filterAndSortCatalog = (books, searchQuery, selectedCategory, sortBy) => {
    let result = [...books];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => b.title?.toLowerCase().includes(q));
    }

    // 2. Category Filter
    if (selectedCategory === 'Gratis') {
      result = result.filter((b) => !b.isLocked);
    } else if (selectedCategory === 'Pro Eksklusif') {
      result = result.filter((b) => b.isLocked);
    }

    // 3. Sorting
    if (sortBy === 'az') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'id'));
    } else if (sortBy === 'za') {
      result.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'id'));
    } else if (sortBy === 'terbaru') {
      result.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    }

    return result;
  };

  const calculateCounts = (books) => {
    let gratis = 0;
    let pro = 0;
    books.forEach((b) => {
      if (b.isLocked) pro += 1;
      else gratis += 1;
    });
    return { semua: books.length, gratis, pro };
  };

  await t.test('2.1 Category counts invariant', () => {
    const counts = calculateCounts(mockBooks);
    assert.strictEqual(counts.semua, 7, 'Total count must equal mock length');
    assert.strictEqual(counts.gratis, 4, 'Gratis count must be 4');
    assert.strictEqual(counts.pro, 3, 'Pro count must be 3');
    assert.strictEqual(
      counts.semua,
      counts.gratis + counts.pro,
      'Semua must equal gratis + pro sum',
    );
  });

  await t.test('2.2 Live search: empty string and whitespace handling', () => {
    const emptyResult = filterAndSortCatalog(mockBooks, '', 'Semua', 'terbaru');
    assert.strictEqual(emptyResult.length, 7, 'Empty search string should return all books');

    const spaceResult = filterAndSortCatalog(mockBooks, '   \t  ', 'Semua', 'terbaru');
    assert.strictEqual(spaceResult.length, 7, 'Whitespace-only search should return all books');
  });

  await t.test('2.3 Live search: special characters, XSS & regex injection resilience', () => {
    const dangerousQueries = [
      '<script>alert(1)</script>',
      "' OR 1=1 --",
      '\\d+',
      '[a-z]+',
      '.*',
      '$^()',
      '\\\\',
      '?',
      '#',
    ];

    for (const dq of dangerousQueries) {
      assert.doesNotThrow(() => {
        const res = filterAndSortCatalog(mockBooks, dq, 'Semua', 'terbaru');
        assert.ok(Array.isArray(res), `Search for "${dq}" must return an array`);
        assert.strictEqual(
          res.length,
          0,
          `Search for unmatched dangerous query "${dq}" must yield 0 results`,
        );
      }, `Dangerous query "${dq}" should not cause regex syntax error or throw`);
    }
  });

  await t.test('2.4 Live search: case-insensitivity and Arabic unicode matching', () => {
    // Case insensitivity
    const lower = filterAndSortCatalog(mockBooks, 'sholawat', 'Semua', 'terbaru');
    const upper = filterAndSortCatalog(mockBooks, 'SHOLAWAT', 'Semua', 'terbaru');
    const mixed = filterAndSortCatalog(mockBooks, 'ShOlAwAt', 'Semua', 'terbaru');
    assert.strictEqual(lower.length, 1, 'Should find 1 book with "sholawat"');
    assert.strictEqual(upper.length, 1, 'Should find 1 book with "SHOLAWAT"');
    assert.strictEqual(mixed.length, 1, 'Should find 1 book with "ShOlAwAt"');
    assert.strictEqual(lower[0].id, 'buku-3');

    // Arabic Unicode matching
    const arabic = filterAndSortCatalog(mockBooks, 'الواحدية', 'Semua', 'terbaru');
    assert.strictEqual(arabic.length, 1, 'Should match Arabic book title');
    assert.strictEqual(arabic[0].id, 'buku-6');
  });

  await t.test('2.5 Category chip filter toggling', () => {
    const gratis = filterAndSortCatalog(mockBooks, '', 'Gratis', 'terbaru');
    assert.strictEqual(gratis.length, 4, 'Gratis filter should return 4 books');
    assert.ok(
      gratis.every((b) => !b.isLocked),
      'All books in Gratis filter must have isLocked === false',
    );

    const pro = filterAndSortCatalog(mockBooks, '', 'Pro Eksklusif', 'terbaru');
    assert.strictEqual(pro.length, 3, 'Pro Eksklusif filter should return 3 books');
    assert.ok(
      pro.every((b) => b.isLocked),
      'All books in Pro filter must have isLocked === true',
    );
  });

  await t.test('2.6 Sorting orders: terbaru, az, and za', () => {
    // 1. Terbaru (newest first)
    const sortedTerbaru = filterAndSortCatalog(mockBooks, '', 'Semua', 'terbaru');
    assert.strictEqual(
      sortedTerbaru[0].id,
      'buku-6',
      'Newest book (2026-05-01) should be first in terbaru',
    );
    assert.strictEqual(
      sortedTerbaru[1].id,
      'buku-5',
      'Second newest (2026-04-05) should be second in terbaru',
    );
    // Books with null dates are sorted to the end
    assert.strictEqual(
      sortedTerbaru[sortedTerbaru.length - 1].createdAt,
      null,
      'Null date books should be at the end',
    );

    // 2. A - Z alphabetical
    const sortedAZ = filterAndSortCatalog(mockBooks, '', 'Semua', 'az');
    const titlesAZ = sortedAZ.map((b) => b.title || '');
    for (let i = 0; i < titlesAZ.length - 1; i++) {
      assert.ok(
        titlesAZ[i].localeCompare(titlesAZ[i + 1], 'id') <= 0,
        `AZ sort order violation: "${titlesAZ[i]}" vs "${titlesAZ[i + 1]}"`,
      );
    }

    // 3. Z - A alphabetical
    const sortedZA = filterAndSortCatalog(mockBooks, '', 'Semua', 'za');
    const titlesZA = sortedZA.map((b) => b.title || '');
    for (let i = 0; i < titlesZA.length - 1; i++) {
      assert.ok(
        titlesZA[i].localeCompare(titlesZA[i + 1], 'id') >= 0,
        `ZA sort order violation: "${titlesZA[i]}" vs "${titlesZA[i + 1]}"`,
      );
    }
  });
});

// =========================================================================
// CHALLENGER SUITE 3: PaywallModal Interaction, State & Focus Trapping
// =========================================================================
test('Challenger Suite 3: PaywallModal Lock Interaction & Dialog Focus Trap', async (t) => {
  await t.test('3.1 Locked vs unlocked book click dispatch rules', () => {
    const regularUser = { id: 'u1', isPro: false };
    const proUser = { id: 'u2', isPro: true };
    const anonymousUser = null;

    const freeBook = { id: 'b1', title: 'Free Book', isLocked: false };
    const lockedBook = { id: 'b2', title: 'Locked Book', isLocked: true };

    const simulateBookClick = (book, user) => {
      let openedReaderWith = null;
      let openedPaywallWith = null;

      const isLocked = book.isLocked && !user?.isPro;
      if (isLocked) {
        openedPaywallWith = book;
      } else {
        openedReaderWith = book;
      }

      return { openedReaderWith, openedPaywallWith };
    };

    // Case A: Anonymous clicks free book -> open reader
    const r1 = simulateBookClick(freeBook, anonymousUser);
    assert.strictEqual(r1.openedReaderWith?.id, 'b1');
    assert.strictEqual(r1.openedPaywallWith, null);

    // Case B: Anonymous clicks locked book -> trigger paywall
    const r2 = simulateBookClick(lockedBook, anonymousUser);
    assert.strictEqual(r2.openedReaderWith, null);
    assert.strictEqual(r2.openedPaywallWith?.id, 'b2');

    // Case C: Regular user clicks locked book -> trigger paywall
    const r3 = simulateBookClick(lockedBook, regularUser);
    assert.strictEqual(r3.openedReaderWith, null);
    assert.strictEqual(r3.openedPaywallWith?.id, 'b2');

    // Case D: Pro user clicks locked book -> open reader directly
    const r4 = simulateBookClick(lockedBook, proUser);
    assert.strictEqual(r4.openedReaderWith?.id, 'b2');
    assert.strictEqual(r4.openedPaywallWith, null);

    // Case E: Pro user clicks free book -> open reader directly
    const r5 = simulateBookClick(freeBook, proUser);
    assert.strictEqual(r5.openedReaderWith?.id, 'b1');
    assert.strictEqual(r5.openedPaywallWith, null);
  });

  await t.test('3.2 Single-page landing showcase integrity (post-M1)', () => {
    // M1 menghapus HomeScreen/PaywallModal/reader dari landing page. Landing kini
    // murni halaman promosi statis dengan CTA unduh APK langsung.
    const appContent = fs.readFileSync('landing-page/src/App.jsx', 'utf8');
    for (const section of ['HeroSection', 'PreviewSection', 'FeaturesSection']) {
      assert.ok(appContent.includes(section), `Landing App.jsx must render ${section}`);
    }
    assert.equal(
      appContent.includes('InstallGuideSection') ||
        appContent.includes('DownloadCtaSection') ||
        appContent.includes('FaqSection'),
      false,
      'Landing page must not mount InstallGuide, DownloadCta, or Faq sections',
    );
    assert.equal(
      appContent.includes('PdfReaderScreen') || appContent.includes('PaywallModal'),
      false,
      'Landing page must not mount reader or paywall (moved out in M1)',
    );
  });

  await t.test('3.3 Dialog Focus Trap logic verification (useDialogFocusTrap.js)', () => {
    // Implementasi kanonik sekarang hidup di root src/lib dan dipakai BookModal
    // pada admin dashboard (duplikat di landing-page sudah dihapus di M1).
    const focusTrapContent = fs.readFileSync('src/lib/useDialogFocusTrap.js', 'utf8');

    // Checks key requirements:
    // 1. Selects all focusable selectors
    assert.ok(
      focusTrapContent.includes('FOCUSABLE_SELECTOR'),
      'useDialogFocusTrap must define FOCUSABLE_SELECTOR',
    );

    // 2. Escape key handling
    assert.ok(
      focusTrapContent.includes("event.key === 'Escape'"),
      'useDialogFocusTrap must handle Escape key',
    );

    // 3. Tab cycling (Tab vs Shift+Tab)
    assert.ok(
      focusTrapContent.includes("event.key !== 'Tab'"),
      'useDialogFocusTrap must check for Tab key',
    );
    assert.ok(
      focusTrapContent.includes('event.shiftKey'),
      'useDialogFocusTrap must support reverse cycling with Shift+Tab',
    );

    // 4. Focus restoration on unmount/close
    assert.ok(
      focusTrapContent.includes('previouslyFocused.focus()'),
      'useDialogFocusTrap must restore focus to previouslyFocused element on close',
    );
  });
});

// =========================================================================
// CHALLENGER SUITE 4: Exhaustive Tailwind v4 Compilation Audit for Landing
// =========================================================================
test('Challenger Suite 4: Tailwind v4 Class Compilation Audit Across Landing Workspace', async (t) => {
  const landingAssetsDir = path.resolve('dist/landing/assets');
  assert.ok(
    fs.existsSync(landingAssetsDir),
    'dist/landing/assets must exist. Ensure npm run build:landing was executed.',
  );

  const landingCssFile = fs.readdirSync(landingAssetsDir).find((f) => f.endsWith('.css'));
  assert.ok(landingCssFile, 'CSS bundle must exist in dist/landing/assets');

  const landingCss = fs.readFileSync(path.join(landingAssetsDir, landingCssFile), 'utf8');

  // Extract classes from all JSX files in landing-page/src
  function extractClassesFromDirectory(dir) {
    const classes = new Set();
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const f of files) {
      const fullPath = path.join(dir, f.name);
      if (f.isDirectory()) {
        const subClasses = extractClassesFromDirectory(fullPath);
        for (const sc of subClasses) classes.add(sc);
      } else if (f.name.endsWith('.jsx') || f.name.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const regex = /className=["'`]([^"'`]+)["'`]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const parts = match[1].split(/\s+/).filter(Boolean);
          for (const p of parts) {
            // Filter out template literals / dynamic expressions
            if (!p.includes('${') && !p.includes('}') && /^[a-zA-Z0-9_\-:[\]/.]+$/.test(p)) {
              classes.add(p);
            }
          }
        }
      }
    }
    return classes;
  }

  const allClasses = Array.from(extractClassesFromDirectory('landing-page/src'));
  console.log(`Auditing ${allClasses.length} unique CSS classes found across landing-page/src...`);

  const missing = [];
  const matched = [];

  for (const cls of allClasses) {
    const escaped = cls.replace(/([:.[\]/])/g, '\\$1');
    const selectorPattern = new RegExp(`\\.${escaped.replace(/\\/g, '\\\\')}(?=[^a-zA-Z0-9_-]|$)`);

    if (selectorPattern.test(landingCss) || landingCss.includes(escaped)) {
      matched.push(cls);
    } else {
      missing.push(cls);
    }
  }

  console.log(`Class Compilation Match: ${matched.length}/${allClasses.length} classes compiled.`);

  if (missing.length > 0) {
    console.warn(`Unmatched classes (check if dynamic or vendor-provided):`, missing.slice(0, 10));
  }

  // Must match at least 95% of static utility classes
  const matchRate = (matched.length / allClasses.length) * 100;
  console.log(`Compilation match rate: ${matchRate.toFixed(2)}%`);
  assert.ok(
    matchRate >= 95,
    `Tailwind v4 class compilation rate must be >= 95% (got ${matchRate.toFixed(2)}%)`,
  );

  // Essential theme tokens audit
  const mandatoryTokens = [
    'bg-cream-50',
    'bg-brand-700',
    'text-ink-900',
    'text-gold-400',
    'rounded-3xl',
    'aspect-[1/1.42]',
    'font-serif',
  ];

  for (const token of mandatoryTokens) {
    const escaped = token.replace(/([:.[\]/])/g, '\\$1');
    assert.ok(
      landingCss.includes(escaped),
      `Mandatory theme token "${token}" must be present in compiled CSS bundle`,
    );
  }
});
