import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const EXPECTED_APK_URL =
  'https://expo.dev/artifacts/eas/qdKRlQGtuS4qap2eylCUfl46_HuxOLHgo3p9tUPCQHs.apk';

test('M2-1: Node.js 24 and Monorepo Environment Configuration', async (t) => {
  await t.test('.nvmrc specifies Node 24', () => {
    const nvmrcPath = path.join(ROOT_DIR, '.nvmrc');
    assert.ok(fs.existsSync(nvmrcPath), '.nvmrc must exist at root');
    const nvmrcContent = fs.readFileSync(nvmrcPath, 'utf8').trim();
    assert.strictEqual(nvmrcContent, '24', '.nvmrc must be set to 24');
  });

  await t.test('package.json specifies "engines": { "node": "24.x" }', () => {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'package.json must exist at root');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(pkg.engines, 'package.json must have engines field');
    assert.strictEqual(pkg.engines.node, '24.x', 'engines.node must be set to "24.x"');
  });

  await t.test('Node runtime version is compatible (>=24.0.0)', () => {
    const nodeVersion = process.versions.node;
    const major = parseInt(nodeVersion.split('.')[0], 10);
    assert.ok(major >= 24, `Current Node version is ${nodeVersion}, expected >= 24`);
  });
});

test('M2-2: Landing Page Single-Page Layout Architecture', async (t) => {
  const landingSrc = path.join(ROOT_DIR, 'landing-page', 'src');

  await t.test('App.jsx renders as clean single page container without bloat', () => {
    const appPath = path.join(landingSrc, 'App.jsx');
    assert.ok(fs.existsSync(appPath), 'landing-page/src/App.jsx must exist');
    const content = fs.readFileSync(appPath, 'utf8');

    // Must import all single page sections
    assert.ok(content.includes('LandingNavbar'), 'App.jsx must include LandingNavbar');
    assert.ok(content.includes('HeroSection'), 'App.jsx must include HeroSection');
    assert.ok(content.includes('FeaturesSection'), 'App.jsx must include FeaturesSection');
    assert.ok(content.includes('PreviewSection'), 'App.jsx must include PreviewSection');
    assert.ok(content.includes('InstallGuideSection'), 'App.jsx must include InstallGuideSection');
    assert.ok(content.includes('FaqSection'), 'App.jsx must include FaqSection');
    assert.ok(content.includes('DownloadCtaSection'), 'App.jsx must include DownloadCtaSection');
    assert.ok(content.includes('LandingFooter'), 'App.jsx must include LandingFooter');

    // Must NOT import legacy reader, auth, or payment screens
    assert.ok(!content.includes('PdfReaderScreen'), 'App.jsx must not import PdfReaderScreen');
    assert.ok(!content.includes('LoginScreen'), 'App.jsx must not import LoginScreen');
    assert.ok(!content.includes('RegisterScreen'), 'App.jsx must not import RegisterScreen');
    assert.ok(
      !content.includes('PaymentMethodScreen'),
      'App.jsx must not import PaymentMethodScreen',
    );
    assert.ok(!content.includes('ProScreen'), 'App.jsx must not import ProScreen');
    assert.ok(
      !content.includes('AppProvider'),
      'App.jsx must not import AppProvider polling context',
    );
  });

  await t.test('LandingNavbar has official branding, anchor links and direct APK CTA', () => {
    const navbarPath = path.join(landingSrc, 'components', 'layout', 'LandingNavbar.jsx');
    assert.ok(fs.existsSync(navbarPath), 'LandingNavbar.jsx must exist');
    const content = fs.readFileSync(navbarPath, 'utf8');

    assert.ok(content.includes('#fitur'), 'LandingNavbar must have #fitur anchor');
    assert.ok(content.includes('#preview'), 'LandingNavbar must have #preview anchor');
    assert.ok(content.includes('#panduan'), 'LandingNavbar must have #panduan anchor');
    assert.ok(content.includes('#faq'), 'LandingNavbar must have #faq anchor');
    assert.ok(content.includes(EXPECTED_APK_URL), 'LandingNavbar must link directly to APK URL');
  });

  await t.test('HeroSection has badge, direct APK download, and QRCodeSVG', () => {
    const heroPath = path.join(landingSrc, 'components', 'sections', 'HeroSection.jsx');
    assert.ok(fs.existsSync(heroPath), 'HeroSection.jsx must exist');
    const content = fs.readFileSync(heroPath, 'utf8');

    assert.ok(content.includes('v0.1.0 (Alpha)'), 'HeroSection must state v0.1.0 (Alpha)');
    assert.ok(content.includes(EXPECTED_APK_URL), 'HeroSection must link to official APK URL');
    assert.ok(content.includes('QRCodeSVG'), 'HeroSection must use QRCodeSVG from qrcode.react');
    assert.ok(content.includes('qrcode.react'), 'HeroSection must import from qrcode.react');
  });

  await t.test('FeaturesSection has 4 feature cards', () => {
    const featPath = path.join(landingSrc, 'components', 'sections', 'FeaturesSection.jsx');
    assert.ok(fs.existsSync(featPath), 'FeaturesSection.jsx must exist');
    const content = fs.readFileSync(featPath, 'utf8');

    assert.ok(content.includes('Koleksi Kitab Sholawat'), 'Must contain Koleksi Kitab Sholawat');
    assert.ok(content.includes('Pembaca PDF Nyaman & Ramah Mata'), 'Must contain Pembaca PDF card');
    assert.ok(
      content.includes('Agenda & Kalender Amaliyah'),
      'Must contain Agenda & Kalender card',
    );
    assert.ok(content.includes('Mode Luring (Offline) & Ringan'), 'Must contain Mode Luring card');
    assert.ok(content.includes('id="fitur"'), 'FeaturesSection must have id="fitur" anchor');
  });

  await t.test(
    'PreviewSection has device mockup frame and tab switcher with real screenshots',
    () => {
      const previewPath = path.join(landingSrc, 'components', 'sections', 'PreviewSection.jsx');
      assert.ok(fs.existsSync(previewPath), 'PreviewSection.jsx must exist');
      const content = fs.readFileSync(previewPath, 'utf8');

      assert.ok(
        content.includes('/mobile_screenshots/1_beranda.png'),
        'Must reference 1_beranda.png',
      );
      assert.ok(
        content.includes('/mobile_screenshots/6_reader_buku.png'),
        'Must reference 6_reader_buku.png',
      );
      assert.ok(
        content.includes('/mobile_screenshots/2_kalender.png'),
        'Must reference 2_kalender.png',
      );
      assert.ok(
        content.includes('/mobile_screenshots/4_profil.png'),
        'Must reference 4_profil.png',
      );
      assert.ok(content.includes('id="preview"'), 'PreviewSection must have id="preview" anchor');
    },
  );

  await t.test('InstallGuideSection has 4-step APK installation workflow', () => {
    const guidePath = path.join(landingSrc, 'components', 'sections', 'InstallGuideSection.jsx');
    assert.ok(fs.existsSync(guidePath), 'InstallGuideSection.jsx must exist');
    const content = fs.readFileSync(guidePath, 'utf8');

    assert.ok(content.includes('01'), 'Must have Step 01');
    assert.ok(content.includes('02'), 'Must have Step 02');
    assert.ok(content.includes('03'), 'Must have Step 03');
    assert.ok(content.includes('04'), 'Must have Step 04');
    assert.ok(
      content.includes('id="panduan"'),
      'InstallGuideSection must have id="panduan" anchor',
    );
  });

  await t.test('FaqSection has accordion questions and answers', () => {
    const faqPath = path.join(landingSrc, 'components', 'sections', 'FaqSection.jsx');
    assert.ok(fs.existsSync(faqPath), 'FaqSection.jsx must exist');
    const content = fs.readFileSync(faqPath, 'utf8');

    assert.ok(content.includes('id="faq"'), 'FaqSection must have id="faq" anchor');
    assert.ok(
      content.includes('Apa itu aplikasi Wahidiyah Book?'),
      'Must answer what is Wahidiyah Book',
    );
    assert.ok(content.includes('Play Store'), 'Must address Play Store status');
  });

  await t.test('DownloadCtaSection has bottom CTA and QR Code', () => {
    const ctaPath = path.join(landingSrc, 'components', 'sections', 'DownloadCtaSection.jsx');
    assert.ok(fs.existsSync(ctaPath), 'DownloadCtaSection.jsx must exist');
    const content = fs.readFileSync(ctaPath, 'utf8');

    assert.ok(content.includes(EXPECTED_APK_URL), 'Must include expected APK URL');
    assert.ok(content.includes('QRCodeSVG'), 'Must include QRCodeSVG');
    assert.ok(content.includes('id="unduh"'), 'Must have id="unduh" anchor');
  });

  await t.test('LandingFooter has official attribution and direct APK link', () => {
    const footerPath = path.join(landingSrc, 'components', 'layout', 'LandingFooter.jsx');
    assert.ok(fs.existsSync(footerPath), 'LandingFooter.jsx must exist');
    const content = fs.readFileSync(footerPath, 'utf8');

    assert.ok(content.includes(EXPECTED_APK_URL), 'Footer must link to APK URL');
    assert.ok(
      content.includes('Yayasan Perjuangan Wahidiyah'),
      'Footer must attribute Yayasan Perjuangan Wahidiyah',
    );
  });

  await t.test('index.html has official title and meta tags', () => {
    const htmlPath = path.join(ROOT_DIR, 'landing-page', 'index.html');
    assert.ok(fs.existsSync(htmlPath), 'landing-page/index.html must exist');
    const content = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(
      content.includes(
        'Wahidiyah Book — Aplikasi Android Kitab Sholawat Wahidiyah (Official APK Download)',
      ),
      'index.html title must match requirement',
    );
    assert.ok(content.includes('content="#14523A"'), 'theme-color must be #14523A');
    assert.ok(content.includes('name="description"'), 'description meta must be present');
  });
});

test('M2-3: Vite Landing Configuration & Manual Chunks Optimization', async (t) => {
  const viteConfigPath = path.join(ROOT_DIR, 'vite.config.landing.js');
  assert.ok(fs.existsSync(viteConfigPath), 'vite.config.landing.js must exist');
  const content = fs.readFileSync(viteConfigPath, 'utf8');

  await t.test('rollupOptions.output.manualChunks does not contain heavy legacy chunks', () => {
    assert.ok(!content.includes('node_modules/pdfjs-dist'), 'Must not chunk pdfjs-dist');
    assert.ok(!content.includes('node_modules/docx-preview'), 'Must not chunk docx-preview');
    assert.ok(!content.includes('node_modules/mammoth'), 'Must not chunk mammoth');
  });

  await t.test('rollupOptions.output.manualChunks includes vendor, icons, and qrcode', () => {
    assert.ok(content.includes("'icons'"), 'Must define icons chunk');
    assert.ok(content.includes("'qrcode'"), 'Must define qrcode chunk');
    assert.ok(content.includes("'vendor'"), 'Must define vendor chunk');
  });
});

test('M2-4: Build Output & Bundle Verification in dist/landing', async (t) => {
  const distLanding = path.join(ROOT_DIR, 'dist', 'landing');
  assert.ok(fs.existsSync(distLanding), 'dist/landing directory must exist');

  await t.test('dist/landing/index.html exists and contains rendered title', () => {
    const htmlPath = path.join(distLanding, 'index.html');
    assert.ok(fs.existsSync(htmlPath), 'dist/landing/index.html must exist');
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(
      content.includes(
        'Wahidiyah Book — Aplikasi Android Kitab Sholawat Wahidiyah (Official APK Download)',
      ),
    );
  });

  await t.test('No heavy PDF or DOCX chunks exist in dist/landing/assets', () => {
    const assetsDir = path.join(distLanding, 'assets');
    assert.ok(fs.existsSync(assetsDir), 'dist/landing/assets must exist');
    const files = fs.readdirSync(assetsDir);

    const pdfWorkerFiles = files.filter((f) => f.includes('pdf.worker'));
    const pdfjsFiles = files.filter((f) => f.startsWith('pdfjs'));
    const docxFiles = files.filter((f) => f.startsWith('docx'));
    const receiptPdfFiles = files.filter((f) => f.startsWith('receiptPdf'));

    assert.strictEqual(pdfWorkerFiles.length, 0, 'No pdf.worker chunk should be generated');
    assert.strictEqual(pdfjsFiles.length, 0, 'No pdfjs chunk should be generated');
    assert.strictEqual(docxFiles.length, 0, 'No docx chunk should be generated');
    assert.strictEqual(receiptPdfFiles.length, 0, 'No receiptPdf chunk should be generated');
  });

  await t.test('Bundle size is lightweight (< 350 KB uncompressed JS total)', () => {
    const assetsDir = path.join(distLanding, 'assets');
    const files = fs.readdirSync(assetsDir);
    const jsFiles = files.filter((f) => f.endsWith('.js'));

    let totalJsSize = 0;
    for (const f of jsFiles) {
      const stats = fs.statSync(path.join(assetsDir, f));
      totalJsSize += stats.size;
    }

    const totalKb = totalJsSize / 1024;
    console.log(`  Total JS bundle size: ${totalKb.toFixed(2)} KB across ${jsFiles.length} files`);
    // Previously was >2500 KB uncompressed. Now should easily be under 350 KB.
    assert.ok(totalKb < 350, `Total JS size should be < 350 KB, but was ${totalKb.toFixed(2)} KB`);
  });

  await t.test('Referenced mobile screenshots exist in public/mobile_screenshots', () => {
    const requiredScreenshots = [
      '1_beranda.png',
      '6_reader_buku.png',
      '2_kalender.png',
      '4_profil.png',
    ];

    for (const s of requiredScreenshots) {
      const p = path.join(ROOT_DIR, 'public', 'mobile_screenshots', s);
      assert.ok(fs.existsSync(p), `Required screenshot public/mobile_screenshots/${s} must exist`);
      const size = fs.statSync(p).size;
      assert.ok(size > 1000, `Screenshot ${s} must have real content (>1KB), was ${size} bytes`);
    }
  });
});
