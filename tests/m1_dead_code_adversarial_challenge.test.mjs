import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Empirical Adversarial Challenge — Milestone 1 Dead Code Cleanup', () => {
  const deletedFilesAndDirs = [
    // Landing Page
    'landing-page/src/components/layout/LandingShell.jsx',
    'landing-page/src/components/routing',
    'landing-page/src/components/ui',
    'landing-page/src/context',
    'landing-page/src/data',
    'landing-page/src/features',
    'landing-page/src/theme',
    // Admin Dashboard
    'admin-dashboard-web/src/features/admin/AdminDashboard.jsx',
    'admin-dashboard-web/src/components/ui/DeviceFrame.jsx',
    'admin-dashboard-web/src/components/ui/PhoneInput.jsx',
    'admin-dashboard-web/src/components/ui/AuthStatus.jsx',
    'admin-dashboard-web/src/components/ui/InAppReminders.jsx',
    'admin-dashboard-web/src/components/ui/ErrorBoundary.jsx',
    'admin-dashboard-web/src/components/ui/ScrollRestoration.jsx',
    'admin-dashboard-web/src/components/ui/ServerStatusBanner.jsx',
    'admin-dashboard-web/src/components/ui/Skeleton.jsx',
    'admin-dashboard-web/src/theme/themeInjector.js',
    'admin-dashboard-web/src/theme',
    'admin-dashboard-web/src/lib/receiptPdf.js',
    'admin-dashboard-web/src/lib/receiptFields.js',
    'admin-dashboard-web/src/lib/reminders.js',
    'admin-dashboard-web/src/lib/scrollPositionEvents.js',
    'admin-dashboard-web/src/lib/sanitizeHtml.js',
    // Mobile App
    'mobile-app/src/screens/DownloadsScreen.js',
    'mobile-app/.claude',
    // Root secrets
    'client_secret_8108075809-5lfbtqmkq9gkbn869jmvd8hhajinl1k2.apps.googleusercontent.com.json',
    'client_secret_8108075809-kpcgb73h2d1t7klg785svrlqc9to3n9t.apps.googleusercontent.com.json',
    // Audit lanjutan: klaster carousel admin yang tidak pernah dirender, lib yatim,
    // section landing yang diparkir, dan script satu-pakai tanpa rujukan.
    'admin-dashboard-web/src/features/admin/CarouselTab.jsx',
    'admin-dashboard-web/src/features/admin/carousel',
    'admin-dashboard-web/src/features/admin/hooks/useAdminCarouselEditor.js',
    'admin-dashboard-web/src/features/admin/events/PushStatusBanner.jsx',
    'admin-dashboard-web/src/lib/utils.js',
    'admin-dashboard-web/src/lib/phone.js',
    'admin-dashboard-web/src/lib/useSubmit.js',
    'src/lib/sanitizeHtml.js',
    'landing-page/src/components/sections/FaqSection.jsx',
    'landing-page/src/components/sections/InstallGuideSection.jsx',
    'landing-page/src/components/sections/DownloadCtaSection.jsx',
    'landing-page/src/lib/supabaseConfig.js',
    'scripts/capture-auth-gate.cjs',
    'scripts/capture-mobile-screens.js',
    'scripts/generate-google-icon.cjs',
    'scripts/update-app-icons.js',
    'mobile-app/app.json',
    // Audit lanjutan: portal admin duplikat di PWA root (sudah pindah ke
    // admin-dashboard-web yang di-deploy terpisah) beserta lib yatimnya.
    'src/features/admin',
    'src/lib/excelExport.js',
    'src/lib/withToast.js',
  ];

  test('1. Absence Test: All deleted files and directories must NOT exist in working tree', () => {
    for (const relPath of deletedFilesAndDirs) {
      const fullPath = path.join(rootDir, relPath);
      assert.equal(fs.existsSync(fullPath), false, `Target for deletion still exists: ${relPath}`);
    }
  });

  test('2. Invariants Test: Critical retained files must exist and be non-empty', () => {
    const criticalRetained = [
      'admin-dashboard-web/src/components/ui/Field.jsx',
      'admin-dashboard-web/src/lib/supabaseConfig.js',
      'admin-dashboard-web/src/lib/excelExport.js',
      'admin-dashboard-web/src/lib/withToast.js',
      'admin-dashboard-web/src/features/admin/AdminLogin.jsx',
      'shared/sanitizeHtml.js',
      'landing-page/src/App.jsx',
      'landing-page/src/main.jsx',
      'admin-dashboard-web/src/App.jsx',
      'admin-dashboard-web/src/main.jsx',
      'src/App.jsx',
      'src/main.jsx',
      'mobile-app/App.js',
      'server/server.js',
    ];

    for (const relPath of criticalRetained) {
      const fullPath = path.join(rootDir, relPath);
      assert.ok(fs.existsSync(fullPath), `Critical file missing: ${relPath}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 0, `Critical file is empty: ${relPath}`);
    }
  });

  test('3. Dangling Reference Scan: No active source code imports purged modules', () => {
    const forbiddenImports = [
      'LandingShell',
      'RouteGuards',
      'RouterBridge',
      'DeviceFrame',
      'InAppReminders',
      'ErrorBoundary',
      'ScrollRestoration',
      'ServerStatusBanner',
      'receiptPdf',
      'receiptFields',
      'reminders',
      'scrollPositionEvents',
      'DownloadsScreen',
    ];

    function scanDir(dir, fileList = []) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === '.agents'
        ) {
          continue;
        }
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(full, fileList);
        } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
          fileList.push(full);
        }
      }
      return fileList;
    }

    const sourceFiles = [
      ...scanDir(path.join(rootDir, 'landing-page/src')),
      ...scanDir(path.join(rootDir, 'admin-dashboard-web/src')),
      ...scanDir(path.join(rootDir, 'mobile-app/src')),
      path.join(rootDir, 'mobile-app/App.js'),
    ];

    for (const srcFile of sourceFiles) {
      const content = fs.readFileSync(srcFile, 'utf8');
      for (const forbidden of forbiddenImports) {
        const importRegex = new RegExp(`from\\s+['"][^'"]*${forbidden}[^'"]*['"]`, 'i');
        assert.ok(
          !importRegex.test(content),
          `File ${path.relative(rootDir, srcFile)} contains forbidden import of ${forbidden}`,
        );
      }
    }
  });

  test('4. Alias Purity: vite.config.landing.js contains only active aliases', () => {
    const landingViteConfig = fs.readFileSync(path.join(rootDir, 'vite.config.landing.js'), 'utf8');
    assert.ok(landingViteConfig.includes("'@':"), "Missing '@' alias in vite.config.landing.js");

    const deadAliases = ['@features', '@ui', '@lib', '@shared', '@data', '@context', '@theme'];
    for (const alias of deadAliases) {
      assert.ok(
        !landingViteConfig.includes(`'${alias}'`) && !landingViteConfig.includes(`"${alias}"`),
        `vite.config.landing.js should not define dead alias ${alias}`,
      );
    }
  });

  test('5. Bundle Integrity: dist/landing artifacts exist and have valid structure', () => {
    const htmlPath = path.join(rootDir, 'dist/landing/index.html');
    assert.ok(fs.existsSync(htmlPath), 'dist/landing/index.html must exist');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(html.includes('<div id="root"></div>'), 'Missing #root in dist/landing/index.html');
    assert.ok(
      html.includes('<script type="module" crossorigin src="/assets/index-'),
      'Missing entry bundle script in dist/landing/index.html',
    );
    assert.ok(
      html.includes('<link rel="stylesheet" crossorigin href="/assets/index-'),
      'Missing compiled stylesheet in dist/landing/index.html',
    );

    const assetsDir = path.join(rootDir, 'dist/landing/assets');
    assert.ok(fs.existsSync(assetsDir), 'dist/landing/assets must exist');
    const assetFiles = fs.readdirSync(assetsDir);
    assert.ok(assetFiles.some((f) => f.startsWith('index-') && f.endsWith('.js')));
    assert.ok(assetFiles.some((f) => f.startsWith('vendor-') && f.endsWith('.js')));
    assert.ok(assetFiles.some((f) => f.startsWith('icons-') && f.endsWith('.js')));
    assert.ok(assetFiles.some((f) => f.startsWith('index-') && f.endsWith('.css')));
  });

  test('6. Bundle Integrity: dist/admin artifacts exist and have valid structure', () => {
    const htmlPath = path.join(rootDir, 'dist/admin/index.html');
    assert.ok(fs.existsSync(htmlPath), 'dist/admin/index.html must exist');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(html.includes('<div id="root"></div>'), 'Missing #root in dist/admin/index.html');
    assert.ok(
      html.includes('<script type="module" crossorigin src="/assets/index-'),
      'Missing entry bundle script in dist/admin/index.html',
    );
    assert.ok(
      html.includes('<link rel="stylesheet" crossorigin href="/assets/index-'),
      'Missing compiled stylesheet in dist/admin/index.html',
    );

    const assetsDir = path.join(rootDir, 'dist/admin/assets');
    assert.ok(fs.existsSync(assetsDir), 'dist/admin/assets must exist');
    const assetFiles = fs.readdirSync(assetsDir);
    assert.ok(assetFiles.some((f) => f.startsWith('index-') && f.endsWith('.js')));
    assert.ok(assetFiles.some((f) => f.startsWith('vendor-') && f.endsWith('.js')));
    assert.ok(assetFiles.some((f) => f.startsWith('supabase-sdk-') && f.endsWith('.js')));
    assert.ok(assetFiles.some((f) => f.startsWith('charts-') && f.endsWith('.js')));
    assert.ok(assetFiles.some((f) => f.startsWith('excel-') && f.endsWith('.js')));
    assert.ok(assetFiles.some((f) => f.startsWith('index-') && f.endsWith('.css')));
  });
});
