import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const LIVE_VERCEL_URL = 'https://mobile-app-ebook.vercel.app';
const OFFICIAL_APK_URL =
  'https://expo.dev/artifacts/eas/nZG8qlaABNxRjAz_jBldJYlxghHw-ai4ecU1iYEVWSs.apk';

// Helper: HTTP GET request with redirect resolution
function fetchWithRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) return reject(new Error('Too many redirects'));
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(
      url,
      {
        headers: { 'User-Agent': 'AdversarialChallenger/1.0' },
        timeout: 15000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).toString();
          fetchWithRedirects(nextUrl, maxRedirects - 1).then(resolve, reject);
          return;
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
    req.on('error', reject);
  });
}

// ============================================================================
// SUITE 1: Live Production Vercel Deployment Empirical Audit
// ============================================================================
test('M4 Suite 1: Live Production Vercel Deployment Empirical Audit', async (t) => {
  let liveHtml = '';
  let liveHeaders = {};
  let mainScriptUrl = '';

  await t.test('1.1 Fetch live landing page: HTTP 200 OK & Vercel edge presence', async () => {
    const res = await fetchWithRedirects(LIVE_VERCEL_URL);
    assert.strictEqual(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}`);
    liveHtml = res.body;
    liveHeaders = res.headers;
    assert.ok(liveHtml.length > 500, 'HTML body must be non-empty and substantial');
    assert.ok(
      liveHeaders['server']?.toLowerCase().includes('vercel') ||
        liveHeaders['x-vercel-id'] !== undefined ||
        liveHeaders['x-vercel-cache'] !== undefined,
      'Response must originate from Vercel edge',
    );
  });

  await t.test('1.2 Verify Page Title and Meta tags match Single-Page Showcase', () => {
    const titleRegex =
      /<title>[\s\S]*(Mobile-app-ebook|Wahidiyah Book) — Aplikasi Android( Kitab Sholawat Wahidiyah)? \(Official APK Download\)[\s\S]*<\/title>/i;
    assert.ok(titleRegex.test(liveHtml), 'HTML title must state official APK download');

    assert.ok(
      liveHtml.includes('Mobile-app-ebook — Aplikasi Android (Official APK Download)') ||
        liveHtml.includes(
          'content="Wahidiyah Book — Aplikasi Android Kitab Sholawat Wahidiyah (Official APK Download)"',
        ),
      'OpenGraph title must accurately communicate APK download purpose',
    );
    assert.ok(
      liveHtml.includes('Unduh aplikasi resmi Wahidiyah Book untuk Android') ||
        /Unduh resmi berkas APK v\d+\.\d+\.\d+ Alpha/.test(liveHtml),
      'Meta description must communicate APK download purpose',
    );
  });

  await t.test(
    '1.3 Extract Live Main Script Bundle and Verify Direct APK Download Link',
    async () => {
      const scriptMatches = [...liveHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(
        (m) => m[1],
      );
      assert.ok(
        scriptMatches.length > 0,
        'Landing page HTML shell must reference entry JavaScript bundle',
      );

      mainScriptUrl = new URL(scriptMatches[0], LIVE_VERCEL_URL).toString();
      const res = await fetchWithRedirects(mainScriptUrl);
      assert.strictEqual(
        res.statusCode,
        200,
        `Live main script ${mainScriptUrl} must return 200 OK`,
      );
      assert.ok(
        res.body.includes(OFFICIAL_APK_URL),
        `Live main script bundle must contain direct APK URL: ${OFFICIAL_APK_URL}`,
      );
    },
  );

  await t.test('1.4 Verify Complete Absence of Legacy Bloat in Live HTML & Scripts', async () => {
    const prohibitedTerms = [
      'Masuk ke Akun',
      'Daftar Akun Baru',
      'Langganan Pro',
      'snap.midtrans.com',
      'app.sandbox.midtrans.com',
      'id="web-reader"',
      'class="pdf-viewer"',
      'data-testid="login-form"',
      'data-testid="register-form"',
      'data-testid="payment-modal"',
    ];

    for (const term of prohibitedTerms) {
      assert.ok(
        !liveHtml.includes(term),
        `Live landing HTML must NOT contain legacy bloat term: "${term}"`,
      );
    }

    const scriptRes = await fetchWithRedirects(mainScriptUrl);
    assert.ok(
      !scriptRes.body.includes('snap.midtrans.com'),
      'Script bundle must not contain live Midtrans snap client',
    );
    assert.ok(
      !scriptRes.body.includes('pdfjs-dist'),
      'Script bundle must not contain pdfjs web reader',
    );
  });

  await t.test('1.5 All Live Module Preload and CSS Assets return HTTP 200 OK', async () => {
    const scriptMatches = [...liveHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(
      (m) => m[1],
    );
    const preloadMatches = [
      ...liveHtml.matchAll(/<link[^>]+rel=["']modulepreload["'][^>]+href=["']([^"']+)["']/gi),
    ].map((m) => m[1]);
    const cssMatches = [
      ...liveHtml.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi),
    ].map((m) => m[1]);

    const allAssets = [...new Set([...scriptMatches, ...preloadMatches, ...cssMatches])];
    assert.ok(allAssets.length >= 3, 'Must have scripts, preloads, and stylesheets');

    for (const relAsset of allAssets) {
      const fullUrl = new URL(relAsset, LIVE_VERCEL_URL).toString();
      const res = await fetchWithRedirects(fullUrl);
      assert.strictEqual(res.statusCode, 200, `Asset ${fullUrl} must return 200 OK`);
      assert.ok(res.body.length > 50, `Asset ${fullUrl} must not be empty`);
    }
  });
});

// ============================================================================
// SUITE 2: EAS APK Artifact Network Availability & Binary Integrity
// ============================================================================
test('M4 Suite 2: EAS APK Artifact Network Availability & Binary Integrity', async (t) => {
  await t.test('2.1 URL APK menghasilkan HTTP 200 dengan berkas tidak kosong', async () => {
    let curr = OFFICIAL_APK_URL;
    let hops = 0;
    let finalRes = null;

    while (hops < 10) {
      const res = await fetch(curr, { method: 'HEAD', redirect: 'manual' });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        curr = res.headers.get('location');
        hops++;
      } else {
        finalRes = res;
        break;
      }
    }

    assert.ok(finalRes !== null, 'Must reach final response');
    assert.strictEqual(finalRes.status, 200, `Expected 200 OK, got ${finalRes.status}`);

    const contentLength = parseInt(finalRes.headers.get('content-length') || '0', 10);
    assert.ok(
      contentLength > 0,
      `Berkas APK harus memiliki ukuran positif, diterima: ${contentLength} byte`,
    );
  });

  await t.test(
    '2.2 APK binary headers confirm authentic ZIP/APK structure (PK magic bytes)',
    async () => {
      const res = await fetch(OFFICIAL_APK_URL);
      const reader = res.body.getReader();
      const { value } = await reader.read();
      await reader.cancel();
      assert.ok(value && value.length >= 4, 'Must read at least 4 bytes of stream header');
      // ZIP magic: 0x50 0x4b 0x03 0x04 ('PK\x03\x04')
      assert.strictEqual(value[0], 0x50, 'Byte 0 must be 0x50 (P)');
      assert.strictEqual(value[1], 0x4b, 'Byte 1 must be 0x4b (K)');
      assert.strictEqual(value[2], 0x03, 'Byte 2 must be 0x03');
      assert.strictEqual(value[3], 0x04, 'Byte 3 must be 0x04');
    },
  );
});

// ============================================================================
// SUITE 3: Monorepo Build Scripts & Compilation Verification
// ============================================================================
test('M4 Suite 3: Monorepo Build Scripts & Compilation Verification', async (t) => {
  await t.test('3.1 npm run build:landing produces dist/landing with clean exit code 0', () => {
    const output = execSync('npm run build:landing', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.ok(output.includes('building for production'), 'Vite build output detected');
    assert.ok(output.includes('built in'), 'Vite build completion message detected');

    const landingHtmlPath = path.join(ROOT_DIR, 'dist', 'landing', 'index.html');
    assert.ok(fs.existsSync(landingHtmlPath), 'dist/landing/index.html must exist');

    const builtHtml = fs.readFileSync(landingHtmlPath, 'utf-8');
    assert.ok(
      builtHtml.includes('Mobile-app-ebook') || builtHtml.includes('Wahidiyah Book'),
      'dist/landing/index.html must contain title',
    );

    const assetsDir = path.join(ROOT_DIR, 'dist', 'landing', 'assets');
    const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
    const apkInAssets = jsFiles.some((f) => {
      const c = fs.readFileSync(path.join(assetsDir, f), 'utf-8');
      return c.includes(OFFICIAL_APK_URL);
    });
    assert.ok(apkInAssets, 'dist/landing/assets/*.js must bundle the official APK URL');
  });

  await t.test('3.2 npm run build:admin produces dist/admin with clean exit code 0', () => {
    const output = execSync('npm run build:admin', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.ok(output.includes('building for production'), 'Vite build output detected');
    assert.ok(output.includes('built in'), 'Vite build completion message detected');

    const adminHtmlPath = path.join(ROOT_DIR, 'dist', 'admin', 'index.html');
    assert.ok(fs.existsSync(adminHtmlPath), 'dist/admin/index.html must exist');

    const adminAssetsDir = path.join(ROOT_DIR, 'dist', 'admin', 'assets');
    assert.ok(fs.existsSync(adminAssetsDir), 'dist/admin/assets must exist');
    const assetFiles = fs.readdirSync(adminAssetsDir);
    assert.ok(assetFiles.length >= 5, 'dist/admin/assets must contain code-split chunks');
  });

  await t.test('3.3 npm run format:check passes with 0 style issues', () => {
    const output = execSync('npm run format:check', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert.ok(
      output.includes('All matched files use Prettier code style!'),
      'Prettier format check must pass completely',
    );
  });
});

// ============================================================================
// SUITE 4: Source Tree Cleanliness & Separation of Concerns
// ============================================================================
test('M4 Suite 4: Source Tree Cleanliness & Separation of Concerns', async (t) => {
  await t.test(
    '4.1 landing-page/src/App.jsx renders showcase sections exclusively with zero legacy bloat',
    () => {
      const landingSrc = path.join(ROOT_DIR, 'landing-page', 'src');

      const appJsx = fs.readFileSync(path.join(landingSrc, 'App.jsx'), 'utf-8');
      assert.ok(appJsx.includes('HeroSection'), 'App.jsx renders Landing HeroSection');
      assert.ok(appJsx.includes('FeaturesSection'), 'App.jsx renders Landing FeaturesSection');
      assert.ok(appJsx.includes('PreviewSection'), 'App.jsx renders Landing PreviewSection');
      assert.ok(!appJsx.includes('WebReader'), 'App.jsx does not render WebReader');
      assert.ok(!appJsx.includes('Checkout'), 'App.jsx does not render Checkout');
      assert.ok(!appJsx.includes('LoginModal'), 'App.jsx does not render LoginModal');
      assert.ok(!appJsx.includes('PdfReaderScreen'), 'App.jsx does not render PdfReaderScreen');
      assert.ok(
        !appJsx.includes('PaymentMethodScreen'),
        'App.jsx does not render PaymentMethodScreen',
      );
      assert.ok(!appJsx.includes('RegisterScreen'), 'App.jsx does not render RegisterScreen');
      assert.ok(!appJsx.includes('ProScreen'), 'App.jsx does not render ProScreen');
    },
  );

  await t.test(
    '4.2 Compiled landing bundle (dist/landing) contains no legacy reader/payment code',
    () => {
      const assetsDir = path.join(ROOT_DIR, 'dist', 'landing', 'assets');
      const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
      const prohibitedBundleTerms = [
        'snap.midtrans.com',
        'pdfjs-dist',
        'Masuk ke Akun',
        'Daftar Akun Baru',
        'Langganan Pro',
      ];

      for (const f of jsFiles) {
        const content = fs.readFileSync(path.join(assetsDir, f), 'utf-8');
        for (const term of prohibitedBundleTerms) {
          assert.ok(
            !content.includes(term),
            `Compiled bundle ${f} must not contain prohibited term: "${term}"`,
          );
        }
      }
    },
  );

  await t.test('4.3 vercel.admin.json and vercel.json configurations are valid JSON', () => {
    const vercelJsonPath = path.join(ROOT_DIR, 'vercel.json');
    const vercelAdminJsonPath = path.join(ROOT_DIR, 'vercel.admin.json');

    assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json exists');
    assert.ok(fs.existsSync(vercelAdminJsonPath), 'vercel.admin.json exists');

    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
    assert.ok(
      vercelConfig.buildCommand === 'npm run build:landing' ||
        vercelConfig.buildCommand === undefined,
    );
    assert.ok(
      vercelConfig.outputDirectory === 'dist/landing' || vercelConfig.outputDirectory === undefined,
    );

    const adminConfig = JSON.parse(fs.readFileSync(vercelAdminJsonPath, 'utf-8'));
    assert.strictEqual(adminConfig.buildCommand, 'npm run build:admin');
    assert.strictEqual(adminConfig.outputDirectory, 'dist/admin');
  });
});
