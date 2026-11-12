import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const FIGCRAFT_CLI = 'C:/Program Files/ArtCraft/FigCraft/figcraft-cli.exe';
const TARGET_FIGCRAFT = path.join(ROOT_DIR, 'project-resources', 'design', 'Design APP.figcraft');
const TEST_TEMP_DIR = path.join(ROOT_DIR, 'tests', '.temp_challenger_m1_2');
const ROUNDTRIP_JSON = path.join(TEST_TEMP_DIR, 'roundtrip.json');
const ROUNDTRIP_FIGCRAFT = path.join(TEST_TEMP_DIR, 'roundtrip.figcraft');

// Helper to extract PNG dimensions from IHDR chunk
function readPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;
  assert.ok(isPng, `File ${filePath} is not a valid PNG`);

  const ihdr = buf.subarray(12, 16).toString('ascii');
  assert.strictEqual(ihdr, 'IHDR', 'Missing IHDR chunk in PNG header');

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf.readUInt8(24);
  const colorType = buf.readUInt8(25);
  return { width, height, bitDepth, colorType, size: buf.length };
}

test.before(() => {
  if (!fs.existsSync(TEST_TEMP_DIR)) {
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
  }
});

test('CHALLENGER-1: Package Round-Trip Integrity Verification', async (t) => {
  await t.test('FigCraft binary exists and is readable', () => {
    assert.ok(fs.existsSync(TARGET_FIGCRAFT), 'Design APP.figcraft must exist in project-resources/design');
    const stats = fs.statSync(TARGET_FIGCRAFT);
    assert.ok(
      stats.size > 100000,
      `Design APP.figcraft size (${stats.size}) is unexpectedly small`,
    );
  });

  await t.test('Convert Design APP.figcraft to JSON AST', () => {
    const cmd = `"${FIGCRAFT_CLI}" convert "${TARGET_FIGCRAFT}" "${ROUNDTRIP_JSON}"`;
    execSync(cmd, { encoding: 'utf8' });
    assert.ok(fs.existsSync(ROUNDTRIP_JSON), 'roundtrip.json must be generated');
  });

  let originalAst;
  await t.test('Verify JSON AST conforms to FigCraft Document Schema', () => {
    const raw = fs.readFileSync(ROUNDTRIP_JSON, 'utf8');
    originalAst = JSON.parse(raw);
    assert.ok(originalAst.version !== undefined, 'AST must have version');
    assert.ok(
      originalAst.nodes && typeof originalAst.nodes === 'object',
      'AST must have nodes dictionary',
    );
    assert.ok(Array.isArray(originalAst.pages), 'AST must have pages array');
    assert.ok(
      originalAst.pages.length >= 6,
      `Expected at least 6 pages, got ${originalAst.pages.length}`,
    );

    // Verify expected pages exist
    const pageNames = originalAst.pages.map((pid) => originalAst.nodes[pid]?.name);
    assert.ok(pageNames.includes('00 · Sistem Desain'), 'Missing page: 00 · Sistem Desain');
    assert.ok(pageNames.includes('Mobile - Komponen'), 'Missing page: Mobile - Komponen');
    assert.ok(pageNames.includes('Mobile - Autentikasi'), 'Missing page: Mobile - Autentikasi');
    assert.ok(pageNames.includes('Mobile - Aplikasi'), 'Missing page: Mobile - Aplikasi');
    assert.ok(pageNames.includes('Web - Landing Page'), 'Missing page: Web - Landing Page');
    assert.ok(pageNames.includes('Web - Admin Dashboard'), 'Missing page: Web - Admin Dashboard');
  });

  await t.test('Convert JSON AST back to .figcraft and verify info without data loss', () => {
    const cmdConvertBack = `"${FIGCRAFT_CLI}" convert "${ROUNDTRIP_JSON}" "${ROUNDTRIP_FIGCRAFT}"`;
    execSync(cmdConvertBack, { encoding: 'utf8' });
    assert.ok(fs.existsSync(ROUNDTRIP_FIGCRAFT), 'roundtrip.figcraft must be generated');

    const cmdInfo = `"${FIGCRAFT_CLI}" info "${ROUNDTRIP_FIGCRAFT}"`;
    const infoOutput = execSync(cmdInfo, { encoding: 'utf8' });

    assert.ok(
      infoOutput.includes('2180 nodes'),
      `Expected 2180 nodes in info output, got:\n${infoOutput}`,
    );
    assert.ok(
      infoOutput.includes('86 styles'),
      `Expected 86 styles in info output, got:\n${infoOutput}`,
    );
    assert.ok(
      infoOutput.includes('90 variables'),
      `Expected 90 variables in info output, got:\n${infoOutput}`,
    );
    assert.ok(
      infoOutput.includes('Web - Landing Page'),
      'info output must contain Web - Landing Page',
    );
    assert.ok(
      infoOutput.includes('Web - Admin Dashboard'),
      'info output must contain Web - Admin Dashboard',
    );
  });
});

test('CHALLENGER-2: Page 2269 (Web - Landing Page) Structural & Semantic Stress-Test', async (t) => {
  const ast = JSON.parse(fs.readFileSync(ROUNDTRIP_JSON, 'utf8'));

  const landingPageId = ast.pages.find((pid) => ast.nodes[pid]?.name === 'Web - Landing Page');
  assert.ok(landingPageId, 'Web - Landing Page not found in AST pages');
  const landingPage = ast.nodes[landingPageId];

  await t.test('Landing Page top-level frames count and dimensions', () => {
    assert.strictEqual(
      landingPage.children.length,
      2,
      'Web - Landing Page must have exactly 2 top-level frames',
    );

    const frameDesktop = ast.nodes[landingPage.children[0]];
    const frameMobile = ast.nodes[landingPage.children[1]];

    assert.ok(
      frameDesktop.name.includes('Landing Page Desktop'),
      `Unexpected desktop frame name: ${frameDesktop.name}`,
    );
    assert.strictEqual(frameDesktop.width, 1440, 'Desktop landing frame width must be 1440');
    assert.strictEqual(frameDesktop.height, 2078, 'Desktop landing frame height must be 2078');

    assert.ok(
      frameMobile.name.includes('Landing Page Mobile'),
      `Unexpected mobile frame name: ${frameMobile.name}`,
    );
    assert.strictEqual(frameMobile.width, 390, 'Mobile landing frame width must be 390');
    assert.strictEqual(frameMobile.height, 2360, 'Mobile landing frame height must be 2360');
  });

  await t.test('Desktop Landing Frame Section Structure and Hierarchy', () => {
    const frameDesktop = ast.nodes[landingPage.children[0]];
    const desktopChildren = frameDesktop.children.map((cid) => ast.nodes[cid]);
    const sectionNames = desktopChildren.map((c) => c.name);

    assert.ok(
      sectionNames.some((n) => n.includes('Header') || n.includes('Navbar')),
      'Header/Navbar must exist',
    );
    assert.ok(
      sectionNames.some((n) => n.includes('Hero Section')),
      'Hero Section must exist',
    );
    assert.ok(
      sectionNames.some((n) => n.includes('Features Section')),
      'Features Section must exist',
    );
    assert.ok(
      sectionNames.some((n) => n.includes('Preview Section')),
      'Preview Section must exist',
    );
    assert.ok(
      sectionNames.some((n) => n.includes('Landing Footer')),
      'Landing Footer must exist',
    );
  });

  // Collect all text characters across page 2269
  function collectTextInSubtree(nodeId) {
    const node = ast.nodes[nodeId];
    if (!node) return [];
    let texts = [];
    if (node.type === 'text' && node.characters) {
      texts.push(node.characters);
    }
    if (Array.isArray(node.children)) {
      for (const cid of node.children) {
        texts = texts.concat(collectTextInSubtree(cid));
      }
    }
    return texts;
  }

  await t.test('Landing Page Copy Content matches landing-page/ source code', () => {
    const allTexts = collectTextInSubtree(landingPageId);

    // Hero Section copy checks
    assert.ok(
      allTexts.some((t) =>
        t.includes('Khazanah Keilmuan & Amaliyah Wahidiyah dalam Satu Genggaman'),
      ),
      'Hero main headline must match HeroSection.jsx',
    );
    assert.ok(
      allTexts.some((t) =>
        t.includes(
          'Aplikasi mobile resmi Mobile-app-ebook menghadirkan kemudahan membaca Lembaran Sholawat Wahidiyah',
        ),
      ),
      'Hero subtitle must match HeroSection.jsx',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Unduh APK Langsung (.apk)')),
      'APK Download button label must be present',
    );
    assert.ok(
      allTexts.some((t) => t.includes('100% Gratis & Bebas Iklan')),
      'Trust highlight 1 must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Naskah Resmi & Terverifikasi')),
      'Trust highlight 2 must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Ringan & Dukung Mode Offline')),
      'Trust highlight 3 must match',
    );

    // Features Section copy checks
    assert.ok(
      allTexts.some((t) => t.includes('FITUR UTAMA APLIKASI MOBILE')),
      'Features pill badge must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Dirancang Khusus untuk Kenyamanan Beribadah & Belajar')),
      'Features section heading must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Koleksi Kitab Sholawat')),
      'Feature 1 title must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Pembaca Naskah Nyaman & Ramah Mata')),
      'Feature 2 title must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Agenda & Kalender Amaliyah')),
      'Feature 3 title must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Mode Luring (Offline) & Ringan')),
      'Feature 4 title must match',
    );

    // Preview Section copy checks
    assert.ok(
      allTexts.some((t) => t.includes('Preview Antarmuka: Bersih, Khusyuk & Minimalis')),
      'Preview heading must match PreviewSection.jsx',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Beranda Aplikasi')),
      'Tab 1 must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Pembaca PDF')),
      'Tab 2 must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Kalender Agenda')),
      'Tab 3 must match',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Profil Pengguna')),
      'Tab 4 must match',
    );
  });

  await t.test('Page 2269 has non-zero nodes and valid layout bounds', () => {
    function countNodes(nodeId) {
      const node = ast.nodes[nodeId];
      if (!node) return 0;
      let count = 1;
      if (Array.isArray(node.children)) {
        for (const cid of node.children) count += countNodes(cid);
      }
      return count;
    }
    const totalNodes = countNodes(landingPageId);
    assert.ok(
      totalNodes >= 110,
      `Expected at least 110 nodes on Web - Landing Page, found ${totalNodes}`,
    );
  });
});

test('CHALLENGER-3: Page 2381 (Web - Admin Dashboard) Structural & Semantic Stress-Test', async (t) => {
  const ast = JSON.parse(fs.readFileSync(ROUNDTRIP_JSON, 'utf8'));

  const adminPageId = ast.pages.find((pid) => ast.nodes[pid]?.name === 'Web - Admin Dashboard');
  assert.ok(adminPageId, 'Web - Admin Dashboard not found in AST pages');
  const adminPage = ast.nodes[adminPageId];

  await t.test('Admin Dashboard top-level frame count and dimensions', () => {
    assert.strictEqual(
      adminPage.children.length,
      1,
      'Web - Admin Dashboard must have exactly 1 top-level frame',
    );
    const fAdmin = ast.nodes[adminPage.children[0]];
    assert.ok(fAdmin.name.includes('Admin Dashboard'), `Unexpected frame name: ${fAdmin.name}`);
    assert.strictEqual(fAdmin.width, 1440, 'Admin Dashboard frame width must be 1440');
    assert.strictEqual(fAdmin.height, 960, 'Admin Dashboard frame height must be 960');
  });

  function collectTextInSubtree(nodeId) {
    const node = ast.nodes[nodeId];
    if (!node) return [];
    let texts = [];
    if (node.type === 'text' && node.characters) {
      texts.push(node.characters);
    }
    if (Array.isArray(node.children)) {
      for (const cid of node.children) {
        texts = texts.concat(collectTextInSubtree(cid));
      }
    }
    return texts;
  }

  const allTexts = collectTextInSubtree(adminPageId);

  await t.test('Admin Sidebar Structure and Navigation items', () => {
    const fAdmin = ast.nodes[adminPage.children[0]];
    const sidebar = fAdmin.children
      .map((cid) => ast.nodes[cid])
      .find((n) => n.name === 'Admin Sidebar');
    assert.ok(sidebar, 'Admin Sidebar must exist in frame');
    assert.strictEqual(sidebar.width, 256, 'Sidebar width must be 256');
    assert.strictEqual(sidebar.height, 960, 'Sidebar height must be 960');

    // Sidebar text checks
    assert.ok(
      allTexts.some((t) => t.includes('Wahidiyah Admin')),
      'Sidebar brand name must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Dashboard Overview')),
      'Sidebar nav Dashboard Overview must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Manajemen Buku')),
      'Sidebar nav Manajemen Buku must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Manajemen Pengguna')),
      'Sidebar nav Manajemen Pengguna must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Agenda & Kegiatan')),
      'Sidebar nav Agenda & Kegiatan must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Log & Transaksi')),
      'Sidebar nav Log & Transaksi must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Admin Utama')),
      'Sidebar user profile name must exist',
    );
  });

  await t.test('Admin Header & 4 KPI StatCards match OverviewTab.jsx', () => {
    assert.ok(
      allTexts.some((t) => t.includes('Export Laporan (.xlsx)')),
      'Export Excel button must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Total Pengguna')),
      'StatCard Total Pengguna label must exist',
    );
    assert.ok(
      allTexts.some((t) => t === '6'),
      'StatCard Total Pengguna value 6 must exist',
    );

    assert.ok(
      allTexts.some((t) => t.includes('Koleksi Buku')),
      'StatCard Koleksi Buku label must exist',
    );
    assert.ok(
      allTexts.some((t) => t === '4'),
      'StatCard Koleksi Buku value 4 must exist',
    );

    assert.ok(
      allTexts.some((t) => t.includes('Langganan Pro')),
      'StatCard Langganan Pro label must exist',
    );
    assert.ok(
      allTexts.some((t) => t === '3'),
      'StatCard Langganan Pro value 3 must exist',
    );

    assert.ok(
      allTexts.some((t) => t.includes('Pendapatan Tervalidasi')),
      'StatCard Pendapatan Tervalidasi label must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Rp 50.000')),
      'StatCard Pendapatan Tervalidasi value Rp 50.000 must exist',
    );
  });

  await t.test('Analytics & Transactions Table Structure match OverviewTab.jsx', () => {
    // Donut & conversion
    assert.ok(
      allTexts.some((t) => t.includes('Komposisi Langganan Pengguna')),
      'Donut title must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('50.0%')),
      'Conversion rate 50.0% must exist',
    );

    // Revenue summary
    assert.ok(
      allTexts.some((t) => t.includes('Ringkasan Pendapatan & Gateway')),
      'Revenue summary title must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('QRIS Midtrans')),
      'Gateway Midtrans mention must exist',
    );

    // Table header columns
    assert.ok(
      allTexts.some((t) => t.includes('NO. REFERENSI')),
      'Table TH NO. REFERENSI must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('PELANGGAN')),
      'Table TH PELANGGAN must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('PAKET')),
      'Table TH PAKET must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('TOTAL BAYAR')),
      'Table TH TOTAL BAYAR must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('STATUS')),
      'Table TH STATUS must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('WAKTU TRANSAKSI')),
      'Table TH WAKTU TRANSAKSI must exist',
    );

    // Transactions rows
    assert.ok(
      allTexts.some((t) => t.includes('TRX-PRO-2026-001')),
      'Transaction 001 must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('TRX-PRO-2026-002')),
      'Transaction 002 must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Settlement')),
      'Settlement status badge must exist',
    );
    assert.ok(
      allTexts.some((t) => t.includes('Pending')),
      'Pending status badge must exist',
    );
  });

  await t.test('Page 2381 has non-zero nodes and valid layout bounds', () => {
    function countNodes(nodeId) {
      const node = ast.nodes[nodeId];
      if (!node) return 0;
      let count = 1;
      if (Array.isArray(node.children)) {
        for (const cid of node.children) count += countNodes(cid);
      }
      return count;
    }
    const totalNodes = countNodes(adminPageId);
    assert.ok(
      totalNodes >= 140,
      `Expected at least 140 nodes on Web - Admin Dashboard, found ${totalNodes}`,
    );
  });
});

test('CHALLENGER-4: Visual Rendering & Raster Integrity Verification', async (t) => {
  const landingPng = path.join(TEST_TEMP_DIR, 'render_Web_Landing_Page.png');
  const adminPng = path.join(TEST_TEMP_DIR, 'render_Web_Admin_Dashboard.png');

  await t.test('Render Web - Landing Page to PNG and verify raster integrity', () => {
    const cmd = `"${FIGCRAFT_CLI}" render --page "Web - Landing Page" --out "${landingPng}" "${TARGET_FIGCRAFT}"`;
    execSync(cmd, { encoding: 'utf8' });

    assert.ok(fs.existsSync(landingPng), 'render_Web_Landing_Page.png must be created');
    const { width, height, size } = readPngDimensions(landingPng);

    assert.ok(size > 50000, `Rendered PNG file size (${size} bytes) is suspiciously small`);
    assert.ok(width >= 1440, `Rendered PNG width (${width}) must be at least 1440`);
    assert.ok(height >= 2078, `Rendered PNG height (${height}) must be at least 2078`);
    console.log(
      `   [CHALLENGER-4] Web - Landing Page PNG render verified: ${width}x${height} px, size: ${size} bytes`,
    );
  });

  await t.test('Render Web - Admin Dashboard to PNG and verify raster integrity', () => {
    const cmd = `"${FIGCRAFT_CLI}" render --page "Web - Admin Dashboard" --out "${adminPng}" "${TARGET_FIGCRAFT}"`;
    execSync(cmd, { encoding: 'utf8' });

    assert.ok(fs.existsSync(adminPng), 'render_Web_Admin_Dashboard.png must be created');
    const { width, height, size } = readPngDimensions(adminPng);

    assert.ok(size > 50000, `Rendered PNG file size (${size} bytes) is suspiciously small`);
    assert.strictEqual(width, 1440, `Rendered PNG width (${width}) must equal 1440`);
    assert.strictEqual(height, 960, `Rendered PNG height (${height}) must equal 960`);
    console.log(
      `   [CHALLENGER-4] Web - Admin Dashboard PNG render verified: ${width}x${height} px, size: ${size} bytes`,
    );
  });
});

test('CHALLENGER-5: Adversarial Boundary, Tree Coherence & Overlap Stress-Test', async (t) => {
  const ast = JSON.parse(fs.readFileSync(ROUNDTRIP_JSON, 'utf8'));
  const checkedPages = ['Web - Landing Page', 'Web - Admin Dashboard'];

  await t.test('Tree Coherence: All node IDs, parent-child links are valid and acyclic', () => {
    for (const pageName of checkedPages) {
      const pageId = ast.pages.find((pid) => ast.nodes[pid]?.name === pageName);
      assert.ok(pageId, `Page ${pageName} missing`);

      const visited = new Set();
      function validateSubtree(nodeId, parentId) {
        assert.ok(!visited.has(nodeId), `Cycle detected at node ${nodeId}`);
        visited.add(nodeId);

        const node = ast.nodes[nodeId];
        assert.ok(node, `Node ${nodeId} referenced but missing from nodes dictionary`);
        if (parentId !== null) {
          assert.strictEqual(node.parent, parentId, `Node ${nodeId} has incorrect parent pointer`);
        }

        // Validate width and height are finite positive numbers
        if (node.type !== 'page') {
          assert.ok(
            typeof node.width === 'number' && !isNaN(node.width) && node.width > 0,
            `Node ${nodeId} (${node.name}) has invalid width: ${node.width}`,
          );
          assert.ok(
            typeof node.height === 'number' && !isNaN(node.height) && node.height > 0,
            `Node ${nodeId} (${node.name}) has invalid height: ${node.height}`,
          );
        }

        // Validate transform if present
        if (node.transform) {
          assert.ok(
            Array.isArray(node.transform) && node.transform.length === 6,
            `Node ${nodeId} has invalid transform`,
          );
          node.transform.forEach((val) =>
            assert.ok(
              typeof val === 'number' && !isNaN(val),
              `Node ${nodeId} transform has NaN value`,
            ),
          );
        }

        if (Array.isArray(node.children)) {
          for (const cid of node.children) {
            validateSubtree(cid, nodeId);
          }
        }
      }

      validateSubtree(pageId, null);
    }
  });

  await t.test('Color and Fill Integrity: Ensure RGBA components are strictly [0, 1]', () => {
    for (const pageName of checkedPages) {
      const pageId = ast.pages.find((pid) => ast.nodes[pid]?.name === pageName);
      function checkFills(nodeId) {
        const node = ast.nodes[nodeId];
        if (node.fills && Array.isArray(node.fills)) {
          for (const fill of node.fills) {
            if (fill.type === 'solid' && fill.color) {
              const { r, g, b, a } = fill.color;
              assert.ok(r >= 0 && r <= 1, `Color red component out of range [0, 1]: ${r}`);
              assert.ok(g >= 0 && g <= 1, `Color green component out of range [0, 1]: ${g}`);
              assert.ok(b >= 0 && b <= 1, `Color blue component out of range [0, 1]: ${b}`);
              assert.ok(a >= 0 && a <= 1, `Color alpha component out of range [0, 1]: ${a}`);
            }
          }
        }
        if (Array.isArray(node.children)) {
          for (const cid of node.children) checkFills(cid);
        }
      }
      checkFills(pageId);
    }
  });

  await t.test('Adversarial double round-trip: render roundtrip.figcraft directly', () => {
    const roundtripLandingPng = path.join(TEST_TEMP_DIR, 'render_roundtrip_landing.png');
    const cmd = `"${FIGCRAFT_CLI}" render --page "Web - Landing Page" --out "${roundtripLandingPng}" "${ROUNDTRIP_FIGCRAFT}"`;
    execSync(cmd, { encoding: 'utf8' });
    assert.ok(fs.existsSync(roundtripLandingPng), 'Render from roundtrip.figcraft must succeed');
    const { width, height } = readPngDimensions(roundtripLandingPng);
    assert.ok(width >= 1440 && height >= 2078, 'Roundtrip render dimensions must match');
  });

  await t.test('Adversarial Layout: Check for overlapping frames & clean section layout', () => {
    // Check Top-level frames on Landing Page (Desktop and Mobile)
    const landingPageId = ast.pages.find((pid) => ast.nodes[pid]?.name === 'Web - Landing Page');
    const landingPage = ast.nodes[landingPageId];
    const dFrame = ast.nodes[landingPage.children[0]];
    const mFrame = ast.nodes[landingPage.children[1]];

    const dTx = dFrame.transform ? dFrame.transform[4] : 0;
    const mTx = mFrame.transform ? mFrame.transform[4] : 0;
    // Desktop is 0 to 1440; Mobile is at 1520 to 1910 -> must not overlap
    assert.ok(
      dTx + dFrame.width <= mTx,
      `Desktop frame (ends at ${dTx + dFrame.width}) overlaps with Mobile frame (starts at ${mTx})`,
    );

    // Check Sections in Desktop frame: ensure sequential Y ordering without negative gaps
    let currentY = 0;
    for (const cid of dFrame.children) {
      const child = ast.nodes[cid];
      const childY = child.transform ? child.transform[5] : 0;
      assert.ok(
        childY >= currentY,
        `Section ${child.name} at y=${childY} overlaps preceding section ending at y=${currentY}`,
      );
      currentY = childY + child.height;
    }

    // Check Admin Dashboard main area vs sidebar
    const adminPageId = ast.pages.find((pid) => ast.nodes[pid]?.name === 'Web - Admin Dashboard');
    const adminPage = ast.nodes[adminPageId];
    const fAdmin = ast.nodes[adminPage.children[0]];
    const sidebar = fAdmin.children
      .map((cid) => ast.nodes[cid])
      .find((n) => n.name === 'Admin Sidebar');
    const mainArea = fAdmin.children
      .map((cid) => ast.nodes[cid])
      .find((n) => n.name === 'Main Dashboard Area');

    assert.ok(sidebar && mainArea, 'Sidebar and MainArea must exist');
    const sbX = sidebar.transform ? sidebar.transform[4] : 0;
    const maX = mainArea.transform ? mainArea.transform[4] : 0;
    assert.strictEqual(
      sbX + sidebar.width,
      maX,
      `Sidebar (width ${sidebar.width}) must sit flush against MainArea (x=${maX}) without overlap or gap`,
    );
  });
});
