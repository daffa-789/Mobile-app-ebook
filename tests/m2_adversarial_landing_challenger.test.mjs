import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const OFFICIAL_APK_URL =
  'https://expo.dev/artifacts/eas/qdKRlQGtuS4qap2eylCUfl46_HuxOLHgo3p9tUPCQHs.apk';

// Helper: recursively find files
function getFilesRecursively(dir, filterFn) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, filterFn));
    } else if (!filterFn || filterFn(item.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ============================================================================
// SUITE 1: APK Download URL Validity, Reachability & Header Assertions
// ============================================================================
test('Adversarial Suite 1: APK Download URL Network Validity & Uniformity', async (t) => {
  await t.test(
    '1.1 Reachability of EAS APK artifact via HTTP HEAD & redirect resolution',
    async () => {
      function resolveHead(url, maxRedirects = 5) {
        return new Promise((resolve, reject) => {
          if (maxRedirects === 0) return reject(new Error('Too many redirects'));
          const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              resolveHead(res.headers.location, maxRedirects - 1).then(resolve, reject);
            } else {
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
              });
            }
          });
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Network timeout reaching APK URL'));
          });
          req.on('error', reject);
          req.end();
        });
      }

      const res = await resolveHead(OFFICIAL_APK_URL);
      assert.strictEqual(
        res.statusCode,
        200,
        `APK download artifact must resolve to HTTP 200, got ${res.statusCode}`,
      );

      const length = parseInt(res.headers['content-length'] || '0', 10);
      assert.ok(
        length > 50 * 1024 * 1024,
        `APK size must be genuine (>50MB), actual: ${(length / (1024 * 1024)).toFixed(2)} MB`,
      );

      const contentType = res.headers['content-type'];
      assert.ok(
        contentType.includes('application/octet-stream') ||
          contentType.includes('application/vnd.android.package-archive'),
        `Content type must be binary/apk, got: ${contentType}`,
      );
    },
  );

  await t.test('1.2 Consistency of APK URL constant across all landing page components', () => {
    const landingSrc = path.join(ROOT_DIR, 'landing-page', 'src');
    const jsxFiles = getFilesRecursively(landingSrc, (name) => name.endsWith('.jsx'));

    const componentsWithApk = [
      'LandingNavbar.jsx',
      'HeroSection.jsx',
      'PreviewSection.jsx',
      'DownloadCtaSection.jsx',
      'LandingFooter.jsx',
    ];

    // M2: URL APK disentralisasi ke src/config/constants.js. Komponen tidak boleh
    // lagi menyimpan URL hardcoded, melainkan mengimpor konstanta terpusat.
    const constantsSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'landing-page/src/config/constants.js'),
      'utf8',
    );
    assert.ok(
      constantsSrc.includes(OFFICIAL_APK_URL),
      'Centralized constants.js must expose the official APK URL',
    );

    for (const comp of componentsWithApk) {
      const match = jsxFiles.find((f) => path.basename(f) === comp);
      assert.ok(match, `Component ${comp} must exist in landing-page/src`);
      const content = fs.readFileSync(match, 'utf8');
      assert.ok(
        content.includes('APK_DOWNLOAD_URL'),
        `Component ${comp} must use the centralized APK_DOWNLOAD_URL constant`,
      );
      assert.ok(
        content.includes('@/config/constants'),
        `Component ${comp} must import APK_DOWNLOAD_URL from @/config/constants`,
      );
      assert.equal(
        content.includes('expo.dev/artifacts/eas/'),
        false,
        `Component ${comp} must not hardcode the EAS artifact URL`,
      );
    }
  });
});

// ============================================================================
// SUITE 2: Element IDs & Anchor Navigation Integrity
// ============================================================================
test('Adversarial Suite 2: Element IDs & Anchor Navigation Integrity', async (t) => {
  const landingSrc = path.join(ROOT_DIR, 'landing-page', 'src');
  const jsxFiles = getFilesRecursively(landingSrc, (name) => name.endsWith('.jsx'));

  await t.test('2.1 All anchor targets have corresponding DOM elements with matching id', () => {
    const requiredAnchors = [
      { id: 'fitur', comp: 'FeaturesSection.jsx' },
      { id: 'preview', comp: 'PreviewSection.jsx' },
      { id: 'panduan', comp: 'InstallGuideSection.jsx' },
      { id: 'faq', comp: 'FaqSection.jsx' },
      { id: 'unduh', comp: 'DownloadCtaSection.jsx' },
    ];

    for (const item of requiredAnchors) {
      const targetFile = jsxFiles.find((f) => path.basename(f) === item.comp);
      assert.ok(targetFile, `Target component ${item.comp} must exist`);
      const content = fs.readFileSync(targetFile, 'utf8');
      const idRegex = new RegExp(`id=["']${item.id}["']`);
      assert.ok(
        idRegex.test(content),
        `Component ${item.comp} must define id="${item.id}" on its root section`,
      );
    }
  });

  await t.test('2.2 LandingNavbar defines correct anchor array', () => {
    const navbarFile = jsxFiles.find((f) => path.basename(f) === 'LandingNavbar.jsx');
    assert.ok(navbarFile, 'LandingNavbar.jsx must exist');
    const content = fs.readFileSync(navbarFile, 'utf8');

    assert.ok(content.includes("href: '#fitur'"), 'Nav must have #fitur link');
    assert.ok(content.includes("href: '#preview'"), 'Nav must have #preview link');
    assert.ok(content.includes("href: '#panduan'"), 'Nav must have #panduan link');
    assert.ok(content.includes("href: '#faq'"), 'Nav must have #faq link');
  });

  await t.test('2.3 HeroSection and LandingFooter have functional jump links', () => {
    const heroFile = jsxFiles.find((f) => path.basename(f) === 'HeroSection.jsx');
    const heroContent = fs.readFileSync(heroFile, 'utf8');
    assert.ok(heroContent.includes('href="#preview"'), 'Hero must have secondary link to #preview');

    const footerFile = jsxFiles.find((f) => path.basename(f) === 'LandingFooter.jsx');
    const footerContent = fs.readFileSync(footerFile, 'utf8');
    assert.ok(footerContent.includes('href="#fitur"'), 'Footer must have link to #fitur');
    assert.ok(footerContent.includes('href="#preview"'), 'Footer must have link to #preview');
    assert.ok(footerContent.includes('href="#panduan"'), 'Footer must have link to #panduan');
    assert.ok(footerContent.includes('href="#faq"'), 'Footer must have link to #faq');
  });
});

// ============================================================================
// SUITE 3: Mobile Screenshots Existence, Binary PNG Header & Dimensions
// ============================================================================
test('Adversarial Suite 3: Mobile Screenshots Binary Integrity & Copying', async (t) => {
  const screenshots = ['1_beranda.png', '6_reader_buku.png', '2_kalender.png', '4_profil.png'];

  await t.test('3.1 All referenced screenshots in PreviewSection exist and are valid PNGs', () => {
    const publicDir = path.join(ROOT_DIR, 'public', 'mobile_screenshots');

    for (const filename of screenshots) {
      const fullPath = path.join(publicDir, filename);
      assert.ok(
        fs.existsSync(fullPath),
        `Screenshot file ${filename} must exist in public/mobile_screenshots`,
      );

      const buffer = fs.readFileSync(fullPath);
      // PNG Magic Bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
      const isPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a;
      assert.ok(isPng, `File ${filename} must have valid PNG signature`);

      // Read width & height from IHDR chunk (bytes 16-23)
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      assert.ok(width >= 700, `Image ${filename} width (${width}px) must be >= 700px`);
      assert.ok(height >= 1500, `Image ${filename} height (${height}px) must be >= 1500px`);
    }
  });

  await t.test('3.2 Screenshots are correctly copied to dist/landing/mobile_screenshots', () => {
    const distDir = path.join(ROOT_DIR, 'dist', 'landing', 'mobile_screenshots');
    assert.ok(fs.existsSync(distDir), 'dist/landing/mobile_screenshots directory must exist');

    for (const filename of screenshots) {
      const fullPath = path.join(distDir, filename);
      assert.ok(
        fs.existsSync(fullPath),
        `Screenshot ${filename} must exist in dist/landing/mobile_screenshots`,
      );
      const size = fs.statSync(fullPath).size;
      assert.ok(size > 10000, `Built screenshot ${filename} must be substantial (>10KB)`);
    }
  });
});

// ============================================================================
// SUITE 4: Security Hardening & Target Blank Protection
// ============================================================================
test('Adversarial Suite 4: Security Hardening & Vulnerability Scan', async (t) => {
  const landingSrc = path.join(ROOT_DIR, 'landing-page', 'src');
  const jsxFiles = getFilesRecursively(landingSrc, (name) => name.endsWith('.jsx'));

  await t.test('4.1 All target="_blank" links have rel="noopener noreferrer"', () => {
    for (const file of jsxFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/<a[^>]*target=["']_blank["'][^>]*>/g) || [];
      for (const tag of matches) {
        assert.ok(
          tag.includes('rel="noopener noreferrer"') || tag.includes("rel='noopener noreferrer'"),
          `Insecure target="_blank" without rel="noopener noreferrer" in ${path.basename(file)}: ${tag}`,
        );
      }
    }
  });

  await t.test('4.2 No sensitive API keys or credentials leaked in dist/landing assets', () => {
    const distAssets = path.join(ROOT_DIR, 'dist', 'landing', 'assets');
    const assetFiles = getFilesRecursively(distAssets);

    const bannedKeywords = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'service_role',
      'MIDTRANS_SERVER_KEY',
      'PRIVATE_KEY',
    ];

    for (const file of assetFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const kw of bannedKeywords) {
        assert.ok(
          !content.includes(kw),
          `Sensitive credential keyword "${kw}" detected in production asset ${path.basename(file)}!`,
        );
      }
    }
  });
});

// ============================================================================
// SUITE 5: Single-Page Isolation & Absence of Polling or Bloat
// ============================================================================
test('Adversarial Suite 5: Single-Page Architecture Isolation', async (t) => {
  await t.test('5.1 App.jsx contains zero polling or route gates', () => {
    const appPath = path.join(ROOT_DIR, 'landing-page', 'src', 'App.jsx');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.ok(!content.includes('setInterval'), 'App.jsx must not contain setInterval');
    assert.ok(!content.includes('/api/auth/me'), 'App.jsx must not poll /api/auth/me');
    assert.ok(!content.includes('useLocation'), 'App.jsx must not use router location hooks');
    assert.ok(!content.includes('useNavigate'), 'App.jsx must not use router navigate hooks');
  });

  await t.test(
    '5.2 Heavy libraries (pdfjs, docx, mammoth, jspdf) are absent from landing bundle',
    () => {
      const distAssets = path.join(ROOT_DIR, 'dist', 'landing', 'assets');
      const jsFiles = fs.readdirSync(distAssets).filter((f) => f.endsWith('.js'));

      for (const jsFile of jsFiles) {
        assert.ok(!jsFile.includes('pdfjs'), `Heavy chunk ${jsFile} should not exist`);
        assert.ok(!jsFile.includes('docx'), `Heavy chunk ${jsFile} should not exist`);
        assert.ok(!jsFile.includes('receiptPdf'), `Heavy chunk ${jsFile} should not exist`);
      }
    },
  );
});

// ============================================================================
// SUITE 6: HTML Metadata & Mobile Responsiveness Markup
// ============================================================================
test('Adversarial Suite 6: HTML Metadata & Mobile Responsiveness', async (t) => {
  await t.test('6.1 index.html has complete SEO, OpenGraph and viewport tags', () => {
    const indexPath = path.join(ROOT_DIR, 'landing-page', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');

    assert.ok(/<!doctype html>/i.test(content), 'Must have doctype');
    assert.ok(/name=["']viewport["']/i.test(content), 'Must have viewport meta');
    assert.ok(/property=["']og:title["']/i.test(content), 'Must have og:title');
    assert.ok(/property=["']og:description["']/i.test(content), 'Must have og:description');
    assert.ok(
      /name=["']theme-color["']/i.test(content) && content.includes('#14523A'),
      'Must have theme-color #14523A',
    );
    assert.ok(
      content.includes(
        'Wahidiyah Book — Aplikasi Android Kitab Sholawat Wahidiyah (Official APK Download)',
      ),
      'Must have official title',
    );
  });

  await t.test('6.2 LandingNavbar provides responsive drawer and accessible buttons', () => {
    const navPath = path.join(
      ROOT_DIR,
      'landing-page',
      'src',
      'components',
      'layout',
      'LandingNavbar.jsx',
    );
    const content = fs.readFileSync(navPath, 'utf8');

    assert.ok(content.includes('aria-label='), 'Navbar hamburger button must have aria-label');
    assert.ok(content.includes('md:hidden'), 'Navbar must support mobile drawer');
    assert.ok(content.includes('hidden md:flex'), 'Navbar must support desktop navigation');
  });
});
