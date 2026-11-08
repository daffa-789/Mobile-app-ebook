import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('CHALLENGER 2 — Integrated Monorepo, Build & Admin Auth Stress Harness', () => {
  describe('Stress Vector 1: Monorepo Single Root Constraint & Engine Versioning', () => {
    test('Strictly 1 package.json exists in root and zero nested package.json in apps', () => {
      const forbiddenDirs = [
        'landing-page',
        'admin-dashboard-web',
        'mobile-app',
        'server',
        'shared',
        'scripts',
      ];
      for (const dir of forbiddenDirs) {
        const nestedPkg = path.join(rootDir, dir, 'package.json');
        assert.equal(
          fs.existsSync(nestedPkg),
          false,
          `Forbidden nested package.json detected in ${dir}`,
        );
      }
      assert.equal(
        fs.existsSync(path.join(rootDir, 'package.json')),
        true,
        'Root package.json must exist',
      );
    });

    test('Zero nested node_modules in workspace apps', () => {
      const forbiddenDirs = ['landing-page', 'admin-dashboard-web', 'mobile-app'];
      for (const dir of forbiddenDirs) {
        const nestedNM = path.join(rootDir, dir, 'node_modules');
        assert.equal(
          fs.existsSync(nestedNM),
          false,
          `Forbidden nested node_modules detected in ${dir}`,
        );
      }
    });

    test('Root package.json and .nvmrc enforce Node 24 compatibility', () => {
      const nvmrcPath = path.join(rootDir, '.nvmrc');
      assert.equal(fs.existsSync(nvmrcPath), true);
      const nvmrcContent = fs.readFileSync(nvmrcPath, 'utf8').trim();
      assert.equal(nvmrcContent, '24', '.nvmrc must specify 24');

      const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
      assert.equal(pkg.engines?.node, '24.x', 'package.json engines.node must be 24.x');

      const currentMajor = parseInt(process.versions.node.split('.')[0], 10);
      assert.ok(
        currentMajor >= 24,
        `Current node major version must be >= 24 (found ${process.versions.node})`,
      );
    });

    test('Root package.json exposes dedicated build and dev scripts for both landing and admin', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
      assert.ok(pkg.scripts['build:landing'], 'Must have build:landing');
      assert.ok(pkg.scripts['build:admin'], 'Must have build:admin');
      assert.ok(pkg.scripts['dev:landing'], 'Must have dev:landing');
      assert.ok(pkg.scripts['dev:admin'], 'Must have dev:admin');
      assert.ok(pkg.scripts['build:all'], 'Must have build:all');
    });
  });

  describe('Stress Vector 2: Dual Build Output Separation & Asset Integrity', () => {
    test('dist/landing contains optimized single-page assets without legacy bloat', () => {
      const landingHtml = path.join(rootDir, 'dist/landing/index.html');
      assert.ok(fs.existsSync(landingHtml), 'dist/landing/index.html must exist');
      const htmlContent = fs.readFileSync(landingHtml, 'utf8');
      assert.ok(
        htmlContent.includes('Mobile-app-ebook') || htmlContent.includes('Wahidiyah Book'),
        'Landing index.html must have official title',
      );
      assert.ok(
        htmlContent.includes('Official APK Download'),
        'Landing index.html must mention APK download',
      );

      const assetsDir = path.join(rootDir, 'dist/landing/assets');
      assert.ok(fs.existsSync(assetsDir), 'dist/landing/assets must exist');
      const files = fs.readdirSync(assetsDir);

      const forbiddenSubstrings = [
        'pdf.worker',
        'pdfjs',
        'docx',
        'mammoth',
        'jspdf',
        'excel',
        'charts',
      ];
      for (const file of files) {
        for (const forbidden of forbiddenSubstrings) {
          assert.equal(
            file.toLowerCase().includes(forbidden),
            false,
            `dist/landing/assets contains prohibited chunk: ${file}`,
          );
        }
      }

      const jsFiles = files.filter((f) => f.endsWith('.js'));
      let totalJsSize = 0;
      for (const f of jsFiles) {
        totalJsSize += fs.statSync(path.join(assetsDir, f)).size;
      }
      assert.ok(
        totalJsSize < 360 * 1024,
        `Total JS size (${Math.round(totalJsSize / 1024)} KB) must be under 360 KB`,
      );
    });

    test('dist/admin contains full admin assets with charts, excel, supabase, and sonner', () => {
      const adminHtml = path.join(rootDir, 'dist/admin/index.html');
      assert.ok(fs.existsSync(adminHtml), 'dist/admin/index.html must exist');
      const htmlContent = fs.readFileSync(adminHtml, 'utf8');
      assert.ok(
        htmlContent.includes('Admin Dashboard'),
        'Admin index.html must have Admin Dashboard title',
      );

      const assetsDir = path.join(rootDir, 'dist/admin/assets');
      assert.ok(fs.existsSync(assetsDir), 'dist/admin/assets must exist');
      const files = fs.readdirSync(assetsDir);

      const requiredChunks = ['charts', 'excel', 'supabase-sdk', 'icons', 'sonner', 'vendor'];
      for (const req of requiredChunks) {
        const found = files.some((f) => f.startsWith(`${req}-`) && f.endsWith('.js'));
        assert.ok(found, `dist/admin/assets must contain chunk starting with ${req}-`);
      }
    });

    test('dist/landing and dist/admin remain mutually isolated simultaneously', () => {
      const landingIndex = path.join(rootDir, 'dist/landing/index.html');
      const adminIndex = path.join(rootDir, 'dist/admin/index.html');
      assert.ok(fs.existsSync(landingIndex), 'dist/landing/index.html exists');
      assert.ok(fs.existsSync(adminIndex), 'dist/admin/index.html exists');

      const landingStat = fs.statSync(landingIndex);
      const adminStat = fs.statSync(adminIndex);
      assert.notEqual(
        landingStat.size,
        adminStat.size,
        'Landing and Admin index.html must be distinct artifacts',
      );
    });
  });

  describe('Stress Vector 3: Landing Page APK Delivery & Static Independence', () => {
    const OFFICIAL_APK_URL =
      'https://expo.dev/artifacts/eas/Ed9NJ755J7BnDSR2zNqX6FjLFXevov8oC7G-JCxiSU0.apk';

    test('Direct APK URL is strictly matching official artifact across all landing components', () => {
      const heroPath = path.join(rootDir, 'landing-page/src/components/sections/HeroSection.jsx');
      const navPath = path.join(rootDir, 'landing-page/src/components/layout/LandingNavbar.jsx');

      const heroSrc = fs.readFileSync(heroPath, 'utf8');
      const navSrc = fs.readFileSync(navPath, 'utf8');

      // M2 memusatkan URL APK ke satu konstanta; komponen wajib memakainya.
      const constantsSrc = fs.readFileSync(
        path.join(rootDir, 'landing-page/src/config/constants.js'),
        'utf8',
      );
      assert.ok(
        constantsSrc.includes(OFFICIAL_APK_URL),
        'Centralized constants.js must expose the official APK URL',
      );
      for (const [name, src] of [
        ['HeroSection', heroSrc],
        ['LandingNavbar', navSrc],
      ]) {
        assert.ok(
          src.includes('APK_DOWNLOAD_URL') && src.includes('@/config/constants'),
          `${name} must consume the centralized APK_DOWNLOAD_URL constant`,
        );
      }
    });

    test('Landing App.jsx is completely static without API polling or auth context bloat', () => {
      const appSrc = fs.readFileSync(path.join(rootDir, 'landing-page/src/App.jsx'), 'utf8');
      assert.equal(appSrc.includes('AppProvider'), false, 'App.jsx must not wrap AppProvider');
      assert.equal(appSrc.includes('/api/auth/me'), false, 'App.jsx must not poll /api/auth/me');
      assert.equal(appSrc.includes('useLocation'), false, 'App.jsx must not require routing');
    });

    test('All mobile preview screenshots referenced exist in public/mobile_screenshots/', () => {
      const previewPath = path.join(
        rootDir,
        'landing-page/src/components/sections/PreviewSection.jsx',
      );
      const previewSrc = fs.readFileSync(previewPath, 'utf8');

      const matches = [...previewSrc.matchAll(/\/mobile_screenshots\/([a-zA-Z0-9_\.]+\.png)/g)];
      assert.ok(matches.length >= 4, 'Must reference at least 4 screenshots');

      for (const m of matches) {
        const diskPath = path.join(rootDir, 'public/mobile_screenshots', m[1]);
        assert.ok(fs.existsSync(diskPath), `Screenshot file ${m[1]} must exist on disk`);
        const stats = fs.statSync(diskPath);
        assert.ok(stats.size > 20 * 1024, `Screenshot ${m[1]} must be a valid image (> 20KB)`);
      }
    });
  });

  describe('Stress Vector 4: Admin Authentication Security & Supabase Connection', () => {
    test('admin-dashboard-web connects to new Supabase project pfiowztxlbcclazpdsxe', () => {
      const cfgPath = path.join(rootDir, 'admin-dashboard-web/src/lib/supabaseConfig.js');
      const cfgSrc = fs.readFileSync(cfgPath, 'utf8');

      assert.ok(cfgSrc.includes('pfiowztxlbcclazpdsxe'), 'Must connect to pfiowztxlbcclazpdsxe');
      assert.equal(
        cfgSrc.includes('pdimjmbjutlzjdfjaqgt'),
        false,
        'Must not reference old project pdimjmbjutlzjdfjaqgt',
      );
    });

    test('Seeded Admin credentials successfully authenticate and return admin role', async () => {
      const { authenticateWithPassword } =
        await import('../server/services/auth/session_service.js');
      const auth = await authenticateWithPassword({
        email: 'admin@wahidiyah.com',
        password: 'AdminWahidiyah2026!',
      });
      assert.equal(auth.ok, true, 'Seeded admin authentication must succeed');
      assert.equal(auth.user.role, 'admin', 'Seeded admin role must be admin');
      assert.ok(auth.user.id, 'User must have an ID');
      assert.ok(auth.token, 'Must return session token');
    });

    test('Adversarial auth attempts are strictly rejected', async () => {
      const { authenticateWithPassword } =
        await import('../server/services/auth/session_service.js');

      // Wrong password
      const wrongPass = await authenticateWithPassword({
        email: 'admin@wahidiyah.com',
        password: 'WrongPassword123!',
      });
      assert.equal(wrongPass.ok, false, 'Wrong password must be rejected');
      assert.equal(wrongPass.status, 401, 'Status must be 401');

      // Empty password (fails schema validation)
      const emptyPass = await authenticateWithPassword({
        email: 'admin@wahidiyah.com',
        password: '',
      });
      assert.equal(emptyPass.ok, false, 'Empty password must be rejected');
      assert.equal(emptyPass.status, 400, 'Status must be 400 validation error');

      // Non-existent user
      const fakeUser = await authenticateWithPassword({
        email: 'intruder@hacker.net',
        password: 'HackedPass2026!',
      });
      assert.equal(fakeUser.ok, false, 'Non-existent user must be rejected');
      assert.equal(fakeUser.status, 401, 'Status must be 401');
    });

    test('AdminRoot in admin-dashboard-web blocks non-admin users and shows restricted access', () => {
      const appSrc = fs.readFileSync(path.join(rootDir, 'admin-dashboard-web/src/App.jsx'), 'utf8');
      assert.ok(appSrc.includes("user?.role !== 'admin'"), 'AdminRoot must guard role !== admin');
      assert.ok(
        appSrc.includes('<AdminLogin />'),
        'AdminRoot must render AdminLogin when not admin',
      );

      const loginSrc = fs.readFileSync(
        path.join(rootDir, 'admin-dashboard-web/src/features/admin/AdminLogin.jsx'),
        'utf8',
      );
      assert.ok(
        loginSrc.includes('Akses Terbatas'),
        'AdminLogin must have Akses Terbatas for non-admin accounts',
      );
    });
  });

  describe('Stress Vector 5: Vercel Dual Deployment Configuration & Serverless Handler', () => {
    test('vercel.json is properly configured for landing page deployment', () => {
      const vPath = path.join(rootDir, 'vercel.json');
      assert.ok(fs.existsSync(vPath));
      const v = JSON.parse(fs.readFileSync(vPath, 'utf8'));
      assert.ok(v.buildCommand === 'npm run build:landing' || v.buildCommand === undefined);
      assert.ok(v.outputDirectory === 'dist/landing' || v.outputDirectory === undefined);
      assert.equal(v.framework, 'vite');
      assert.ok(
        v.rewrites.some((r) => r.source === '/api/(.*)' && r.destination === '/api/index.js'),
      );
    });

    test('vercel.admin.json is properly configured for admin dashboard deployment', () => {
      const vPath = path.join(rootDir, 'vercel.admin.json');
      assert.ok(fs.existsSync(vPath));
      const v = JSON.parse(fs.readFileSync(vPath, 'utf8'));
      assert.equal(v.name, 'mobile-app-ebook-admin');
      assert.equal(v.buildCommand, 'npm run build:admin');
      assert.equal(v.outputDirectory, 'dist/admin');
      assert.equal(v.framework, 'vite');
      assert.ok(
        v.rewrites.some((r) => r.source === '/api/(.*)' && r.destination === '/api/index.js'),
      );
    });

    test('api/index.js exists and exports a callable serverless express app', async () => {
      const apiPath = path.join(rootDir, 'api/index.js');
      assert.ok(fs.existsSync(apiPath));
      const mod = await import('../api/index.js');
      assert.ok(mod.default, 'api/index.js must have a default export');
      assert.equal(typeof mod.default, 'function', 'Default export must be express app function');
    });
  });
});
